import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import { Database } from '@/types/supabase';
import { ADRPerformanceAssessment, CreateAssessmentRequest } from '@/types/adr-performance';

// Create Supabase admin client
const supabaseAdmin = createClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey
);

// GET - Get all assessments for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    let query = (supabaseAdmin
      .from('adr_performance_assessments') as any)
      .select(`
        *,
        users:user_id (
          id,
          name,
          email,
          organization
        )
      `)
      .order('assessment_date', { ascending: false });

    // If not admin, only show own assessments
    if (userRole !== 'admin') {
      query = query.eq('user_id', userId);
    }

    const { data: assessments, error } = (await query) as { data: any[] | null; error: any };

    if (error) {
      console.error('Error fetching assessments:', error);
      return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
    }

    return NextResponse.json({ data: assessments });
  } catch (error) {
    console.error('Error in GET /api/adr-performance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new assessment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body: CreateAssessmentRequest = await request.json();

    const newAssessment = {
      user_id: userId,
      assessment_date: body.assessment_date || new Date().toISOString().split('T')[0],
      status: body.status || 'draft',
      notes: body.notes
    };

    const { data: assessment, error } = (await (supabaseAdmin
      .from('adr_performance_assessments') as any)
      .insert([newAssessment])
      .select()
      .single()) as { data: any; error: any };

    if (error) {
      console.error('Error creating assessment:', error);
      return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
    }

    return NextResponse.json({ data: assessment }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/adr-performance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

