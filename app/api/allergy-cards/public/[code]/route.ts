// =====================================================
// PUBLIC ALLERGY CARD LOOKUP API
// API cong khai de tra cuu the di ung bang ma the
// KHONG CAN AUTHENTICATION - cho phep quet QR cong khai
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

/**
 * GET /api/allergy-cards/public/[code]
 * Public endpoint to lookup allergy card by card code
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  void request;

  try {
    const cardCode = params.code;

    if (!cardCode || !/^AC-\d{4}-\d{6}$/.test(cardCode)) {
      return NextResponse.json(
        {
          error: 'Mã thẻ không hợp lệ. Định dạng đúng: AC-YYYY-XXXXXX',
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: card, error: cardError } = await supabase
      .from('allergy_cards_with_details')
      .select('*')
      .eq('card_code', cardCode)
      .maybeSingle();

    if (cardError) {
      console.error('Database error:', cardError);
      return NextResponse.json(
        { error: 'Lỗi khi tra cứu thẻ dị ứng' },
        { status: 500 }
      );
    }

    if (!card) {
      return NextResponse.json(
        {
          error: 'Không tìm thấy thẻ dị ứng với mã này',
          message: 'Vui lòng kiểm tra lại mã thẻ hoặc liên hệ bác sĩ điều trị',
        },
        { status: 404 }
      );
    }

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

    const sortedAllergies = ((card.allergies || []) as any[]).sort((a, b) => {
      const severityOrder: Record<string, number> = {
        life_threatening: 1,
        severe: 2,
        moderate: 3,
        mild: 4,
      };
      const orderA = severityOrder[a.severity_level] || 99;
      const orderB = severityOrder[b.severity_level] || 99;
      return orderA - orderB;
    });

    const { data: updates, error: updatesError } = await supabase
      .from('allergy_card_updates')
      .select('*')
      .eq('card_id', card.id)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (updatesError) {
      console.error('Allergy card updates fetch error:', updatesError);
    }

    let transformedUpdates: any[] = [];
    if (updates && updates.length > 0) {
      const updateIds = updates.map((update) => update.id);
      const { data: allergiesData, error: allergiesError } = await supabase
        .from('update_allergies')
        .select('*')
        .in('update_id', updateIds)
        .order('severity_level', { ascending: false, nullsFirst: false })
        .limit(1000);

      if (allergiesError) {
        console.error('Allergy update details fetch error:', allergiesError);
      }

      const allergiesByUpdateId = new Map<string, any[]>();
      for (const allergy of allergiesData || []) {
        const updateId = allergy.update_id;
        if (!allergiesByUpdateId.has(updateId)) {
          allergiesByUpdateId.set(updateId, []);
        }
        allergiesByUpdateId.get(updateId)!.push(allergy);
      }

      transformedUpdates = updates.map((update) => {
        const allergies = allergiesByUpdateId.get(update.id) || [];
        return {
          ...update,
          allergies_added: allergies,
          allergies_count: allergies.length,
        };
      });
    }

    const responseData = {
      success: true,
      card: {
        ...card,
        allergies: sortedAllergies,
      },
      updates: transformedUpdates,
      total_updates: transformedUpdates.length,
      warning,
    };

    const response = NextResponse.json(responseData);
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    response.headers.set('CDN-Cache-Control', 'no-store');
    response.headers.set('Vercel-CDN-Cache-Control', 'no-store');

    return response;
  } catch (error) {
    console.error('Public card lookup error:', error);
    return NextResponse.json(
      {
        error: 'Lỗi server',
        message: 'Vui lòng thử lại sau',
      },
      { status: 500 }
    );
  }
}
