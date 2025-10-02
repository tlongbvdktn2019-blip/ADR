import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET: Lấy danh sách đơn vị (Admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // @ts-ignore - departments table not in Database types yet
    const { data: departments, error } = await (supabaseAdmin
      .from('departments') as any)
      .select('*')
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

// POST: Tạo đơn vị mới (Admin)
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
    const { name, code, description, is_active = true } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Thiếu tên đơn vị' },
        { status: 400 }
      );
    }

    // @ts-ignore - departments table not in Database types yet
    const { data: department, error } = await (supabaseAdmin
      .from('departments') as any)
      .insert({ name, code, description, is_active })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: department,
      message: 'Tạo đơn vị thành công'
    });
  } catch (error: any) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT: Cập nhật đơn vị (Admin)
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
        { success: false, error: 'Thiếu ID đơn vị' },
        { status: 400 }
      );
    }

    // @ts-ignore - departments table not in Database types yet
    const { data: department, error } = await (supabaseAdmin
      .from('departments') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: department,
      message: 'Cập nhật đơn vị thành công'
    });
  } catch (error: any) {
    console.error('Error updating department:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Xóa đơn vị (Admin)
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
        { success: false, error: 'Thiếu ID đơn vị' },
        { status: 400 }
      );
    }

    // @ts-ignore - departments table not in Database types yet
    const { error } = await (supabaseAdmin
      .from('departments') as any)
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Xóa đơn vị thành công'
    });
  } catch (error: any) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

