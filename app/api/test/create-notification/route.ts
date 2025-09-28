import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    const { type = 'system', title, message, data } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
    }

    // Create test notification for current user
    const testNotification = {
      recipient_id: session.user.id,
      sender_id: null,
      type,
      title,
      message,
      data: {
        ...data,
        test: true,
        created_by: 'test-api',
        created_at: new Date().toISOString()
      },
      read: false
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([testNotification])
      .select()
      .single()

    if (error) {
      console.error('Error creating test notification:', error)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      notification,
      message: 'Test notification created successfully'
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
