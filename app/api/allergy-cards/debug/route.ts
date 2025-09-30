import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/allergy-cards/debug
 * Debug endpoint to check available allergy cards data
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Please login first'
      }, { status: 401 });
    }

    const supabase = createServerClient();

    console.log('🔍 Debug: Checking allergy cards data...');

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('allergy_cards')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Count error:', countError);
    }

    // Get sample cards with detailed error info
    const { data: cards, error: cardsError } = await supabase
      .from('allergy_cards')
      .select('id, card_code, patient_name, created_at, issued_by_user_id')
      .order('created_at', { ascending: false })
      .limit(10);

    if (cardsError) {
      console.log('❌ Cards query error:', cardsError);
    }

    // Also check card_allergies table to see if there's orphaned data
    const { data: orphanedAllergies, error: orphanedError } = await supabase
      .from('card_allergies')
      .select('id, card_id, allergen_name, certainty_level')
      .limit(10);

    if (orphanedError) {
      console.log('❌ Orphaned allergies error:', orphanedError);
    }

    // Check for specific card_id from the screenshot
    const testCardIds = [
      '3c607c7a-a78f-4879-94fe-2401b23cf60d',
      '435ec6cf-5252-4863-b95e-b99bddba52d4', 
      '22c60e88-c51f-4aad-8bc0-5f8242072f9'
    ];

    const cardChecks = [];
    for (const cardId of testCardIds) {
      const { data: cardCheck, error: checkError } = await supabase
        .from('allergy_cards')
        .select('id, card_code, patient_name')
        .eq('id', cardId)
        .maybeSingle();

      cardChecks.push({
        card_id: cardId,
        exists_in_allergy_cards: !!cardCheck,
        error: checkError?.message,
        card_data: cardCheck
      });
    }

    // Get user info
    const userEmail = session.user?.email;
    const { data: currentUser } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', userEmail)
      .single();

    console.log('✅ Debug results:');
    console.log('   Total cards:', totalCount);
    console.log('   User:', userEmail);
    console.log('   Cards found:', cards?.length || 0);

    return NextResponse.json({
      debug_info: {
        total_cards: totalCount || 0,
        cards_found: cards?.length || 0,
        user_email: userEmail,
        user_id: currentUser?.id,
        user_role: currentUser?.role,
        cards_error: cardsError?.message,
        count_error: countError?.message
      },
      allergy_cards: cards || [],
      orphaned_card_allergies: orphanedAllergies || [],
      card_existence_checks: cardChecks,
      diagnosis: {
        likely_issue: totalCount === 0 
          ? 'allergy_cards table is empty but card_allergies has data'
          : 'Cards exist but may have RLS/permission issues',
        recommendation: totalCount === 0 
          ? 'Need to create allergy_cards records that match the card_allergies data'
          : 'Check RLS policies and user permissions'
      },
      message: totalCount === 0 
        ? '🚨 FOUND THE ISSUE: allergy_cards table is empty but card_allergies has orphaned data!' 
        : `✅ Found ${totalCount} cards. Should work for printing.`,
      next_steps: totalCount === 0 ? [
        '1. The card_allergies table has data but allergy_cards is empty',
        '2. This creates orphaned foreign key references',
        '3. You need to either:',
        '   a) Create matching allergy_cards records, OR',
        '   b) Create new cards via UI at /allergy-cards',
        '4. Then test printing again'
      ] : [
        '1. Cards exist in database',
        '2. Try printing with IDs below',
        '3. If still fails, check RLS policies'
      ],
      test_urls: cardChecks.map(check => ({
        card_id: check.card_id,
        exists: check.exists_in_allergy_cards,
        test_url: check.exists_in_allergy_cards 
          ? `/api/allergy-cards/${check.card_id}/print-view`
          : 'Card does not exist in allergy_cards table'
      }))
    });

  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    
    return NextResponse.json({
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
