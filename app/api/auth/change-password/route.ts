import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import bcrypt from 'bcryptjs'

const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Bạn cần đăng nhập để thực hiện thao tác này' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword, confirmPassword } = body

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      )
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Mật khẩu mới và xác nhận mật khẩu không khớp' },
        { status: 400 }
      )
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu mới phải có ít nhất 6 ký tự' },
        { status: 400 }
      )
    }

    // Get current user from database
    const { data: user, error: getUserError } = await supabaseAdmin
      .from('users')
      .select('id, password_hash')
      .eq('id', session.user.id)
      .single()

    if (getUserError || !user) {
      return NextResponse.json(
        { error: 'Không tìm thấy thông tin người dùng' },
        { status: 404 }
      )
    }

    // Verify current password
    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'Tài khoản chưa được thiết lập mật khẩu' },
        { status: 400 }
      )
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Mật khẩu hiện tại không chính xác' },
        { status: 400 }
      )
    }

    // Hash new password
    const saltRounds = 10
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password in database
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: hashedNewPassword,
        password_updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id)

    if (updateError) {
      console.error('Password update error:', updateError)
      return NextResponse.json(
        { error: 'Không thể cập nhật mật khẩu' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Đổi mật khẩu thành công'
    })

  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi đổi mật khẩu' },
      { status: 500 }
    )
  }
}









