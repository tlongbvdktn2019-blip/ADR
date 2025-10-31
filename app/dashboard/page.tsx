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
  FunnelIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import ReportTimeline from '@/components/dashboard/ReportTimeline';

interface ReportTimeline {
  id: string;
  report_code: string;
  organization: string;
  severity_level: string;
  approval_status: string;
  created_at: string;
}

interface DashboardStats {
  totalReports: number;
  newReportsThisMonth: number;
  criticalReports: number;
  previousMonthReports: number;
  growthRate: number;
  newReportsToday: number;
  pendingReports: number;
  unapprovedReports: number;
  recentReportsTimeline: ReportTimeline[];
}

interface Department {
  id: string;
  name: string;
  code: string | null;
}

interface ActiveContest {
  id: string;
  title: string;
  description?: string;
  status: string;
  number_of_questions: number;
  time_per_question: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [activeContest, setActiveContest] = useState<ActiveContest | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/login');
      return;
    }

    loadDepartments();
    loadStats();
    loadActiveContest();
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.id) {
      loadStats();
    }
  }, [selectedOrganization, selectedYear]);

  // Load available years on mount
  useEffect(() => {
    const loadAvailableYears = async () => {
      try {
        const response = await fetch('/api/dashboard/available-years');
        const result = await response.json();
        if (result.success && result.years) {
          setAvailableYears(result.years);
        }
      } catch (error) {
        console.error('Error loading years:', error);
      }
    };
    
    if (session?.user?.id) {
      loadAvailableYears();
    }
  }, [session?.user?.id]);

  const loadDepartments = async () => {
    try {
      const response = await fetch('/api/public/departments');
      const result = await response.json();
      
      if (result.success && result.data) {
        setDepartments(result.data);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadActiveContest = async () => {
    try {
      const response = await fetch('/api/contest/active');
      const result = await response.json();
      
      if (result.success && result.data) {
        setActiveContest(result.data);
      }
    } catch (error) {
      console.error('Error loading active contest:', error);
    }
  };

  const loadStats = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedOrganization && selectedOrganization !== 'all') {
        params.append('organization', selectedOrganization);
      }
      if (selectedYear && selectedYear !== 'all') {
        params.append('year', selectedYear);
      }
      
      const url = params.toString() 
        ? `/api/dashboard/stats?${params.toString()}`
        : '/api/dashboard/stats';
      const response = await fetch(url);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Chào mừng {session.user.name}
              {isAdmin && <span className="ml-2 text-blue-600 font-semibold">(Quản trị viên)</span>}
            </p>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600 font-medium">Lọc:</span>
            </div>
            
            {/* Year Filter */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 min-w-[150px]"
            >
              <option value="all">Tất cả năm</option>
              {availableYears.map((year) => (
                <option key={year} value={year.toString()}>
                  Năm {year}
                </option>
              ))}
            </select>
            
            {/* Organization Filter */}
            <select
              value={selectedOrganization}
              onChange={(e) => setSelectedOrganization(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 min-w-[200px]"
            >
              <option value="all">Tất cả nơi báo cáo</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contest Banner */}
        {activeContest && (
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
                        {activeContest.title}
                      </h2>
                      <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                        {activeContest.description || 'Thử thách bản thân với các câu hỏi hấp dẫn về phản ứng có hại của thuốc. Tham gia ngay để kiểm tra kiến thức và cạnh tranh trên bảng xếp hạng!'}
                      </p>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-3 mt-4">
                      <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full shadow-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-gray-700">Đang diễn ra</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full shadow-sm">
                        <AcademicCapIcon className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-medium text-gray-700">{activeContest.number_of_questions} câu hỏi</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full shadow-sm">
                        <ClockIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-gray-700">{activeContest.time_per_question}s/câu</span>
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
        )}

        {/* Stats Grid - Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Reports */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-full -mr-16 -mt-16"></div>
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng số báo cáo</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.totalReports || 0}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <DocumentTextIcon className="w-7 h-7 text-white" />
              </div>
            </div>
          </Card>

          {/* New Reports This Month */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-full -mr-16 -mt-16"></div>
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-sm font-medium text-gray-600">Báo cáo tháng này</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.newReportsThisMonth || 0}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <ChartBarIcon className="w-7 h-7 text-white" />
              </div>
            </div>
          </Card>

          {/* New Reports Today */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-violet-600/5 rounded-full -mr-16 -mt-16"></div>
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-sm font-medium text-gray-600">Báo cáo mới hôm nay</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.newReportsToday || 0}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <ClockIcon className="w-7 h-7 text-white" />
              </div>
            </div>
          </Card>

          {/* Critical Reports */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/10 to-rose-600/5 rounded-full -mr-16 -mt-16"></div>
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-sm font-medium text-gray-600">Báo cáo nghiêm trọng</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.criticalReports || 0}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/30">
                <ExclamationTriangleIcon className="w-7 h-7 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Stats Grid - Row 2 (Pending Reports) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pending/Unapproved Reports */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-full -mr-16 -mt-16"></div>
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-sm font-medium text-gray-600">Báo cáo chưa duyệt</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.pendingReports || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Tổng số báo cáo đang chờ phê duyệt
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                <CheckCircleIcon className="w-7 h-7 text-white" />
              </div>
            </div>
          </Card>

          {/* Growth Rate */}
          {stats && stats.previousMonthReports > 0 && (
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-full -mr-16 -mt-16"></div>
              <div className="flex items-center justify-between relative">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tăng trưởng so với tháng trước</p>
                  <div className="flex items-center mt-2">
                    <p className={`text-2xl font-bold ${stats.growthRate >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate.toFixed(1)}%
                    </p>
                    <span className="text-sm text-gray-600 ml-2">
                      ({stats.previousMonthReports} báo cáo tháng trước)
                    </span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <ChartBarIcon className="w-7 h-7 text-white" />
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Timeline Section */}
        {stats && stats.recentReportsTimeline && stats.recentReportsTimeline.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline Báo cáo mới</h2>
            <Card className="max-h-[600px] overflow-y-auto">
              <ReportTimeline reports={stats.recentReportsTimeline} />
            </Card>
          </div>
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
            {selectedOrganization !== 'all' && (
              <span className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                Lọc theo: <span className="font-semibold text-blue-700">{selectedOrganization}</span>
              </span>
            )}
          </div>
          <DashboardCharts layout="grid" showAll={true} organization={selectedOrganization} year={selectedYear} />
        </div>
      </div>
    </MainLayout>
  );
}
