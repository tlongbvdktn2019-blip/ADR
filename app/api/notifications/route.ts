import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Notification, NotificationStats } from '@/types/notification'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

function parsePagination(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1)
  const requestedLimit = Number.parseInt(searchParams.get('limit') || '20', 10) || 20
  const limit = Math.min(50, Math.max(1, requestedLimit))
  const offset = (page - 1) * limit

  return {
    page,
    limit,
    offset,
    unreadOnly: searchParams.get('unread_only') === 'true',
  }
}

async function getNotificationStats(userId: string): Promise<NotificationStats> {
  const { count: totalCount, error: totalError } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)

  if (totalError) {
    throw new Error(totalError.message)
  }

  const { count: unreadCount, error: unreadError } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('read', false)

  if (unreadError) {
    throw new Error(unreadError.message)
  }

  const total = totalCount || 0
  const unread = unreadCount || 0

  return {
    total,
    unread,
    read: Math.max(0, total - unread),
  }
}

function normalizeNotificationIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null
  }

  return Array.from(new Set(value.filter((id): id is string => typeof id === 'string' && id.length > 0)))
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { page, limit, offset, unreadOnly } = parsePagination(request)

    let query = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('recipient_id', session.user.id)
      .order('created_at', { ascending: false })

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    const stats = await getNotificationStats(session.user.id)
    const totalForPage = count || 0

    return NextResponse.json({
      notifications: (data || []) as Notification[],
      pagination: {
        page,
        limit,
        total: totalForPage,
        totalPages: Math.ceil(totalForPage / limit),
      },
      stats,
    })
  } catch (error) {
    console.error('Notifications API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)

    if (!body || typeof body.action !== 'string') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (body.action === 'mark_as_read') {
      const notificationIds = normalizeNotificationIds(body.notification_ids)

      if (!notificationIds) {
        return NextResponse.json({ error: 'notification_ids is required and must be an array' }, { status: 400 })
      }

      if (notificationIds.length === 0) {
        return NextResponse.json({
          success: true,
          updated: 0,
          stats: await getNotificationStats(session.user.id),
        })
      }

      const { data, error } = await supabaseAdmin
        .from('notifications')
        .update({
          read: true,
          updated_at: new Date().toISOString(),
        })
        .eq('recipient_id', session.user.id)
        .in('id', notificationIds)
        .select('id')

      if (error) {
        console.error('Error marking notifications as read:', error)
        return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        updated: data?.length || 0,
        stats: await getNotificationStats(session.user.id),
      })
    }

    if (body.action === 'mark_all_as_read') {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .update({
          read: true,
          updated_at: new Date().toISOString(),
        })
        .eq('recipient_id', session.user.id)
        .eq('read', false)
        .select('id')

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return NextResponse.json({ error: 'Failed to mark all notifications as read' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        updated: data?.length || 0,
        stats: await getNotificationStats(session.user.id),
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Notifications API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
