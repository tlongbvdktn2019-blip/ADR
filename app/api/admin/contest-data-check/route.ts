import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET: Kiểm tra dữ liệu departments và units (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Lấy tất cả departments
    const { data: departments, error: deptError } = await (supabaseAdmin
      .from('departments') as any)
      .select('*')
      .order('name');

    if (deptError) throw deptError;

    // Lấy tất cả units với thông tin department
    const { data: units, error: unitsError } = await (supabaseAdmin
      .from('units') as any)
      .select('*, department:departments(id, name)')
      .order('name');

    if (unitsError) throw unitsError;

    // Thống kê
    const stats = {
      totalDepartments: departments?.length || 0,
      activeDepartments: departments?.filter((d: any) => d.is_active).length || 0,
      totalUnits: units?.length || 0,
      activeUnits: units?.filter((u: any) => u.is_active).length || 0,
      unitsByDepartment: {} as Record<string, number>
    };

    // Đếm units theo department
    units?.forEach((unit: any) => {
      const deptName = unit.department?.name || 'Không có đơn vị';
      stats.unitsByDepartment[deptName] = (stats.unitsByDepartment[deptName] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        departments,
        units,
        stats
      }
    });
  } catch (error: any) {
    console.error('Error checking contest data:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

