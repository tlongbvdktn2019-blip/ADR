import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth-config'
import { createClient, createAdminClient } from '../../../lib/supabase'
import { 
  ADRInformation, 
  InformationQueryParams,
  CreateInformationData,
  InformationStatus,
  InformationListResponse,
  InformationFilters 
} from '../../../types/adr-information'

// GET /api/adr-information - Get list of information/news
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const offset = (page - 1) * limit

    // Parse filters
    const filters: InformationFilters = {
      type: searchParams.get('type') as any,
      status: searchParams.get('status') as any,
      search: searchParams.get('search') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      is_pinned: searchParams.get('is_pinned') === 'true' ? true : undefined,
      show_on_homepage: searchParams.get('show_on_homepage') === 'true' ? true : undefined,
      priority: searchParams.get('priority') ? parseInt(searchParams.get('priority')!) : undefined
    }

    // Sort options
    const sortField = searchParams.get('sort_field') || 'published_at'
    const sortDirection = searchParams.get('sort_direction') || 'desc'

    const supabase = createClient()

    // Build query
    let query = supabase
      .from('adr_information')
      .select('*', { count: 'exact' })

    // Apply filters based on user role
    if (session.user.role === 'admin') {
      // Admin can see all information
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
    } else {
      // Regular users can only see published information targeted to them
      query = query.eq('status', 'published')
      
      // Check expiry
      query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      
      // Check target audience
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

    // Apply other filters
    if (filters.type) {
      query = query.eq('type', filters.type)
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    if (filters.is_pinned !== undefined) {
      query = query.eq('is_pinned', filters.is_pinned)
    }

    if (filters.show_on_homepage !== undefined) {
      query = query.eq('show_on_homepage', filters.show_on_homepage)
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority)
    }

    // Apply sorting
    query = query.order(sortField as any, { ascending: sortDirection === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching ADR information:', error)
      return NextResponse.json(
        { error: 'Failed to fetch information' },
        { status: 500 }
      )
    }

    const response: InformationListResponse = {
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in GET /api/adr-information:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/adr-information - Create new information/news (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' }, 
        { status: 403 }
      )
    }

    const data: CreateInformationData = await request.json()

    // Validate required fields
    if (!data.title || !data.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const allowedStatuses: InformationStatus[] = ['draft', 'published', 'archived']
    const requestedStatus: InformationStatus =
      allowedStatuses.find((status) => status === data.status) ?? 'published'

    const publishedAtValue =
      requestedStatus === 'published'
        ? (data.published_at ? data.published_at : new Date().toISOString())
        : null

    // Prepare data for insertion
    const insertData = {
      title: data.title.trim(),
      summary: data.summary?.trim() || null,
      content: data.content,
      type: data.type || 'news',
      priority: data.priority || 3,
      tags: data.tags || [],
      featured_image_url: data.featured_image_url || null,
      attachments: data.attachments || [],
      target_audience: data.target_audience || ['user'],
      is_pinned: data.is_pinned || false,
      show_on_homepage: data.show_on_homepage || false,
      meta_keywords: data.meta_keywords?.trim() || null,
      meta_description: data.meta_description?.trim() || null,
      expires_at: data.expires_at || null,
      published_at: publishedAtValue,
      created_by_user_id: session.user.id,
      author_name: session.user.name,
      author_organization: session.user.organization || null,
      status: requestedStatus
    }

    const { data: result, error } = await supabase
      .from('adr_information')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error('Error creating ADR information:', error)
      return NextResponse.json(
        { error: 'Failed to create information' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: result }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/adr-information:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


