import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { createClient } from '@supabase/supabase-js'
import { authOptions } from '@/lib/auth-config'
import { config } from '@/lib/config'
import { sendEmail } from '@/lib/email-service'
import { applyReportAccessScope, getReportAccessContext } from '@/lib/report-access'
import {
  ADR_REPORT_PDF_RECIPIENT,
  buildReportPdfEmailContent,
  buildReportPdfEmailSubject,
} from '@/lib/report-pdf-email'
import { buildReportPdfFilename, generateReportPdf } from '@/lib/report-pdf-service'
import { ADRReport } from '@/types/report'
import { Database } from '@/types/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const supabaseAdmin = createClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey
)

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reportId = params.id
    const accessContext = await getReportAccessContext(session.user.id, supabaseAdmin)

    if (!accessContext) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let query = supabaseAdmin
      .from('adr_reports')
      .select(`
        *,
        suspected_drugs(*),
        concurrent_drugs(*)
      `)
      .eq('id', reportId)

    const scopedQuery = applyReportAccessScope(query, accessContext)
    if (!scopedQuery) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const { data: report, error } = await scopedQuery.single()

    if (error || !report) {
      return NextResponse.json({ error: 'Không tìm thấy báo cáo' }, { status: 404 })
    }

    const typedReport = report as ADRReport
    let pdfBuffer: Buffer

    try {
      pdfBuffer = await generateReportPdf(typedReport)
    } catch (pdfError) {
      console.error('Report PDF generation failed', {
        reportId,
        reportCode: typedReport.report_code,
        userId: session.user.id,
        error: pdfError,
      })
      return NextResponse.json(
        { error: 'Không thể tạo file PDF của báo cáo' },
        { status: 500 }
      )
    }

    const filename = buildReportPdfFilename(typedReport.report_code)
    const emailContent = buildReportPdfEmailContent(typedReport)
    const emailResult = await sendEmail({
      to: ADR_REPORT_PDF_RECIPIENT,
      subject: buildReportPdfEmailSubject(typedReport),
      html: emailContent.html,
      text: emailContent.text,
      attachments: [{
        filename,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }],
    })

    if (!emailResult.success) {
      console.error('Report PDF email failed', {
        reportId,
        reportCode: typedReport.report_code,
        userId: session.user.id,
        error: emailResult.error,
      })
      return NextResponse.json({ error: 'Không thể gửi email báo cáo' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Đã gửi file PDF của báo cáo qua email',
      messageId: emailResult.messageId,
      recipient: ADR_REPORT_PDF_RECIPIENT,
      attachment: {
        filename,
        contentType: 'application/pdf',
      },
      ...(emailResult.previewURL && { previewURL: emailResult.previewURL }),
    })
  } catch (error) {
    console.error('Send report PDF email API error:', error)
    return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 })
  }
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessContext = await getReportAccessContext(session.user.id, supabaseAdmin)
    if (!accessContext) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let query = supabaseAdmin
      .from('adr_reports')
      .select('id, reporter_id, report_code, organization_id')
      .eq('id', params.id)

    const scopedQuery = applyReportAccessScope(query, accessContext)
    if (!scopedQuery) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const { data: report, error } = await scopedQuery.single()
    if (error || !report) {
      return NextResponse.json({ error: 'Không tìm thấy báo cáo' }, { status: 404 })
    }

    return NextResponse.json({
      canSendEmail: true,
      reportCode: (report as any)?.report_code || 'unknown',
      defaultRecipient: ADR_REPORT_PDF_RECIPIENT,
      isProduction: process.env.NODE_ENV === 'production',
    })
  } catch (error) {
    console.error('Check report PDF email API error:', error)
    return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 })
  }
}
