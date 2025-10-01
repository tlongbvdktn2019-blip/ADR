// =====================================================
// PUBLIC ALLERGY CARD VIEW API
// API công khai để xem thẻ dị ứng qua QR (không cần auth)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

/**
 * GET /api/allergy-cards/view/[id]
 * Public endpoint to view allergy card via QR code
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Get card with details
    const { data: card, error } = await adminSupabase
      .from('allergy_cards_with_details')
      .select('*')
      .eq('id', id)
      .eq('status', 'active') // Only show active cards
      .single();

    if (error || !card) {
      console.error('Card not found:', error);
      return NextResponse.json({ 
        error: 'Không tìm thấy thẻ dị ứng hoặc thẻ không còn hiệu lực' 
      }, { status: 404 });
    }

    // Return card info (safe to show publicly as it's medical necessity)
    return NextResponse.json({
      card: {
        id: card.id,
        card_code: card.card_code,
        patient_name: card.patient_name,
        patient_gender: card.patient_gender,
        patient_age: card.patient_age,
        patient_id_number: card.patient_id_number,
        hospital_name: card.hospital_name,
        department: card.department,
        doctor_name: card.doctor_name,
        doctor_phone: card.doctor_phone,
        issued_date: card.issued_date,
        expiry_date: card.expiry_date,
        organization: card.organization,
        allergies: card.allergies || [],
        notes: card.notes,
        status: card.status
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Lỗi server' 
    }, { status: 500 });
  }
}


