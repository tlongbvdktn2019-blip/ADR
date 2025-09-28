'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ShieldExclamationIcon, HomeIcon } from '@heroicons/react/24/outline'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <div className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <ShieldExclamationIcon className="h-8 w-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Không có quyền truy cập
            </h1>
            
            <p className="text-sm text-gray-600 mb-6">
              Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ với quản trị viên nếu bạn cho rằng đây là lỗi.
            </p>
            
            <div className="space-y-3">
              <Link href="/dashboard">
                <Button className="w-full">
                  <HomeIcon className="w-4 h-4 mr-2" />
                  Về Dashboard
                </Button>
              </Link>
              
              <Link href="/auth/login">
                <Button variant="outline" className="w-full">
                  Đăng nhập lại
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}