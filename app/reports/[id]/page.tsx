import { getServerSession } from 'next-auth/next'
import { notFound, redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import { Database } from '@/types/supabase'
import MainLayout from '@/components/layout/MainLayout'
import ReportDetail from '@/components/reports/ReportDetail'
import { ADRReport } from '@/types/report'
import { applyReportAccessScope, getReportAccessContext } from '@/lib/report-access'

interface ReportPageProps {
  params: {
    id: string
  }
}

// Create Supabase admin client
const supabaseAdmin = createClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey
)

async function getReport(id: string, userId: string): Promise<ADRReport | null> {
  try {
    const accessContext = await getReportAccessContext(userId, supabaseAdmin)
    if (!accessContext) {
      return null
    }

    let query = supabaseAdmin
      .from('adr_reports')
      .select(`
        *,
        suspected_drugs(*)
      `)
      .eq('id', id)

    const scopedQuery = applyReportAccessScope(query, accessContext)
    if (!scopedQuery) {
      return null
    }

    const { data: report, error } = await scopedQuery.single()

    if (error || !report) {
      return null
    }

    return report as ADRReport
  } catch (error) {
    console.error('Error fetching report:', error)
    return null
  }
}

export default async function ReportPage({ params }: ReportPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const report = await getReport(params.id, session.user.id)

  if (!report) {
    notFound()
  }

  return (
    <MainLayout>
      <ReportDetail report={report} />
    </MainLayout>
  )
}

// Generate metadata for the page
export async function generateMetadata({ params }: ReportPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return {
      title: 'Báo cáo ADR',
    }
  }

  const report = await getReport(params.id, session.user.id)

  if (!report) {
    return {
      title: 'Báo cáo không tìm thấy',
    }
  }

  return {
    title: `Báo cáo ${report.report_code} - ${report.patient_name}`,
    description: `Chi tiết báo cáo ADR cho bệnh nhân ${report.patient_name}`,
  }
}

