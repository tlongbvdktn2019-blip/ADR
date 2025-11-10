import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { supabaseAdmin } from '@/lib/supabase-admin'

// DELETE: Xóa một câu hỏi
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const { error } = await supabaseAdmin
      .from('contest_questions')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting contest question:', error)
      return NextResponse.json(
        { error: 'Lỗi khi xóa câu hỏi', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa câu hỏi thành công'
    })

  } catch (error: any) {
    console.error('DELETE contest question error:', error)
    return NextResponse.json(
      { error: 'Lỗi server', details: error.message },
      { status: 500 }
    )
  }
}

// PUT: Cập nhật câu hỏi
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { question_text, options, correct_answer, explanation, points_value, is_active } = body

    // Validate
    if (!question_text || !options || !correct_answer) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    const updateData = {
      question_text,
      options,
      correct_answer,
      explanation,
      points_value,
      is_active,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await (supabaseAdmin
      .from('contest_questions') as any)
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating contest question:', error)
      return NextResponse.json(
        { error: 'Lỗi khi cập nhật câu hỏi', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật câu hỏi thành công',
      data
    })

  } catch (error: any) {
    console.error('PUT contest question error:', error)
    return NextResponse.json(
      { error: 'Lỗi server', details: error.message },
      { status: 500 }
    )
  }
}
