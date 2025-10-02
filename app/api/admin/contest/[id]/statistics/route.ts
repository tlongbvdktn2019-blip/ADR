import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET: Lấy thống kê cuộc thi (Admin)
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

    // 1. Tổng số participants
    // @ts-ignore - contest tables not in Database types yet
    const { count: totalParticipants } = await (supabaseAdmin
      .from('contest_participants') as any)
      .select('*', { count: 'exact', head: true })
      .eq('contest_id', contestId);

    // 2. Tổng số submissions
    // @ts-ignore - contest tables not in Database types yet
    const { count: totalSubmissions } = await (supabaseAdmin
      .from('contest_submissions') as any)
      .select('*', { count: 'exact', head: true })
      .eq('contest_id', contestId)
      .eq('status', 'completed');

    // 3. Lấy tất cả submissions để tính toán
    // @ts-ignore - contest tables not in Database types yet
    const { data: submissions } = await (supabaseAdmin
      .from('contest_submissions') as any)
      .select('score, time_taken, participant:contest_participants(department_id, department:departments(name))')
      .eq('contest_id', contestId)
      .eq('status', 'completed');

    const averageScore = submissions && submissions.length > 0
      ? submissions.reduce((sum: number, s: any) => sum + s.score, 0) / submissions.length
      : 0;

    const averageTime = submissions && submissions.length > 0
      ? submissions.reduce((sum: number, s: any) => sum + (s.time_taken || 0), 0) / submissions.length
      : 0;

    const completionRate = totalParticipants && totalSubmissions
      ? (totalSubmissions / totalParticipants) * 100
      : 0;

    // 4. Phân phối điểm số
    const scoreRanges = [
      { range: '0-2', min: 0, max: 2, count: 0 },
      { range: '3-5', min: 3, max: 5, count: 0 },
      { range: '6-8', min: 6, max: 8, count: 0 },
      { range: '9-10', min: 9, max: 10, count: 0 }
    ];

    submissions?.forEach((s: any) => {
      const range = scoreRanges.find(r => s.score >= r.min && s.score <= r.max);
      if (range) range.count++;
    });

    // 5. Top performers
    // @ts-ignore - contest tables not in Database types yet
    const { data: topPerformers } = await (supabaseAdmin
      .from('contest_leaderboard') as any)
      .select('*')
      .eq('contest_id', contestId)
      .order('rank')
      .limit(10);

    // 6. Thống kê theo đơn vị
    const departmentStats: any = {};
    submissions?.forEach((s: any) => {
      const deptName = s.participant?.department?.name || 'Không rõ';
      if (!departmentStats[deptName]) {
        departmentStats[deptName] = {
          department_name: deptName,
          participants: 0,
          total_score: 0,
          average_score: 0
        };
      }
      departmentStats[deptName].participants++;
      departmentStats[deptName].total_score += s.score;
    });

    const departmentStatsArray = Object.values(departmentStats).map((d: any) => ({
      ...d,
      average_score: d.total_score / d.participants
    }));

    const statistics = {
      total_participants: totalParticipants || 0,
      total_submissions: totalSubmissions || 0,
      average_score: Math.round(averageScore * 10) / 10,
      average_time: Math.round(averageTime),
      completion_rate: Math.round(completionRate * 10) / 10,
      score_distribution: scoreRanges,
      top_performers: topPerformers || [],
      department_stats: departmentStatsArray
    };

    return NextResponse.json({
      success: true,
      data: statistics
    });
  } catch (error: any) {
    console.error('Error fetching contest statistics:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

