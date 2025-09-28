// =====================================================
// ALLERGY CARD PDF EXPORT API  
// API endpoint for generating PDF allergy cards
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { createServerClient } from '@/lib/supabase';
import { AllergyCardPDFService } from '@/lib/allergy-card-pdf-service';

/**
 * GET /api/allergy-cards/[id]/export-pdf
 * Export allergy card as PDF
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
      return NextResponse.json({ error: 'Không tìm thấy thẻ dị ứng' }, { status: 404 });
    }

    // Check permissions
    const isAdmin = (session.user as any).role === 'admin';
    const isOwner = card.issued_by_user_id === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    // Generate PDF
    const pdfBuffer = await AllergyCardPDFService.generatePDF(card);

    // Set response headers for PDF download
    const headers = new Headers({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="The_Di_Ung_${card.card_code}.pdf"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    return new NextResponse(pdfBuffer as BodyInit, { headers });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ 
      error: 'Không thể tạo file PDF' 
    }, { status: 500 });
  }
}
