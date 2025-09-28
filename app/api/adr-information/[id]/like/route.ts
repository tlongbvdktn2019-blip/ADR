import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../../lib/auth-config'
import { createClient } from '../../../../../lib/supabase'

// POST /api/adr-information/[id]/like - Like information
export async function POST(
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

    // Check if information exists and user can access it
    let query = supabase
      .from('adr_information')
      .select('id, title')
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

    const { data: information, error: fetchError } = await query.single()

    if (fetchError || !information) {
      return NextResponse.json(
        { error: 'Information not found' },
        { status: 404 }
      )
    }

    // Try to insert like (will fail if already exists due to unique constraint)
    const { error } = await supabase
      .from('information_likes')
      .insert([{
        information_id: id,
        user_id: session.user.id
      }])

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Already liked' },
          { status: 409 }
        )
      }
      console.error('Error creating like:', error)
      return NextResponse.json(
        { error: 'Failed to like information' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Information liked successfully' })

  } catch (error) {
    console.error('Error in POST /api/adr-information/[id]/like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/adr-information/[id]/like - Unlike information
export async function DELETE(
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

    // Delete the like
    const { error } = await supabase
      .from('information_likes')
      .delete()
      .eq('information_id', id)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error deleting like:', error)
      return NextResponse.json(
        { error: 'Failed to unlike information' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Information unliked successfully' })

  } catch (error) {
    console.error('Error in DELETE /api/adr-information/[id]/like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { authOptions } from '../../../../../lib/auth-config'
import { createClient } from '../../../../../lib/supabase'

// POST /api/adr-information/[id]/like - Like information
export async function POST(
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

    // Check if information exists and user can access it
    let query = supabase
      .from('adr_information')
      .select('id, title')
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

    const { data: information, error: fetchError } = await query.single()

    if (fetchError || !information) {
      return NextResponse.json(
        { error: 'Information not found' },
        { status: 404 }
      )
    }

    // Try to insert like (will fail if already exists due to unique constraint)
    const { error } = await supabase
      .from('information_likes')
      .insert([{
        information_id: id,
        user_id: session.user.id
      }])

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Already liked' },
          { status: 409 }
        )
      }
      console.error('Error creating like:', error)
      return NextResponse.json(
        { error: 'Failed to like information' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Information liked successfully' })

  } catch (error) {
    console.error('Error in POST /api/adr-information/[id]/like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/adr-information/[id]/like - Unlike information
export async function DELETE(
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

    // Delete the like
    const { error } = await supabase
      .from('information_likes')
      .delete()
      .eq('information_id', id)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error deleting like:', error)
      return NextResponse.json(
        { error: 'Failed to unlike information' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Information unliked successfully' })

  } catch (error) {
    console.error('Error in DELETE /api/adr-information/[id]/like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
