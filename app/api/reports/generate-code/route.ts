import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  generateNextReportCode,
  ReportCodeError,
} from '@/lib/report-code'

/**
 * POST /api/reports/generate-code
 * Tạo mã xem trước cho người dùng đã đăng nhập.
 * API tạo báo cáo sẽ cấp lại mã chính thức ở phía server.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

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
