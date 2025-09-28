'use client'

import { useEffect, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

    const destination = session.user.role === 'admin' ? '/dashboard' : '/reports'
    router.replace(destination)
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
      } else if (result?.ok) {
        toast.success('Đăng nhập thành công!')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi đăng nhập')
      console.error('Login error:', error)
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

          <div className="mt-6">
            <div className="text-center text-sm text-gray-600">
              Chưa có tài khoản?{' '}
              <Link href="/auth/register" className="font-medium text-primary-600 hover:text-primary-500">
                Liên hệ quản trị viên
              </Link>
            </div>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Tài khoản demo:</h3>
            <div className="text-xs text-blue-800 space-y-1">
              <div><strong>Admin:</strong> admin@soyte.gov.vn / admin123</div>
              <div><strong>User:</strong> user@benhvien.gov.vn / user123</div>
            </div>
          </div>
        </Card>
        </div>
      </div>
    </SimpleLayout>
  )
}
