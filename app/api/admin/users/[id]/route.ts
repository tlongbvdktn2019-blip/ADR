import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import {
  getUsernameValidationMessage,
  normalizeEmail,
  normalizeUsername,
} from '@/lib/user-account'

const supabaseAdmin = createClient(
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
    void request

    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const userId = params.id

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, username, email, name, role, organization, phone, created_at, updated_at')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    const { count: totalReports = 0 } = await supabaseAdmin
      .from('adr_reports')
      .select('id', { count: 'exact', head: true })
      .eq('reporter_id', userId)

    const { count: totalCards = 0 } = await supabaseAdmin
      .from('allergy_cards')
      .select('id', { count: 'exact', head: true })
      .eq('issued_by_user_id', userId)

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: user.organization,
        phone: user.phone,
        created_at: user.created_at,
        updated_at: user.updated_at,
        statistics: {
          totalReports,
          totalCards,
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

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const userId = params.id
    const body = await request.json()
    const name = body.name?.trim()
    const username = normalizeUsername(body.username || '')
    const email = normalizeEmail(body.email || '')
    const organization = body.organization?.trim()
    const phone = body.phone?.trim() || null
    const role = body.role

    if (!name || !username || !email || !organization) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc: tên, username, email, tổ chức' },
        { status: 400 }
      )
    }

    const usernameError = getUsernameValidationMessage(username)
    if (usernameError) {
      return NextResponse.json(
        { error: usernameError },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 }
      )
    }

    if (!role || !['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Vai trò không hợp lệ' },
        { status: 400 }
      )
    }

    const { data: existingUsername } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username)
      .neq('id', userId)
      .maybeSingle()

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Tên đăng nhập đã được sử dụng bởi người dùng khác' },
        { status: 400 }
      )
    }

    const { data: existingEmail } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', userId)
      .maybeSingle()

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng bởi người dùng khác' },
        { status: 400 }
      )
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update({
        name,
        username,
        email,
        organization,
        phone,
        role,
        updated_at: new Date().toISOString(),
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
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        organization: updatedUser.organization,
        phone: updatedUser.phone,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
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
    void request

    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const userId = params.id

    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Không thể xóa chính mình' },
        { status: 400 }
      )
    }

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

    const { count: reportsCount = 0 } = await supabaseAdmin
      .from('adr_reports')
      .select('id', { count: 'exact', head: true })
      .eq('reporter_id', userId)

    const { count: cardsCount = 0 } = await supabaseAdmin
      .from('allergy_cards')
      .select('id', { count: 'exact', head: true })
      .eq('issued_by_user_id', userId)

    const safeReportsCount = reportsCount || 0
    const safeCardsCount = cardsCount || 0
    const hasReports = safeReportsCount > 0
    const hasCards = safeCardsCount > 0

    if (hasReports || hasCards) {
      return NextResponse.json(
        {
          error: `Không thể xóa người dùng này vì đã có dữ liệu liên quan: ${hasReports ? `${safeReportsCount} báo cáo ADR` : ''}${hasReports && hasCards ? ', ' : ''}${hasCards ? `${safeCardsCount} thẻ dị ứng` : ''}`,
          hasData: true,
          dataCount: {
            reports: safeReportsCount,
            cards: safeCardsCount,
          }
        },
        { status: 409 }
      )
    }

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
      message: `Đã xóa người dùng "${userCheck.name || 'Unknown'}" thành công`
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa người dùng' },
      { status: 500 }
    )
  }
}
