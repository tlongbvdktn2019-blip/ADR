'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import MainLayout from '@/components/layout/MainLayout'
import Card from '@/components/ui/Card'
import APIKeyManager from '@/components/settings/APIKeyManager'
import { 
  Cog6ToothIcon,
  KeyIcon,
  UserIcon,
  ChartBarIcon,
  BellIcon
} from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'api-keys' | 'profile' | 'usage' | 'notifications'>('api-keys')

  const tabs = [
    {
      id: 'api-keys',
      name: 'API Keys',
      icon: KeyIcon,
      description: 'Quản lý API keys cho AI Chatbot'
    },
    {
      id: 'profile',
      name: 'Hồ sơ',
      icon: UserIcon,
      description: 'Thông tin cá nhân'
    },
    {
      id: 'usage',
      name: 'Sử dụng AI',
      icon: ChartBarIcon,
      description: 'Thống kê sử dụng AI'
    },
    {
      id: 'notifications',
      name: 'Thông báo',
      icon: BellIcon,
      description: 'Cài đặt thông báo'
    }
  ]

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8">
          <Cog6ToothIcon className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
            <p className="text-gray-600">Quản lý tài khoản và API keys của bạn</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar - Tabs */}
          <div className="lg:col-span-1">
            <Card className="p-1">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{tab.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                          {tab.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            
            {/* API Keys Tab */}
            {activeTab === 'api-keys' && (
              <APIKeyManager />
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin hồ sơ</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
                        {session?.user?.email}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
                        {session?.user?.name}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vai trò
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
                        {session?.user?.role || 'User'}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Usage Tab */}
            {activeTab === 'usage' && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Thống kê sử dụng AI</h2>
                  <div className="text-center py-12">
                    <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Tính năng đang phát triển</h3>
                    <p className="text-gray-600">
                      Thống kê chi tiết về việc sử dụng AI sẽ sớm được cập nhật
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Cài đặt thông báo</h2>
                  <div className="text-center py-12">
                    <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Tính năng đang phát triển</h3>
                    <p className="text-gray-600">
                      Cài đặt thông báo sẽ sớm được cập nhật
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}


