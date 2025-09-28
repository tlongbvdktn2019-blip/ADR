import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@/lib/supabase'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('quiz_questions')
      .select(`
        *,
        category:quiz_categories(name, category_key)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching question:', error)
      return NextResponse.json(
        { error: 'Không tìm thấy câu hỏi' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Admin quiz question GET error:', error)
    return NextResponse.json(
      { error: 'Lỗi server' },
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

    const body = await request.json()
    const {
      category_id,
      question_text,
      question_type,
      difficulty,
      options,
      correct_answer,
      explanation,
      reference_source,
      learning_points,
      estimated_time_seconds,
      points_value,
      is_active,
      review_status
    } = body

    // Validation
    if (!question_text || !difficulty || !options || !correct_answer) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    // Validate options format
    if (!Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: 'Phải có ít nhất 2 lựa chọn' },
        { status: 400 }
      )
    }

    // Check if correct_answer exists in options
    const optionKeys = options.map((opt: any) => opt.key)
    if (!optionKeys.includes(correct_answer)) {
      return NextResponse.json(
        { error: 'Đáp án đúng không khớp với các lựa chọn' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('quiz_questions')
      .update({
        category_id,
        question_text,
        question_type,
        difficulty,
        options,
        correct_answer,
        explanation,
        reference_source,
        learning_points,
        estimated_time_seconds,
        points_value,
        is_active,
        review_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating question:', error)
      return NextResponse.json(
        { error: 'Không thể cập nhật câu hỏi' },
        { status: 500 }
      )
    }

    // Update category question count if category changed
    if (category_id) {
      const { error: updateError } = await supabase
        .rpc('update_category_question_count', { category_id })

      if (updateError) {
        console.warn('Failed to update category count:', updateError)
      }
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Cập nhật câu hỏi thành công'
    })

  } catch (error) {
    console.error('Admin quiz question PUT error:', error)
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const supabase = createClient()

    // First check if question exists and get category_id
    const { data: question, error: fetchError } = await supabase
      .from('quiz_questions')
      .select('category_id')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Không tìm thấy câu hỏi' },
        { status: 404 }
      )
    }

    // Check if question is used in any sessions
    const { data: usageData, error: usageError } = await supabase
      .from('quiz_answers')
      .select('id')
      .eq('question_id', params.id)
      .limit(1)

    if (usageError) {
      console.error('Error checking question usage:', usageError)
      return NextResponse.json(
        { error: 'Không thể kiểm tra việc sử dụng câu hỏi' },
        { status: 500 }
      )
    }

    if (usageData && usageData.length > 0) {
      return NextResponse.json(
        { error: 'Không thể xóa câu hỏi đã được sử dụng trong quiz. Bạn có thể vô hiệu hóa câu hỏi này thay vì xóa.' },
        { status: 409 }
      )
    }

    // Delete the question
    const { error } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting question:', error)
      return NextResponse.json(
        { error: 'Không thể xóa câu hỏi' },
        { status: 500 }
      )
    }

    // Update category question count
    const { error: updateError } = await supabase
      .rpc('update_category_question_count', { category_id: question.category_id })

    if (updateError) {
      console.warn('Failed to update category count:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Xóa câu hỏi thành công'
    })

  } catch (error) {
    console.error('Admin quiz question DELETE error:', error)
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    )
  }
}