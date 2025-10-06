import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/available-years
 * Lấy danh sách các năm có báo cáo (từ report_date)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Query to get distinct years from report_date
    const { data, error } = await supabaseAdmin
      .from('adr_reports')
      .select('report_date')
      .not('report_date', 'is', null)
      .order('report_date', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Không thể lấy danh sách năm' },
        { status: 500 }
      )
    }

    // Extract years from report_date and get unique values
    const years = new Set<number>()
    
    if (data && data.length > 0) {
      data.forEach((report: any) => {
        if (report.report_date) {
          // report_date format: YYYY-MM-DD
          const year = parseInt(report.report_date.substring(0, 4))
          if (!isNaN(year) && year >= 2000 && year <= 2100) {
            years.add(year)
          }
        }
      })
    }

    // Convert to array and sort descending (newest first)
    const yearArray = Array.from(years).sort((a, b) => b - a)

    return NextResponse.json({
      success: true,
      years: yearArray,
      count: yearArray.length
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách năm' },
      { status: 500 }
    )
  }
}



