import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { NotificationStats } from '@/types/notification'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

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

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(await getNotificationStats(session.user.id))
  } catch (error) {
    console.error('Notification stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
