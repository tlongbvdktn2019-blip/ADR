import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import { Database } from '@/types/supabase'
import MainLayout from '@/components/layout/MainLayout'
import DashboardClient from '@/components/dashboard/DashboardClient'

// Create Supabase admin client
const supabaseAdmin = createClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey
)

interface DashboardStats {
  totalReports: number
  newReportsThisMonth: number
  totalUsers: number
  criticalReports: number
  previousMonthReports?: number
  growthRate?: number
}

async function getDashboardStats(userId?: string, userRole?: string): Promise<DashboardStats> {
  try {
    // Base query for reports
    let reportsQuery = supabaseAdmin
      .from('adr_reports')
      .select('*')

    // Filter by user if not admin
    if (userRole !== 'admin' && userId) {
      reportsQuery = reportsQuery.eq('reporter_id', userId)
    }

    const { data: allReports, error: reportsError } = await reportsQuery

    if (reportsError) {
      return { totalReports: 0, newReportsThisMonth: 0, totalUsers: 0, criticalReports: 0 }
    }

    // Calculate stats
    const totalReports = allReports?.length || 0
    
    // This month's reports
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const newReportsThisMonth = allReports?.filter((report: any) =>
      new Date(report.created_at) >= firstDayOfMonth
    ).length || 0

    // Previous month's reports
    const firstDayOfPreviousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    const previousMonthReports = allReports?.filter((report: any) => {
      const reportDate = new Date(report.created_at)
      return reportDate >= firstDayOfPreviousMonth && reportDate < firstDayOfMonth
    }).length || 0

    // Growth rate calculation
    const growthRate = previousMonthReports > 0 
      ? ((newReportsThisMonth - previousMonthReports) / previousMonthReports) * 100
      : newReportsThisMonth > 0 ? 100 : 0

    // Critical reports (severe reactions)
    const criticalReports = allReports?.filter((report: any) =>
      ['death', 'life_threatening', 'hospitalization'].includes(report.severity_level)
    ).length || 0

    // Total users (only for admin)
    let totalUsers = 0
    if (userRole === 'admin') {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id')

      totalUsers = users?.length || 0
    }

    return {
      totalReports,
      newReportsThisMonth,
      totalUsers,
      criticalReports,
      previousMonthReports,
      growthRate
    }

  } catch (error) {
    return { totalReports: 0, newReportsThisMonth: 0, totalUsers: 0, criticalReports: 0 }
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  // Get initial stats based on user role
  const initialStats = await getDashboardStats(session?.user?.id, session?.user?.role)

  return (
    <MainLayout>
      <DashboardClient initialStats={initialStats} />
    </MainLayout>
  )
}


