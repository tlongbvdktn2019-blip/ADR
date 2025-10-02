import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET: Lấy danh sách khoa/phòng (Admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('department_id');

    // @ts-ignore - units table not in Database types yet
    let query = (supabaseAdmin
      .from('units') as any)
      .select('*, department:departments(*)');

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

// POST: Tạo khoa/phòng mới (Admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { department_id, name, code, description, is_active = true } = body;

    if (!department_id || !name) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // @ts-ignore - units table not in Database types yet
    const { data: unit, error } = await (supabaseAdmin
      .from('units') as any)
      .insert({ department_id, name, code, description, is_active })
      .select('*, department:departments(*)')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: unit,
      message: 'Tạo khoa/phòng thành công'
    });
  } catch (error: any) {
    console.error('Error creating unit:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT: Cập nhật khoa/phòng (Admin)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Thiếu ID khoa/phòng' },
        { status: 400 }
      );
    }

    // @ts-ignore - units table not in Database types yet
    const { data: unit, error } = await (supabaseAdmin
      .from('units') as any)
      .update(updates)
      .eq('id', id)
      .select('*, department:departments(*)')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: unit,
      message: 'Cập nhật khoa/phòng thành công'
    });
  } catch (error: any) {
    console.error('Error updating unit:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Xóa khoa/phòng (Admin)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Thiếu ID khoa/phòng' },
        { status: 400 }
      );
    }

    // @ts-ignore - units table not in Database types yet
    const { error } = await (supabaseAdmin
      .from('units') as any)
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Xóa khoa/phòng thành công'
    });
  } catch (error: any) {
    console.error('Error deleting unit:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

