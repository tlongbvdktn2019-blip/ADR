import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET: Lấy danh sách khoa/phòng (có thể lọc theo department)
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('department_id');
    
    let query = supabase
      .from('units')
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



