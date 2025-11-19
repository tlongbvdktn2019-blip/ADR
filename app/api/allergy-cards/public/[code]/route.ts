// =====================================================
// PUBLIC ALLERGY CARD LOOKUP API
// API công khai để tra cứu thẻ dị ứng bằng mã thẻ
// KHÔNG CẦN AUTHENTICATION - cho phép quét QR công khai
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role (same as internal API)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

    // Use direct service role client with auth options to bypass RLS completely
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    });

    // Lookup card by card code
    const { data: card, error: cardError } = await supabase
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
    const { data: allergies, error: allergiesError } = await supabase
      .from('card_allergies')
      .select('*')
      .eq('card_id', card.id)
      .order('created_at', { ascending: true })
      .limit(100); // Explicit limit to prevent default restrictions

    // DEBUG LOGGING - Chi tiết allergies
    console.log(`🔍 [${cardCode}] Card ID: ${card.id}`);
    console.log(`🔍 [${cardCode}] Raw allergies from DB: ${allergies?.length || 0}`);
    console.log(`🔍 [${cardCode}] All allergen names:`, allergies?.map(a => a.allergen_name));
    console.log(`🔍 [${cardCode}] All allergy IDs:`, allergies?.map(a => a.id));

    if (allergiesError) {
      console.error(`❌ [${cardCode}] Allergies fetch error:`, allergiesError);
      return NextResponse.json({ 
        error: 'Lỗi khi lấy thông tin dị ứng',
        details: allergiesError
      }, { status: 500 });
    }
    
    if (!allergies || allergies.length === 0) {
      console.warn(`⚠️ [${cardCode}] No allergies returned from query`);
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
    
    console.log(`✅ [${cardCode}] After sorting: ${sortedAllergies.length} allergies`);

    // Fetch update history (lịch sử bổ sung)
    // Query 2 bước riêng biệt để tránh nested select issue
    
    // Bước 1: Lấy tất cả updates
    const { data: updates, error: updatesError } = await supabase
      .from('allergy_card_updates')
      .select('*')
      .eq('card_id', card.id)
      .order('created_at', { ascending: false });
    
    // Bước 2: Lấy allergies cho từng update
    if (updates && updates.length > 0) {
      const updateIds = updates.map(u => u.id);
      const { data: allergiesData } = await supabase
        .from('update_allergies')
        .select('*')
        .in('update_id', updateIds)
        .order('severity_level', { ascending: false, nullsFirst: false });
      
      // Map allergies vào từng update
      updates.forEach(update => {
        update.allergies_added = (allergiesData || []).filter(a => a.update_id === update.id);
      });
    }

    if (updatesError) {
      console.error('Updates fetch error:', updatesError);
      // Continue without updates if error
    }

    // Transform updates to ensure allergies_added is always an array
    const transformedUpdates = (updates || []).map(update => ({
      ...update,
      allergies_added: Array.isArray(update.allergies_added) ? update.allergies_added : [],
      allergies_count: Array.isArray(update.allergies_added) ? update.allergies_added.length : 0
    }));

    // DEBUG LOGGING - Chi tiết để tìm update bị thiếu
    console.log(`🔍 [${cardCode}] Raw updates from DB: ${updates?.length || 0}`);
    console.log(`🔍 [${cardCode}] Transformed updates: ${transformedUpdates?.length || 0}`);
    
    if (updates && updates.length > 0) {
      console.log(`📋 [${cardCode}] All updates:`, updates.map(u => ({
        id: u.id,
        type: u.update_type,
        by: u.updated_by_name,
        org: u.updated_by_organization,
        facility: u.facility_name,
        date: u.created_at,
        allergies_raw: u.allergies_added,
        allergies_count: Array.isArray(u.allergies_added) ? u.allergies_added.length : 0
      })));
    }
    
    console.log(`✅ [${cardCode}] Final counts - Allergies: ${sortedAllergies.length}, Updates: ${transformedUpdates.length}`);

    // Return card with allergies and updates (public safe data only)
    const response = NextResponse.json({
      success: true,
      card: {
        ...card,
        allergies: sortedAllergies // Use sorted allergies
      },
      updates: transformedUpdates,
      total_updates: transformedUpdates.length,
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

