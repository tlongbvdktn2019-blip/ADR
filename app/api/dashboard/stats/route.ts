// =====================================================
// DASHBOARD STATS API
// API endpoint for dashboard statistics
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';


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
  totalUsers: number;
  criticalReports: number;
  previousMonthReports: number;
  growthRate: number;
  newReportsToday: number;
  pendingReports: number;
  unapprovedReports: number;
  recentReportsTimeline: ReportTimeline[];
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

    const isAdmin = (session.user as any).role === 'admin';
    const supabase = createAdminClient();
    
    // Get filters from query params
    const { searchParams } = new URL(request.url);
    const organization = searchParams.get('organization');
    const year = searchParams.get('year');
    
    // Base query for reports
    let reportsQuery = supabase
      .from('adr_reports')
      .select('*');

    // Apply organization filter if provided
    if (organization && organization !== 'all') {
      reportsQuery = reportsQuery.eq('organization', organization);
    }

    // Apply year filter if provided (filter by report_date year)
    if (year && year !== 'all') {
      const yearNum = parseInt(year);
      if (!isNaN(yearNum)) {
        const startDate = `${yearNum}-01-01`;
        const endDate = `${yearNum}-12-31`;
        reportsQuery = reportsQuery
          .gte('report_date', startDate)
          .lte('report_date', endDate);
      }
    }

    // No filtering by user - both admin and user can view stats for all reports
    // This allows users to see system-wide statistics while maintaining edit restrictions

    const { data: allReports, error: reportsError } = await reportsQuery;

    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
      return NextResponse.json({ 
        error: 'KhĂ´ng thá»ƒ táº£i thá»‘ng kĂª' 
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

    // New reports today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const newReportsToday = allReports?.filter(report => 
      new Date(report.created_at) >= startOfToday
    ).length || 0;

    // Pending reports (chưa duyệt - status pending)
    const pendingReports = allReports?.filter(report =>
      report.approval_status === 'pending'
    ).length || 0;

    // Unapproved reports (same as pending for this context)
    const unapprovedReports = pendingReports;

    // Recent reports timeline (last 10 reports)
    const recentReportsTimeline: ReportTimeline[] = allReports
      ? allReports
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)
          .map(report => ({
            id: report.id,
            report_code: report.report_code,
            organization: report.organization,
            severity_level: report.severity_level,
            approval_status: report.approval_status,
            created_at: report.created_at
          }))
      : [];

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
      growthRate,
      newReportsToday,
      pendingReports,
      unapprovedReports,
      recentReportsTimeline
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json({ 
      error: 'Lá»—i server khi táº£i thá»‘ng kĂª' 
    }, { status: 500 });
  }
}




