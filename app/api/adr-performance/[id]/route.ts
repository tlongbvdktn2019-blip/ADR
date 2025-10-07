import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import { Database } from '@/types/supabase';
import { UpdateAssessmentRequest } from '@/types/adr-performance';

// Create Supabase admin client
const supabaseAdmin = createClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey
);

// GET - Get assessment by ID with all answers
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get assessment
    const { data: assessment, error: assessmentError } = (await (supabaseAdmin
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
      .eq('id', id)
      .single()) as { data: any; error: any };

    if (assessmentError || !assessment) {
      console.error('Error fetching assessment:', assessmentError);
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Get all answers for this assessment
    const { data: answers, error: answersError } = (await (supabaseAdmin
      .from('adr_performance_answers') as any)
      .select('*')
      .eq('assessment_id', id)
      .order('indicator_code')) as { data: any[] | null; error: any };

    if (answersError) {
      console.error('Error fetching answers:', answersError);
    }

    return NextResponse.json({ 
      data: {
        ...assessment,
        answers: answers || []
      }
    });
  } catch (error) {
    console.error('Error in GET /api/adr-performance/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update assessment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id } = params;
    const body: UpdateAssessmentRequest = await request.json();

    // Verify ownership
    const { data: existing } = (await (supabaseAdmin
      .from('adr_performance_assessments') as any)
      .select('user_id')
      .eq('id', id)
      .single()) as { data: { user_id: string } | null };

    if (!existing || existing.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = {};
    if (body.assessment_date) updateData.assessment_date = body.assessment_date;
    if (body.status) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data: assessment, error } = (await (supabaseAdmin
      .from('adr_performance_assessments') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()) as { data: any; error: any };

    if (error) {
      console.error('Error updating assessment:', error);
      return NextResponse.json({ error: 'Failed to update assessment' }, { status: 500 });
    }

    return NextResponse.json({ data: assessment });
  } catch (error) {
    console.error('Error in PUT /api/adr-performance/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete assessment
export async function DELETE(
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
    const { id } = params;

    // Get assessment details
    const { data: existing } = (await (supabaseAdmin
      .from('adr_performance_assessments') as any)
      .select('user_id, status')
      .eq('id', id)
      .single()) as { data: { user_id: string; status: string } | null };

    if (!existing) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Admin can delete any assessment (regardless of status)
    // Regular users can only delete their own draft assessments
    if (userRole !== 'admin') {
      if (existing.user_id !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (existing.status !== 'draft') {
        return NextResponse.json({ 
          error: 'Only draft assessments can be deleted' 
        }, { status: 400 });
      }
    }
    // Admin can delete any assessment - no status check needed

    const { error } = (await (supabaseAdmin
      .from('adr_performance_assessments') as any)
      .delete()
      .eq('id', id)) as { error: any };

    if (error) {
      console.error('Error deleting assessment:', error);
      return NextResponse.json({ error: 'Failed to delete assessment' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/adr-performance/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

