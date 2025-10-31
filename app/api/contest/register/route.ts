import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// POST: Đăng ký tham gia cuộc thi
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    const { contest_id, full_name, email, phone, department_id, unit_id } = body;

    // Validate
    if (!contest_id || !full_name || !department_id || !unit_id) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // Kiểm tra cuộc thi có tồn tại và đang active
    const now = new Date().toISOString();
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select('*')
      .eq('id', contest_id)
      .eq('status', 'active')
      .single();

    if (contestError || !contest) {
      return NextResponse.json(
        { success: false, error: 'Cuộc thi không tồn tại hoặc đã kết thúc' },
        { status: 404 }
      );
    }

    // Chỉ kiểm tra ngày kết thúc nếu có giá trị
    if (contest.end_date) {
      if (contest.end_date < now) {
        return NextResponse.json(
          { success: false, error: 'Cuộc thi đã kết thúc. Không thể đăng ký!' },
          { status: 400 }
        );
      }
    }

    // Chỉ kiểm tra ngày bắt đầu nếu có giá trị
    if (contest.start_date) {
      if (contest.start_date > now) {
        return NextResponse.json(
          { success: false, error: 'Cuộc thi chưa bắt đầu!' },
          { status: 400 }
        );
      }
    }

    // Lấy thông tin IP và User Agent
    const ip_address = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const user_agent = request.headers.get('user-agent') || 'unknown';

    // Tạo participant
    const { data: participant, error: participantError } = await supabase
      .from('contest_participants')
      .insert({
        contest_id,
        full_name,
        email,
        phone,
        department_id,
        unit_id,
        ip_address,
        user_agent
      })
      .select()
      .single();

    if (participantError) throw participantError;

    return NextResponse.json({
      success: true,
      data: participant,
      message: 'Đăng ký thành công'
    });
  } catch (error: any) {
    console.error('Error registering participant:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}































