import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// GET: Lấy cuộc thi đang diễn ra
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const now = new Date().toISOString();
    
    // Lấy tất cả cuộc thi active và public, sau đó filter trong code
    const { data: contests, error } = await supabase
      .from('contests')
      .select('*')
      .eq('status', 'active')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter cuộc thi hợp lệ (xử lý start_date và end_date null)
    const validContest = contests?.find((contest: any) => {
      // Nếu có start_date, kiểm tra đã bắt đầu chưa
      if (contest.start_date && contest.start_date > now) {
        return false;
      }
      // Nếu có end_date, kiểm tra đã kết thúc chưa
      if (contest.end_date && contest.end_date < now) {
        return false;
      }
      return true;
    });

    // Convert về single result
    const contest = validContest || null;

    return NextResponse.json({
      success: true,
      data: contest
    });
  } catch (error: any) {
    console.error('Error fetching active contest:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}































