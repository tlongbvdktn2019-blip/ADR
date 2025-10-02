import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { supabaseAdmin } from '@/lib/supabase-admin'

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
    const questionId = params.id

    // @ts-ignore - contest tables not in Database types yet
    const { data, error } = await (supabaseAdmin
      .from('contest_questions') as any)
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', questionId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Cập nhật câu hỏi thành công',
      data
    })

  } catch (error: any) {
    console.error('Update contest question error:', error)
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật câu hỏi' },
      { status: 500 }
    )
  }
}

// DELETE: Xóa câu hỏi
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

    const questionId = params.id

    // @ts-ignore - contest tables not in Database types yet
    const { error } = await (supabaseAdmin
      .from('contest_questions') as any)
      .delete()
      .eq('id', questionId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Xóa câu hỏi thành công'
    })

  } catch (error: any) {
    console.error('Delete contest question error:', error)
    return NextResponse.json(
      { error: 'Lỗi khi xóa câu hỏi' },
      { status: 500 }
    )
  }
}


