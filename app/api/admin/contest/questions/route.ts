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
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100

    // @ts-ignore - contest tables not in Database types yet
    const { data, error } = await (supabaseAdmin
      .from('contest_questions') as any)
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error: any) {
    console.error('Get contest questions error:', error)
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách câu hỏi' },
      { status: 500 }
    )
  }
}

// POST: Tạo câu hỏi mới
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
      question_text,
      options,
      correct_answer,
      explanation,
      points_value = 10
    } = body

    // Validation
    if (!question_text || !options || !correct_answer) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc (câu hỏi, đáp án, đáp án đúng)' },
        { status: 400 }
      )
    }

    // Validate options format - phải có đúng 4 đáp án A, B, C, D
    if (!Array.isArray(options) || options.length !== 4) {
      return NextResponse.json(
        { error: 'Phải có đúng 4 đáp án A, B, C, D' },
        { status: 400 }
      )
    }

    // Validate correct_answer
    if (!['A', 'B', 'C', 'D'].includes(correct_answer)) {
      return NextResponse.json(
        { error: 'Đáp án đúng phải là A, B, C hoặc D' },
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

    // @ts-ignore - contest tables not in Database types yet
    const { data, error } = await (supabaseAdmin
      .from('contest_questions') as any)
      .insert({
        question_text,
        options,
        correct_answer,
        explanation,
        points_value,
        is_active: true,
        created_by: session.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating contest question:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Tạo câu hỏi thành công',
      data
    })

  } catch (error: any) {
    console.error('Create contest question error:', error)
    return NextResponse.json(
      { error: 'Lỗi khi tạo câu hỏi' },
      { status: 500 }
    )
  }
}

