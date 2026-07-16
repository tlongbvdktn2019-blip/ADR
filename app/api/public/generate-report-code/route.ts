import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  generateNextReportCode,
  ReportCodeError,
} from '@/lib/report-code'

/**
 * POST /api/public/generate-report-code
 * Public API - không cần authentication.
 * Mã trả về chỉ là mã xem trước; API tạo báo cáo sẽ cấp mã chính thức.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { department_id } = body

    if (!department_id) {
      return NextResponse.json(
        { success: false, error: 'Thiếu department_id' },
        { status: 400 }
      )
    }

    const generated = await generateNextReportCode(supabaseAdmin, {
      departmentId: department_id,
    })

    return NextResponse.json({
      success: true,
      data: {
        report_code: generated.reportCode,
        organization: generated.organization,
        department_code: generated.departmentCode,
        sequence_number: generated.sequenceNumber,
        year: generated.year,
      },
    })
  } catch (error: any) {
    console.error('Error generating report code:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error instanceof ReportCodeError ? error.status : 500 }
    )
  }
}
