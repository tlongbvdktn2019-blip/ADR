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

    // Use admin client to bypass RLS completely (same as internal API)
    const supabase = createAdminClient();

    // Lookup card by card code using view (same as internal API)
    // View includes allergies already joined, ensuring real-time data
    const { data: card, error: cardError } = await supabase
      .from('allergy_cards_with_details')
      .select('*')
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

    // Allergies are already included in the view
    // Sort allergies by severity in application layer
    const sortedAllergies = ((card.allergies || []) as any[]).sort((a, b) => {
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

    // DEBUG LOGGING - Chi tiết allergies
    console.log(`🔍 [${cardCode}] Card ID: ${card.id}`);
    console.log(`🔍 [${cardCode}] Allergies from view: ${sortedAllergies?.length || 0}`);
    console.log(`🔍 [${cardCode}] All allergen names:`, sortedAllergies?.map(a => a.allergen_name));
    
    console.log(`✅ [${cardCode}] After sorting: ${sortedAllergies.length} allergies`);

    // Fetch update history - Query directly from tables to ensure all updates are retrieved
    // This ensures we get all updates including the latest ones
    // Use explicit limit to ensure we get all records (Supabase default limit is 1000)
    const { data: updates, error: updatesError } = await supabase
      .from('allergy_card_updates')
      .select('*', { count: 'exact' })
      .eq('card_id', card.id)
      .order('created_at', { ascending: false })
      .limit(1000); // Explicit limit to ensure we get all updates

    if (updatesError) {
      console.error(`❌ [${cardCode}] Updates fetch error:`, updatesError);
      console.error(`❌ [${cardCode}] Error details:`, JSON.stringify(updatesError, null, 2));
      // Continue without updates if error, but log it
    }

    console.log(`🔍 [${cardCode}] Found ${updates?.length || 0} updates for card_id: ${card.id}`);

    // Fetch allergies for each update
    let transformedUpdates: any[] = [];
    if (updates && updates.length > 0) {
      const updateIds = updates.map(u => u.id);
      console.log(`🔍 [${cardCode}] Fetching allergies for ${updateIds.length} updates:`, updateIds);
      
      // Get all allergies for all updates in one query
      // Use explicit limit to ensure we get all records
      const { data: allergiesData, error: allergiesError } = await supabase
        .from('update_allergies')
        .select('*', { count: 'exact' })
        .in('update_id', updateIds)
        .order('severity_level', { ascending: false, nullsFirst: false })
        .limit(1000); // Explicit limit

      if (allergiesError) {
        console.error(`❌ [${cardCode}] Allergies fetch error for updates:`, allergiesError);
        console.error(`❌ [${cardCode}] Error details:`, JSON.stringify(allergiesError, null, 2));
      } else {
        console.log(`✅ [${cardCode}] Found ${allergiesData?.length || 0} allergies for updates`);
      }

      // Group allergies by update_id
      const allergiesByUpdateId = new Map<string, any[]>();
      (allergiesData || []).forEach(allergy => {
        const updateId = allergy.update_id;
        if (!allergiesByUpdateId.has(updateId)) {
          allergiesByUpdateId.set(updateId, []);
        }
        allergiesByUpdateId.get(updateId)!.push(allergy);
      });

      console.log(`🔍 [${cardCode}] Allergies grouped by update_id:`, 
        Array.from(allergiesByUpdateId.entries()).map(([id, allergies]) => ({
          update_id: id,
          count: allergies.length
        }))
      );

      // Map allergies to each update
      transformedUpdates = (updates || []).map(update => {
        const allergies = allergiesByUpdateId.get(update.id) || [];
        return {
          ...update,
          allergies_added: allergies,
          allergies_count: allergies.length
        };
      });
    } else {
      console.log(`⚠️ [${cardCode}] No updates found for card_id: ${card.id}`);
    }

    // DEBUG LOGGING - Chi tiết để tìm update bị thiếu
    console.log(`🔍 [${cardCode}] Raw updates from DB: ${updates?.length || 0}`);
    console.log(`🔍 [${cardCode}] Transformed updates: ${transformedUpdates?.length || 0}`);
    
    if (updates && updates.length > 0) {
      console.log(`📋 [${cardCode}] All updates (raw):`, updates.map(u => ({
        id: u.id,
        type: u.update_type,
        by: u.updated_by_name,
        org: u.updated_by_organization,
        facility: u.facility_name,
        date: u.created_at,
        card_id: u.card_id
      })));
      
      console.log(`📋 [${cardCode}] Transformed updates with allergies:`, transformedUpdates.map(u => ({
        id: u.id,
        type: u.update_type,
        by: u.updated_by_name,
        date: u.created_at,
        allergies_count: u.allergies_count || 0,
        allergies_added_ids: u.allergies_added?.map((a: any) => a.id) || []
      })));
    } else {
      console.log(`⚠️ [${cardCode}] WARNING: No updates found in database for card_id: ${card.id}`);
    }
    
    console.log(`✅ [${cardCode}] Final counts - Allergies: ${sortedAllergies.length}, Updates: ${transformedUpdates.length}`);
    console.log(`✅ [${cardCode}] Response will include ${transformedUpdates.length} updates`);

    // Return card with allergies and updates (public safe data only)
    const responseData = {
      success: true,
      card: {
        ...card,
        allergies: sortedAllergies // Use sorted allergies
      },
      updates: transformedUpdates,
      total_updates: transformedUpdates.length,
      warning
    };
    
    // Final verification log
    console.log(`✅ [${cardCode}] Response data summary:`, {
      card_id: card.id,
      allergies_count: sortedAllergies.length,
      updates_count: transformedUpdates.length,
      updates_ids: transformedUpdates.map(u => u.id)
    });
    
    const response = NextResponse.json(responseData);

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

