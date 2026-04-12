'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import ChangePasswordForm from '@/components/ui/ChangePasswordForm'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function ChangePasswordPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/auth/login')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Quay lại Dashboard
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Quản lý tài khoản
          </h1>
          <p className="mt-2 text-gray-600">
            Đổi mật khẩu để bảo mật tài khoản của bạn
          </p>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Thông tin tài khoản
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Họ tên
              </label>
              <p className="mt-1 text-sm text-gray-900">{session.user.name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tên đăng nhập
              </label>
              <p className="mt-1 text-sm text-gray-900">@{session.user.username}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <p className="mt-1 text-sm text-gray-900">{session.user.email}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Vai trò
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {session.user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
              </p>
            </div>
            
            {session.user.organization && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tổ chức
                </label>
                <p className="mt-1 text-sm text-gray-900">{session.user.organization}</p>
              </div>
            )}
          </div>
        </div>

        {/* Change Password Form */}
        <ChangePasswordForm
          onSuccess={() => {
            // Optionally redirect or show additional success message
            setTimeout(() => {
              router.push('/dashboard')
            }, 2000)
          }}
          onCancel={() => {
            router.push('/dashboard')
          }}
        />

        {/* Security Tips */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            💡 Mẹo bảo mật
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Sử dụng mật khẩu mạnh với ít nhất 8 ký tự</li>
            <li>• Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</li>
            <li>• Không sử dụng thông tin cá nhân trong mật khẩu</li>
            <li>• Thay đổi mật khẩu định kỳ để tăng tính bảo mật</li>
            <li>• Không chia sẻ mật khẩu với người khác</li>
          </ul>
        </div>
      </div>
    </div>
  )
}









