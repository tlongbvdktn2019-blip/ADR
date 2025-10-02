'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import Sidebar from './Sidebar'
import LoadingSpinner from '../ui/LoadingSpinner'

interface MainLayoutProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireRole?: 'admin' | 'user'
}

export default function MainLayout({ 
  children, 
  requireAuth = true, 
  requireRole 
}: MainLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (requireAuth && status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (requireRole && session?.user?.role !== requireRole) {
      router.push('/unauthorized')
      return
    }
  }, [session, status, requireAuth, requireRole, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (requireAuth && !session) {
    return null
  }

  if (requireRole && session?.user?.role !== requireRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h1>
          <p className="text-gray-600 mb-4">Bạn không có quyền truy cập vào trang này.</p>
          <button
            onClick={() => router.back()}
            className="btn-primary"
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 sm:bg-gray-100 flex flex-col">
      <Header />
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Desktop Sidebar - Hidden on mobile, navigation is in mobile menu */}
        <Sidebar />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}

