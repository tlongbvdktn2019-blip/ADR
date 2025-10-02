import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET: Lấy danh sách cuộc thi (Admin)
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
    const status = searchParams.get('status');

    // @ts-ignore - contest tables not in Database types yet
    let query = (supabaseAdmin
      .from('contests') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: contests, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: contests
    });
  } catch (error: any) {
    console.error('Error fetching contests:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST: Tạo cuộc thi mới (Admin)
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

    const {
      title,
      description,
      rules,
      prizes,
      logo_url,
      number_of_questions = 10,
      time_per_question = 20,
      passing_score,
      start_date,
      end_date,
      status = 'draft',
      is_public = true
    } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Thiếu tiêu đề cuộc thi' },
        { status: 400 }
      );
    }

    // @ts-ignore - contest tables not in Database types yet
    const { data: contest, error } = await (supabaseAdmin
      .from('contests') as any)
      .insert({
        title,
        description,
        rules,
        prizes,
        logo_url,
        number_of_questions,
        time_per_question,
        passing_score,
        start_date,
        end_date,
        status,
        is_public
        // Temporarily removed created_by until foreign key constraint is fixed
        // created_by: session.user.id
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: contest,
      message: 'Tạo cuộc thi thành công'
    });
  } catch (error: any) {
    console.error('Error creating contest:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

