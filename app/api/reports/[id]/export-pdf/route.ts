import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import { Database } from '@/types/supabase'
import { ADRReport } from '@/types/report'
import { PDFServiceVercel } from '@/lib/pdf-service-vercel'

// Force Node.js runtime (not Edge)
export const runtime = 'nodejs'

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

export async function GET(request: NextRequest, { params }: RouteParams) {
  const reportId = params.id

  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the report with suspected and concurrent drugs
    let query = supabaseAdmin
      .from('adr_reports')
      .select(`
        *,
        suspected_drugs(*),
        concurrent_drugs(*)
      `)
      .eq('id', reportId)
      .single()

    const { data: reportData, error } = await query

    if (error || !reportData) {
      return NextResponse.json(
        { error: 'Không tìm thấy báo cáo' },
        { status: 404 }
      )
    }

    const report = reportData as ADRReport

    // PDF export is allowed for all reports (read-only operation)
    // Both admin and user can export PDF for any report they can view

    // Debug logging: Check data format
    console.log('=== PDF GENERATION DEBUG ===')
    console.log('Report ID:', reportId)
    console.log('Report basic info:', {
      id: report.id,
      report_code: report.report_code,
      patient_name: report.patient_name,
      reaction_onset_time: report.reaction_onset_time,
      suspected_drugs_count: report.suspected_drugs?.length || 0
    })
    
    // Validate critical fields
    if (!report.patient_name) {
      console.warn('WARNING: Missing patient_name')
    }
    if (!report.adr_occurrence_date) {
      console.warn('WARNING: Missing adr_occurrence_date')
    }
    
    console.log('Calling PDFService.generatePDF...')

    // Generate PDF
    const pdfBuffer = await PDFServiceVercel.generatePDF(report)
    
    console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes')

    // Create filename with report code
    const filename = `ADR_Report_${report.report_code || 'unknown'}.pdf`

    // Return PDF file
    return new NextResponse(pdfBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error: unknown) {
    const err = error instanceof Error ? error : null

    // Enhanced error logging for debugging
    console.error('=== PDF GENERATION ERROR ===')
    console.error('Report ID:', reportId)
    console.error('Error type:', err?.constructor?.name ?? typeof error)
    console.error('Error message:', err?.message ?? String(error))
    console.error('Error stack:', err?.stack ?? 'N/A')
    
    if (err) {
      console.error('Full error object:', JSON.stringify({
        name: err.name,
        message: err.message,
        stack: err.stack
      }, null, 2))
    } else {
      console.error('Non-Error thrown value:', error)
    }
    
    // Check if it's a specific type of error
    if (err) {
      if (err.message.includes('browser') || err.message.includes('puppeteer')) {
        console.error('PUPPETEER ERROR detected')
        return NextResponse.json(
          { 
            error: 'Lỗi hệ thống khi tạo PDF. Vui lòng thử lại sau.',
            details: err.message // Add details for debugging
          },
          { status: 500 }
        )
      }
      
      if (err.message.includes('timeout')) {
        console.error('TIMEOUT ERROR detected')
        return NextResponse.json(
          { 
            error: 'Timeout khi tạo PDF. Vui lòng thử lại.',
            details: err.message
          },
          { status: 500 }
        )
      }
      
      if (err.message.includes('template') || err.message.includes('HTML')) {
        console.error('TEMPLATE ERROR detected')
        return NextResponse.json(
          { 
            error: 'Lỗi template HTML. Vui lòng liên hệ admin.',
            details: err.message
          },
          { status: 500 }
        )
      }
    }

    console.error('UNKNOWN ERROR - returning generic message')
    return NextResponse.json(
      { 
        error: 'Có lỗi xảy ra khi tạo file PDF',
        details: err?.message ?? String(error),
        type: err?.constructor?.name ?? typeof error
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const reportId = params.id

  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { options = {} } = body // PDF generation options

    // Get the report with suspected and concurrent drugs
    const { data: reportData, error } = await supabaseAdmin
      .from('adr_reports')
      .select(`
        *,
        suspected_drugs(*),
        concurrent_drugs(*)
      `)
      .eq('id', reportId)
      .single()

    if (error || !reportData) {
      return NextResponse.json(
        { error: 'Không tìm thấy báo cáo' },
        { status: 404 }
      )
    }

    const report = reportData as ADRReport

    // PDF export is allowed for all reports (read-only operation)
    // Both admin and user can export PDF for any report they can view

    // Debug logging for POST method
    console.log('=== PDF GENERATION DEBUG (POST) ===')
    console.log('Report ID:', reportId)
    console.log('Options:', options)
    console.log('Report basic info:', {
      id: report.id,
      report_code: report.report_code,
      patient_name: report.patient_name,
      reaction_onset_time: report.reaction_onset_time,
      suspected_drugs_count: report.suspected_drugs?.length || 0
    })

    // Generate PDF with custom options
    const pdfBuffer = await PDFServiceVercel.generatePDF(report, options)
    
    console.log('PDF generated successfully (POST), size:', pdfBuffer.length, 'bytes')

    // Return PDF as base64 for preview or direct download
    const base64PDF = pdfBuffer.toString('base64')
    const filename = `ADR_Report_${report.report_code || 'unknown'}.pdf`

    return NextResponse.json({
      success: true,
      filename,
      size: pdfBuffer.length,
      pdf: base64PDF, // For preview purposes
      downloadUrl: `/api/reports/${reportId}/export-pdf` // For direct download
    })

  } catch (error: unknown) {
    const err = error instanceof Error ? error : null

    // Enhanced error logging for debugging (POST method)
    console.error('=== PDF GENERATION ERROR (POST) ===')
    console.error('Report ID:', reportId)
    console.error('Error type:', err?.constructor?.name ?? typeof error)
    console.error('Error message:', err?.message ?? String(error))
    console.error('Error stack:', err?.stack ?? 'N/A')
    
    if (err) {
      console.error('Full error object:', JSON.stringify({
        name: err.name,
        message: err.message,
        stack: err.stack
      }, null, 2))
    } else {
      console.error('Non-Error thrown value:', error)
    }

    return NextResponse.json(
      { 
        error: 'Có lỗi xảy ra khi tạo file PDF',
        details: err?.message ?? String(error),
        type: err?.constructor?.name ?? typeof error
      },
      { status: 500 }
    )
  }
}
