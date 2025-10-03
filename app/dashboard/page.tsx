'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import DashboardCharts from '@/components/charts/DashboardCharts';
import {
  DocumentTextIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  UserGroupIcon,
  TrophyIcon,
  AcademicCapIcon,
  SparklesIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalReports: number;
  newReportsThisMonth: number;
  criticalReports: number;
  previousMonthReports: number;
  growthRate: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/login');
      return;
    }

    loadStats();
  }, [status, session, router]);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      
      if (data.error) {
        console.error('Error loading stats:', data.error);
      } else {
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (!session) {
    return null;
  }

  const isAdmin = session.user.role === 'admin';

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Chào mừng {session.user.name}
            {isAdmin && <span className="ml-2 text-blue-600 font-semibold">(Quản trị viên)</span>}
          </p>
        </div>

        {/* Contest Banner */}
        <Link href="/contest">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-1 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] cursor-pointer group">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Left side - Content */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Trophy Icon with Animation */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                    <div className="relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center transform rotate-3 group-hover:rotate-6 transition-transform shadow-lg">
                      <TrophyIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <SparklesIcon className="w-5 h-5 text-purple-600 animate-pulse" />
                      <span className="text-xs md:text-sm font-semibold text-purple-600 uppercase tracking-wider">
                        Sự kiện đặc biệt
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-2">
                      Cuộc thi Kiến thức ADR
                    </h2>
                    <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                      Thử thách bản thân với các câu hỏi hấp dẫn về phản ứng có hại của thuốc. 
                      <span className="hidden md:inline"> Tham gia ngay để kiểm tra kiến thức và cạnh tranh trên bảng xếp hạng!</span>
                    </p>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-3 mt-4">
                      <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full shadow-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-gray-700">Đang diễn ra</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full shadow-sm">
                        <AcademicCapIcon className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-medium text-gray-700">Nhiều câu hỏi thú vị</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full shadow-sm">
                        <TrophyIcon className="w-4 h-4 text-yellow-600" />
                        <span className="text-xs font-medium text-gray-700">Bảng xếp hạng</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side - CTA Button */}
                <div className="flex-shrink-0">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-sm md:text-base shadow-lg group-hover:shadow-xl transition-all flex items-center gap-2 group-hover:gap-3">
                    Tham gia ngay
                    <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl -z-10"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-yellow-400/20 to-orange-400/20 rounded-full blur-3xl -z-10"></div>
            </div>
          </div>
        </Link>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Reports */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng số báo cáo</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.totalReports || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* New Reports This Month */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Báo cáo tháng này</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.newReportsThisMonth || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          {/* Critical Reports */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Báo cáo nghiêm trọng</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.criticalReports || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Growth Rate */}
        {stats && stats.previousMonthReports > 0 && (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tăng trưởng so với tháng trước</p>
                <div className="flex items-center mt-2">
                  <p className={`text-2xl font-bold ${stats.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate.toFixed(1)}%
                  </p>
                  <span className="text-sm text-gray-600 ml-2">
                    ({stats.previousMonthReports} báo cáo tháng trước)
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Common Actions */}
            <Link href="/reports/new">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <PlusIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Tạo báo cáo mới</h3>
                    <p className="text-sm text-gray-600">Báo cáo ADR</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/reports">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Xem báo cáo</h3>
                    <p className="text-sm text-gray-600">Danh sách báo cáo</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/information">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <InformationCircleIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Thông tin ADR</h3>
                    <p className="text-sm text-gray-600">Tin tức & tài liệu</p>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Admin Only Actions */}
            {isAdmin && (
              <>
                <Link href="/admin/departments">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Đơn vị & Khoa/Phòng</h3>
                        <p className="text-sm text-gray-600">Quản lý tổ chức</p>
                      </div>
                    </div>
                  </Card>
                </Link>

                <Link href="/admin/users">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-green-500">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <UserGroupIcon className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Người dùng</h3>
                        <p className="text-sm text-gray-600">Quản lý tài khoản</p>
                      </div>
                    </div>
                  </Card>
                </Link>

                <Link href="/admin/contest-management">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-yellow-500">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <TrophyIcon className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Cuộc thi</h3>
                        <p className="text-sm text-gray-600">Quản lý thi trắc nghiệm</p>
                      </div>
                    </div>
                  </Card>
                </Link>

                <Link href="/admin/adr-information">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-indigo-500">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <DocumentTextIcon className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Thông tin ADR</h3>
                        <p className="text-sm text-gray-600">Quản lý tin tức</p>
                      </div>
                    </div>
                  </Card>
                </Link>

                <Link href="/admin/quiz">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-pink-500">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                        <AcademicCapIcon className="w-6 h-6 text-pink-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Quiz</h3>
                        <p className="text-sm text-gray-600">Quản lý câu hỏi</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Dashboard Charts Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Thống kê và phân tích</h2>
          </div>
          <DashboardCharts layout="grid" showAll={true} />
        </div>
      </div>
    </MainLayout>
  );
}
