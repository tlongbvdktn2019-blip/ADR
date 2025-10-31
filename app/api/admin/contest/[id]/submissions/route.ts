import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET: Lấy danh sách bài nộp của cuộc thi (Admin)
 */
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

    const contestId = params.id;

    // Get submissions with participant details
    const { data: submissions, error } = await supabaseAdmin
      .from('contest_submissions')
      .select(`
        *,
        participant:contest_participants(
          id,
          full_name,
          email,
          phone,
          department:contest_departments(id, name),
          unit:contest_units(id, name)
        )
      `)
      .eq('contest_id', contestId)
      .eq('status', 'completed')
      .order('score', { ascending: false })
      .order('time_taken', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: submissions || []
    });
  } catch (error: any) {
    console.error('Error fetching contest submissions:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
