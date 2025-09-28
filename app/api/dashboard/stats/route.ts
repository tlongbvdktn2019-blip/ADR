// =====================================================
// DASHBOARD STATS API
// API endpoint for dashboard statistics
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { createServerClient } from '@/lib/supabase';

interface DashboardStats {
  totalReports: number;
  newReportsThisMonth: number;
  totalUsers: number;
  criticalReports: number;
  previousMonthReports: number;
  growthRate: number;
}

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();
    const isAdmin = (session.user as any).role === 'admin';

    // Base query for reports
    let reportsQuery = supabase
      .from('adr_reports')
      .select('*');

    // No filtering by user - both admin and user can view stats for all reports
    // This allows users to see system-wide statistics while maintaining edit restrictions

    const { data: allReports, error: reportsError } = await reportsQuery;

    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
      return NextResponse.json({ 
        error: 'Không thể tải thống kê' 
      }, { status: 500 });
    }

    // Calculate stats
    const totalReports = allReports?.length || 0;
    
    // This month's reports
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const newReportsThisMonth = allReports?.filter(report => 
      new Date(report.created_at) >= firstDayOfMonth
    ).length || 0;

    // Previous month's reports
    const firstDayOfPreviousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const previousMonthReports = allReports?.filter(report => {
      const reportDate = new Date(report.created_at);
      return reportDate >= firstDayOfPreviousMonth && reportDate < firstDayOfMonth;
    }).length || 0;

    // Growth rate calculation
    const growthRate = previousMonthReports > 0 
      ? ((newReportsThisMonth - previousMonthReports) / previousMonthReports) * 100
      : newReportsThisMonth > 0 ? 100 : 0;

    // Critical reports (severe reactions)
    const criticalReports = allReports?.filter(report =>
      ['death', 'life_threatening', 'hospitalization'].includes(report.severity_level)
    ).length || 0;

    // Total users (only for admin)
    let totalUsers = 0;
    if (isAdmin) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id');

      totalUsers = users?.length || 0;
    }

    const stats: DashboardStats = {
      totalReports,
      newReportsThisMonth,
      totalUsers,
      criticalReports,
      previousMonthReports,
      growthRate
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json({ 
      error: 'Lỗi server khi tải thống kê' 
    }, { status: 500 });
  }
}
