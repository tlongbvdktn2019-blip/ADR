'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { 
  UserCircleIcon, 
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  ChartBarIcon,
  DocumentTextIcon,
  QrCodeIcon,
  UsersIcon,
  AcademicCapIcon,
  LockClosedIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import NotificationBell from './NotificationBell'

export default function Header() {
  const { data: session } = useSession()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [adrDropdownOpen, setAdrDropdownOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    // Confirm logout
    if (!confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
      return
    }

    setSigningOut(true)
    
    try {
      toast.loading('Đang đăng xuất...', { id: 'logout' })
      
      await signOut({ 
        callbackUrl: '/auth/login',
        redirect: true
      })
      
      // This won't be reached due to redirect, but good practice
      toast.success('Đã đăng xuất thành công!', { id: 'logout' })
      
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Có lỗi xảy ra khi đăng xuất', { id: 'logout' })
      setSigningOut(false)
    }
  }

  // Close ADR dropdown when clicking outside
  const handleClickOutside = () => {
    setAdrDropdownOpen(false)
    setDropdownOpen(false)
  }

  if (!session) return null

  return (
    <header className="bg-blue-800 shadow-sm border-b border-blue-700">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6" onClick={handleClickOutside}>
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Hệ thống ADR"
                width={32}
                height={32}
                className="rounded"
                priority
              />
              <span className="ml-2 text-lg font-bold text-white">
                Hệ thống ADR
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-3 sm:space-x-4">
            <Link 
              href="/dashboard" 
              className="flex items-center text-blue-200 hover:text-white transition-colors text-sm"
              title="Dashboard"
            >
              <ChartBarIcon className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            
            {/* ADR Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setAdrDropdownOpen(!adrDropdownOpen)
                }}
                className="flex items-center text-blue-200 hover:text-white transition-colors text-sm focus:outline-none"
              >
                <DocumentTextIcon className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Báo cáo ADR</span>
                <ChevronDownIcon className="w-3 h-3 ml-1" />
              </button>

              {adrDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-gray-200 z-50">
                  <div className="py-2">
                    <Link
                      href="/reports"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setAdrDropdownOpen(false)}
                    >
                      <DocumentTextIcon className="w-4 h-4 mr-3" />
                      Báo cáo
                    </Link>
                    <Link
                      href="/allergy-cards"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setAdrDropdownOpen(false)}
                    >
                      <QrCodeIcon className="w-4 h-4 mr-3" />
                      Thẻ dị ứng
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <Link 
              href="/adr-information" 
              className="flex items-center text-blue-200 hover:text-white transition-colors text-sm"
              title="Thông tin ADR"
            >
              <InformationCircleIcon className="w-4 h-4 mr-1" />
              <span className="hidden md:inline">Thông tin ADR</span>
            </Link>
            <Link 
              href="/training" 
              className="flex items-center text-blue-200 hover:text-white transition-colors text-sm"
              title="Tập huấn"
            >
              <AcademicCapIcon className="w-4 h-4 mr-1" />
              <span className="hidden md:inline">Tập huấn</span>
            </Link>
            {/* Admin-only Navigation */}
            {session?.user.role === 'admin' && (
              <>
                <Link 
                  href="/admin/users" 
                  className="flex items-center text-blue-200 hover:text-white transition-colors text-sm"
                  title="Quản lý Users"
                >
                  <UsersIcon className="w-4 h-4 mr-1" />
                  <span className="hidden lg:inline">Users</span>
                </Link>
                <Link 
                  href="/admin/quiz" 
                  className="flex items-center text-blue-200 hover:text-white transition-colors text-sm"
                  title="Quiz Manager"
                >
                  <AcademicCapIcon className="w-4 h-4 mr-1" />
                  <span className="hidden lg:inline">Quiz</span>
                </Link>
                <Link 
                  href="/admin/adr-information" 
                  className="flex items-center text-blue-200 hover:text-white transition-colors text-sm"
                  title="Quản lý Thông tin ADR"
                >
                  <InformationCircleIcon className="w-4 h-4 mr-1" />
                  <span className="hidden lg:inline">ADR Info</span>
                </Link>
              </>
            )}
          </nav>

          {/* User and Notifications Section */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setDropdownOpen(!dropdownOpen)
                }}
                className="flex items-center text-white hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-blue-800 rounded-lg px-1 py-1"
              >
                <UserCircleIcon className="w-6 h-6 mr-1 sm:mr-2" />
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-medium">{session.user.name}</div>
                  <div className="text-xs text-blue-200">{session.user.role === 'admin' ? 'Admin' : 'User'}</div>
                </div>
                <ChevronDownIcon className="w-3 h-3 ml-1" />
              </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg ring-1 ring-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="text-sm font-medium text-gray-900">{session.user.name}</div>
                  <div className="text-xs text-gray-500">{session.user.email}</div>
                  {session.user.organization && (
                    <div className="text-xs text-gray-500 mt-1">{session.user.organization}</div>
                  )}
                </div>
                <div className="py-2">
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <UserIcon className="w-4 h-4 mr-3" />
                    Thông tin cá nhân
                  </Link>
                  <Link
                    href="/profile/change-password"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <LockClosedIcon className="w-4 h-4 mr-3" />
                    Đổi mật khẩu
                  </Link>
                  <button
                    onClick={() => {
                      setDropdownOpen(false)
                      handleSignOut()
                    }}
                    disabled={signingOut}
                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowRightOnRectangleIcon className={`w-4 h-4 mr-3 ${signingOut ? 'animate-spin' : ''}`} />
                    {signingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                  </button>
                </div>
              </div>
            )}
            </div>
            
            {/* Notification Bell - Far Right */}
            <NotificationBell />
          </div>
        </div>
      </div>
    </header>
  )
}



