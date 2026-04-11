// =====================================================
// ALLERGY CARD PRINT VIEW API
// API endpoint to generate HTML print preview
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { createAdminClient } from '@/lib/supabase';
import { generateAllergyCardPrintHTML } from '@/lib/allergy-card-print-template';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getUserRole(userId: string): Promise<string | null> {
  try {
    const supabase = createAdminClient();
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
 * Supports:
 * - authenticated owner/admin
 * - public QR flow when the request includes the matching card_code
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const publicCardCode = request.nextUrl.searchParams.get('card_code');
    const supabase = createAdminClient();
    const cardId = params.id;

    const { data: card, error } = await supabase
      .from('allergy_cards_with_details')
      .select('*')
      .eq('id', cardId)
      .single();

    if (error || !card) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Khong tim thay the di ung' }, { status: 404 });
    }

    if (!session?.user?.id) {
      if (!publicCardCode || publicCardCode !== card.card_code) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const userRole = await getUserRole(session.user.id);
      const isAdmin = userRole === 'admin';
      const isOwner = card.issued_by_user_id === session.user.id;

      if (!isAdmin && !isOwner) {
        return NextResponse.json({ error: 'Khong co quyen truy cap' }, { status: 403 });
      }
    }

    const html = generateAllergyCardPrintHTML(card);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Loi server' }, { status: 500 });
  }
}
