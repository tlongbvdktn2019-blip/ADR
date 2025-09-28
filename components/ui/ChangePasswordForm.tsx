'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { LockClosedIcon } from '@heroicons/react/24/outline'

interface ChangePasswordFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ChangePasswordForm({ onSuccess, onCancel }: ChangePasswordFormProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp')
      return
    }

    if (formData.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra')
      }

      toast.success('Đổi mật khẩu thành công!')
      
      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })

      if (onSuccess) {
        onSuccess()
      }

    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi đổi mật khẩu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <div className="p-6">
        <div className="flex items-center mb-6">
          <LockClosedIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Đổi mật khẩu</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              label="Mật khẩu hiện tại"
              type={showPasswords ? 'text' : 'password'}
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              required
              hideRequired={true}
              placeholder="Nhập mật khẩu hiện tại"
            />
          </div>

          <div>
            <Input
              label="Mật khẩu mới"
              type={showPasswords ? 'text' : 'password'}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              hideRequired={true}
              placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
              minLength={6}
            />
          </div>

          <div>
            <Input
              label="Xác nhận mật khẩu mới"
              type={showPasswords ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              hideRequired={true}
              placeholder="Nhập lại mật khẩu mới"
              minLength={6}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showPasswords"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showPasswords" className="ml-2 block text-sm text-gray-700">
              Hiển thị mật khẩu
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              loading={loading}
              className="flex-1"
            >
              Đổi mật khẩu
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex-1"
              >
                Hủy
              </Button>
            )}
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Lưu ý:</strong> Mật khẩu mới phải có ít nhất 6 ký tự. 
            Sau khi đổi mật khẩu, bạn sẽ cần đăng nhập lại với mật khẩu mới.
          </p>
        </div>
      </div>
    </Card>
  )
}
