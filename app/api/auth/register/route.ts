import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import {
  getUsernameValidationMessage,
  normalizeEmail,
  normalizeUsername,
} from '@/lib/user-account'

const bcrypt = require('bcryptjs')

const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = body.name?.trim()
    const username = normalizeUsername(body.username || '')
    const email = normalizeEmail(body.email || '')
    const organization = body.organization?.trim()
    const phone = body.phone?.trim() || null
    const password = String(body.password || '')

    if (!name || !username || !email || !organization || !password) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    const usernameError = getUsernameValidationMessage(username)
    if (usernameError) {
      return NextResponse.json(
        { error: usernameError },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có ít nhất 8 ký tự' },
        { status: 400 }
      )
    }

    const { data: existingUsername } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Tên đăng nhập đã được sử dụng' },
        { status: 400 }
      )
    }

    const { data: existingEmail } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        username,
        email,
        organization,
        phone,
        role: 'user',
        password_hash: passwordHash,
        password_updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Không thể tạo tài khoản người dùng' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Đăng ký thành công',
      user: {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        organization: newUser.organization,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Lỗi máy chủ nội bộ' },
      { status: 500 }
    )
  }
}
