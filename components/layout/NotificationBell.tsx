'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { 
  BellIcon,
  XMarkIcon,
  CheckIcon,
  EyeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { Notification } from '@/types/notification'
import { useNotifications } from '@/hooks/useNotifications'

export default function NotificationBell() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [markingAsRead, setMarkingAsRead] = useState<string[]>([])
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Use notifications hook
  const { 
    notifications, 
    stats, 
    loading, 
    fetchNotifications, 
    markAsRead: markAsReadHook, 
    markAllAsRead: markAllAsReadHook 
  } = useNotifications()

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (markingAsRead.includes(notificationId)) return

    setMarkingAsRead(prev => [...prev, notificationId])
    
    try {
      const success = await markAsReadHook([notificationId])
      if (!success) {
        toast.error('Không thể đánh dấu thông báo đã đọc')
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Không thể đánh dấu thông báo đã đọc')
    } finally {
      setMarkingAsRead(prev => prev.filter(id => id !== notificationId))
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const success = await markAllAsReadHook()
      if (success) {
        toast.success('Đã đánh dấu tất cả thông báo đã đọc')
      } else {
        toast.error('Không thể đánh dấu tất cả thông báo')
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Không thể đánh dấu tất cả thông báo')
    }
  }

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'death':
      case 'life_threatening':
        return 'text-red-600 bg-red-50'
      case 'hospitalization':
      case 'birth_defect':
      case 'permanent_disability':
        return 'text-orange-600 bg-orange-50'
      default:
        return 'text-blue-600 bg-blue-50'
    }
  }

  // Get severity label
  const getSeverityLabel = (severity: string) => {
    const labels: Record<string, string> = {
      death: 'Tử vong',
      life_threatening: 'Đe dọa tính mạng',
      hospitalization: 'Nhập viện',
      birth_defect: 'Dị tật bẩm sinh',
      permanent_disability: 'Tàn tật vĩnh viễn',
      not_serious: 'Không nghiêm trọng'
    }
    return labels[severity] || severity
  }

  // Format notification time
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: vi 
      })
    } catch (error) {
      return 'Vừa xong'
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch notifications when dropdown is opened
  useEffect(() => {
    if (isOpen && session?.user?.id) {
      fetchNotifications()
    }
  }, [isOpen, session?.user?.id, fetchNotifications])

  if (!session?.user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg transition-colors"
      >
        {stats.unread > 0 ? (
          <BellIconSolid className="w-6 h-6 text-primary-600" />
        ) : (
          <BellIcon className="w-6 h-6" />
        )}
        
        {/* Unread count badge */}
        {stats.unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {stats.unread > 99 ? '99+' : stats.unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg ring-1 ring-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <BellIcon className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Thông báo</h3>
              {stats.unread > 0 && (
                <span className="ml-2 bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                  {stats.unread} mới
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {stats.unread > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-primary-600 hover:text-primary-800 transition-colors"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-sm">Đang tải...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <BellIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-sm">Chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        notification.type === 'new_report' 
                          ? 'bg-green-100 text-green-600'
                          : notification.type === 'report_updated'
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {notification.type === 'new_report' ? (
                          <DocumentTextIcon className="w-4 h-4" />
                        ) : notification.type === 'report_updated' ? (
                          <EyeIcon className="w-4 h-4" />
                        ) : (
                          <ExclamationTriangleIcon className="w-4 h-4" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="flex-shrink-0 w-2 h-2 bg-primary-600 rounded-full"></div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>

                        {/* Additional info for report notifications */}
                        {notification.data?.severity_level && (
                          <div className="mt-2 flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              getSeverityColor(notification.data.severity_level)
                            }`}>
                              {getSeverityLabel(notification.data.severity_level)}
                            </span>
                            {notification.data.report_code && (
                              <span className="text-xs text-gray-500">
                                {notification.data.report_code}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center text-xs text-gray-500">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            {formatTime(notification.created_at)}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {notification.data?.report_id && (
                              <Link
                                href={`/reports/${notification.data.report_id}`}
                                onClick={() => setIsOpen(false)}
                                className="text-xs text-primary-600 hover:text-primary-800 transition-colors"
                              >
                                Xem báo cáo
                              </Link>
                            )}
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                disabled={markingAsRead.includes(notification.id)}
                                className="text-xs text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                              >
                                {markingAsRead.includes(notification.id) ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
                                ) : (
                                  <CheckIcon className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-sm text-primary-600 hover:text-primary-800 transition-colors block text-center"
              >
                Xem tất cả thông báo
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
