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

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // Debug logging
    console.log('🔍 DEBUG - Active contests found:', contests?.length || 0);
    if (contests && contests.length > 0) {
      contests.forEach((c: any) => {
        console.log(`📋 Contest: ${c.title}`, {
          status: c.status,
          is_public: c.is_public,
          start_date: c.start_date,
          end_date: c.end_date,
          now: now
        });
      });
    }

    // Filter cuộc thi hợp lệ (xử lý start_date và end_date null)
    const validContest = contests?.find((contest: any) => {
      // Nếu có start_date, kiểm tra đã bắt đầu chưa
      if (contest.start_date && contest.start_date > now) {
        console.log(`❌ Contest "${contest.title}" chưa bắt đầu`);
        return false;
      }
      // Nếu có end_date, kiểm tra đã kết thúc chưa
      if (contest.end_date && contest.end_date < now) {
        console.log(`❌ Contest "${contest.title}" đã kết thúc. End: ${contest.end_date}, Now: ${now}`);
        return false;
      }
      console.log(`✅ Contest "${contest.title}" hợp lệ`);
      return true;
    });

    // Convert về single result
    const contest = validContest || null;

    // Debug response
    if (!contest && contests && contests.length > 0) {
      console.warn('⚠️ Có cuộc thi trong DB nhưng không hợp lệ về thời gian');
    } else if (!contests || contests.length === 0) {
      console.warn('⚠️ Không có cuộc thi active + public trong DB');
    }

    return NextResponse.json({
      success: true,
      data: contest,
      // Debug info (chỉ để dev, có thể xóa sau)
      debug: process.env.NODE_ENV === 'development' ? {
        totalContests: contests?.length || 0,
        serverTime: now,
        hasValidContest: !!contest
      } : undefined
    });
  } catch (error: any) {
    console.error('Error fetching active contest:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}































