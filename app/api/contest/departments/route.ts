import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// GET: Lấy danh sách đơn vị
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const { data: departments, error } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: departments
    });
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}



