import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

/**
 * POST /api/reports/generate-code
 * Generate mã số báo cáo tự động
 * Format: {code_department}-{số_thứ_tự}-{năm}
 * Ví dụ: 92114-001-2025
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { department_id } = body;

    if (!department_id) {
      return NextResponse.json(
        { success: false, error: 'Thiếu department_id' },
        { status: 400 }
      );
    }

    // Lấy thông tin department để có code
    // @ts-ignore
    const { data: department, error: deptError } = await (supabaseAdmin
      .from('departments') as any)
      .select('code, name')
      .eq('id', department_id)
      .single();

    if (deptError || !department) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy đơn vị' },
        { status: 404 }
      );
    }

    if (!department.code) {
      return NextResponse.json(
        { success: false, error: 'Đơn vị chưa có mã code' },
        { status: 400 }
      );
    }

    // Lấy năm hiện tại
    const currentYear = new Date().getFullYear();

    // Đếm số báo cáo của đơn vị này trong năm hiện tại
    // @ts-ignore
    const { count, error: countError } = await (supabaseAdmin
      .from('adr_reports') as any)
      .select('*', { count: 'exact', head: true })
      .eq('organization', department.name)
      .gte('created_at', `${currentYear}-01-01`)
      .lte('created_at', `${currentYear}-12-31`);

    if (countError) {
      console.error('Error counting reports:', countError);
      return NextResponse.json(
        { success: false, error: 'Lỗi khi đếm báo cáo' },
        { status: 500 }
      );
    }

    // Số thứ tự = count + 1, padding 3 chữ số
    const sequenceNumber = String((count || 0) + 1).padStart(3, '0');

    // Generate code: {dept_code}-{sequence}-{year}
    const reportCode = `${department.code}-${sequenceNumber}-${currentYear}`;

    return NextResponse.json({
      success: true,
      data: {
        report_code: reportCode,
        organization: department.name,
        department_code: department.code,
        sequence_number: sequenceNumber,
        year: currentYear
      }
    });

  } catch (error: any) {
    console.error('Error generating report code:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}



