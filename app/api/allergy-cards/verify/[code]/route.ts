// =====================================================
// ALLERGY CARD QR VERIFICATION API
// API endpoint for verifying QR codes and retrieving allergy information
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { QRCodeService } from '@/lib/qr-service';
import { QRCodeData, QRScanResult } from '@/types/allergy-card';

/**
 * GET /api/allergy-cards/verify/[code]
 * Verify QR code and return allergy card information
 * This endpoint is PUBLIC - no authentication required for emergency access
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = createServerClient();
    const cardCode = params.code.toUpperCase();

    // Validate card code format (AC-YYYY-XXXXXX)
    const cardCodeRegex = /^AC-\d{4}-\d{6}$/;
    if (!cardCodeRegex.test(cardCode)) {
      return NextResponse.json({
        success: false,
        error: 'Mã thẻ không đúng định dạng',
        cardFound: false
      });
    }

    // Fetch card from database
    const { data: card, error } = await supabase
      .from('allergy_cards_with_details')
      .select('*')
      .eq('card_code', cardCode)
      .eq('status', 'active') // Only active cards
      .single();

    if (error || !card) {
      return NextResponse.json({
        success: false,
        error: 'Không tìm thấy thẻ dị ứng hoặc thẻ đã hết hạn',
        cardFound: false
      });
    }

    // Fetch suspected drugs if card is linked to an ADR report
    let suspectedDrugs = [];
    if (card.report_id) {
      const { data: drugs } = await supabase
        .from('suspected_drugs')
        .select('*')
        .eq('report_id', card.report_id);
      
      suspectedDrugs = drugs || [];
    }

    // Add suspected drugs to card data
    card.suspected_drugs = suspectedDrugs;

    // Check if card has expired
    if (card.expiry_date) {
      const expiryDate = new Date(card.expiry_date);
      const now = new Date();
      if (now > expiryDate) {
        return NextResponse.json({
          success: false,
          error: 'Thẻ dị ứng đã hết hạn',
          cardFound: true,
          expiryDate: card.expiry_date
        });
      }
    }

    // Create QR data for response
    const baseUrl = request.nextUrl.origin;
    const qrData: QRCodeData = QRCodeService.createQRData(card, baseUrl);

    // Create emergency text for quick display
    const emergencyText = QRCodeService.createEmergencyText(qrData);

    // Return card information
    return NextResponse.json({
      success: true,
      cardFound: true,
      data: qrData,
      emergencyText,
      card: {
        id: card.id,
        card_code: card.card_code,
        patient_name: card.patient_name,
        patient_age: card.patient_age,
        patient_gender: card.patient_gender,
        hospital_name: card.hospital_name,
        doctor_name: card.doctor_name,
        doctor_phone: card.doctor_phone,
        issued_date: card.issued_date,
        expiry_date: card.expiry_date,
        allergies: card.allergies || []
      }
    });

  } catch (error) {
    console.error('QR verification error:', error);
    return NextResponse.json({
      success: false,
      error: 'Lỗi server khi xác thực mã QR',
      cardFound: false
    }, { status: 500 });
  }
}

/**
 * POST /api/allergy-cards/verify/[code]  
 * Verify QR data payload and return parsed information
 * This is for when the full QR data is scanned and sent as payload
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const body = await request.json();
    const { qrData } = body;

    if (!qrData) {
      return NextResponse.json({
        success: false,
        error: 'Thiếu dữ liệu QR',
        cardFound: false
      }, { status: 400 });
    }

    // Parse QR data
    const parsedResult: QRScanResult = QRCodeService.parseQRData(qrData);

    if (!parsedResult.success || !parsedResult.data) {
      return NextResponse.json(parsedResult);
    }

    // Verify that the card exists in database
    const supabase = createServerClient();
    const cardCode = parsedResult.data.cardCode;
    const { data: card, error } = await supabase
      .from('allergy_cards')
      .select('id, status, expiry_date')
      .eq('card_code', cardCode)
      .single();

    if (error || !card) {
      return NextResponse.json({
        success: false,
        error: 'Thẻ không tồn tại trong hệ thống',
        cardFound: false
      });
    }

    if (card.status !== 'active') {
      return NextResponse.json({
        success: false,
        error: 'Thẻ đã bị vô hiệu hóa',
        cardFound: true
      });
    }

    // Check expiry
    if (card.expiry_date) {
      const expiryDate = new Date(card.expiry_date);
      const now = new Date();
      if (now > expiryDate) {
        return NextResponse.json({
          success: false,
          error: 'Thẻ đã hết hạn',
          cardFound: true,
          expiryDate: card.expiry_date
        });
      }
    }

    // Create emergency text
    const emergencyText = QRCodeService.createEmergencyText(parsedResult.data);

    return NextResponse.json({
      success: true,
      cardFound: true,
      data: parsedResult.data,
      emergencyText,
      verified: true
    });

  } catch (error) {
    console.error('QR data verification error:', error);
    return NextResponse.json({
      success: false,
      error: 'Lỗi server khi xác thực dữ liệu QR',
      cardFound: false
    }, { status: 500 });
  }
}
