import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET: Lấy danh sách bài thi (Admin)
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

    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');
    const departmentId = searchParams.get('department_id');
    const unitId = searchParams.get('unit_id');

    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('contest_submissions')
      .select(`
        *,
        participant:contest_participants(
          *,
          department:departments(name),
          unit:units(name)
        )
      `, { count: 'exact' })
      .eq('contest_id', params.id)
      .eq('status', 'completed');

    // Tìm kiếm theo tên
    if (search) {
      // Cần filter ở client side vì RLS
    }

    const { data: submissions, error, count } = await query
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Filter ở client side nếu cần
    let filteredData = submissions;
    
    if (search && filteredData) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter((s: any) => 
        s.participant?.full_name?.toLowerCase().includes(searchLower) ||
        s.participant?.email?.toLowerCase().includes(searchLower)
      );
    }

    if (departmentId && filteredData) {
      filteredData = filteredData.filter((s: any) => 
        s.participant?.department_id === departmentId
      );
    }

    if (unitId && filteredData) {
      filteredData = filteredData.filter((s: any) => 
        s.participant?.unit_id === unitId
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredData,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

