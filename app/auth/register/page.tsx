'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import SimpleLayout from '@/components/layout/SimpleLayout'
import { DocumentTextIcon } from '@heroicons/react/24/outline'
import { normalizeEmail, normalizeUsername } from '@/lib/user-account'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    organization: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value

    if (e.target.name === 'username') {
      value = normalizeUsername(value)
    }

    if (e.target.name === 'email') {
      value = normalizeEmail(value)
    }

    setFormData((prev) => ({
      ...prev,
      [e.target.name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          email: formData.email,
          organization: formData.organization,
          phone: formData.phone,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Đăng ký thành công! Vui lòng đăng nhập.')
        router.push('/auth/login')
      } else {
        toast.error(data.error || 'Có lỗi xảy ra khi đăng ký')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi đăng ký')
      console.error('Register error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SimpleLayout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
              Đăng ký tài khoản
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Tạo tài khoản để sử dụng hệ thống ADR
            </p>
          </div>

          <Card>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <Input
                id="name"
                name="name"
                type="text"
                label="Họ và tên"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Nguyễn Văn A"
              />

              <Input
                id="username"
                name="username"
                type="text"
                label="Tên đăng nhập"
                value={formData.username}
                onChange={handleChange}
                required
                helperText="Dùng để đăng nhập. Chỉ chấp nhận chữ thường, số, ., _, -"
                placeholder="nguyenvana"
              />

              <Input
                id="email"
                name="email"
                type="email"
                label="Email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="user@example.com"
              />

              <Input
                id="organization"
                name="organization"
                type="text"
                label="Đơn vị/Tổ chức"
                value={formData.organization}
                onChange={handleChange}
                required
                placeholder="Bệnh viện ABC"
              />

              <Input
                id="phone"
                name="phone"
                type="tel"
                label="Số điện thoại"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0123456789"
              />

              <Input
                id="password"
                name="password"
                type="password"
                label="Mật khẩu"
                value={formData.password}
                onChange={handleChange}
                required
                helperText="Tối thiểu 8 ký tự"
                placeholder="Nhập mật khẩu"
              />

              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Xác nhận mật khẩu"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Nhập lại mật khẩu"
              />

              <Button
                type="submit"
                loading={loading}
                fullWidth
                size="lg"
              >
                Đăng ký
              </Button>
            </form>

            <div className="mt-6">
              <div className="text-center text-sm text-gray-600">
                Đã có tài khoản?{' '}
                <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
                  Đăng nhập
                </Link>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Lưu ý:</strong> Đăng ký tại đây chỉ tạo tài khoản người dùng thông thường.
                Quyền quản trị chỉ có thể được cấp bởi quản trị viên hệ thống.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </SimpleLayout>
  )
}
