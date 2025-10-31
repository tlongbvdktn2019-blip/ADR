import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

/**
 * Test API để kiểm tra trạng thái cuộc thi
 * GET /api/contest/test-status
 */
export async function GET() {
  try {
    const supabase = createClient();
    const now = new Date().toISOString();

    // Lấy cuộc thi active
    const { data: contests, error } = await supabase
      .from('contests')
      .select('*')
      .eq('status', 'active')
      .eq('is_public', true);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: 'Error fetching contests from database'
      }, { status: 500 });
    }

    // Lấy số câu hỏi
    const { data: questions, error: qError } = await supabase
      .from('contest_questions')
      .select('id', { count: 'exact' })
      .eq('is_active', true);

    if (qError) {
      return NextResponse.json({
        success: false,
        error: qError.message,
        details: 'Error fetching questions'
      }, { status: 500 });
    }

    // Kiểm tra cuộc thi hợp lệ
    const validContest = contests?.find((contest: any) => {
      if (contest.start_date && contest.start_date > now) {
        return false;
      }
      if (contest.end_date && contest.end_date < now) {
        return false;
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      data: {
        serverTime: now,
        totalActiveContests: contests?.length || 0,
        validContest: validContest || null,
        totalQuestions: questions?.length || 0,
        apiStatus: 'OK',
        message: validContest
          ? '✅ Có cuộc thi hợp lệ'
          : '❌ Không có cuộc thi hợp lệ'
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'Server error'
    }, { status: 500 });
  }
}

