/**
 * Organization Settings API
 * CRUD operations for organization email notification settings
 * Admin only
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import { Database } from '@/types/supabase'
import { isValidEmail } from '@/lib/email-service'

// Create Supabase admin client
const supabaseAdmin = createClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey
)

// GET /api/organization-settings - List all organization settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const activeOnly = searchParams.get('active_only') === 'true'
    const offset = (page - 1) * limit

    // Build query
    let query = (supabaseAdmin
      .from('organization_settings') as any)
      .select('*', { count: 'exact' })
      .order('organization_name', { ascending: true })

    // Apply filters
    if (search) {
      query = query.ilike('organization_name', `%${search}%`)
    }

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching organization settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch organization settings' },
        { status: 500 }
      )
    }

    // Get stats
    const { data: statsData } = await (supabaseAdmin
      .from('organization_settings') as any)
      .select('is_active')

    const stats = {
      total: statsData?.length || 0,
      active: statsData?.filter((s: any) => s.is_active).length || 0,
      inactive: statsData?.filter((s: any) => !s.is_active).length || 0
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/organization-settings - Create new organization setting
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      organization_name,
      notification_email,
      contact_person,
      contact_phone,
      is_active = true
    } = body

    // Validate required fields
    if (!organization_name || !notification_email) {
      return NextResponse.json(
        { error: 'organization_name and notification_email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!isValidEmail(notification_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Insert new organization setting
    const { data, error } = await (supabaseAdmin
      .from('organization_settings') as any)
      .insert({
        organization_name: organization_name.trim(),
        notification_email: notification_email.trim().toLowerCase(),
        contact_person: contact_person?.trim() || null,
        contact_phone: contact_phone?.trim() || null,
        is_active
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'Organization already exists' },
          { status: 409 }
        )
      }
      console.error('Error creating organization setting:', error)
      return NextResponse.json(
        { error: 'Failed to create organization setting' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Organization setting created successfully',
      data
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

