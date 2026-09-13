/**
 * Auto Email API - Tự động gửi email thông báo cho báo cáo ADR
 * 
 * POST /api/reports/auto-email
 * Body: { reportId: string, includeReporter?: boolean, includeOrganization?: boolean }
 * 
 * Endpoint yêu cầu phiên đăng nhập và áp dụng quyền truy cập theo đơn vị.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import { Database } from '@/types/supabase'
import { sendAutoReportEmail } from '@/lib/auto-email-service'
import { ADRReport } from '@/types/report'
import { applyReportAccessScope, getReportAccessContext } from '@/lib/report-access'

// Create Supabase admin client
const supabaseAdmin = createClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey
)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      reportId, 
      includeReporter = true, 
      includeOrganization = true,
      additionalRecipients = []
    } = body

    if (!reportId) {
      return NextResponse.json(
        { error: 'reportId is required' },
        { status: 400 }
      )
    }

    const accessContext = await getReportAccessContext(session.user.id, supabaseAdmin)
    if (!accessContext) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get the report with all related data
    let reportQuery = supabaseAdmin
      .from('adr_reports')
      .select(`
        *,
        suspected_drugs(*)
      `)
      .eq('id', reportId)

    const scopedReportQuery = applyReportAccessScope(reportQuery, accessContext)
    if (!scopedReportQuery) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const { data: report, error: reportError } = await scopedReportQuery.single()

    if (reportError || !report) {
      console.error('Report fetch error:', reportError)
      return NextResponse.json(
        { error: 'Không tìm thấy báo cáo' },
        { status: 404 }
      )
    }

    const typedReport = report as ADRReport

    // Send automatic emails
    const result = await sendAutoReportEmail(typedReport, {
      includeReporter,
      includeOrganization,
      additionalRecipients
    })

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Không thể gửi email tự động',
          details: result.failures
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email tự động đã được gửi thành công',
      reportCode: typedReport.report_code,
      sentTo: result.sentTo,
      failures: result.failures.length > 0 ? result.failures : undefined
    })

  } catch (error) {
    console.error('Auto email API error:', error)
    return NextResponse.json(
      { 
        error: 'Lỗi máy chủ nội bộ',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET method to check auto-email status for a report
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId')

    if (!reportId) {
      return NextResponse.json(
        { error: 'reportId is required' },
        { status: 400 }
      )
    }

    const accessContext = await getReportAccessContext(session.user.id, supabaseAdmin)
    if (!accessContext) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get report info
    let reportQuery = supabaseAdmin
      .from('adr_reports')
      .select('id, report_code, organization, organization_id, reporter_email')
      .eq('id', reportId)

    const scopedReportQuery = applyReportAccessScope(reportQuery, accessContext)
    if (!scopedReportQuery) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const { data: report, error: reportError } = await scopedReportQuery.single()

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Không tìm thấy báo cáo' },
        { status: 404 }
      )
    }

    // Check auto-email configuration
    const hasReporterEmail = !!(report as any).reporter_email
    const hasOrganizationEmail = !!(report as any).organization

    return NextResponse.json({
      success: true,
      reportCode: (report as any).report_code,
      autoEmailEnabled: true,
      configuration: {
        hasReporterEmail,
        hasOrganizationEmail,
        organization: (report as any).organization,
        reporterEmail: hasReporterEmail ? (report as any).reporter_email : null
      }
    })

  } catch (error) {
    console.error('Auto email status API error:', error)
    return NextResponse.json(
      { error: 'Lỗi máy chủ nội bộ' },
      { status: 500 }
    )
  }
}

