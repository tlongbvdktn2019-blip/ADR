import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

/**
 * GET /api/treatment-drugs
 * Lấy danh sách nhóm thuốc điều trị từ bảng treatment_drugs
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

    // Lấy danh sách treatment drugs từ database
    const { data: treatmentDrugs, error } = await supabaseAdmin
      .from('treatment_drugs')
      .select('id, name')
      .order('name', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Không thể lấy danh sách nhóm thuốc điều trị' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      treatmentDrugs: treatmentDrugs || [] 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách nhóm thuốc điều trị' },
      { status: 500 }
    )
  }
}





