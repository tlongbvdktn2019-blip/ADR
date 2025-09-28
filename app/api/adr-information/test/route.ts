import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth-config'
import { createClient } from '../../../../lib/supabase'

// GET /api/adr-information/test - Test database connection and schema
export async function GET(request: NextRequest) {
  try {
    console.log('=== ADR Information Test API ===')
    
    // Test 1: Auth session
    const session = await getServerSession(authOptions)
    console.log('Session:', {
      exists: !!session,
      user: session?.user ? {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
        email: session.user.email
      } : null
    })

    if (!session?.user) {
      return NextResponse.json({
        error: 'No session found',
        step: 'auth',
        success: false
      }, { status: 401 })
    }

    // Test 2: Supabase connection
    const supabase = createClient()
    console.log('Supabase client created')

    // Test 3: Check if table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('adr_information')
      .select('id')
      .limit(1)

    console.log('Table check:', {
      error: tableError,
      hasData: !!tableCheck
    })

    if (tableError) {
      return NextResponse.json({
        error: 'Database table error',
        details: tableError.message,
        code: tableError.code,
        step: 'table_check',
        success: false
      }, { status: 500 })
    }

    // Test 4: Check user permissions (handle multiple users)
    const { data: userCheck, error: userError, count } = await supabase
      .from('users')
      .select('id, name, role, email, organization', { count: 'exact' })
      .eq('id', session.user.id)

    console.log('User check:', {
      error: userError,
      users: userCheck,
      count: count
    })

    if (userError) {
      return NextResponse.json({
        error: 'User lookup error',
        details: userError.message,
        step: 'user_check',
        success: false
      }, { status: 500 })
    }

    if (!userCheck || userCheck.length === 0) {
      return NextResponse.json({
        error: 'User not found in database',
        details: `User ID ${session.user.id} does not exist in users table`,
        step: 'user_check',
        success: false
      }, { status: 404 })
    }

    if (userCheck.length > 1) {
      return NextResponse.json({
        error: 'Multiple users found with same ID',
        details: `Found ${userCheck.length} users with ID ${session.user.id}`,
        users: userCheck,
        step: 'user_check',
        success: false
      }, { status: 400 })
    }

    const user = userCheck[0]

    // Test 5: Try simple insert (if admin)
    if (user.role === 'admin') {
      const testData = {
        title: 'Test Information - ' + new Date().toISOString(),
        content: '<p>This is a test information entry.</p>',
        type: 'news',
        priority: 5,
        tags: ['test'],
        target_audience: ['admin'],
        is_pinned: false,
        show_on_homepage: false,
        created_by_user_id: session.user.id,
        author_name: session.user.name,
        author_organization: session.user.organization || 'Test Organization',
        status: 'draft'
      }

      console.log('Attempting test insert with data:', testData)

      const { data: insertResult, error: insertError } = await supabase
        .from('adr_information')
        .insert([testData])
        .select()
        .single()

      console.log('Insert result:', {
        error: insertError,
        success: !!insertResult,
        data: insertResult
      })

      if (insertError) {
        return NextResponse.json({
          error: 'Insert test failed',
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint,
          step: 'insert_test',
          success: false
        }, { status: 500 })
      }

      // Clean up test data
      await supabase
        .from('adr_information')
        .delete()
        .eq('id', insertResult.id)

      return NextResponse.json({
        message: 'All tests passed!',
        user: {
          name: user.name,
          role: user.role,
          id: user.id,
          email: user.email,
          organization: user.organization
        },
        database: 'Connected',
        table: 'Accessible',
        permissions: 'Working',
        insert: 'Success',
        success: true
      })
    } else {
      return NextResponse.json({
        message: 'Basic tests passed (non-admin user)',
        user: {
          name: user.name,
          role: user.role,
          id: user.id,
          email: user.email,
          organization: user.organization
        },
        database: 'Connected',
        table: 'Accessible',
        note: 'Insert test skipped - not admin',
        success: true
      })
    }

  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      step: 'general',
      success: false
    }, { status: 500 })
  }
}

// POST /api/adr-information/test - Test creation with detailed logging
export async function POST(request: NextRequest) {
  try {
    console.log('=== POST Test API ===')
    
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({
        error: 'Unauthorized - Admin access required',
        step: 'auth',
        success: false
      }, { status: 403 })
    }

    const requestData = await request.json()
    console.log('Request data received:', requestData)

    const supabase = createClient()

    // Prepare minimal test data
    const insertData = {
      title: requestData.title || 'Test Title',
      content: requestData.content || '<p>Test content</p>',
      type: 'news',
      priority: 3,
      tags: [],
      target_audience: ['admin'],
      is_pinned: false,
      show_on_homepage: false,
      created_by_user_id: session.user.id,
      author_name: session.user.name,
      author_organization: session.user.organization || 'Test Org',
      status: 'draft'
    }

    console.log('Insert data prepared:', insertData)

    const { data: result, error } = await supabase
      .from('adr_information')
      .insert([insertData])
      .select()
      .single()

    console.log('Insert result:', { error, result })

    if (error) {
      return NextResponse.json({
        error: 'Database insert failed',
        details: error.message,
        code: error.code,
        hint: error.hint,
        data: insertData,
        success: false
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Test creation successful',
      data: result,
      success: true
    }, { status: 201 })

  } catch (error) {
    console.error('POST Test error:', error)
    return NextResponse.json({
      error: 'Test creation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
}

