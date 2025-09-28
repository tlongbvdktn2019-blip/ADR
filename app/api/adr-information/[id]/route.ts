import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth-config'
import { createClient, createAdminClient } from '../../../../lib/supabase'
import { 
  ADRInformation, 
  UpdateInformationData,
  InformationResponse 
} from '../../../../types/adr-information'

// GET /api/adr-information/[id] - Get specific information by ID
export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const { id } = params
    const supabase = createClient()

    // First, get the information
    let query = supabase
      .from('adr_information')
      .select('*')
      .eq('id', id)

    // Apply visibility rules for non-admin users
    if (session.user.role !== 'admin') {
      query = query.eq('status', 'published')
      query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      
      const userConditions = [
        'target_audience.is.null',
        'target_audience.cs.{public}',
        'target_audience.cs.{user}'
      ]
      
      if (session.user.organization) {
        userConditions.push(`target_audience.cs.{${session.user.organization}}`)
      }
      
      query = query.or(userConditions.join(','))
    }

    const { data: information, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Information not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching ADR information:', error)
      return NextResponse.json(
        { error: 'Failed to fetch information' },
        { status: 500 }
      )
    }

    // Check if user has liked this information
    const { data: likeData } = await supabase
      .from('information_likes')
      .select('id')
      .eq('information_id', id)
      .eq('user_id', session.user.id)
      .single()

    // Check if user has viewed this information
    const { data: viewData } = await supabase
      .from('information_views')
      .select('id')
      .eq('information_id', id)
      .eq('user_id', session.user.id)
      .single()

    // Record view if not already viewed
    if (!viewData) {
      await supabase
        .from('information_views')
        .insert([{
          information_id: id,
          user_id: session.user.id,
          user_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        }])
    }

    const response: InformationResponse = {
      data: information,
      isLiked: !!likeData,
      hasViewed: !!viewData
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in GET /api/adr-information/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/adr-information/[id] - Update information (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' }, 
        { status: 403 }
      )
    }

    const { id } = params
    const data: UpdateInformationData = await request.json()

    const supabase = createAdminClient()

    // Check if information exists
    const { data: existing, error: fetchError } = await supabase
      .from('adr_information')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Information not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    if (data.title !== undefined) updateData.title = data.title.trim()
    if (data.summary !== undefined) updateData.summary = data.summary?.trim() || null
    if (data.content !== undefined) updateData.content = data.content
    if (data.type !== undefined) updateData.type = data.type
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.tags !== undefined) updateData.tags = data.tags
    if (data.featured_image_url !== undefined) updateData.featured_image_url = data.featured_image_url || null
    if (data.attachments !== undefined) updateData.attachments = data.attachments
    if (data.target_audience !== undefined) updateData.target_audience = data.target_audience
    if (data.is_pinned !== undefined) updateData.is_pinned = data.is_pinned
    if (data.show_on_homepage !== undefined) updateData.show_on_homepage = data.show_on_homepage
    if (data.meta_keywords !== undefined) updateData.meta_keywords = data.meta_keywords?.trim() || null
    if (data.meta_description !== undefined) updateData.meta_description = data.meta_description?.trim() || null
    if (data.expires_at !== undefined) updateData.expires_at = data.expires_at || null
    if (data.status !== undefined) {
      updateData.status = data.status
      if (data.status === 'published' && data.published_at === undefined) {
        updateData.published_at = new Date().toISOString()
      }
    }
    if (data.published_at !== undefined) updateData.published_at = data.published_at

    const { data: result, error } = await supabase
      .from('adr_information')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating ADR information:', error)
      return NextResponse.json(
        { error: 'Failed to update information' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: result })

  } catch (error) {
    console.error('Error in PUT /api/adr-information/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/adr-information/[id] - Delete information (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' }, 
        { status: 403 }
      )
    }

    const { id } = params
    const supabase = createAdminClient()

    // Check if information exists
    const { data: existing, error: fetchError } = await supabase
      .from('adr_information')
      .select('id, title')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Information not found' },
        { status: 404 }
      )
    }

    // Delete the information (cascading deletes will handle related records)
    const { error } = await supabase
      .from('adr_information')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting ADR information:', error)
      return NextResponse.json(
        { error: 'Failed to delete information' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: `Information "${existing.title}" deleted successfully` 
    })

  } catch (error) {
    console.error('Error in DELETE /api/adr-information/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

