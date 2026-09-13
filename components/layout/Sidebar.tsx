'use client'

import { useEffect, useRef, useState } from 'react'
import type { ComponentType, SVGProps } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  BuildingOfficeIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  HeartIcon,
  InformationCircleIcon,
  TrophyIcon,
  UsersIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'

type UserRole = 'admin' | 'user'

interface NavItem {
  label: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  roles?: UserRole[]
}

interface SidebarLinkProps {
  item: NavItem
  active: boolean
  collapsed: boolean
  onClick?: () => void
}

const baseNavItems: NavItem[] = [
  { label: 'Thông tin ADR', href: '/adr-information', icon: InformationCircleIcon },
  { label: 'Bảng điều khiển', href: '/dashboard', icon: ChartBarIcon },
  { label: 'Báo cáo ADR', href: '/reports', icon: DocumentTextIcon },
  { label: 'Thẻ dị ứng', href: '/allergy-cards', icon: HeartIcon },
  { label: 'Cuộc thi Kiến thức ADR', href: '/contest', icon: TrophyIcon },
  { label: 'Đánh giá hoạt động ADR', href: '/adr-performance', icon: ClipboardDocumentCheckIcon },
  { label: 'Cài đặt', href: '/settings', icon: Cog6ToothIcon }
]

const adminNavItems: NavItem[] = [
  { label: 'Quản lý người dùng', href: '/admin/users', icon: UsersIcon, roles: ['admin'] },
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

function SidebarLink({ item, active, collapsed, onClick }: SidebarLinkProps) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      aria-label={collapsed ? item.label : undefined}
      onClick={onClick}
      className={`group relative flex items-center rounded-lg border text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        collapsed ? 'justify-center px-2 py-3' : 'px-3 py-2'
      } ${
        active
          ? 'border-blue-100 bg-blue-50 text-blue-700'
          : 'border-transparent text-gray-600 hover:bg-blue-50 hover:text-blue-700'
      }`}
    >
      <Icon
        aria-hidden="true"
        className={`${collapsed ? 'h-6 w-6' : 'mr-3 h-5 w-5'} ${active ? 'text-blue-600' : 'text-gray-400'}`}
      />
      {!collapsed && <span>{item.label}</span>}
      {collapsed && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          {item.label}
        </span>
      )}
    </Link>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user?.role as UserRole) || 'user'
  const isAdmin = role === 'admin'
  const filteredItems = baseNavItems.filter(item => !item.roles || item.roles.includes(role))
  const managementItems = adminNavItems.filter(item => !item.roles || item.roles.includes(role))
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [managementOpen, setManagementOpen] = useState(false)
  const managementRef = useRef<HTMLDivElement>(null)
  const managementActive = managementItems.some(item => isActive(pathname, item.href))

  useEffect(() => {
    setManagementOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isCollapsed || !managementOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!managementRef.current?.contains(event.target as Node)) {
        setManagementOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setManagementOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isCollapsed, managementOpen])

  const toggleSidebar = () => {
    setManagementOpen(false)
    setIsCollapsed(current => !current)
  }

  return (
    <aside
      className={`relative z-30 hidden flex-shrink-0 border-r border-gray-200 bg-white transition-[width] duration-200 ease-in-out lg:flex ${
        isCollapsed ? 'lg:w-[72px]' : 'lg:w-72 xl:w-80'
      }`}
    >
      <div className="flex h-full w-full flex-col">
        <div className={`relative border-b border-gray-200 bg-blue-50 py-6 ${isCollapsed ? 'px-2' : 'px-6'}`}>
          <Link
            href="/"
            className="flex items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title={isCollapsed ? 'Hệ thống ADR' : undefined}
          >
            <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'}`}>
              <img
                src="/logo-syt.png"
                alt="Logo Hệ thống ADR"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <div className={isCollapsed ? 'hidden' : 'text-left'}>
                <div className="text-lg font-bold text-blue-900">Hệ thống ADR</div>
                <div className="text-xs text-blue-600">Quản lý báo cáo phản ứng có hại</div>
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={toggleSidebar}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            title={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            className="absolute -right-3 top-1/2 z-40 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <nav
          aria-label="Điều hướng chính"
          className={`flex-1 space-y-1 py-4 ${isCollapsed ? 'overflow-visible px-2' : 'overflow-y-auto px-3'}`}
        >
          {filteredItems.map(item => (
            <SidebarLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
              collapsed={isCollapsed}
            />
          ))}

          {isAdmin && (
            <div ref={managementRef} className="relative pt-2">
              <button
                type="button"
                onClick={() => setManagementOpen(current => !current)}
                aria-expanded={isCollapsed ? managementOpen : managementOpen || managementActive}
                aria-haspopup={isCollapsed ? 'menu' : undefined}
                aria-label={isCollapsed ? 'Quản lý' : undefined}
                className={`group relative flex w-full items-center rounded-lg border text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-2'
                } ${
                  managementActive || managementOpen
                    ? 'border-blue-100 bg-blue-50 text-blue-700'
                    : 'border-transparent text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <WrenchScrewdriverIcon
                  aria-hidden="true"
                  className={`${isCollapsed ? 'h-6 w-6' : 'mr-3 h-5 w-5'} ${
                    managementActive || managementOpen ? 'text-blue-600' : 'text-gray-400'
                  }`}
                />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">Quản lý</span>
                    <svg
                      className={`h-4 w-4 transition-transform ${
                        managementOpen || managementActive ? 'rotate-180 text-blue-600' : 'text-gray-400'
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </>
                )}
                {isCollapsed && !managementOpen && (
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    Quản lý
                  </span>
                )}
              </button>

              {!isCollapsed && (managementOpen || managementActive) && (
                <div className="mt-1 space-y-1 pl-8">
                  {managementItems.map(item => (
                    <SidebarLink
                      key={item.href}
                      item={item}
                      active={isActive(pathname, item.href)}
                      collapsed={false}
                    />
                  ))}
                </div>
              )}

              {isCollapsed && managementOpen && (
                <div
                  aria-label="Quản lý"
                  className="absolute left-full top-2 z-50 ml-3 w-64 space-y-1 rounded-xl border border-gray-200 bg-white p-2 shadow-xl"
                >
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Quản lý
                  </div>
                  {managementItems.map(item => (
                    <SidebarLink
                      key={item.href}
                      item={item}
                      active={isActive(pathname, item.href)}
                      collapsed={false}
                      onClick={() => setManagementOpen(false)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </aside>
  )
}
