'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Notification, NotificationStats } from '@/types/notification'

export function useNotifications() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats>({ total: 0, unread: 0, read: 0 })
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  // Fetch notifications
  const fetchNotifications = async (limit = 20) => {
    if (!session?.user?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/notifications?limit=${limit}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch stats only
  const fetchStats = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/notifications/stats')
      if (response.ok) {
        const newStats = await response.json()
        setStats(newStats)
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error)
    }
  }

  // Mark notifications as read
  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_as_read',
          notification_ids: notificationIds
        })
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notificationIds.includes(notif.id)
              ? { ...notif, read: true }
              : notif
          )
        )
        setStats(prev => ({
          ...prev,
          unread: Math.max(0, prev.unread - notificationIds.length),
          read: prev.read + notificationIds.length
        }))
        return true
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
    return false
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_as_read' })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        )
        setStats(prev => ({
          total: prev.total,
          unread: 0,
          read: prev.total
        }))
        return true
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
    return false
  }

  // Setup real-time subscription
  useEffect(() => {
    if (!session?.user?.id) return

    // Subscribe to new notifications for current user
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('New notification received:', payload)
          // Fetch fresh stats when new notification comes in
          fetchStats()
          
          // If we have notifications loaded, add the new one
          if (notifications.length > 0) {
            const newNotification = payload.new as Notification
            setNotifications(prev => [newNotification, ...prev])
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('Notification updated:', payload)
          // Update the notification in local state
          const updatedNotification = payload.new as Notification
          setNotifications(prev => 
            prev.map(notif => 
              notif.id === updatedNotification.id 
                ? updatedNotification 
                : notif
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.user?.id, supabase])

  // Initial fetch and periodic polling
  useEffect(() => {
    if (session?.user?.id) {
      fetchStats()
      
      // Poll for stats every 30 seconds as backup
      const interval = setInterval(fetchStats, 30000)
      return () => clearInterval(interval)
    }
  }, [session?.user?.id])

  return {
    notifications,
    stats,
    loading,
    fetchNotifications,
    fetchStats,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  }
}
