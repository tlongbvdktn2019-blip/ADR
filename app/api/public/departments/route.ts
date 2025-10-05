import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/public/departments
 * Public API - Không cần authentication
 * Dùng cho form báo cáo không đăng nhập
 */
export async function GET(request: NextRequest) {
  try {
    // Lấy danh sách departments (PUBLIC - không cần auth)
    // @ts-ignore
    const { data: departments, error } = await (supabaseAdmin
      .from('departments') as any)
      .select('id, name, code')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching departments:', error);
      return NextResponse.json(
        { success: false, error: 'Không thể lấy danh sách đơn vị' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: departments || []
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}



