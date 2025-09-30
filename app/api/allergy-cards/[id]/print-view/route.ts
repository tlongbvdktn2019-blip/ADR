// =====================================================
// ALLERGY CARD PRINT VIEW API
// API endpoint to generate HTML print preview
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { createServerClient } from '@/lib/supabase';
import { generateAllergyCardPrintHTML } from '@/lib/allergy-card-print-template';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper function to safely get user role
async function getUserRole(userId: string): Promise<string | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error getting user role:', error);
      return null;
    }
    
    return data?.role || null;
  } catch (error) {
    console.error('Exception getting user role:', error);
    return null;
  }
}

/**
 * GET /api/allergy-cards/[id]/print-view
 * Generate HTML print preview based on capthe.html template
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();
    const cardId = params.id;

    // Fetch card with allergies
    const { data: card, error } = await supabase
      .from('allergy_cards_with_details')
      .select('*')
      .eq('id', cardId)
      .single();

    if (error || !card) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Không tìm thấy thẻ dị ứng' }, { status: 404 });
    }

    // Check permissions
    const userRole = await getUserRole(session.user.id);
    const isAdmin = userRole === 'admin';
    const isOwner = card.issued_by_user_id === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    // Generate HTML based on capthe.html template
    const html = generateAllergyCardPrintHTML(card);

    // Return HTML with proper headers for display in browser
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

