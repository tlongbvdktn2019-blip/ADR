'use client'

import { useEffect, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import SimpleLayout from '@/components/layout/SimpleLayout'
import { DocumentTextIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) {
      return
    }

    // Sau đăng nhập thành công → chuyển đến /dashboard
    router.replace('/dashboard')
  }, [status, session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error(result.error)
        setLoading(false)
      } else if (result?.ok) {
        toast.success('Đăng nhập thành công!')
        // Chờ một chút để session được cập nhật, sau đó redirect
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 500)
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi đăng nhập')
      console.error('Login error:', error)
      setLoading(false)
    }
  }

  return (
    <SimpleLayout>
      <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-50">
        {/* Left side - 50% - Giới thiệu */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 py-12">
          <div className="max-w-2xl">
            {/* Tên đơn vị */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-blue-900 uppercase">
                Sở Y tế Thành phố Cần Thơ
              </h3>
              <p className="text-lg text-blue-800 mt-1">
                Trung tâm y tế khu vực Thốt Nốt
              </p>
            </div>

            {/* Logo - Canh giữa */}
            <div className="flex justify-center mb-8">
              <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
                <img
                  src="/Logo.jpg"
                  alt="Logo Hệ thống ADR"
                  width={100}
                  height={100}
                  className="rounded-xl"
                />
              </Link>
            </div>

            {/* Tên hệ thống */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-blue-900">Hệ thống Quản lý ADR</h1>
              <p className="text-blue-700">Adverse Drug Reaction Management System</p>
            </div>

            {/* Giới thiệu */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Chào mừng đến với Hệ thống Quản lý Phản ứng Có hại của Thuốc
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Hệ thống ADR giúp các cơ sở y tế quản lý, theo dõi và báo cáo các phản ứng có hại của thuốc một cách hiệu quả, 
                  góp phần nâng cao chất lượng điều trị và đảm bảo an toàn cho người bệnh.
                </p>
              </div>

              {/* Tính năng chính */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Tính năng chính:</h3>
                <div className="grid gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">✓</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Báo cáo ADR trực tuyến</h4>
                      <p className="text-gray-600">Ghi nhận và quản lý các báo cáo phản ứng có hại một cách nhanh chóng</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">✓</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Quản lý thẻ dị ứng</h4>
                      <p className="text-gray-600">Tạo và quản lý thẻ dị ứng cho bệnh nhân với mã QR</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">✓</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Cơ sở dữ liệu thông tin ADR</h4>
                      <p className="text-gray-600">Tra cứu thông tin về các phản ứng có hại của thuốc</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">✓</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Tập huấn và kiểm tra kiến thức</h4>
                      <p className="text-gray-600">Nâng cao năng lực nhân viên y tế về quản lý ADR</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - 50% - Form đăng nhập */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-white shadow-2xl">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              {/* Logo mobile */}
              <div className="flex justify-center lg:hidden mb-6">
                <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
                  <img
                    src="/Logo.jpg"
                    alt="Logo Hệ thống ADR"
                    width={60}
                    height={60}
                    className="rounded-xl"
                  />
                </Link>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900">
                Đăng nhập
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Vào hệ thống quản lý ADR
              </p>
            </div>

            <Card>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <Input
                  id="email"
                  type="email"
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@soyte.gov.vn"
                />

                <Input
                  id="password"
                  type="password"
                  label="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  hideRequired={true}
                  placeholder="Nhập mật khẩu"
                />

                <Button
                  type="submit"
                  loading={loading}
                  fullWidth
                  size="lg"
                >
                  Đăng nhập
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </SimpleLayout>
  )
}
