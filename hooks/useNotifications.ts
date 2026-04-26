'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import type { Notification, NotificationStats } from '@/types/notification'

interface UseNotificationsOptions {
  autoFetch?: boolean
  pollIntervalMs?: number
}

interface NotificationPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const emptyStats: NotificationStats = { total: 0, unread: 0, read: 0 }

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { data: session, status } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats>(emptyStats)
  const [pagination, setPagination] = useState<NotificationPagination | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!session?.user?.id) return null

    try {
      const response = await fetch('/api/notifications/stats', {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Không thể tải số lượng thông báo')
      }

      const newStats = await response.json()
      setStats(newStats)
      return newStats as NotificationStats
    } catch (fetchError) {
      console.error('Error fetching notification stats:', fetchError)
      return null
    }
  }, [session?.user?.id])

  const fetchNotifications = useCallback(async (limit = 20, page = 1, unreadOnly = false) => {
    if (!session?.user?.id) return null

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })

      if (unreadOnly) {
        params.set('unread_only', 'true')
      }

      const response = await fetch(`/api/notifications?${params.toString()}`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Không thể tải danh sách thông báo')
      }

      const data = await response.json()
      setNotifications(data.notifications || [])
      setStats(data.stats || emptyStats)
      setPagination(data.pagination || null)
      return data
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Không thể tải thông báo'
      console.error('Error fetching notifications:', fetchError)
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    if (!session?.user?.id || notificationIds.length === 0) return false

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_as_read',
          notification_ids: notificationIds,
        }),
      })

      if (!response.ok) {
        throw new Error('Không thể đánh dấu thông báo đã đọc')
      }

      const data = await response.json()
      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, read: true }
            : notification
        )
      )

      if (data.stats) {
        setStats(data.stats)
      } else {
        await fetchStats()
      }

      return true
    } catch (markError) {
      console.error('Error marking notifications as read:', markError)
      return false
    }
  }, [fetchStats, session?.user?.id])

  const markAllAsRead = useCallback(async () => {
    if (!session?.user?.id) return false

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_as_read' }),
      })

      if (!response.ok) {
        throw new Error('Không thể đánh dấu tất cả thông báo')
      }

      const data = await response.json()
      setNotifications(prev => prev.map(notification => ({ ...notification, read: true })))

      if (data.stats) {
        setStats(data.stats)
      } else {
        await fetchStats()
      }

      return true
    } catch (markError) {
      console.error('Error marking all notifications as read:', markError)
      return false
    }
  }, [fetchStats, session?.user?.id])

  useEffect(() => {
    if (status === 'unauthenticated') {
      setNotifications([])
      setStats(emptyStats)
      setPagination(null)
      setError(null)
    }
  }, [status])

  useEffect(() => {
    if (!session?.user?.id) return

    fetchStats()
    const interval = window.setInterval(fetchStats, options.pollIntervalMs || 30000)

    return () => window.clearInterval(interval)
  }, [fetchStats, options.pollIntervalMs, session?.user?.id])

  useEffect(() => {
    if (!options.autoFetch || !session?.user?.id) return

    fetchNotifications()
  }, [fetchNotifications, options.autoFetch, session?.user?.id])

  return {
    notifications,
    stats,
    pagination,
    loading,
    error,
    fetchNotifications,
    fetchStats,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  }
}
