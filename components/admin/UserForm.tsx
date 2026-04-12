'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { UserFormData, User } from '@/types/user'
import {
  getUsernameValidationMessage,
  normalizeEmail,
  normalizeUsername,
} from '@/lib/user-account'

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
    username: '',
    email: '',
    organization: '',
    phone: '',
    role: 'user',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        username: user.username,
        email: user.email,
        organization: user.organization || '',
        phone: user.phone || '',
        role: user.role,
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value = e.target.value

    if (e.target.name === 'username') {
      value = normalizeUsername(value)
    }

    if (e.target.name === 'email') {
      value = normalizeEmail(value)
    }

    setFormData(prev => ({
      ...prev,
      [e.target.name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên người dùng')
      return
    }

    const username = normalizeUsername(formData.username)
    const usernameError = getUsernameValidationMessage(username)
    if (usernameError) {
      toast.error(usernameError)
      return
    }

    const email = normalizeEmail(formData.email)
    if (!email) {
      toast.error('Vui lòng nhập email')
      return
    }

    if (!formData.organization.trim()) {
      toast.error('Vui lòng nhập tên tổ chức')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Email không hợp lệ')
      return
    }

    try {
      await onSubmit({
        ...formData,
        username,
        email,
        organization: formData.organization.trim(),
        phone: formData.phone?.trim() || '',
      })
    } catch (error) {
      void error
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

            <div>
              <Input
                label="Tên đăng nhập"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Nhập tên đăng nhập"
                helperText="Dùng để đăng nhập. Chỉ chấp nhận chữ thường, số, ., _, -"
                required
                disabled={loading}
              />
            </div>

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

            <div>
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
