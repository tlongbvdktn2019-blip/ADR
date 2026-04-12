import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import { rejectUnlessDevelopmentAdmin } from '@/lib/debug-route'
import { normalizeEmail } from '@/lib/user-account'

export async function GET(request: NextRequest) {
  try {
    const guard = await rejectUnlessDevelopmentAdmin()
    if (guard) {
      return guard
    }

    void request

    const supabaseAdmin = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey
    )

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, username, email, name, role, organization')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        {
          error: 'Database connection failed',
          details: error.message,
          supabaseUrl: config.supabase.url ? 'configured' : 'missing',
          supabaseKey: config.supabase.serviceRoleKey ? 'configured' : 'missing',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      totalUsers: users?.length || 0,
      users: users || [],
      demoAccounts: {
        admin: users?.find((u: any) => u.username === 'admin') ? 'exists' : 'missing',
        user: users?.find((u: any) => u.username === 'user') ? 'exists' : 'missing',
      },
      environment: {
        supabaseUrl: config.supabase.url ? 'configured' : 'missing',
        supabaseKey: config.supabase.serviceRoleKey ? 'configured' : 'missing',
      }
    })
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: (error as Error).message,
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await rejectUnlessDevelopmentAdmin()
    if (guard) {
      return guard
    }

    void request

    const supabaseAdmin = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey
    )

    const demoUsers = [
      {
        username: 'admin',
        email: normalizeEmail('admin@soyte.gov.vn'),
        name: 'Quản trị viên Sở Y tế',
        role: 'admin' as const,
        organization: 'Sở Y tế Thành phố',
        phone: '0123456789'
      },
      {
        username: 'user',
        email: normalizeEmail('user@benhvien.gov.vn'),
        name: 'Bác sĩ Nguyễn Văn A',
        role: 'user' as const,
        organization: 'Bệnh viện Đa khoa ABC',
        phone: '0987654321'
      }
    ]

    const results = []

    for (const userData of demoUsers) {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id, username, email')
        .eq('email', userData.email)
        .maybeSingle()

      if (existingUser) {
        results.push({
          username: userData.username,
          email: userData.email,
          status: 'exists',
          id: existingUser.id
        })
      } else {
        const { data: newUser, error } = await supabaseAdmin
          .from('users')
          .insert(userData)
          .select()
          .single()

        if (error) {
          results.push({
            username: userData.username,
            email: userData.email,
            status: 'error',
            error: error.message
          })
        } else {
          results.push({
            username: userData.username,
            email: userData.email,
            status: 'created',
            id: newUser.id
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      results
    })
  } catch (error) {
    console.error('Create users error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create demo users',
        message: (error as Error).message
      },
      { status: 500 }
    )
  }
}
