import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'

interface RouteParams {
  params: {
    id: string
  }
}

// Create Supabase client without type constraint for new columns
const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
)

// PUT /api/reports/[id]/approve - Duyệt hoặc từ chối báo cáo
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Vui lòng đăng nhập' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Chỉ admin mới có quyền duyệt báo cáo' },
        { status: 403 }
      )
    }

    const reportId = params.id
    const body = await request.json()
    const { approval_status, approval_note } = body

    // Validate approval_status
    if (!['approved', 'rejected', 'pending'].includes(approval_status)) {
      return NextResponse.json(
        { error: 'Invalid approval status - Trạng thái duyệt không hợp lệ' },
        { status: 400 }
      )
    }

    // Check if report exists
    const { data: existingReport, error: fetchError } = await supabaseAdmin
      .from('adr_reports')
      .select('id, report_code, approval_status')
      .eq('id', reportId)
      .single()

    if (fetchError) {
      console.error('Fetch report error:', fetchError)
      
      // Check if error is due to missing column (migration not run)
      if (fetchError.message?.includes('approval_status') || fetchError.code === '42703') {
        return NextResponse.json(
          { 
            error: 'Database chưa được cập nhật. Vui lòng chạy migration: supabase/add-approval-status.sql',
            details: 'Cột approval_status chưa tồn tại trong bảng adr_reports'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Không tìm thấy báo cáo', details: fetchError.message },
        { status: 404 }
      )
    }

    if (!existingReport) {
      return NextResponse.json(
        { error: 'Không tìm thấy báo cáo' },
        { status: 404 }
      )
    }

    // Update report approval status
    let updateData: {
      approval_status: 'pending' | 'approved' | 'rejected'
      approval_note: string | null
      updated_at: string
      approved_by?: string | null
      approved_at?: string | null
    } = {
      approval_status,
      approval_note: approval_note || null,
      updated_at: new Date().toISOString(),
    }

    // Only set approved_by and approved_at if approving or rejecting
    if (approval_status === 'approved' || approval_status === 'rejected') {
      updateData.approved_by = session.user.id
      updateData.approved_at = new Date().toISOString()
    } else if (approval_status === 'pending') {
      // Reset approval info if setting back to pending
      updateData.approved_by = null
      updateData.approved_at = null
    }

    const { data: updatedReport, error: updateError } = await supabaseAdmin
      .from('adr_reports')
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single()

    if (updateError) {
      console.error('Update approval status error:', updateError)
      
      // Check if error is due to missing column
      if (updateError.message?.includes('approval_status') || updateError.code === '42703') {
        return NextResponse.json(
          { 
            error: 'Database chưa được cập nhật. Vui lòng chạy migration: supabase/add-approval-status.sql',
            details: updateError.message 
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Không thể cập nhật trạng thái duyệt báo cáo', details: updateError.message },
        { status: 500 }
      )
    }

    const statusText = approval_status === 'approved' ? 'đã duyệt' : 
                       approval_status === 'rejected' ? 'đã từ chối' : 
                       'chuyển về chưa duyệt'

    return NextResponse.json({
      message: `Báo cáo ${existingReport.report_code} ${statusText} thành công`,
      report: updatedReport,
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật trạng thái duyệt báo cáo' },
      { status: 500 }
    )
  }
}

