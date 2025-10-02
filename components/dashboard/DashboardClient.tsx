// =====================================================
// DASHBOARD CLIENT COMPONENT
// Client-side dashboard with charts and real-time stats
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Card from '@/components/ui/Card';
import DashboardCharts from '@/components/charts/DashboardCharts';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface DashboardStats {
  totalReports: number;
  newReportsThisMonth: number;
  totalUsers: number;
  criticalReports: number;
  previousMonthReports?: number;
  growthRate?: number;
}

interface DashboardClientProps {
  initialStats: DashboardStats;
}

export default function DashboardClient({ initialStats }: DashboardClientProps) {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [isLoading, setIsLoading] = useState(false);
  const [showCharts, setShowCharts] = useState(false);

  const isAdmin = (session?.user as any)?.role === 'admin';

  useEffect(() => {
    // Load charts after component mounts
    const timer = setTimeout(() => {
      setShowCharts(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const refreshStats = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const newStats = await response.json();
        setStats(newStats);
      }
    } catch (error) {
      // Error refreshing stats
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const getGrowthIcon = (rate?: number) => {
    if (!rate || rate === 0) return null;
    
    return rate > 0 ? (
      <ArrowUpIcon className="w-4 h-4 text-green-600" />
    ) : (
      <ArrowDownIcon className="w-4 h-4 text-red-600" />
    );
  };

  const getGrowthColor = (rate?: number) => {
    if (!rate || rate === 0) return 'text-gray-500';
    return rate > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Tổng quan hệ thống quản lý ADR' : 'Thống kê báo cáo ADR của bạn'}
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <button
            onClick={refreshStats}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Làm mới
          </button>
        </div>
      </div>

      {/* Contest Banner */}
      <Link 
        href="/contest"
        className="block group"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 p-1">
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 transition-transform group-hover:scale-[0.99]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform">
                    <TrophyIcon className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
                    🎯 Cuộc thi Kiến thức ADR
                  </h3>
                  <p className="text-gray-700 mt-1 text-sm sm:text-base">
                    Tham gia ngay! Không cần đăng nhập - Kiểm tra kiến thức và nhận giải thưởng hấp dẫn
                  </p>
                  <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
                    <span className="flex items-center">
                      ⚡ 10 câu hỏi
                    </span>
                    <span className="flex items-center">
                      ⏱️ 20 giây/câu
                    </span>
                    <span className="flex items-center">
                      🏆 Xếp hạng ngay
                    </span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:flex items-center">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg group-hover:shadow-xl transition-shadow">
                  Tham gia ngay →
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {isAdmin ? 'Tổng báo cáo' : 'Báo cáo của bạn'}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(stats.totalReports)}
                </p>
              </div>
            </div>
            {stats.growthRate !== undefined && (
              <div className={`flex items-center text-sm ${getGrowthColor(stats.growthRate)}`}>
                {getGrowthIcon(stats.growthRate)}
                <span className="ml-1">
                  {Math.abs(stats.growthRate).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Báo cáo tháng này</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(stats.newReportsThisMonth)}
              </p>
              {stats.previousMonthReports !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                  Tháng trước: {formatNumber(stats.previousMonthReports)}
                </p>
              )}
            </div>
          </div>
        </Card>

        {isAdmin && (
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tổng người dùng</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(stats.totalUsers)}
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Báo cáo nghiêm trọng</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(stats.criticalReports)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalReports > 0 
                  ? `${((stats.criticalReports / stats.totalReports) * 100).toFixed(1)}% tổng số`
                  : '0% tổng số'
                }
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      {showCharts ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Biểu đồ phân tích</h2>
            <div className="text-sm text-gray-500">
              Dữ liệu được cập nhật theo thời gian thực
            </div>
          </div>
          
          <DashboardCharts layout="grid" showAll={true} />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[...Array(5)].map((_, index) => (
            <div 
              key={index} 
              className={`animate-pulse ${index === 0 ? 'xl:col-span-2' : ''}`}
            >
              <Card className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Truy cập nhanh</h3>
          <div className="space-y-3">
            <a 
              href="/reports/new" 
              className="block text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              → Tạo báo cáo ADR mới
            </a>
            <a 
              href="/reports" 
              className="block text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              → Xem danh sách báo cáo
            </a>
            <a 
              href="/allergy-cards" 
              className="block text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              → Quản lý thẻ dị ứng
            </a>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cảnh báo</h3>
          {stats.criticalReports > 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-sm text-red-800">
                  {stats.criticalReports} báo cáo nghiêm trọng cần xử lý
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-green-800">
                  Không có cảnh báo khẩn cấp
                </span>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Dữ liệu cập nhật: {new Date().toLocaleString('vi-VN')}</p>
            <p>Người dùng: {session?.user?.name}</p>
            <p>Vai trò: {isAdmin ? 'Quản trị viên' : 'Người dùng'}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

