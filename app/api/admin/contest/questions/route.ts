import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET: Lấy danh sách câu hỏi cuộc thi
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * limit

    // Build query
    let query = supabaseAdmin
      .from('contest_questions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.or(`question_text.ilike.%${search}%,explanation.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching contest questions:', error)
      return NextResponse.json(
        { error: 'Lỗi khi lấy danh sách câu hỏi' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error: any) {
    console.error('GET contest questions error:', error)
    return NextResponse.json(
      { error: 'Lỗi server', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Xóa nhiều câu hỏi
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Danh sách ID không hợp lệ' },
        { status: 400 }
      )
    }

    // Delete questions
    const { error } = await supabaseAdmin
      .from('contest_questions')
      .delete()
      .in('id', ids)

    if (error) {
      console.error('Error deleting contest questions:', error)
      return NextResponse.json(
        { error: 'Lỗi khi xóa câu hỏi', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Đã xóa ${ids.length} câu hỏi thành công`
    })

  } catch (error: any) {
    console.error('DELETE contest questions error:', error)
    return NextResponse.json(
      { error: 'Lỗi server', details: error.message },
      { status: 500 }
    )
  }
}
