import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { rejectUnlessDevelopmentAdmin } from '@/lib/debug-route'
import { createNotificationForUsers } from '@/lib/notification-service'
import type { NotificationType } from '@/types/notification'

export async function POST(request: NextRequest) {
  try {
    const guard = await rejectUnlessDevelopmentAdmin()
    if (guard) {
      return guard
    }

    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    const { type = 'system', title, message, data } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
    }

    const allowedTypes: NotificationType[] = ['new_report', 'report_updated', 'system']
    const notificationType: NotificationType = allowedTypes.includes(type) ? type : 'system'

    const result = await createNotificationForUsers({
      recipientIds: [session.user.id],
      senderId: null,
      type: notificationType,
      title,
      message,
      data: {
        ...data,
        test: true,
        created_by: 'test-api',
        created_at: new Date().toISOString(),
      },
    })

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      inserted: result.inserted,
      message: 'Test notification created successfully'
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
