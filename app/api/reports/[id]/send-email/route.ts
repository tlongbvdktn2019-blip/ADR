import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import { Database } from '@/types/supabase'
import { sendEmail } from '@/lib/email-service'
import { generateADRReportEmailHTML, generateADRReportEmailSubject, generateADRReportEmailText } from '@/lib/email-templates/adr-report'
import { ADRReport } from '@/types/report'
import { applyReportAccessScope, getReportAccessContext } from '@/lib/report-access'

// Create Supabase admin client
const supabaseAdmin = createClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey
)

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const reportId = params.id

    const accessContext = await getReportAccessContext(session.user.id, supabaseAdmin)
    if (!accessContext) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get the report with suspected drugs
    let query = supabaseAdmin
      .from('adr_reports')
      .select(`
        *,
        suspected_drugs(*)
      `)
      .eq('id', reportId)

    const scopedQuery = applyReportAccessScope(query, accessContext)
    if (!scopedQuery) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const { data: report, error } = await scopedQuery.single()

    if (error || !report) {
      return NextResponse.json(
        { error: 'Không tìm thấy báo cáo' },
        { status: 404 }
      )
    }

    // Get custom email from request body (optional)
    const body = await request.json()
    const customEmail = body.email // Optional override

    // Generate email content
    const emailSubject = generateADRReportEmailSubject(report as ADRReport)
    const emailHTML = generateADRReportEmailHTML(report as ADRReport)
    const emailText = generateADRReportEmailText(report as ADRReport)

    // Send email
    const emailResult = await sendEmail({
      to: customEmail, // Will use default if not provided
      subject: emailSubject,
      html: emailHTML,
      text: emailText
    })

    if (!emailResult.success) {
      console.error('Email sending failed:', emailResult.error)
      return NextResponse.json(
        { error: 'Không thể gửi email: ' + emailResult.error },
        { status: 500 }
      )
    }

    // Return success response
    const response = {
      success: true,
      message: 'Email đã được gửi thành công',
      messageId: emailResult.messageId,
      recipient: customEmail || 'di.pvcenter@gmail.com',
      // Include preview URL for development
      ...(emailResult.previewURL && { previewURL: emailResult.previewURL })
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Send email API error:', error)
    return NextResponse.json(
      { error: 'Lỗi máy chủ nội bộ' },
      { status: 500 }
    )
  }
}

// GET method to check email sending capability
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const reportId = params.id

    const accessContext = await getReportAccessContext(session.user.id, supabaseAdmin)
    if (!accessContext) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if report exists and user has permission
    let query = supabaseAdmin
      .from('adr_reports')
      .select('id, reporter_id, report_code, organization_id')
      .eq('id', reportId)

    const scopedQuery = applyReportAccessScope(query, accessContext)
    if (!scopedQuery) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const { data: report, error } = await scopedQuery.single()

    if (error || !report) {
      return NextResponse.json(
        { error: 'Không tìm thấy báo cáo' },
        { status: 404 }
      )
    }

    // Return email configuration info
    return NextResponse.json({
      canSendEmail: true,
      reportCode: (report as any)?.report_code || 'unknown',
      defaultRecipient: 'di.pvcenter@gmail.com',
      isProduction: process.env.NODE_ENV === 'production'
    })

  } catch (error) {
    console.error('Check email API error:', error)
    return NextResponse.json(
      { error: 'Lỗi máy chủ nội bộ' },
      { status: 500 }
    )
  }
}
