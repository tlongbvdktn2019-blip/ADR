'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import SimpleLayout from '@/components/layout/SimpleLayout'
import { DocumentTextIcon } from '@heroicons/react/24/outline'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    phone: '',
    role: 'user',
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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

  const roleOptions = [
    { value: 'user', label: 'Người dùng (Đơn vị y tế)' },
    { value: 'admin', label: 'Quản trị viên (Sở Y tế)' },
  ]

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

            <Select
              id="role"
              name="role"
              label="Vai trò"
              value={formData.role}
              onChange={handleChange}
              options={roleOptions}
              required
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
              <strong>Lưu ý:</strong> Trong phiên bản demo này, việc đăng ký chỉ mang tính minh họa. 
              Trong thực tế, chỉ quản trị viên mới có thể tạo tài khoản cho người dùng.
            </p>
          </div>
        </Card>
        </div>
      </div>
    </SimpleLayout>
  )
}


