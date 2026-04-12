import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import {
  getUsernameValidationMessage,
  normalizeEmail,
  normalizeUsername,
} from '@/lib/user-account'

const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
)

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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit
    const search = searchParams.get('search')
    const role = searchParams.get('role')

    let query = supabaseAdmin
      .from('users')
      .select('id, username, email, name, role, organization, phone, created_at, updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%,organization.ilike.%${search}%`)
    }

    if (role && role !== '') {
      query = query.eq('role', role)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: users, error, count } = await query

    if (error) {
      console.error('Get users error:', error)
      return NextResponse.json(
        { error: 'Không thể lấy danh sách người dùng: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1,
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Lỗi máy chủ nội bộ' },
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
    const name = body.name?.trim()
    const username = normalizeUsername(body.username || '')
    const email = normalizeEmail(body.email || '')
    const organization = body.organization?.trim()
    const phone = body.phone?.trim() || null
    const role = body.role

    if (!name || !username || !email || !organization) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc: tên, username, email, tổ chức' },
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

    if (!role || !['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Vai trò không hợp lệ' },
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

    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        username,
        email,
        organization,
        phone,
        role,
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
      message: 'Tạo người dùng thành công',
      user: {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        organization: newUser.organization,
        phone: newUser.phone,
        created_at: newUser.created_at,
      }
    })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Lỗi máy chủ nội bộ' },
      { status: 500 }
    )
  }
}
