import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Type for contest update payload
type ContestUpdatePayload = {
  title?: string;
  description?: string;
  rules?: string;
  prizes?: string;
  logo_url?: string;
  number_of_questions?: number;
  time_per_question?: number;
  passing_score?: number;
  start_date?: string;
  end_date?: string;
  status?: 'draft' | 'active' | 'ended' | 'archived';
  is_public?: boolean;
  updated_at?: string;
};

// GET: Lấy thông tin cuộc thi (Admin)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: contest, error } = await supabaseAdmin
      .from('contests')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: contest
    });
  } catch (error: any) {
    console.error('Error fetching contest:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT: Cập nhật cuộc thi (Admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as ContestUpdatePayload;

    // @ts-ignore - contests table not in Database types yet
    const { data: contest, error } = await (supabaseAdmin
      .from('contests') as any)
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: contest,
      message: 'Cập nhật cuộc thi thành công'
    });
  } catch (error: any) {
    console.error('Error updating contest:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Xóa cuộc thi (Admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { error } = await supabaseAdmin
      .from('contests')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Xóa cuộc thi thành công'
    });
  } catch (error: any) {
    console.error('Error deleting contest:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

