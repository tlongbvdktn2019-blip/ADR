import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated and is admin
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Chỉ admin mới có thể reset mật khẩu' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, newPassword, action } = body

    // Validate required fields
    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    // Check if user exists
    const { data: targetUser, error: getUserError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role')
      .eq('id', userId)
      .single()

    if (getUserError || !targetUser) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    let updateData: any = {}

    switch (action) {
      case 'reset':
        // Reset to default password based on role
        if (!newPassword) {
          return NextResponse.json(
            { error: 'Vui lòng nhập mật khẩu mới' },
            { status: 400 }
          )
        }

        if (newPassword.length < 6) {
          return NextResponse.json(
            { error: 'Mật khẩu mới phải có ít nhất 6 ký tự' },
            { status: 400 }
          )
        }

        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds)
        
        updateData = {
          password_hash: hashedPassword,
          password_updated_at: new Date().toISOString(),
          reset_token: null,
          reset_token_expires: null
        }
        break

      case 'clear':
        // Clear password (remove password_hash)
        updateData = {
          password_hash: null,
          password_updated_at: new Date().toISOString(),
          reset_token: null,
          reset_token_expires: null
        }
        break

      case 'generate_reset_token':
        // Generate reset token for user to set their own password
        const resetToken = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        
        updateData = {
          reset_token: resetToken,
          reset_token_expires: expiresAt.toISOString()
        }
        break

      default:
        return NextResponse.json(
          { error: 'Hành động không hợp lệ' },
          { status: 400 }
        )
    }

    // Update user in database
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)

    if (updateError) {
      console.error('Password reset error:', updateError)
      return NextResponse.json(
        { error: 'Không thể thực hiện thao tác' },
        { status: 500 }
      )
    }

    let message = ''
    let data: any = {}

    switch (action) {
      case 'reset':
        message = `Đã reset mật khẩu cho ${targetUser.name}`
        break
      case 'clear':
        message = `Đã xóa mật khẩu của ${targetUser.name}`
        break
      case 'generate_reset_token':
        message = `Đã tạo token reset cho ${targetUser.name}`
        data.resetToken = updateData.reset_token
        break
    }

    return NextResponse.json({
      message,
      ...data
    })

  } catch (error) {
    console.error('Admin password reset error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi thực hiện thao tác' },
      { status: 500 }
    )
  }
}









