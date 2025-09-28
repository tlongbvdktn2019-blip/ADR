import { getServerSession } from 'next-auth/next'
import { notFound, redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import { Database } from '@/types/supabase'
import MainLayout from '@/components/layout/MainLayout'
import ReportDetail from '@/components/reports/ReportDetail'
import { ADRReport } from '@/types/report'

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

async function getReport(id: string, userId?: string, userRole?: string): Promise<ADRReport | null> {
  try {
    let query = supabaseAdmin
      .from('adr_reports')
      .select(`
        *,
        suspected_drugs(*)
      `)
      .eq('id', id)
      .single()

    const { data: report, error } = await query

    if (error || !report) {
      return null
    }

    // Check permissions
    if (userRole !== 'admin' && (report as any)?.reporter_id !== userId) {
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

  const report = await getReport(params.id, session.user.id, session.user.role)

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

  const report = await getReport(params.id, session.user.id, session.user.role)

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


