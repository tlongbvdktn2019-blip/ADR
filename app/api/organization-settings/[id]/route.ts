/**
 * Organization Settings API - Single record operations
 * GET, PUT, DELETE for specific organization setting
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@supabase/supabase-js'
import { UpdateOrganizationSettingsData } from '@/types/organization-settings'
import { config } from '@/lib/config'
import { Database } from '@/types/supabase'
import { isValidEmail } from '@/lib/email-service'

// Create Supabase admin client
const supabaseAdmin = createClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey
)

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/organization-settings/[id] - Get single organization setting
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('organization_settings' as any)
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Organization setting not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
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

// PUT /api/organization-settings/[id] - Update organization setting
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
      notification_email,
      contact_person,
      contact_phone,
      is_active
    } = body

    // Validate email if provided
    if (notification_email && !isValidEmail(notification_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: Partial<Database['public']['Tables']['organization_settings']['Update']> = {
      updated_at: new Date().toISOString()
    }

    if (notification_email !== undefined) {
      updateData.notification_email = notification_email.trim().toLowerCase()
    }
    if (contact_person !== undefined) {
      updateData.contact_person = contact_person?.trim() || null
    }
    if (contact_phone !== undefined) {
      updateData.contact_phone = contact_phone?.trim() || null
    }
    if (is_active !== undefined) {
      updateData.is_active = is_active
    }

    // Update organization setting
    const { data, error } = await (supabaseAdmin
      .from('organization_settings') as any)
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating organization setting:', error)
      return NextResponse.json(
        { error: 'Failed to update organization setting' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Organization setting not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Organization setting updated successfully',
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

// DELETE /api/organization-settings/[id] - Delete organization setting
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { error } = await supabaseAdmin
      .from('organization_settings' as any)
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting organization setting:', error)
      return NextResponse.json(
        { error: 'Failed to delete organization setting' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Organization setting deleted successfully'
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

