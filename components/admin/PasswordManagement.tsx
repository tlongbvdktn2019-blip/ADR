'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { User } from '@/types/user'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { 
  LockClosedIcon, 
  LockOpenIcon,
  KeyIcon,
  TrashIcon 
} from '@heroicons/react/24/outline'

interface PasswordManagementProps {
  user: User
  onClose?: () => void
  onSuccess?: () => void
}

export default function PasswordManagement({ user, onClose, onSuccess }: PasswordManagementProps) {
  const [action, setAction] = useState<'reset' | 'clear' | 'generate_reset_token' | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetToken, setResetToken] = useState('')

  const handlePasswordReset = async () => {
    if (action === 'reset') {
      if (!newPassword) {
        toast.error('Vui lòng nhập mật khẩu mới')
        return
      }
      
      if (newPassword !== confirmPassword) {
        toast.error('Mật khẩu và xác nhận mật khẩu không khớp')
        return
      }

      if (newPassword.length < 6) {
        toast.error('Mật khẩu phải có ít nhất 6 ký tự')
        return
      }
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action,
          newPassword: action === 'reset' ? newPassword : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra')
      }

      toast.success(data.message)

      if (action === 'generate_reset_token' && data.resetToken) {
        setResetToken(data.resetToken)
      }

      if (onSuccess) {
        onSuccess()
      }

      // Reset form
      setNewPassword('')
      setConfirmPassword('')
      setAction(null)

    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const copyResetToken = () => {
    navigator.clipboard.writeText(resetToken)
    toast.success('Đã copy reset token!')
  }

  return (
    <Card className="max-w-lg mx-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <KeyIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Quản lý mật khẩu
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-1">{user.name}</h3>
          <p className="text-sm text-gray-600">{user.email}</p>
          <p className="text-sm text-gray-600">Vai trò: {user.role}</p>
        </div>

        {!action && (
          <div className="space-y-3">
            <Button
              onClick={() => setAction('reset')}
              className="w-full flex items-center justify-center"
              variant="primary"
            >
              <LockClosedIcon className="h-4 w-4 mr-2" />
              Reset mật khẩu mới
            </Button>

            <Button
              onClick={() => setAction('clear')}
              className="w-full flex items-center justify-center"
              variant="outline"
            >
              <LockOpenIcon className="h-4 w-4 mr-2" />
              Xóa mật khẩu
            </Button>

            <Button
              onClick={() => setAction('generate_reset_token')}
              className="w-full flex items-center justify-center"
              variant="outline"
            >
              <KeyIcon className="h-4 w-4 mr-2" />
              Tạo token reset
            </Button>

            {onClose && (
              <Button
                onClick={onClose}
                className="w-full"
                variant="ghost"
              >
                Hủy
              </Button>
            )}
          </div>
        )}

        {action === 'reset' && (
          <div className="space-y-4">
            <div>
              <Input
                label="Mật khẩu mới"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                required
                hideRequired={true}
              />
            </div>

            <div>
              <Input
                label="Xác nhận mật khẩu"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                required
                hideRequired={true}
              />
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handlePasswordReset}
                loading={loading}
                className="flex-1"
              >
                Reset mật khẩu
              </Button>
              <Button
                onClick={() => setAction(null)}
                variant="outline"
                disabled={loading}
                className="flex-1"
              >
                Hủy
              </Button>
            </div>
          </div>
        )}

        {action === 'clear' && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Cảnh báo:</strong> Hành động này sẽ xóa mật khẩu của người dùng. 
                Họ sẽ không thể đăng nhập cho đến khi được thiết lập mật khẩu mới.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handlePasswordReset}
                loading={loading}
                variant="danger"
                className="flex-1 flex items-center justify-center"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Xóa mật khẩu
              </Button>
              <Button
                onClick={() => setAction(null)}
                variant="outline"
                disabled={loading}
                className="flex-1"
              >
                Hủy
              </Button>
            </div>
          </div>
        )}

        {action === 'generate_reset_token' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Tạo token reset để người dùng có thể tự thiết lập mật khẩu mới.
                Token sẽ có hiệu lực trong 24 giờ.
              </p>
            </div>

            {resetToken && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Reset Token (click để copy):
                </label>
                <div 
                  onClick={copyResetToken}
                  className="p-3 bg-gray-100 rounded border cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <code className="text-sm break-all">{resetToken}</code>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              {!resetToken && (
                <Button
                  onClick={handlePasswordReset}
                  loading={loading}
                  className="flex-1"
                >
                  Tạo Token
                </Button>
              )}
              <Button
                onClick={() => {
                  setAction(null)
                  setResetToken('')
                }}
                variant="outline"
                disabled={loading}
                className="flex-1"
              >
                {resetToken ? 'Đóng' : 'Hủy'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
