import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

// GET: return the current public contest, if any
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

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

    const validContest =
      contests?.find((contest: any) => {
        if (contest.start_date && contest.start_date > now) {
          return false;
        }

        if (contest.end_date && contest.end_date < now) {
          return false;
        }

        return true;
      }) || null;

    const response = NextResponse.json({
      success: true,
      data: validContest,
      debug:
        process.env.NODE_ENV === 'development'
          ? {
              totalContests: contests?.length || 0,
              serverTime: now,
              hasValidContest: !!validContest,
            }
          : undefined,
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error: any) {
    console.error('Error fetching active contest:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
