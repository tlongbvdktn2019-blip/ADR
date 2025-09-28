import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import { Database } from '@/types/supabase'

// Create Supabase admin client
const supabaseAdmin = createClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey
)

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated and is admin
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const userId = params.id

    // Get the user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, organization, phone, created_at, updated_at')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    // Get user statistics (optional)
    const { data: reportStats } = await supabaseAdmin
      .from('adr_reports')
      .select('id', { count: 'exact' })
      .eq('reporter_id', userId)

    const { data: cardStats } = await supabaseAdmin
      .from('allergy_cards')
      .select('id', { count: 'exact' })
      .eq('issued_by_user_id', userId)

    const userData = user as any;
    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        organization: userData.organization,
        phone: userData.phone,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        statistics: {
          totalReports: reportStats?.length || 0,
          totalCards: cardStats?.length || 0
        }
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy thông tin người dùng' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated and is admin
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const userId = params.id
    const body = await request.json()
    const { name, email, organization, phone, role } = body

    // Validate required fields
    if (!name || !email || !organization) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc: tên, email, tổ chức' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 }
      )
    }

    // Validate role
    if (!role || !['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Vai trò không hợp lệ' },
        { status: 400 }
      )
    }

    // Check if email is already used by another user
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', userId)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng bởi người dùng khác' },
        { status: 400 }
      )
    }

    // Update the user
    const { data: updatedUser, error } = await (supabaseAdmin as any)
      .from('users')
      .update({
        name,
        email,
        organization,
        phone: phone || null,
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Update user error:', error)
      return NextResponse.json(
        { error: 'Không thể cập nhật thông tin người dùng' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Cập nhật thông tin người dùng thành công',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        organization: updatedUser.organization,
        phone: updatedUser.phone,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật người dùng' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated and is admin
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const userId = params.id

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Không thể xóa chính mình' },
        { status: 400 }
      )
    }

    // Check if user exists
    const { data: userCheck } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('id', userId)
      .single()

    if (!userCheck) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    // Check if user has any reports or cards (prevent deletion if has data)
    const { data: reportsCheck } = await supabaseAdmin
      .from('adr_reports')
      .select('id', { count: 'exact' })
      .eq('reporter_id', userId)

    const { data: cardsCheck } = await supabaseAdmin
      .from('allergy_cards')
      .select('id', { count: 'exact' })
      .eq('issued_by_user_id', userId)

    const hasReports = (reportsCheck?.length || 0) > 0
    const hasCards = (cardsCheck?.length || 0) > 0

    if (hasReports || hasCards) {
      return NextResponse.json(
        { 
          error: `Không thể xóa người dùng này vì đã có dữ liệu liên quan: ${hasReports ? `${reportsCheck?.length} báo cáo ADR` : ''}${hasReports && hasCards ? ', ' : ''}${hasCards ? `${cardsCheck?.length} thẻ dị ứng` : ''}`,
          hasData: true,
          dataCount: {
            reports: reportsCheck?.length || 0,
            cards: cardsCheck?.length || 0
          }
        },
        { status: 409 }
      )
    }

    // Delete the user
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      console.error('Delete user error:', deleteError)
      return NextResponse.json(
        { error: 'Không thể xóa người dùng' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Đã xóa người dùng "${(userCheck as any)?.name || 'Unknown'}" thành công`
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa người dùng' },
      { status: 500 }
    )
  }
}



