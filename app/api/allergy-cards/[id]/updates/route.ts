// =====================================================
// ALLERGY CARD UPDATES API
// API endpoints để bổ sung thông tin vào thẻ dị ứng
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  AllergyCardUpdateFormData, 
  AllergyCardUpdateResponse,
  AllergyCardUpdate 
} from '@/types/allergy-card';

// Initialize Supabase client with service role for public access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET - Lấy lịch sử cập nhật của một thẻ dị ứng
 * Public access - Ai cũng có thể xem lịch sử (sau khi quét QR)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const cardId = params.id;

    // Lấy thông tin thẻ để verify
    const { data: card, error: cardError } = await supabase
      .from('allergy_cards')
      .select('id, card_code, patient_name')
      .eq('id', cardId)
      .single();

    if (cardError || !card) {
      return NextResponse.json(
        { error: 'Không tìm thấy thẻ dị ứng' },
        { status: 404 }
      );
    }

    // Lấy lịch sử cập nhật từ view
    const { data: updates, error: updatesError } = await supabase
      .from('allergy_card_updates_with_details')
      .select('*')
      .eq('card_id', cardId)
      .order('created_at', { ascending: false });

    if (updatesError) {
      console.error('Get updates error:', updatesError);
      return NextResponse.json(
        { error: 'Không thể tải lịch sử cập nhật' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      card: {
        id: card.id,
        card_code: card.card_code,
        patient_name: card.patient_name
      },
      updates: updates || [],
      total_updates: updates?.length || 0
    });

  } catch (error) {
    console.error('Get updates error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tải lịch sử' },
      { status: 500 }
    );
  }
}

/**
 * POST - Bổ sung thông tin mới vào thẻ dị ứng
 * Public access - Ai cũng có thể bổ sung (sau khi quét QR và verify mã thẻ)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const cardId = params.id;
    const body: AllergyCardUpdateFormData = await request.json();

    // Validate required fields
    if (!body.updated_by_name || !body.updated_by_organization || !body.facility_name) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin người bổ sung và cơ sở y tế' },
        { status: 400 }
      );
    }

    if (!body.update_type) {
      return NextResponse.json(
        { error: 'Vui lòng chọn loại cập nhật' },
        { status: 400 }
      );
    }

    // Verify card exists và card_code khớp
    const { data: card, error: cardError } = await supabase
      .from('allergy_cards')
      .select('id, card_code, patient_name, status')
      .eq('id', cardId)
      .single();

    if (cardError || !card) {
      return NextResponse.json(
        { error: 'Không tìm thấy thẻ dị ứng' },
        { status: 404 }
      );
    }

    // Verify card code
    if (body.card_code !== card.card_code) {
      return NextResponse.json(
        { error: 'Mã thẻ không chính xác' },
        { status: 403 }
      );
    }

    // Check if card is active
    if (card.status === 'expired') {
      return NextResponse.json(
        { error: 'Thẻ đã hết hạn, không thể bổ sung thông tin' },
        { status: 400 }
      );
    }

    // Insert update record
    const { data: updateRecord, error: updateError } = await supabase
      .from('allergy_card_updates')
      .insert({
        card_id: cardId,
        updated_by_name: body.updated_by_name,
        updated_by_organization: body.updated_by_organization,
        updated_by_role: body.updated_by_role,
        updated_by_phone: body.updated_by_phone,
        updated_by_email: body.updated_by_email,
        facility_name: body.facility_name,
        facility_department: body.facility_department,
        update_type: body.update_type,
        update_notes: body.update_notes,
        reason_for_update: body.reason_for_update,
        is_verified: false // Mặc định chưa xác minh
      })
      .select()
      .single();

    if (updateError || !updateRecord) {
      console.error('Insert update error:', updateError);
      return NextResponse.json(
        { error: 'Không thể tạo bản cập nhật' },
        { status: 500 }
      );
    }

    let allergiesAdded = 0;

    // Insert allergies if provided
    if (body.allergies && body.allergies.length > 0) {
      // 1. Lưu vào update_allergies (lịch sử)
      const allergiesToInsert = body.allergies.map(allergy => ({
        update_id: updateRecord.id,
        allergen_name: allergy.allergen_name,
        certainty_level: allergy.certainty_level,
        clinical_manifestation: allergy.clinical_manifestation,
        severity_level: allergy.severity_level,
        reaction_type: allergy.reaction_type,
        discovered_date: allergy.discovered_date,
        is_approved: true, // Tự động approve
        approved_at: new Date().toISOString()
      }));

      const { data: insertedAllergies, error: allergiesError } = await supabase
        .from('update_allergies')
        .insert(allergiesToInsert)
        .select();

      if (allergiesError) {
        console.error('Insert allergies error:', allergiesError);
        // Continue anyway, update was created
      } else {
        allergiesAdded = insertedAllergies?.length || 0;

        // 2. ĐỒNG THỜI thêm vào card_allergies (dị ứng chính của thẻ)
        // Để dị ứng mới hiển thị ngay trên thẻ khi quét lại QR
        const cardAllergiesToInsert = body.allergies.map(allergy => ({
          card_id: cardId,
          allergen_name: allergy.allergen_name,
          certainty_level: allergy.certainty_level,
          clinical_manifestation: allergy.clinical_manifestation,
          severity_level: allergy.severity_level,
          reaction_type: allergy.reaction_type
        }));

        const { error: cardAllergiesError } = await supabase
          .from('card_allergies')
          .insert(cardAllergiesToInsert);

        if (cardAllergiesError) {
          console.error('Insert card allergies error:', cardAllergiesError);
          // Log error nhưng không fail request vì đã lưu vào update_allergies
        }
      }
    }

    // Cập nhật updated_at của thẻ chính
    await supabase
      .from('allergy_cards')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', cardId);

    // Lấy thông tin update với allergies
    const { data: finalUpdate } = await supabase
      .from('allergy_card_updates_with_details')
      .select('*')
      .eq('id', updateRecord.id)
      .single();

    const response: AllergyCardUpdateResponse = {
      success: true,
      update: finalUpdate || updateRecord,
      allergies_added: allergiesAdded
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Add update error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi bổ sung thông tin' },
      { status: 500 }
    );
  }
}

