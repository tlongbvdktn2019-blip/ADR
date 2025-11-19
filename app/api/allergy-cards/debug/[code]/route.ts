// =====================================================
// DEBUG API - Kiểm tra updates trong database
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const cardCode = params.code;
    const supabase = createAdminClient();

    // Validate card code format
    if (!cardCode || !/^AC-\d{4}-\d{6}$/.test(cardCode)) {
      return NextResponse.json({ 
        error: 'Mã thẻ không hợp lệ' 
      }, { status: 400 });
    }

    // 1. Tìm card bằng card_code
    const { data: card, error: cardError } = await supabase
      .from('allergy_cards')
      .select('id, card_code, patient_name')
      .eq('card_code', cardCode)
      .maybeSingle();

    if (cardError || !card) {
      return NextResponse.json({ 
        error: 'Không tìm thấy thẻ dị ứng' 
      }, { status: 404 });
    }

    // 2. Count tổng số updates
    const { count: totalCount, error: countError } = await supabase
      .from('allergy_card_updates')
      .select('*', { count: 'exact', head: true })
      .eq('card_id', card.id);

    // 3. Query tất cả updates
    const { data: allUpdates, error: updatesError } = await supabase
      .from('allergy_card_updates')
      .select('*')
      .eq('card_id', card.id)
      .order('created_at', { ascending: false });

    // 4. Query updates với limit 1000 (như API public)
    const { data: limitedUpdates, count: limitedCount, error: limitedError } = await supabase
      .from('allergy_card_updates')
      .select('*', { count: 'exact' })
      .eq('card_id', card.id)
      .order('created_at', { ascending: false })
      .limit(1000);

    // 5. Kiểm tra RLS policies (skip if function doesn't exist)
    let rlsCheck = null;
    try {
      const { data } = await supabase.rpc('check_rls_policies', {});
      rlsCheck = data;
    } catch (error) {
      // RPC function might not exist, skip
    }

    // 6. Query từng update riêng biệt để kiểm tra
    let individualUpdates: any[] = [];
    if (allUpdates && allUpdates.length > 0) {
      for (const update of allUpdates) {
        const { data: singleUpdate, error: singleError } = await supabase
          .from('allergy_card_updates')
          .select('*')
          .eq('id', update.id)
          .single();
        
        individualUpdates.push({
          found: !!singleUpdate,
          error: singleError,
          update_id: update.id
        });
      }
    }

    return NextResponse.json({
      debug: true,
      card: {
        id: card.id,
        card_code: card.card_code,
        patient_name: card.patient_name
      },
      stats: {
        total_count_query: totalCount,
        all_updates_count: allUpdates?.length || 0,
        limited_updates_count: limitedUpdates?.length || 0,
        limited_count_value: limitedCount
      },
      errors: {
        count_error: countError,
        updates_error: updatesError,
        limited_error: limitedError
      },
      all_updates: allUpdates?.map(u => ({
        id: u.id,
        card_id: u.card_id,
        update_type: u.update_type,
        updated_by_name: u.updated_by_name,
        facility_name: u.facility_name,
        created_at: u.created_at,
        is_verified: u.is_verified
      })) || [],
      limited_updates: limitedUpdates?.map(u => ({
        id: u.id,
        card_id: u.card_id,
        update_type: u.update_type,
        updated_by_name: u.updated_by_name,
        facility_name: u.facility_name,
        created_at: u.created_at
      })) || [],
      individual_checks: individualUpdates
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ 
      error: 'Lỗi server',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

