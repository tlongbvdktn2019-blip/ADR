import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/admin/migrate-report-codes
 * Migration script: Tạo mã báo cáo cho các báo cáo cũ chưa có mã
 * CHỈ DÀNH CHO ADMIN
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

    // Lấy tất cả báo cáo chưa có report_code
    // @ts-ignore
    const { data: reportsWithoutCode, error: fetchError } = await (supabaseAdmin
      .from('adr_reports') as any)
      .select('id, organization, created_at, report_date')
      .or('report_code.is.null,report_code.eq.')
      .order('created_at');

    if (fetchError) {
      console.error('Error fetching reports:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Lỗi khi lấy danh sách báo cáo' },
        { status: 500 }
      );
    }

    if (!reportsWithoutCode || reportsWithoutCode.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Không có báo cáo nào cần cập nhật mã',
        updated: 0
      });
    }

    console.log(`Found ${reportsWithoutCode.length} reports without code`);

    // Lấy tất cả departments để có mapping name -> code
    // @ts-ignore
    const { data: departments, error: deptError } = await (supabaseAdmin
      .from('departments') as any)
      .select('name, code');

    if (deptError) {
      console.error('Error fetching departments:', deptError);
      return NextResponse.json(
        { success: false, error: 'Lỗi khi lấy danh sách đơn vị' },
        { status: 500 }
      );
    }

    const deptMap = new Map(departments?.map((d: any) => [d.name, d.code]) || []);

    // Nhóm báo cáo theo organization và year để đếm
    const orgYearCounter: Record<string, number> = {};

    const updates: Array<{ id: string; report_code: string }> = [];

    for (const report of reportsWithoutCode) {
      const org = report.organization || 'Unknown';
      const deptCode = deptMap.get(org);

      if (!deptCode) {
        console.warn(`No department code for organization: ${org}`);
        continue;
      }

      // Lấy năm từ created_at hoặc report_date
      const year = new Date(report.report_date || report.created_at).getFullYear();
      const key = `${org}-${year}`;

      if (!orgYearCounter[key]) {
        // Đếm số báo cáo của org này trong năm này (từ database)
        // @ts-ignore
        const { count } = await (supabaseAdmin
          .from('adr_reports') as any)
          .select('*', { count: 'exact', head: true })
          .eq('organization', org)
          .gte('created_at', `${year}-01-01`)
          .lte('created_at', `${year}-12-31`)
          .not('report_code', 'is', null);

        orgYearCounter[key] = count || 0;
      }

      // Tăng counter
      orgYearCounter[key]++;
      const sequenceNumber = String(orgYearCounter[key]).padStart(3, '0');
      const reportCode = `${deptCode}-${sequenceNumber}-${year}`;

      updates.push({
        id: report.id,
        report_code: reportCode
      });
    }

    console.log(`Prepared ${updates.length} updates`);

    // Cập nhật từng báo cáo
    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      // @ts-ignore
      const { error: updateError } = await (supabaseAdmin
        .from('adr_reports') as any)
        .update({ report_code: update.report_code })
        .eq('id', update.id);

      if (updateError) {
        console.error(`Error updating report ${update.id}:`, updateError);
        errorCount++;
      } else {
        successCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật ${successCount} báo cáo`,
      details: {
        total: reportsWithoutCode.length,
        success: successCount,
        error: errorCount
      }
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

