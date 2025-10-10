'use client'

import { useState } from 'react'
import type { ComponentType, SVGProps } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ChartBarIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  InformationCircleIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  // PlusCircleIcon,
  WrenchScrewdriverIcon,
  HeartIcon,
  TrophyIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline'

type UserRole = 'admin' | 'user'

interface NavItem {
  label: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  roles?: UserRole[]
}

const baseNavItems: NavItem[] = [
  { label: 'Thông tin ADR', href: '/adr-information', icon: InformationCircleIcon },
  { label: 'Bảng điều khiển', href: '/dashboard', icon: ChartBarIcon },
  { label: 'Báo cáo ADR', href: '/reports', icon: DocumentTextIcon },
  { label: 'Thẻ dị ứng', href: '/allergy-cards', icon: HeartIcon },
  { label: 'Tập huấn', href: '/training', icon: AcademicCapIcon },
  { label: 'Cuộc thi Kiến thức ADR', href: '/contest', icon: TrophyIcon },
  { label: 'Đánh giá hoạt động ADR', href: '/adr-performance', icon: ClipboardDocumentCheckIcon },
  { label: 'Cài đặt', href: '/settings', icon: Cog6ToothIcon }
]

const adminNavItems: NavItem[] = [
  { label: 'Quản lý người dùng', href: '/admin/users', icon: UsersIcon, roles: ['admin'] },
  { label: 'Quản lý bài kiểm tra', href: '/admin/quiz', icon: ClipboardDocumentListIcon, roles: ['admin'] },
  { label: 'Quản lý tin ADR', href: '/admin/adr-information', icon: InformationCircleIcon, roles: ['admin'] },
  { label: 'Quản lý Cuộc thi', href: '/admin/contest-management', icon: TrophyIcon, roles: ['admin'] },
  { label: 'Quản lý Đơn vị/Khoa', href: '/admin/departments', icon: BuildingOfficeIcon, roles: ['admin'] }
]

function isActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/'
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user?.role as UserRole) || 'user'
  const isAdmin = role === 'admin'
  const filteredItems = baseNavItems.filter(item => !item.roles || item.roles.includes(role))
  const managementItems = adminNavItems.filter(item => !item.roles || item.roles.includes(role))
  const [managementOpen, setManagementOpen] = useState(false)
  const managementActive = managementItems.some(item => isActive(pathname, item.href))

  return (
    <aside className="hidden lg:flex lg:w-72 xl:w-80 bg-white border-r border-gray-200">
      <div className="flex flex-col w-full h-full">
        {/* Hệ thống ADR - Top Section */}
        <div className="px-6 py-6 border-b border-gray-200 bg-blue-50">
          <Link href="/" className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              {/* Logo Hệ thống ADR */}
              <img
                src="/Logo.jpg"
                alt="Logo Hệ thống ADR"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <div className="text-left">
                <div className="text-lg font-bold text-blue-900">Hệ thống ADR</div>
                <div className="text-xs text-blue-600">Quản lý báo cáo phản ứng có hại</div>
              </div>
            </div>
          </Link>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="text-sm text-gray-500">Xin chào</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">
            {session?.user?.name || 'Người dùng'}
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredItems.map(item => {
            const Icon = item.icon
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  active
                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                    : 'border-transparent text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}

          {isAdmin && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setManagementOpen(prev => !prev)}
                className={`flex w-full items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  managementActive || managementOpen
                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                    : 'border-transparent text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                }`}
              >
                <WrenchScrewdriverIcon className={`w-5 h-5 mr-3 ${managementActive || managementOpen ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="flex-1 text-left">Quản lý</span>
                <svg
                  className={`w-4 h-4 transition-transform ${managementOpen || managementActive ? 'rotate-180 text-blue-600' : 'text-gray-400'}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                </svg>
              </button>

              {(managementOpen || managementActive) && (
                <div className="mt-1 space-y-1 pl-8">
                  {managementItems.map(item => {
                    const Icon = item.icon
                    const active = isActive(pathname, item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors border ${
                          active
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : 'border-transparent text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mr-3 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Nút "Báo cáo mới" đã bị ẩn */}
        {/* <div className="px-6 py-5 border-t border-gray-200 bg-gray-50">
          <Link
            href="/reports/new"
            className="inline-flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Báo cáo mới
          </Link>
        </div> */}
      </div>
    </aside>
  )
}

