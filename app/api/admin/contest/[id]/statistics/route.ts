import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET: Lấy thống kê cuộc thi (Admin)
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

    // Get total participants
    const { data: participants, error: pError } = await supabaseAdmin
      .from('contest_participants')
      .select('id', { count: 'exact' })
      .eq('contest_id', contestId);

    if (pError) throw pError;

    // Get submissions
    const { data: submissions, error: sError } = await supabaseAdmin
      .from('contest_submissions')
      .select('*')
      .eq('contest_id', contestId)
      .eq('status', 'completed');

    if (sError) throw sError;

    const totalParticipants = participants?.length || 0;
    const totalSubmissions = submissions?.length || 0;
    
    // Calculate average score
    const averageScore = totalSubmissions > 0 && submissions
      ? submissions.reduce((sum: number, sub: any) => sum + (sub.score || 0), 0) / totalSubmissions
      : 0;

    // Calculate completion rate
    const completionRate = totalParticipants > 0
      ? (totalSubmissions / totalParticipants) * 100
      : 0;

    // Get top performers (with participant details)
    const topPerformers = submissions && submissions.length > 0
      ? submissions
          .sort((a: any, b: any) => {
            if (b.score !== a.score) {
              return b.score - a.score; // Higher score first
            }
            return a.time_taken - b.time_taken; // Lower time first
          })
          .slice(0, 10)
          .map((sub: any, index: number) => ({
            id: sub.id,
            rank: index + 1,
            full_name: sub.participant?.full_name || 'N/A',
            department_name: sub.participant?.department?.name || 'N/A',
            score: sub.score,
            time_taken: sub.time_taken
          }))
      : [];

    // Score distribution
    const scoreDistribution = submissions && submissions.length > 0
      ? [
          { range: '0-3', count: submissions.filter((s: any) => s.score >= 0 && s.score <= 3).length },
          { range: '4-6', count: submissions.filter((s: any) => s.score >= 4 && s.score <= 6).length },
          { range: '7-8', count: submissions.filter((s: any) => s.score >= 7 && s.score <= 8).length },
          { range: '9-10', count: submissions.filter((s: any) => s.score >= 9 && s.score <= 10).length }
        ]
      : [
          { range: '0-3', count: 0 },
          { range: '4-6', count: 0 },
          { range: '7-8', count: 0 },
          { range: '9-10', count: 0 }
        ];

    // Department stats - simplified (would need JOIN with participants)
    const departmentStats: any[] = [];

    return NextResponse.json({
      success: true,
      data: {
        total_participants: totalParticipants,
        total_submissions: totalSubmissions,
        average_score: averageScore,
        completion_rate: completionRate,
        top_performers: topPerformers,
        score_distribution: scoreDistribution,
        department_stats: departmentStats
      }
    });
  } catch (error: any) {
    console.error('Error fetching contest statistics:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
