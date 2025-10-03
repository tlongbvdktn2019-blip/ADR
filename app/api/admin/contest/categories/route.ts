import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET: Lấy danh sách danh mục
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('contest_categories')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error: any) {
    console.error('Get contest categories error:', error)
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách danh mục' },
      { status: 500 }
    )
  }
}





