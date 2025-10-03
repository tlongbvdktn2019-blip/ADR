import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Lấy danh sách đơn vị (Public API for contest)
export async function GET(request: NextRequest) {
  try {
    // Sử dụng supabaseAdmin để đảm bảo lấy dữ liệu chính xác
    // @ts-ignore - departments table not in Database types yet
    const { data: departments, error } = await (supabaseAdmin
      .from('departments') as any)
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





