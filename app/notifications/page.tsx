'use client'

import { useMemo, useState } from 'react'
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
  FunnelIcon,
} from '@heroicons/react/24/outline'
import { useNotifications } from '@/hooks/useNotifications'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'death':
    case 'life_threatening':
      return 'text-red-700 bg-red-50 border-red-200'
    case 'hospitalization':
    case 'birth_defect':
    case 'permanent_disability':
      return 'text-orange-700 bg-orange-50 border-orange-200'
    default:
      return 'text-blue-700 bg-blue-50 border-blue-200'
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
    return <DocumentTextIcon className="h-5 w-5" />
  }

  if (type === 'report_updated') {
    return <EyeIcon className="h-5 w-5" />
  }

  return <ExclamationTriangleIcon className="h-5 w-5" />
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

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [markingSelected, setMarkingSelected] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const {
    notifications,
    stats,
    pagination,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ autoFetch: true })

  const filteredNotifications = useMemo(() => {
    return filter === 'unread'
      ? notifications.filter(notification => !notification.read)
      : notifications
  }, [filter, notifications])

  const hasMore = pagination ? notifications.length < pagination.total : notifications.length >= 20

  const handleSelectNotification = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }

  const handleMarkSelectedAsRead = async () => {
    if (selectedIds.length === 0 || markingSelected) return

    setMarkingSelected(true)

    try {
      const success = await markAsRead(selectedIds)
      if (success) {
        toast.success(`Đã đánh dấu ${selectedIds.length} thông báo đã đọc`)
        setSelectedIds([])
      } else {
        toast.error('Không thể đánh dấu thông báo đã đọc')
      }
    } finally {
      setMarkingSelected(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (markingAll) return

    setMarkingAll(true)

    try {
      const success = await markAllAsRead()
      if (success) {
        toast.success('Đã đánh dấu tất cả thông báo đã đọc')
        setSelectedIds([])
      } else {
        toast.error('Không thể đánh dấu tất cả thông báo')
      }
    } finally {
      setMarkingAll(false)
    }
  }

  const handleLoadMore = () => {
    const nextLimit = notifications.length + 20
    fetchNotifications(nextLimit)
  }

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center">
            <BellIcon className="mr-3 h-8 w-8 flex-shrink-0 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Thông báo</h1>
              <p className="mt-1 text-sm text-gray-600 sm:text-base">
                {stats.total} thông báo, {stats.unread} chưa đọc
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <select
                value={filter}
                onChange={event => setFilter(event.target.value as 'all' | 'unread')}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Tất cả ({stats.total})</option>
                <option value="unread">Chưa đọc ({stats.unread})</option>
              </select>
            </div>

            {stats.unread > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                size="sm"
                loading={markingAll}
              >
                <CheckIcon className="mr-1 h-4 w-4" />
                Đánh dấu tất cả
              </Button>
            )}
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-blue-800">
              Đã chọn {selectedIds.length} thông báo
            </span>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleMarkSelectedAsRead}
                variant="outline"
                size="sm"
                loading={markingSelected}
              >
                <CheckIcon className="mr-1 h-4 w-4" />
                Đánh dấu đã đọc
              </Button>
              <Button
                onClick={() => setSelectedIds([])}
                variant="ghost"
                size="sm"
              >
                Hủy chọn
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {loading && notifications.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
            <p className="mt-4 text-gray-500">Đang tải thông báo...</p>
          </div>
        ) : error ? (
          <Card className="py-12 text-center">
            <ExclamationTriangleIcon className="mx-auto mb-4 h-12 w-12 text-red-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">Không thể tải thông báo</h3>
            <p className="text-gray-500">{error}</p>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card className="py-12 text-center">
            <BellIcon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
            </h3>
            <p className="text-gray-500">
              {filter === 'unread'
                ? 'Bạn đã đọc tất cả thông báo.'
                : 'Các thông báo mới sẽ xuất hiện ở đây.'}
            </p>
          </Card>
        ) : (
          filteredNotifications.map(notification => (
            <Card
              key={notification.id}
              className={`p-4 transition-all hover:shadow-md sm:p-6 ${
                !notification.read ? 'border-blue-200 bg-blue-50' : ''
              } ${
                selectedIds.includes(notification.id) ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  aria-label="Chọn thông báo"
                  checked={selectedIds.includes(notification.id)}
                  onChange={() => handleSelectNotification(notification.id)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />

                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${getNotificationIconClass(notification.type)}`}
                >
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="mt-1 inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800">
                          Mới
                        </span>
                      )}
                    </div>

                    <span className="flex flex-shrink-0 items-center text-sm text-gray-500">
                      <ClockIcon className="mr-1 h-4 w-4" />
                      {formatNotificationTime(notification.created_at)}
                    </span>
                  </div>

                  <p className="mt-3 text-gray-700">{notification.message}</p>

                  {notification.data && (
                    <div className="mt-4 space-y-2">
                      {notification.data.severity_level && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getSeverityColor(notification.data.severity_level)}`}
                          >
                            {getSeverityLabel(notification.data.severity_level)}
                          </span>
                          {notification.data.report_code && (
                            <span className="text-sm text-gray-500">
                              Mã: {notification.data.report_code}
                            </span>
                          )}
                        </div>
                      )}

                      {notification.data.patient_name && (
                        <p className="text-sm text-gray-600">
                          Bệnh nhân: <span className="font-medium">{notification.data.patient_name}</span>
                        </p>
                      )}

                      {notification.data.organization && (
                        <p className="text-sm text-gray-600">
                          Đơn vị: <span className="font-medium">{notification.data.organization}</span>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      {notification.data?.report_id && (
                        <Link
                          href={`/reports/${notification.data.report_id}`}
                          className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-800"
                        >
                          Xem báo cáo
                        </Link>
                      )}
                    </div>

                    {!notification.read && (
                      <Button
                        onClick={() => markAsRead([notification.id])}
                        variant="ghost"
                        size="sm"
                      >
                        <CheckIcon className="mr-1 h-4 w-4" />
                        Đánh dấu đã đọc
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <Button
            onClick={handleLoadMore}
            variant="outline"
            loading={loading && notifications.length > 0}
          >
            Tải thêm thông báo
          </Button>
        </div>
      )}
    </div>
  )
}
