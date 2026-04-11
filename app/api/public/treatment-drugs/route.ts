import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/public/treatment-drugs
 * Public API - Lấy danh sách nhóm thuốc điều trị KHÔNG CẦN authentication
 * Dùng cho form báo cáo công khai
 */
export async function GET(request: NextRequest) {
  try {
    // Lấy danh sách treatment drugs từ database
    const { data: treatmentDrugs, error } = await supabaseAdmin
      .from('treatment_drugs')
      .select('id, name')
      .order('name', { ascending: true })

    if (error) {
      console.error('❌ Database error when fetching treatment_drugs:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { 
          error: 'Không thể lấy danh sách nhóm thuốc điều trị',
          details: error.message 
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      treatmentDrugs: treatmentDrugs || [],
      count: treatmentDrugs?.length || 0
    })

  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json(
      { 
        error: 'Có lỗi xảy ra khi lấy danh sách nhóm thuốc điều trị',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

