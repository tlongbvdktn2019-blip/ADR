'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { UserFormData, User } from '@/types/user'

interface UserFormProps {
  user?: User | null
  onSubmit: (data: UserFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  title?: string
}

export default function UserForm({ 
  user, 
  onSubmit, 
  onCancel, 
  loading = false,
  title = 'Tạo Người Dùng Mới'
}: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    organization: '',
    phone: '',
    role: 'user',
  })

  // Pre-fill form when editing
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        organization: user.organization || '',
        phone: user.phone || '',
        role: user.role,
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên người dùng')
      return
    }

    if (!formData.email.trim()) {
      toast.error('Vui lòng nhập email')
      return
    }

    if (!formData.organization.trim()) {
      toast.error('Vui lòng nhập tên tổ chức')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Email không hợp lệ')
      return
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      // Error is handled by parent component
    }
  }

  const roleOptions = [
    { value: 'user', label: 'Người dùng (Đơn vị y tế)' },
    { value: 'admin', label: 'Quản trị viên (Sở Y tế)' },
  ]

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {title}
          </h2>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Hủy
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <Input
                label="Họ và tên"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nhập họ và tên"
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Nhập địa chỉ email"
                required
                disabled={loading}
              />
            </div>

            {/* Organization */}
            <div>
              <Input
                label="Tổ chức"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                placeholder="Tên bệnh viện / đơn vị y tế"
                required
                disabled={loading}
              />
            </div>

            {/* Phone */}
            <div>
              <Input
                label="Số điện thoại"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Nhập số điện thoại (tùy chọn)"
                disabled={loading}
              />
            </div>

            {/* Role */}
            <div className="md:col-span-2">
              <Select
                label="Vai trò"
                name="role"
                value={formData.role}
                onChange={handleChange}
                options={roleOptions}
                required
                disabled={loading}
              />
            </div>
          </div>

          {user && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Thông tin bổ sung</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
                <div>
                  <span className="font-medium">Ngày tạo:</span>
                  <div>{new Date(user.created_at).toLocaleDateString('vi-VN')}</div>
                </div>
                <div>
                  <span className="font-medium">Cập nhật lần cuối:</span>
                  <div>{new Date(user.updated_at).toLocaleDateString('vi-VN')}</div>
                </div>
                {user.statistics && (
                  <div>
                    <span className="font-medium">Hoạt động:</span>
                    <div>{user.statistics.totalReports} báo cáo, {user.statistics.totalCards} thẻ</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
            >
              {user ? 'Cập nhật' : 'Tạo người dùng'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}




