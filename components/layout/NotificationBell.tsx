'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  BellIcon,
  CheckIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid'
import { useNotifications } from '@/hooks/useNotifications'

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'death':
    case 'life_threatening':
      return 'text-red-700 bg-red-50'
    case 'hospitalization':
    case 'birth_defect':
    case 'permanent_disability':
      return 'text-orange-700 bg-orange-50'
    default:
      return 'text-blue-700 bg-blue-50'
  }
}

function getSeverityLabel(severity: string) {
  const labels: Record<string, string> = {
    death: 'Tử vong',
    life_threatening: 'Đe dọa tính mạng',
    hospitalization: 'Nhập viện',
    birth_defect: 'Dị tật bẩm sinh',
    permanent_disability: 'Tàn tật vĩnh viễn',
    not_serious: 'Không nghiêm trọng',
  }

  return labels[severity] || severity
}

function formatNotificationTime(dateString: string) {
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: vi,
    })
  } catch {
    return 'Vừa xong'
  }
}

function getNotificationIcon(type: string) {
  if (type === 'new_report') {
    return <DocumentTextIcon className="h-4 w-4" />
  }

  if (type === 'report_updated') {
    return <EyeIcon className="h-4 w-4" />
  }

  return <ExclamationTriangleIcon className="h-4 w-4" />
}

function getNotificationIconClass(type: string) {
  if (type === 'new_report') {
    return 'bg-green-100 text-green-700'
  }

  if (type === 'report_updated') {
    return 'bg-blue-100 text-blue-700'
  }

  return 'bg-gray-100 text-gray-700'
}

export default function NotificationBell() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [markingAsRead, setMarkingAsRead] = useState<string[]>([])
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const {
    notifications,
    stats,
    loading,
    error,
    fetchNotifications,
    markAsRead: markAsReadHook,
    markAllAsRead: markAllAsReadHook,
  } = useNotifications()

  const markAsRead = async (notificationId: string) => {
    if (markingAsRead.includes(notificationId)) return

    setMarkingAsRead(prev => [...prev, notificationId])

    try {
      const success = await markAsReadHook([notificationId])
      if (!success) {
        toast.error('Không thể đánh dấu thông báo đã đọc')
      }
    } finally {
      setMarkingAsRead(prev => prev.filter(id => id !== notificationId))
    }
  }

  const markAllAsRead = async () => {
    if (markingAllAsRead) return

    setMarkingAllAsRead(true)

    try {
      const success = await markAllAsReadHook()
      if (success) {
        toast.success('Đã đánh dấu tất cả thông báo đã đọc')
      } else {
        toast.error('Không thể đánh dấu tất cả thông báo')
      }
    } finally {
      setMarkingAllAsRead(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && session?.user?.id) {
      fetchNotifications(20)
    }
  }, [fetchNotifications, isOpen, session?.user?.id])

  if (!session?.user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        aria-label="Mở thông báo"
        onClick={() => setIsOpen(prev => !prev)}
        className="relative rounded-lg p-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-blue-800"
      >
        {stats.unread > 0 ? (
          <BellIconSolid className="h-6 w-6 text-yellow-200" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}

        {stats.unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold leading-none text-white">
            {stats.unread > 99 ? '99+' : stats.unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-96 max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-gray-200">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <div className="flex min-w-0 items-center">
              <BellIcon className="mr-2 h-5 w-5 flex-shrink-0 text-gray-400" />
              <h3 className="text-base font-semibold text-gray-900">Thông báo</h3>
              {stats.unread > 0 && (
                <span className="ml-2 rounded-full bg-primary-100 px-2 py-1 text-xs font-medium text-primary-800">
                  {stats.unread} mới
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {stats.unread > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  disabled={markingAllAsRead}
                  className="text-xs font-medium text-primary-600 transition-colors hover:text-primary-800 disabled:opacity-50"
                >
                  Đánh dấu tất cả
                </button>
              )}
              <button
                type="button"
                aria-label="Đóng thông báo"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-500">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-primary-600" />
                <p className="mt-2 text-sm">Đang tải...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-sm text-red-600">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <BellIcon className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="text-sm">Chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 transition-colors hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${getNotificationIconClass(notification.type)}`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary-600" />
                          )}
                        </div>

                        <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                          {notification.message}
                        </p>

                        {notification.data?.severity_level && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getSeverityColor(notification.data.severity_level)}`}
                            >
                              {getSeverityLabel(notification.data.severity_level)}
                            </span>
                            {notification.data.report_code && (
                              <span className="text-xs text-gray-500">
                                {notification.data.report_code}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="flex items-center text-xs text-gray-500">
                            <ClockIcon className="mr-1 h-3 w-3" />
                            {formatNotificationTime(notification.created_at)}
                          </div>

                          <div className="flex flex-shrink-0 items-center gap-2">
                            {notification.data?.report_id && (
                              <Link
                                href={`/reports/${notification.data.report_id}`}
                                onClick={() => setIsOpen(false)}
                                className="text-xs font-medium text-primary-600 transition-colors hover:text-primary-800"
                              >
                                Xem báo cáo
                              </Link>
                            )}
                            {!notification.read && (
                              <button
                                type="button"
                                aria-label="Đánh dấu đã đọc"
                                onClick={() => markAsRead(notification.id)}
                                disabled={markingAsRead.includes(notification.id)}
                                className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                              >
                                {markingAsRead.includes(notification.id) ? (
                                  <div className="h-3 w-3 animate-spin rounded-full border-b border-gray-400" />
                                ) : (
                                  <CheckIcon className="h-3 w-3" />
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

          {notifications.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 p-3">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center text-sm font-medium text-primary-600 transition-colors hover:text-primary-800"
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
