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
      .order('created_at', { ascending: true }); // Oldest first (original order)

    // DEBUG LOGGING
    console.log(`🔍 [${cardCode}] Card ID: ${card.id}`);
    console.log(`🔍 [${cardCode}] Allergies count: ${allergies?.length || 0}`);
    console.log(`🔍 [${cardCode}] Allergies:`, allergies?.map(a => a.allergen_name));

    if (allergiesError) {
      console.error('Allergies fetch error:', allergiesError);
      return NextResponse.json({ 
        error: 'Lỗi khi lấy thông tin dị ứng' 
      }, { status: 500 });
    }

    // Sort allergies by severity in application layer
    const sortedAllergies = (allergies || []).sort((a, b) => {
      const severityOrder: Record<string, number> = {
        'life_threatening': 1,
        'severe': 2,
        'moderate': 3,
        'mild': 4
      };
      const orderA = severityOrder[a.severity_level] || 99;
      const orderB = severityOrder[b.severity_level] || 99;
      return orderA - orderB;
    });

    // Fetch update history (lịch sử bổ sung)
    const { data: updates, error: updatesError } = await adminSupabase
      .from('allergy_card_updates_with_details')
      .select('*')
      .eq('card_id', card.id)
      .order('created_at', { ascending: false });

    if (updatesError) {
      console.error('Updates fetch error:', updatesError);
      // Continue without updates if error
    }

    // DEBUG LOGGING
    console.log(`🔍 [${cardCode}] Updates count: ${updates?.length || 0}`);
    if (updates && updates.length > 0) {
      console.log(`🔍 [${cardCode}] Updates details:`, updates.map(u => ({
        id: u.id,
        type: u.update_type,
        by: u.updated_by_name,
        date: u.created_at
      })));
    }
    console.log(`✅ [${cardCode}] Final allergies count: ${sortedAllergies.length}`);

    // Return card with allergies and updates (public safe data only)
    const response = NextResponse.json({
      success: true,
      card: {
        ...card,
        allergies: sortedAllergies // Use sorted allergies
      },
      updates: updates || [],
      total_updates: updates?.length || 0,
      warning
    });

    // Disable caching để luôn lấy dữ liệu mới nhất
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;

  } catch (error) {
    console.error('Public card lookup error:', error);
    return NextResponse.json({ 
      error: 'Lỗi server',
      message: 'Vui lòng thử lại sau'
    }, { status: 500 });
  }
}

