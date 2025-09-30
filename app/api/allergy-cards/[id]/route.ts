// =====================================================
// ALLERGY CARD DETAIL API
// API endpoints for specific allergy card operations
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { createServerClient, createAdminClient } from '@/lib/supabase';
import { QRCodeService } from '@/lib/qr-service';
import { 
  AllergyCard, 
  AllergyCardFormData, 
  QRCodeData 
} from '@/types/allergy-card';

// Helper function to safely get user role
async function getUserRole(userId: string): Promise<string | null> {
  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
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
 * GET /api/allergy-cards/[id]
 * Get specific allergy card with details
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
    let query = supabase
      .from('allergy_cards_with_details')
      .select('*')
      .eq('id', cardId)
      .single();

    const { data: card, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Không tìm thấy thẻ dị ứng' }, { status: 404 });
    }

    // Check permissions using helper function
    const userRole = await getUserRole(session.user.id);
    const isAdmin = userRole === 'admin';
    const isOwner = card.issued_by_user_id === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    // Fetch suspected drugs if card is linked to an ADR report
    if (card.report_id) {
      const { data: drugs } = await supabase
        .from('suspected_drugs')
        .select('*')
        .eq('report_id', card.report_id);
      
      card.suspected_drugs = drugs || [];
    }

    return NextResponse.json({ card });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

/**
 * PUT /api/allergy-cards/[id]
 * Update allergy card
 */
export async function PUT(
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
    const formData: AllergyCardFormData = await request.json();

    // Check if card exists and user has permission
    const { data: existingCard, error: fetchError } = await supabase
      .from('allergy_cards')
      .select('*')
      .eq('id', cardId)
      .single();

    if (fetchError || !existingCard) {
      return NextResponse.json({ error: 'Không tìm thấy thẻ dị ứng' }, { status: 404 });
    }

    // Check permissions using helper function
    const userRole = await getUserRole(session.user.id);
    const isAdmin = userRole === 'admin';
    const isOwner = existingCard.issued_by_user_id === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Không có quyền chỉnh sửa' }, { status: 403 });
    }

    // Validate required fields
    if (!formData.patient_name || !formData.hospital_name || !formData.doctor_name) {
      return NextResponse.json({ 
        error: 'Thiếu thông tin bắt buộc' 
      }, { status: 400 });
    }

    // Update main card record
    const cardUpdateData = {
      patient_name: formData.patient_name,
      patient_gender: formData.patient_gender,
      patient_age: formData.patient_age,
      patient_id_number: formData.patient_id_number,
      hospital_name: formData.hospital_name,
      department: formData.department,
      doctor_name: formData.doctor_name,
      doctor_phone: formData.doctor_phone,
      expiry_date: formData.expiry_date && formData.expiry_date.trim() !== '' ? formData.expiry_date : null,
      notes: formData.notes,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('allergy_cards')
      .update(cardUpdateData)
      .eq('id', cardId);

    if (updateError) {
      console.error('Card update error:', updateError);
      return NextResponse.json({ error: 'Không thể cập nhật thẻ' }, { status: 500 });
    }

    // Update allergies - delete existing and insert new ones
    const { error: deleteError } = await supabase
      .from('card_allergies')
      .delete()
      .eq('card_id', cardId);

    if (deleteError) {
      console.error('Allergies delete error:', deleteError);
      return NextResponse.json({ error: 'Không thể cập nhật dị ứng' }, { status: 500 });
    }

    // Insert updated allergies
    if (formData.allergies && formData.allergies.length > 0) {
      const allergiesData = formData.allergies.map(allergy => ({
        card_id: cardId,
        allergen_name: allergy.allergen_name,
        certainty_level: allergy.certainty_level,
        clinical_manifestation: allergy.clinical_manifestation,
        severity_level: allergy.severity_level,
        reaction_type: allergy.reaction_type
      }));

      const { error: allergiesError } = await supabase
        .from('card_allergies')
        .insert(allergiesData);

      if (allergiesError) {
        console.error('Allergies insert error:', allergiesError);
        return NextResponse.json({ error: 'Không thể cập nhật dị ứng' }, { status: 500 });
      }
    }

    // Fetch updated card with allergies
    const { data: updatedCard } = await supabase
      .from('allergy_cards_with_details')
      .select('*')
      .eq('id', cardId)
      .single();

    if (updatedCard) {
      // Fetch suspected drugs if card is linked to an ADR report
      if (updatedCard.report_id) {
        const { data: drugs } = await supabase
          .from('suspected_drugs')
          .select('*')
          .eq('report_id', updatedCard.report_id);
        
        updatedCard.suspected_drugs = drugs || [];
      }

      // Regenerate QR code with updated data
      const baseUrl = request.nextUrl.origin;
      const qrData: QRCodeData = QRCodeService.createQRData(updatedCard, baseUrl);
      const qrCodeDataURL = await QRCodeService.generateQRCodeDataURL(qrData);

      // Update QR code in database
      await supabase
        .from('allergy_cards')
        .update({
          qr_code_data: JSON.stringify(qrData),
          qr_code_url: qrCodeDataURL
        })
        .eq('id', cardId);

      updatedCard.qr_code_data = JSON.stringify(qrData);
      updatedCard.qr_code_url = qrCodeDataURL;
    }

    return NextResponse.json({
      success: true,
      card: updatedCard
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

/**
 * DELETE /api/allergy-cards/[id]
 * Permanently delete allergy card and all related data
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient(); // Use admin client to bypass RLS
    const cardId = params.id;

    // Check if card exists and user has permission using admin client
    const { data: existingCard, error: fetchError } = await adminSupabase
      .from('allergy_cards')
      .select('*')
      .eq('id', cardId)
      .single();

    if (fetchError || !existingCard) {
      console.error('Card fetch error:', fetchError);
      return NextResponse.json({ error: 'Không tìm thấy thẻ dị ứng' }, { status: 404 });
    }

    // Check permissions using helper function
    const userRole = await getUserRole(session.user.id);
    const isAdmin = userRole === 'admin';
    const isOwner = existingCard.issued_by_user_id === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Không có quyền xóa' }, { status: 403 });
    }

    // Hard delete: First delete related allergies, then delete the card
    console.log(`Deleting allergy card ${cardId} permanently...`);
    
    // Delete related allergies first (foreign key constraint)
    const { error: allergiesDeleteError } = await adminSupabase
      .from('card_allergies')
      .delete()
      .eq('card_id', cardId);

    if (allergiesDeleteError) {
      console.error('Allergies delete error:', allergiesDeleteError);
      return NextResponse.json({ error: 'Không thể xóa thông tin dị ứng' }, { status: 500 });
    }

    // Now delete the main card record
    const { error: cardDeleteError } = await adminSupabase
      .from('allergy_cards')
      .delete()
      .eq('id', cardId);

    if (cardDeleteError) {
      console.error('Card delete error:', cardDeleteError);
      return NextResponse.json({ error: 'Không thể xóa thẻ dị ứng' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa vĩnh viễn thẻ dị ứng'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
