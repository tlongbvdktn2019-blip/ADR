import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../../lib/auth-config'
import { createClient } from '../../../../../lib/supabase'

// GET /api/adr-information/test/user - Check and fix user record
export async function GET(request: NextRequest) {
  try {
    console.log('=== User Check and Fix API ===')
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({
        error: 'No session found',
        success: false
      }, { status: 401 })
    }

    const userId = session.user.id
    const userEmail = session.user.email
    const userName = session.user.name

    console.log('Session user:', { userId, userEmail, userName })

    const supabase = createClient()

    // Step 1: Check if user exists in public.users
    const { data: fetchedPublicUser, error: publicError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    let publicUser = fetchedPublicUser

    console.log('Public user check:', { publicUser, publicError })

    // Step 2: Check if user exists in auth.users (using service client)
    let authUser = null
    try {
      // We can't directly access auth.users from client, but we can infer from session
      authUser = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        exists: true // We know it exists because we have a session
      }
    } catch (error) {
      console.log('Auth user check error:', error)
    }

    // Step 3: If user doesn't exist in public.users, create them
    let userCreated = false
    let createError = null

    if (!publicUser && !publicError) {
      console.log('Creating missing user in public.users...')
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          email: userEmail || `user-${userId}@example.com`,
          name: userName || 'Admin User',
          role: 'admin', // Default to admin for testing
          organization: 'S??? Y t??? Th??nh ph???',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (insertError) {
        console.error('Error creating user:', insertError)
        createError = insertError.message
      } else {
        console.log('User created successfully:', newUser)
        userCreated = true
        publicUser = newUser
      }
    }

    // Step 4: If user exists but doesn't have admin role, update them
    let roleUpdated = false
    let updateError = null

    if (publicUser && publicUser.role !== 'admin') {
      console.log('Updating user role to admin...')
      
      const { data: updatedUser, error: roleError } = await supabase
        .from('users')
        .update({
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (roleError) {
        console.error('Error updating user role:', roleError)
        updateError = roleError.message
      } else {
        console.log('User role updated successfully:', updatedUser)
        roleUpdated = true
        publicUser = updatedUser
      }
    }

    // Step 5: Test RLS policy with the user
    const { data: rlsTest, error: rlsError } = await supabase
      .from('adr_information')
      .select('count')
      .limit(1)

    // Step 6: Try a test insert
    let insertTest = null
    let insertError = null

    if (publicUser?.role === 'admin') {
      const testData = {
        title: `User Fix Test - ${new Date().toISOString()}`,
        content: '<p>Testing after user fix</p>',
        type: 'news',
        priority: 5,
        tags: ['test', 'user-fix'],
        target_audience: ['admin'],
        is_pinned: false,
        show_on_homepage: false,
        created_by_user_id: userId,
        author_name: publicUser.name,
        author_organization: publicUser.organization || 'Test Organization',
        status: 'draft'
      }

      const { data: insertResult, error: testInsertError } = await supabase
        .from('adr_information')
        .insert([testData])
        .select()
        .single()

      if (testInsertError) {
        insertError = testInsertError.message
        console.error('Insert test failed:', testInsertError)
      } else {
        insertTest = 'SUCCESS'
        console.log('Insert test passed:', insertResult)
        
        // Clean up test data
        await supabase
          .from('adr_information')
          .delete()
          .eq('id', insertResult.id)
      }
    }

    return NextResponse.json({
      message: 'User check and fix completed',
      session: {
        userId,
        userEmail,
        userName
      },
      authUser,
      publicUser,
      actions: {
        userCreated,
        roleUpdated,
        createError,
        updateError
      },
      tests: {
        rlsAccess: rlsError ? 'FAILED' : 'SUCCESS',
        rlsError: rlsError?.message || null,
        insertTest,
        insertError
      },
      success: true
    })

  } catch (error) {
    console.error('User check API error:', error)
    return NextResponse.json({
      error: 'User check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
}

// POST /api/adr-information/test/user - Force create/update user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({
        error: 'No session found',
        success: false
      }, { status: 401 })
    }

    const body = await request.json()
    const { forceAdmin = true } = body

    const supabase = createClient()

    const userData = {
      id: session.user.id,
      email: session.user.email || `user-${session.user.id}@example.com`,
      name: session.user.name || 'Admin User',
      role: forceAdmin ? 'admin' : 'user',
      organization: body.organization || 'S??? Y t??? Th??nh ph???',
      phone: body.phone || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: result, error } = await supabase
      .from('users')
      .upsert([userData])
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        error: 'Failed to create/update user',
        details: error.message,
        success: false
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'User created/updated successfully',
      user: result,
      success: true
    }, { status: 200 })

  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json({
      error: 'User creation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
}

