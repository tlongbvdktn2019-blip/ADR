import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const difficulty = searchParams.get('difficulty')
    const status = searchParams.get('status') || 'approved'

    let query = supabase
      .from('quiz_questions')
      .select(`
        *,
        category:quiz_categories(name, category_key)
      `)
      .order('created_at', { ascending: false })

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }

    if (status !== 'all') {
      query = query.eq('review_status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching questions:', error)
      return NextResponse.json(
        { error: 'Không thể lấy danh sách câu hỏi' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('Admin quiz questions GET error:', error)
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
      question_type = 'multiple_choice',
      difficulty,
      options,
      correct_answer,
      explanation,
      reference_source,
      learning_points,
      estimated_time_seconds = 60,
      points_value = 10
    } = body

    // Validation
    if (!category_id || !question_text || !difficulty || !options || !correct_answer) {
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
      .insert({
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
        is_active: true,
        review_status: 'approved',
        created_by: session.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating question:', error)
      return NextResponse.json(
        { error: 'Không thể tạo câu hỏi' },
        { status: 500 }
      )
    }

    // Update category question count
    const { error: updateError } = await supabase
      .rpc('update_category_question_count', { category_id })

    if (updateError) {
      console.warn('Failed to update category count:', updateError)
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Tạo câu hỏi thành công'
    })

  } catch (error) {
    console.error('Admin quiz questions POST error:', error)
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    )
  }
}