// =====================================================
// PUBLIC ALLERGY CARD LOOKUP API
// API công khai để tra cứu thẻ dị ứng bằng mã thẻ
// KHÔNG CẦN AUTHENTICATION - cho phép quét QR công khai
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

/**
 * GET /api/allergy-cards/public/[code]
 * Public endpoint to lookup allergy card by card code
 * No authentication required - for public QR scanning
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const cardCode = params.code;

    // Validate card code format (AC-YYYY-XXXXXX)
    if (!cardCode || !/^AC-\d{4}-\d{6}$/.test(cardCode)) {
      return NextResponse.json({ 
        error: 'Mã thẻ không hợp lệ. Định dạng đúng: AC-YYYY-XXXXXX' 
      }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Lookup card by card code
    const { data: card, error: cardError } = await adminSupabase
      .from('allergy_cards')
      .select(`
        id,
        card_code,
        patient_name,
        patient_gender,
        patient_age,
        patient_id_number,
        hospital_name,
        department,
        doctor_name,
        doctor_phone,
        issued_date,
        expiry_date,
        organization,
        status,
        notes,
        created_at
      `)
      .eq('card_code', cardCode)
      .maybeSingle();

    if (cardError) {
      console.error('Database error:', cardError);
      return NextResponse.json({ 
        error: 'Lỗi khi tra cứu thẻ dị ứng' 
      }, { status: 500 });
    }

    if (!card) {
      return NextResponse.json({ 
        error: 'Không tìm thấy thẻ dị ứng với mã này',
        message: 'Vui lòng kiểm tra lại mã thẻ hoặc liên hệ bác sĩ điều trị'
      }, { status: 404 });
    }

    // Check if card is expired or inactive
    let warning = null;
    if (card.status === 'expired') {
      warning = 'Thẻ này đã hết hiệu lực. Vui lòng liên hệ bác sĩ để cập nhật.';
    } else if (card.status === 'inactive') {
      warning = 'Thẻ này đã bị vô hiệu hóa. Vui lòng liên hệ bác sĩ để biết thêm chi tiết.';
    } else if (card.expiry_date) {
      const expiryDate = new Date(card.expiry_date);
      const today = new Date();
      if (expiryDate < today) {
        warning = 'Thẻ này đã quá hạn. Vui lòng liên hệ bác sĩ để cập nhật.';
      }
    }

    // Fetch allergies for this card
    const { data: allergies, error: allergiesError } = await adminSupabase
      .from('card_allergies')
      .select('*')
      .eq('card_id', card.id)
      .order('severity_level', { ascending: false }); // Severe first

    if (allergiesError) {
      console.error('Allergies fetch error:', allergiesError);
      return NextResponse.json({ 
        error: 'Lỗi khi lấy thông tin dị ứng' 
      }, { status: 500 });
    }

    // Return card with allergies (public safe data only)
    return NextResponse.json({
      success: true,
      card: {
        ...card,
        allergies: allergies || []
      },
      warning
    });

  } catch (error) {
    console.error('Public card lookup error:', error);
    return NextResponse.json({ 
      error: 'Lỗi server',
      message: 'Vui lòng thử lại sau'
    }, { status: 500 });
  }
}

