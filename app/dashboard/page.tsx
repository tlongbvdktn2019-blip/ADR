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
