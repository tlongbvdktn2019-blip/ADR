// =====================================================
// API TRA CỨU THẺ DỊ ỨNG BẰNG MÃ THẺ
// Endpoint: GET /api/allergy-cards/lookup/[code]
// Dùng để tra cứu thẻ khi quét QR code
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

/**
 * GET /api/allergy-cards/lookup/[code]
 * Tra cứu thẻ dị ứng bằng mã thẻ (card_code)
 * Public endpoint - không cần authentication để hỗ trợ quét QR khẩn cấp
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const cardCode = params.code;

    // Validate card code format (AC-YYYY-XXXXXX)
    if (!/^AC-\d{4}-\d{6}$/.test(cardCode)) {
      return NextResponse.json({ 
        error: 'Mã thẻ không hợp lệ. Định dạng đúng: AC-YYYY-XXXXXX' 
      }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Tìm thẻ dựa vào mã thẻ
    const { data: card, error } = await adminSupabase
      .from('allergy_cards_with_details')
      .select('*')
      .eq('card_code', cardCode)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Lỗi truy vấn dữ liệu' 
      }, { status: 500 });
    }

    if (!card) {
      return NextResponse.json({ 
        error: 'Không tìm thấy thẻ dị ứng với mã này',
        code: cardCode
      }, { status: 404 });
    }

    // Kiểm tra trạng thái thẻ
    if (card.status === 'expired') {
      return NextResponse.json({
        card,
        warning: 'Thẻ dị ứng đã hết hạn. Vui lòng liên hệ bác sĩ để cấp lại.'
      });
    }

    if (card.status === 'inactive') {
      return NextResponse.json({
        card,
        warning: 'Thẻ dị ứng đã bị vô hiệu hóa. Vui lòng liên hệ cơ sở y tế đã cấp thẻ.'
      });
    }

    // Nếu thẻ có liên kết với báo cáo ADR, lấy suspected drugs
    let suspectedDrugs = [];
    if (card.report_id) {
      const { data: drugs } = await adminSupabase
        .from('suspected_drugs')
        .select('*')
        .eq('report_id', card.report_id);
      
      suspectedDrugs = drugs || [];
    }

    card.suspected_drugs = suspectedDrugs;

    // Trả về thông tin thẻ
    return NextResponse.json({
      success: true,
      card
    });

  } catch (error) {
    console.error('Lookup error:', error);
    return NextResponse.json({ 
      error: 'Lỗi server khi tra cứu thẻ',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

