import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import { Database } from '@/types/supabase';
import { SaveAnswerRequest, calculateIndicatorScore } from '@/types/adr-performance';

// Create Supabase admin client
const supabaseAdmin = createClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey
);

// POST - Save/Update answer for an indicator
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: assessmentId } = params;
    const body: SaveAnswerRequest = await request.json();

    // Verify ownership of assessment
    const { data: assessment, error: assessmentError } = (await (supabaseAdmin
      .from('adr_performance_assessments') as any)
      .select('user_id, status')
      .eq('id', assessmentId)
      .single()) as { data: { user_id: string; status: string } | null; error: any };

    if (assessmentError || !assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    if (assessment.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate score based on answer
    const score = calculateIndicatorScore(body.indicator_type, body.answer);

    const answerData = {
      assessment_id: assessmentId,
      indicator_code: body.indicator_code,
      indicator_type: body.indicator_type,
      category: body.category,
      question: body.question,
      answer: body.answer,
      score: score,
      note: body.note || null
    };

    // Upsert answer (insert or update if exists)
    const { data: savedAnswer, error } = (await (supabaseAdmin
      .from('adr_performance_answers') as any)
      .upsert(answerData, {
        onConflict: 'assessment_id,indicator_code'
      })
      .select()
      .single()) as { data: any; error: any };

    if (error) {
      console.error('Error saving answer:', error);
      return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
    }

    // Get updated assessment with scores (auto-calculated by trigger)
    const { data: updatedAssessment } = (await (supabaseAdmin
      .from('adr_performance_assessments') as any)
      .select('*')
      .eq('id', assessmentId)
      .single()) as { data: any };

    return NextResponse.json({ 
      data: {
        answer: savedAnswer,
        assessment: updatedAssessment
      }
    });
  } catch (error) {
    console.error('Error in POST /api/adr-performance/[id]/answers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get all answers for an assessment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const { id: assessmentId } = params;

    // Verify access to assessment
    const { data: assessment } = (await (supabaseAdmin
      .from('adr_performance_assessments') as any)
      .select('user_id')
      .eq('id', assessmentId)
      .single()) as { data: { user_id: string } | null };

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Check if user is admin or owner
    const isAdmin = userRole === 'admin';
    const isOwner = assessment.user_id === userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: answers, error } = (await (supabaseAdmin
      .from('adr_performance_answers') as any)
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('indicator_code')) as { data: any[] | null; error: any };

    if (error) {
      console.error('Error fetching answers:', error);
      return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 });
    }

    return NextResponse.json({ data: answers || [] });
  } catch (error) {
    console.error('Error in GET /api/adr-performance/[id]/answers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

