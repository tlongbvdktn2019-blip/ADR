import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Lấy danh sách khoa/phòng (có thể lọc theo department) (Public API for contest)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('department_id');
    
    // Sử dụng supabaseAdmin để đảm bảo lấy dữ liệu chính xác
    // @ts-ignore - units table not in Database types yet
    let query = (supabaseAdmin
      .from('units') as any)
      .select('*, department:departments(*)')
      .eq('is_active', true);
    
    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }
    
    const { data: units, error } = await query.order('name');

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: units
    });
  } catch (error: any) {
    console.error('Error fetching units:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}




