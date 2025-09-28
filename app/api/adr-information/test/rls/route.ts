import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth-config'
import { createClient, createAdminClient } from '../../../../../lib/supabase'

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// GET /api/adr-information/test/rls - Test RLS policies specifically
export async function GET(request: NextRequest) {
  try {
    console.log('=== RLS Policy Test ===')
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({
        error: 'No session found',
        success: false
      }, { status: 401 })
    }

    const supabase = createClient()
    const getErrorMessage = (error: unknown): string | null => {
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as { message?: unknown }).message
        return typeof message === 'string' ? message : JSON.stringify(message)
      }
      return null
    }


    // Test 1: Get current user info
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    console.log('Current user:', currentUser)
    console.log('User error:', userError)

    if (userError) {
      return NextResponse.json({
        error: 'Cannot find current user',
        details: getErrorMessage(userError) || 'Unknown error',
        userId: session.user.id,
        success: false
      }, { status: 500 })
    }

    // Test 2: Check auth.uid() function
    const { data: authTest, error: authError } = await supabase
      .rpc('get_current_user_id')

    console.log('Auth UID test:', authTest)
    console.log('Auth error:', authError)

    // Test 3: Try direct RLS test query
    const testQuery = `
      SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role::text = 'admin'
      ) as is_admin
    `

    const { data: rlsTest, error: rlsError } = await supabase
      .rpc('execute_sql', { query: testQuery })

    console.log('RLS test result:', rlsTest)
    console.log('RLS test error:', rlsError)

    // Test 4: Check existing policies
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'adr_information')

    console.log('Existing policies:', policies)

    // Test 5: Try insert with RLS bypass (service role)
    const serviceSupabase = createAdminClient() // Use service role if available

    const testData = {
      title: 'RLS Test - ' + new Date().toISOString(),
      content: '<p>Testing RLS policies</p>',
      type: 'news',
      priority: 3,
      tags: [],
      target_audience: ['admin'],
      is_pinned: false,
      show_on_homepage: false,
      created_by_user_id: session.user.id,
      author_name: session.user.name || 'Test User',
      author_organization: session.user.organization || 'Test Org',
      status: 'draft'
    }

    const { data: serviceInsert, error: serviceError } = await serviceSupabase
      .from('adr_information')
      .insert([testData])
      .select()
      .single()

    console.log('Service role insert:', serviceInsert)
    console.log('Service role error:', serviceError)

    // Clean up service role test data
    if (serviceInsert) {
      await serviceSupabase
        .from('adr_information')
        .delete()
        .eq('id', serviceInsert.id)
    }

    // Test 6: Try regular insert (should fail with RLS)
    const { data: regularInsert, error: regularError } = await supabase
      .from('adr_information')
      .insert([testData])
      .select()
      .single()

    console.log('Regular insert:', regularInsert)
    console.log('Regular insert error:', regularError)

    return NextResponse.json({
      message: 'RLS policy test completed',
      results: {
        currentUser: currentUser,
        userLookupError: getErrorMessage(userError),
        authUidTest: authTest,
        authUidError: getErrorMessage(authError),
        rlsTest: rlsTest,
        rlsError: getErrorMessage(rlsError),
        policies: policies,
        policyError: getErrorMessage(policyError),
        serviceRoleInsert: serviceInsert ? 'SUCCESS' : 'FAILED',
        serviceRoleError: getErrorMessage(serviceError),
        regularInsert: regularInsert ? 'SUCCESS' : 'FAILED',
        regularInsertError: getErrorMessage(regularError)
      },
      success: true
    })

  } catch (error) {
    console.error('RLS test error:', error)
    return NextResponse.json({
      error: 'RLS test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
}

// Helper function to create Supabase client with service role
function createServiceClient() {
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase configuration for service role')
  }
  
  return createSupabaseClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}



