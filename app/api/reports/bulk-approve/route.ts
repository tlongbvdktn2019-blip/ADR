import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient } from '@supabase/supabase-js'
import { authOptions } from '@/lib/auth-config'
import {
  BulkApprovalValidationError,
  buildBulkApprovalResult,
  normalizeBulkApprovalIds,
} from '@/lib/bulk-report-approval'
import { config } from '@/lib/config'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Vui lòng đăng nhập' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Chỉ admin mới có quyền duyệt báo cáo' },
        { status: 403 }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Dữ liệu yêu cầu không hợp lệ' },
        { status: 400 }
      )
    }

    let reportIds: string[]
    try {
      const reportIdsValue =
        typeof body === 'object' && body !== null && 'report_ids' in body
          ? (body as { report_ids?: unknown }).report_ids
          : undefined
      reportIds = normalizeBulkApprovalIds(reportIdsValue)
    } catch (error) {
      if (error instanceof BulkApprovalValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      throw error
    }

    const timestamp = new Date().toISOString()
    const supabaseAdmin = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey
    )

    const { data: updatedReports, error: updateError } = await supabaseAdmin
      .from('adr_reports')
      .update({
        approval_status: 'approved',
        approved_by: session.user.id,
        approved_at: timestamp,
        updated_at: timestamp,
        approval_note: null,
      })
      .in('id', reportIds)
      .eq('approval_status', 'pending')
      .select('id')

    if (updateError) {
      console.error('Bulk report approval update error:', updateError)
      return NextResponse.json(
        { error: 'Không thể duyệt các báo cáo đã chọn' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      buildBulkApprovalResult(reportIds, updatedReports || [])
    )
  } catch (error) {
    console.error('Bulk report approval API error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi duyệt các báo cáo' },
      { status: 500 }
    )
  }
}
