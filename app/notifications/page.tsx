'use client'

import { useState } from 'react'
import { 
  BellIcon,
  CheckIcon,
  EyeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import { useNotifications } from '@/hooks/useNotifications'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  const { notifications, stats, loading, fetchNotifications, markAsRead, markAllAsRead } = useNotifications()

  // Filter notifications
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'death':
      case 'life_threatening':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'hospitalization':
      case 'birth_defect':
      case 'permanent_disability':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200'
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

  // Handle select notification
  const handleSelectNotification = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }

  // Handle mark selected as read
  const handleMarkSelectedAsRead = async () => {
    if (selectedIds.length === 0) return

    try {
      const success = await markAsRead(selectedIds)
      if (success) {
        setSelectedIds([])
        toast.success(`Đã đánh dấu ${selectedIds.length} thông báo đã đọc`)
      } else {
        toast.error('Không thể đánh dấu thông báo đã đọc')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    }
  }

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const success = await markAllAsRead()
      if (success) {
        toast.success('Đã đánh dấu tất cả thông báo đã đọc')
      } else {
        toast.error('Không thể đánh dấu tất cả thông báo')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BellIcon className="w-8 h-8 text-primary-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Thông báo</h1>
              <p className="text-gray-600 mt-1">
                {stats.total} thông báo, {stats.unread} chưa đọc
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Filter */}
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-4 h-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Tất cả ({stats.total})</option>
                <option value="unread">Chưa đọc ({stats.unread})</option>
              </select>
            </div>

            {/* Mark all as read */}
            {stats.unread > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                size="sm"
              >
                <CheckIcon className="w-4 h-4 mr-1" />
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </div>
        </div>
        
        {/* Selected actions */}
        {selectedIds.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <span className="text-sm text-blue-800">
              Đã chọn {selectedIds.length} thông báo
            </span>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleMarkSelectedAsRead}
                variant="outline"
                size="sm"
              >
                <CheckIcon className="w-4 h-4 mr-1" />
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

      {/* Notifications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Đang tải thông báo...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card className="text-center py-12">
            <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
            </h3>
            <p className="text-gray-500">
              {filter === 'unread' 
                ? 'Bạn đã đọc tất cả thông báo!'
                : 'Các thông báo mới sẽ xuất hiện ở đây.'
              }
            </p>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-6 transition-all hover:shadow-md ${
                !notification.read ? 'bg-blue-50 border-blue-200' : ''
              } ${
                selectedIds.includes(notification.id) ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedIds.includes(notification.id)}
                  onChange={() => handleSelectNotification(notification.id)}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />

                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  notification.type === 'new_report' 
                    ? 'bg-green-100 text-green-600'
                    : notification.type === 'report_updated'
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {notification.type === 'new_report' ? (
                    <DocumentTextIcon className="w-5 h-5" />
                  ) : notification.type === 'report_updated' ? (
                    <EyeIcon className="w-5 h-5" />
                  ) : (
                    <ExclamationTriangleIcon className="w-5 h-5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {notification.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                      )}
                      <span className="text-sm text-gray-500 flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">
                    {notification.message}
                  </p>

                  {/* Additional info for report notifications */}
                  {notification.data && (
                    <div className="space-y-2">
                      {notification.data.severity_level && (
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            getSeverityColor(notification.data.severity_level)
                          }`}>
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

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      {notification.data?.report_id && (
                        <Link
                          href={`/reports/${notification.data.report_id}`}
                          className="text-sm text-primary-600 hover:text-primary-800 transition-colors"
                        >
                          Xem báo cáo →
                        </Link>
                      )}
                    </div>
                    
                    {!notification.read && (
                      <Button
                        onClick={() => markAsRead([notification.id])}
                        variant="ghost"
                        size="sm"
                      >
                        <CheckIcon className="w-4 h-4 mr-1" />
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

      {/* Load More */}
      {filteredNotifications.length >= 20 && (
        <div className="text-center mt-8">
          <Button
            onClick={() => fetchNotifications(notifications.length + 20)}
            variant="outline"
          >
            Tải thêm thông báo
          </Button>
        </div>
      )}
    </div>
  )
}
