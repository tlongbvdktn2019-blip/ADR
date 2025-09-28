import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Cần đăng nhập để truy cập' },
        { status: 401 }
      )
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('quiz_categories')
      .select(`
        id,
        name,
        category_key,
        description,
        icon_name,
        color_scheme,
        total_questions,
        is_active
      `)
      .eq('is_active', true)
      .gt('total_questions', 0)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching quiz categories:', error)
      return NextResponse.json(
        { error: 'Không thể lấy danh sách chủ đề quiz' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('Quiz categories GET error:', error)
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    )
  }
}