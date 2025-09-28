import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import { Database } from '@/types/supabase'

// Test endpoint to check if demo users exist
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createClient<Database>(
      config.supabase.url,
      config.supabase.serviceRoleKey
    )

    // Get all users from database
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, organization')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { 
          error: 'Database connection failed', 
          details: error.message,
          supabaseUrl: config.supabase.url ? 'configured' : 'missing',
          supabaseKey: config.supabase.serviceRoleKey ? 'configured' : 'missing'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      totalUsers: users?.length || 0,
      users: users || [],
      demoAccounts: {
        admin: users?.find((u: any) => u.email === 'admin@soyte.gov.vn') ? 'exists' : 'missing',
        user: users?.find((u: any) => u.email === 'user@benhvien.gov.vn') ? 'exists' : 'missing',
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
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      },
      { status: 500 }
    )
  }
}

// POST endpoint to create demo users if they don't exist
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createClient<Database>(
      config.supabase.url,
      config.supabase.serviceRoleKey
    )

    const demoUsers = [
      {
        email: 'admin@soyte.gov.vn',
        name: 'Quản trị viên Sở Y tế',
        role: 'admin' as const,
        organization: 'Sở Y tế Thành phố',
        phone: '0123456789'
      },
      {
        email: 'user@benhvien.gov.vn',
        name: 'Bác sĩ Nguyễn Văn A',
        role: 'user' as const,
        organization: 'Bệnh viện Đa khoa ABC',
        phone: '0987654321'
      }
    ]

    const results = []

    for (const userData of demoUsers) {
      // Check if user exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('email', userData.email)
        .single()

      if (existingUser) {
        results.push({
          email: userData.email,
          status: 'exists',
          id: (existingUser as any)?.id
        })
      } else {
        // Create user
        const { data: newUser, error } = await (supabaseAdmin as any)
          .from('users')
          .insert(userData)
          .select()
          .single()

        if (error) {
          results.push({
            email: userData.email,
            status: 'error',
            error: error.message
          })
        } else {
          results.push({
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


