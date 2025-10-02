'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  XMarkIcon,
  ChartBarIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  InformationCircleIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  PlusCircleIcon,
  WrenchScrewdriverIcon,
  HeartIcon,
  TrophyIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  label: string
  href: string
  icon: any
  roles?: string[]
}

const baseNavItems: NavItem[] = [
  { label: 'Thông tin ADR', href: '/adr-information', icon: InformationCircleIcon },
  { label: 'Bảng điều khiển', href: '/dashboard', icon: ChartBarIcon },
  { label: 'Báo cáo ADR', href: '/reports', icon: DocumentTextIcon },
  { label: 'Thẻ dị ứng', href: '/allergy-cards', icon: HeartIcon },
  { label: 'Tập huấn', href: '/training', icon: AcademicCapIcon },
  { label: 'Cuộc thi Kiến thức ADR', href: '/contest', icon: TrophyIcon }
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

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user?.role as string) || 'user'
  const isAdmin = role === 'admin'

  const filteredItems = baseNavItems.filter(item => !item.roles || item.roles.includes(role))
  const managementItems = adminNavItems.filter(item => !item.roles || item.roles.includes(role))

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/80" />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button
                    type="button"
                    className="-m-2.5 p-2.5"
                    onClick={onClose}
                  >
                    <span className="sr-only">Đóng menu</span>
                    <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>

              {/* Mobile menu content */}
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                {/* Logo Section */}
                <div className="flex h-16 shrink-0 items-center border-b border-gray-200">
                  <Link href="/" onClick={onClose} className="flex items-center">
                    <img
                      src="/Logo.jpg"
                      alt="Logo Hệ thống ADR"
                      className="h-10 w-10 rounded-lg"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-bold text-blue-900">Hệ thống ADR</div>
                      <div className="text-xs text-blue-600">Quản lý báo cáo</div>
                    </div>
                  </Link>
                </div>

                {/* User Info */}
                <div className="py-3 border-b border-gray-200">
                  <div className="text-sm text-gray-500">Xin chào</div>
                  <div className="mt-1 text-base font-semibold text-gray-900">
                    {session?.user?.name || 'Người dùng'}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                  </div>
                </div>

                {/* Navigation */}
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {filteredItems.map((item) => {
                          const Icon = item.icon
                          const active = isActive(pathname, item.href)
                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={onClose}
                                className={`group flex gap-x-3 rounded-md p-3 text-sm font-semibold leading-6 ${
                                  active
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
                                }`}
                              >
                                <Icon
                                  className={`h-6 w-6 shrink-0 ${
                                    active ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                                  }`}
                                  aria-hidden="true"
                                />
                                {item.label}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </li>

                    {/* Admin Section */}
                    {isAdmin && managementItems.length > 0 && (
                      <li>
                        <div className="text-xs font-semibold leading-6 text-gray-400 uppercase">
                          Quản lý
                        </div>
                        <ul role="list" className="-mx-2 mt-2 space-y-1">
                          {managementItems.map((item) => {
                            const Icon = item.icon
                            const active = isActive(pathname, item.href)
                            return (
                              <li key={item.href}>
                                <Link
                                  href={item.href}
                                  onClick={onClose}
                                  className={`group flex gap-x-3 rounded-md p-3 text-sm font-semibold leading-6 ${
                                    active
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
                                  }`}
                                >
                                  <Icon
                                    className={`h-6 w-6 shrink-0 ${
                                      active ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                                    }`}
                                    aria-hidden="true"
                                  />
                                  {item.label}
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      </li>
                    )}
                  </ul>
                </nav>

                {/* Bottom Action Button */}
                <div className="border-t border-gray-200 pt-4">
                  <Link
                    href="/reports/new"
                    onClick={onClose}
                    className="flex w-full items-center justify-center gap-x-2 rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    <PlusCircleIcon className="h-5 w-5" aria-hidden="true" />
                    Báo cáo mới
                  </Link>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

