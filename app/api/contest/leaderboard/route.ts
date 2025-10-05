import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET: Lấy bảng xếp hạng
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    const contestId = searchParams.get('contest_id');
    const limit = parseInt(searchParams.get('limit') || '100');
    const departmentId = searchParams.get('department_id');
    const unitId = searchParams.get('unit_id');
    const search = searchParams.get('search'); // Tìm kiếm theo tên

    if (!contestId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu contest_id' },
        { status: 400 }
      );
    }

    // Sử dụng view đã tạo
    let query = supabase
      .from('contest_leaderboard')
      .select('*')
      .eq('contest_id', contestId);

    // Lọc theo department
    if (departmentId) {
      // Join với contest_participants để lọc
      query = supabase
        .from('contest_submissions')
        .select(`
          *,
          participant:contest_participants!inner(
            full_name,
            email,
            department:departments(name),
            unit:units(name),
            department_id,
            unit_id
          )
        `)
        .eq('contest_id', contestId)
        .eq('status', 'completed')
        .eq('participant.department_id', departmentId);
    }

    // Lọc theo unit
    if (unitId) {
      query = supabase
        .from('contest_submissions')
        .select(`
          *,
          participant:contest_participants!inner(
            full_name,
            email,
            department:departments(name),
            unit:units(name),
            department_id,
            unit_id
          )
        `)
        .eq('contest_id', contestId)
        .eq('status', 'completed')
        .eq('participant.unit_id', unitId);
    }

    // Nếu không có filter, dùng view
    if (!departmentId && !unitId) {
      let { data: leaderboard, error } = await query
        .order('rank')
        .limit(limit);

      if (error) throw error;

      // Tìm kiếm theo tên nếu có
      if (search && leaderboard) {
        const searchLower = search.toLowerCase();
        leaderboard = leaderboard.filter((entry: any) => 
          entry.full_name.toLowerCase().includes(searchLower)
        );
      }

      return NextResponse.json({
        success: true,
        data: leaderboard
      });
    }

    // Xử lý khi có filter
    const { data: submissions, error } = await query;
    if (error) throw error;

    // Format và sắp xếp
    const formattedLeaderboard = submissions
      ?.map((s: any) => ({
        id: s.id,
        contest_id: s.contest_id,
        full_name: s.participant.full_name,
        email: s.participant.email,
        department_name: s.participant.department?.name,
        unit_name: s.participant.unit?.name,
        score: s.score,
        total_questions: s.total_questions,
        correct_answers: s.correct_answers,
        time_taken: s.time_taken,
        submitted_at: s.submitted_at
      }))
      .sort((a: any, b: any) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.time_taken - b.time_taken;
      })
      .map((entry: any, index: number) => ({
        ...entry,
        rank: index + 1
      }))
      .slice(0, limit);

    // Tìm kiếm
    let finalData = formattedLeaderboard;
    if (search && finalData) {
      const searchLower = search.toLowerCase();
      finalData = finalData.filter((entry: any) => 
        entry.full_name.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      success: true,
      data: finalData
    });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}















