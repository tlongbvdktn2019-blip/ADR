import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/admin/fix-organizations
 * Script sửa organization cho các báo cáo có giá trị sai
 * Admin only
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin only' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { report_id, new_organization } = body;

    if (!report_id || !new_organization) {
      return NextResponse.json(
        { success: false, error: 'Thiếu report_id hoặc new_organization' },
        { status: 400 }
      );
    }

    // Cập nhật organization
    // @ts-ignore
    const { error: updateError } = await (supabaseAdmin
      .from('adr_reports') as any)
      .update({ organization: new_organization })
      .eq('id', report_id);

    if (updateError) {
      console.error('Error updating organization:', updateError);
      return NextResponse.json(
        { success: false, error: 'Lỗi khi cập nhật: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật organization thành công'
    });

  } catch (error: any) {
    console.error('Fix organizations error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET: Lấy danh sách reports có organization không nằm trong departments
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Lấy danh sách tên departments hợp lệ
    // @ts-ignore
    const { data: departments } = await (supabaseAdmin
      .from('departments') as any)
      .select('name');

    const validOrgNames = departments?.map((d: any) => d.name) || [];

    // Lấy tất cả reports
    // @ts-ignore
    const { data: reports } = await (supabaseAdmin
      .from('adr_reports') as any)
      .select('id, report_code, organization, patient_name, reporter_name');

    // Lọc ra những reports có organization không hợp lệ
    const invalidReports = reports?.filter(
      (r: any) => !validOrgNames.includes(r.organization)
    ) || [];

    return NextResponse.json({
      success: true,
      data: {
        validOrganizations: validOrgNames,
        invalidReports: invalidReports,
        totalInvalid: invalidReports.length
      }
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}



