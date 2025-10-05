'use client'

/**
 * Admin Page - Quản lý Email Thông báo theo Tổ chức
 * Cho phép admin cấu hình email notification cho từng tổ chức
 */

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import type { OrganizationSettings } from '@/types/organization-settings'

export default function OrganizationEmailsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [settings, setSettings] = useState<OrganizationSettings[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<OrganizationSettings | null>(null)
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 })

  // Form state
  const [formData, setFormData] = useState({
    organization_name: '',
    notification_email: '',
    contact_person: '',
    contact_phone: '',
    is_active: true
  })

  // Redirect if not admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/unauthorized')
    }
  }, [status, session, router])

  // Fetch organization settings
  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/organization-settings?limit=100')
      const data = await response.json()
      
      if (data.success) {
        setSettings(data.data || [])
        setStats(data.stats || { total: 0, active: 0, inactive: 0 })
      } else {
        toast.error('Không thể tải dữ liệu')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Lỗi khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchSettings()
    }
  }, [session])

  // Filter settings based on search
  const filteredSettings = settings.filter(setting =>
    setting.organization_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    setting.notification_email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingItem
        ? `/api/organization-settings/${editingItem.id}`
        : '/api/organization-settings'
      
      const method = editingItem ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || 'Lưu thành công')
        setShowModal(false)
        resetForm()
        fetchSettings()
      } else {
        toast.error(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Lỗi khi lưu dữ liệu')
    }
  }

  // Handle delete
  const handleDelete = async (id: string, orgName: string) => {
    if (!confirm(`Xác nhận xóa cấu hình cho "${orgName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/organization-settings/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Xóa thành công')
        fetchSettings()
      } else {
        toast.error(data.error || 'Không thể xóa')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Lỗi khi xóa dữ liệu')
    }
  }

  // Handle edit
  const handleEdit = (setting: OrganizationSettings) => {
    setEditingItem(setting)
    setFormData({
      organization_name: setting.organization_name,
      notification_email: setting.notification_email,
      contact_person: setting.contact_person || '',
      contact_phone: setting.contact_phone || '',
      is_active: setting.is_active
    })
    setShowModal(true)
  }

  // Reset form
  const resetForm = () => {
    setEditingItem(null)
    setFormData({
      organization_name: '',
      notification_email: '',
      contact_person: '',
      contact_phone: '',
      is_active: true
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <EnvelopeIcon className="w-8 h-8 text-primary-600 mr-3" />
          Quản lý Email Thông báo
        </h1>
        <p className="text-gray-600 mt-2">
          Cấu hình email nhận thông báo ADR cho từng tổ chức
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Tổng số</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <BuildingOfficeIcon className="w-10 h-10 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Đang hoạt động</p>
                <p className="text-2xl font-bold text-green-900">{stats.active}</p>
              </div>
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
          </Card>

          <Card className="p-4 bg-gray-50 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Đã tắt</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
              <XCircleIcon className="w-10 h-10 text-gray-600" />
            </div>
          </Card>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tổ chức hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <Button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Thêm tổ chức
        </Button>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổ chức
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email thông báo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người liên hệ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSettings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có cấu hình nào'}
                  </td>
                </tr>
              ) : (
                filteredSettings.map((setting) => (
                  <tr key={setting.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">
                          {setting.organization_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <EnvelopeIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <a
                          href={`mailto:${setting.notification_email}`}
                          className="text-sm text-primary-600 hover:text-primary-800"
                        >
                          {setting.notification_email}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {setting.contact_person || '-'}
                      </div>
                      {setting.contact_phone && (
                        <div className="text-xs text-gray-500">
                          {setting.contact_phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {setting.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          Đã tắt
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(setting)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(setting.id, setting.organization_name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingItem ? 'Chỉnh sửa cấu hình' : 'Thêm tổ chức mới'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Organization Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên tổ chức <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.organization_name}
                    onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                    disabled={!!editingItem}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                    placeholder="Bệnh viện ABC"
                  />
                  {editingItem && (
                    <p className="mt-1 text-xs text-gray-500">
                      Tên tổ chức không thể thay đổi
                    </p>
                  )}
                </div>

                {/* Notification Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email nhận thông báo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.notification_email}
                    onChange={(e) => setFormData({ ...formData, notification_email: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="notification@hospital.vn"
                  />
                </div>

                {/* Contact Person */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Người liên hệ
                  </label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0123456789"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Kích hoạt gửi email thông báo
                  </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                  >
                    Hủy
                  </Button>
                  <Button type="submit">
                    {editingItem ? 'Cập nhật' : 'Thêm mới'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}







