import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createAdminClient } from '@/lib/supabase'
import { applyReportAccessScope, getReportAccessContext } from '@/lib/report-access'
import { generateReportPrintHTML } from '@/lib/report-print-template'
import { ADRReport } from '@/types/report'

// Force Node.js runtime (not Edge)
export const runtime = 'nodejs'

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
    const supabase = createAdminClient()
    const accessContext = await getReportAccessContext(session.user.id, supabase)
    if (!accessContext) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let reportQuery = supabase
      .from('adr_reports')
      .select(`
        *,
        suspected_drugs(*),
        concurrent_drugs(*)
      `)
      .eq('id', reportId)

    const scopedReportQuery = applyReportAccessScope(reportQuery, accessContext)
    if (!scopedReportQuery) {
      return NextResponse.json(
        { error: 'Không tìm thấy báo cáo' },
        { status: 404 }
      )
    }

    const { data: reportData, error } = await scopedReportQuery.single()

    if (error || !reportData) {
      console.error('Report not found:', error)
      return NextResponse.json(
        { error: 'Không tìm thấy báo cáo' },
        { status: 404 }
      )
    }

    const report = reportData as ADRReport

    // Generate form-style HTML exactly like template.html
    const html = generateReportPrintHTML(report)

    // Return HTML response
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    })

  } catch (error) {
    console.error('Print view error:', error)
    return NextResponse.json(
      { 
        error: 'Có lỗi xảy ra khi tạo view in', 
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'Error'
      },
      { status: 500 }
    )
  }
}
