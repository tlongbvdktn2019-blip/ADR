// =====================================================
// ALLERGY CARDS API
// Main API endpoints for allergy card management
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { createServerClient, createAdminClient } from '@/lib/supabase';
import { QRDriveService } from '@/lib/qr-drive-service';
import { QRCardService } from '@/lib/qr-card-service';
import { 
  AllergyCard, 
  AllergyCardFormData, 
  AllergyCardListResponse, 
  AllergyCardFilters
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

// Helper function to safely get user data
async function getUserData(userId: string): Promise<any | null> {
  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from('users')
      .select('organization, role, name, email')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error getting user data:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception getting user data:', error);
    return null;
  }
}

/**
 * GET /api/allergy-cards
 * List allergy cards with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();
    const adminSupabase = createAdminClient(); // For bypassing RLS when needed

    const { searchParams } = new URL(request.url);
    const filters: AllergyCardFilters = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') as any || undefined,
      hospital: searchParams.get('hospital') || undefined,
      doctor: searchParams.get('doctor') || undefined,
      severity_level: searchParams.get('severity_level') as any || undefined,
      issued_from: searchParams.get('issued_from') || undefined,
      issued_to: searchParams.get('issued_to') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10')
    };

    // Build query based on user role using admin client
    let query = adminSupabase
      .from('allergy_cards_with_details')
      .select('*', { count: 'exact' });

    // Apply role-based filtering using helper function
    const userRole = await getUserRole(session.user.id);
    const isAdmin = userRole === 'admin';
    if (!isAdmin) {
      query = query.eq('issued_by_user_id', session.user.id);
    }

    // Apply search filters
    if (filters.search) {
      query = query.or(`patient_name.ilike.%${filters.search}%,card_code.ilike.%${filters.search}%,hospital_name.ilike.%${filters.search}%`);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.hospital) {
      query = query.ilike('hospital_name', `%${filters.hospital}%`);
    }

    if (filters.doctor) {
      query = query.ilike('doctor_name', `%${filters.doctor}%`);
    }

    if (filters.issued_from) {
      query = query.gte('issued_date', filters.issued_from);
    }

    if (filters.issued_to) {
      query = query.lte('issued_date', filters.issued_to);
    }

    // Apply pagination
    const from = ((filters.page || 1) - 1) * (filters.limit || 10);
    const to = from + (filters.limit || 10) - 1;
    
    query = query
      .range(from, to)
      .order('created_at', { ascending: false });

    const { data: cards, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Lỗi truy vấn dữ liệu' }, { status: 500 });
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / (filters.limit || 10));
    const currentPage = filters.page || 1;

    const response: AllergyCardListResponse = {
      cards: cards || [],
      pagination: {
        page: currentPage,
        limit: filters.limit || 10,
        total: count || 0,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

/**
 * POST /api/allergy-cards
 * Create new allergy card
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();
    const adminSupabase = createAdminClient(); // For bypassing RLS when needed
    const formData: AllergyCardFormData = await request.json();

    // Validate required fields
    if (!formData.patient_name || !formData.hospital_name || !formData.doctor_name) {
      return NextResponse.json({ 
        error: 'Thiếu thông tin bắt buộc: tên bệnh nhân, bệnh viện, bác sĩ' 
      }, { status: 400 });
    }

    if (!formData.allergies || formData.allergies.length === 0) {
      return NextResponse.json({ 
        error: 'Phải có ít nhất một dị ứng' 
      }, { status: 400 });
    }

    // Get user data using helper function
    const userData = await getUserData(session.user.id);

    // Create allergy card record
    const cardData = {
      patient_name: formData.patient_name,
      patient_gender: formData.patient_gender,
      patient_age: formData.patient_age,
      patient_id_number: formData.patient_id_number,
      hospital_name: formData.hospital_name,
      department: formData.department,
      doctor_name: formData.doctor_name,
      doctor_phone: formData.doctor_phone,
      issued_date: formData.issued_date || new Date().toISOString().split('T')[0],
      expiry_date: formData.expiry_date && formData.expiry_date.trim() !== '' ? formData.expiry_date : null,
      issued_by_user_id: session.user.id,
      organization: userData?.organization || formData.hospital_name,
      notes: formData.notes,
      report_id: formData.report_id,
      google_drive_url: formData.google_drive_url,
      status: 'active' as const
    };

    // Insert main card record using admin client to bypass RLS
    const { data: cardResult, error: cardError } = await adminSupabase
      .from('allergy_cards')
      .insert(cardData)
      .select()
      .single();

    if (cardError) {
      console.error('Card creation error:', cardError);
      return NextResponse.json({ error: 'Không thể tạo thẻ dị ứng' }, { status: 500 });
    }

    // Insert allergies
    const allergiesData = formData.allergies.map(allergy => ({
      card_id: cardResult.id,
      allergen_name: allergy.allergen_name,
      certainty_level: allergy.certainty_level,
      clinical_manifestation: allergy.clinical_manifestation,
      severity_level: allergy.severity_level,
      reaction_type: allergy.reaction_type
    }));

    const { error: allergiesError } = await adminSupabase
      .from('card_allergies')
      .insert(allergiesData);

    if (allergiesError) {
      console.error('Allergies creation error:', allergiesError);
      // Rollback card creation
      await adminSupabase.from('allergy_cards').delete().eq('id', cardResult.id);
      return NextResponse.json({ error: 'Không thể lưu thông tin dị ứng' }, { status: 500 });
    }

    // Fetch complete card with allergies
    const { data: completeCard } = await adminSupabase
      .from('allergy_cards_with_details')
      .select('*')
      .eq('id', cardResult.id)
      .single();

    if (!completeCard) {
      return NextResponse.json({ error: 'Không thể lấy thông tin thẻ vừa tạo' }, { status: 500 });
    }

    // Fetch suspected drugs if card is linked to an ADR report
    let suspectedDrugs = [];
    if (completeCard.report_id) {
      const { data: drugs } = await adminSupabase
        .from('suspected_drugs')
        .select('*')
        .eq('report_id', completeCard.report_id);
      
      suspectedDrugs = drugs || [];
    }

    // Add suspected drugs to card data
    completeCard.suspected_drugs = suspectedDrugs;

    // Generate QR code for the card (always generate for every card)
    // QR chứa URL CÔNG KHAI để bất kỳ ai quét cũng có thể xem thông tin
    let qrCodeUrl = null;
    let qrCodeData = null;
    
    try {
      // Generate QR code containing PUBLIC URL
      // Ví dụ QR sẽ chứa: "https://domain.com/allergy-cards/public/AC-2024-000001"
      // Khi quét bằng bất kỳ app QR nào, sẽ mở trang public với đầy đủ thông tin
      qrCodeUrl = await QRCardService.generateCardQR(cardResult.card_code);
      
      // Store card code as QR data for reference
      qrCodeData = cardResult.card_code;
      
      // Update card with QR code
      await adminSupabase
        .from('allergy_cards')
        .update({ 
          qr_code_url: qrCodeUrl,
          qr_code_data: qrCodeData
        })
        .eq('id', cardResult.id);
        
      completeCard.qr_code_url = qrCodeUrl;
      completeCard.qr_code_data = qrCodeData;
    } catch (error) {
      console.error('QR generation error:', error);
      // Continue without QR if generation fails
    }

    // Additionally: Generate Google Drive QR if URL is provided
    if (formData.google_drive_url && formData.google_drive_url.trim() !== '') {
      try {
        const driveQR = await QRDriveService.generateQRFromDriveUrl(formData.google_drive_url);
        
        // Store as separate field or in notes
        await adminSupabase
          .from('allergy_cards')
          .update({ 
            google_drive_url: formData.google_drive_url,
            notes: (formData.notes || '') + `\n[QR Google Drive đã tạo]`
          })
          .eq('id', cardResult.id);
          
        completeCard.google_drive_url = formData.google_drive_url;
      } catch (error) {
        console.error('Drive QR generation error:', error);
        // Continue without Drive QR if generation fails
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      card: completeCard,
      qr_code_url: qrCodeUrl
    }, { status: 201 });

  } catch (error) {
    console.error('Allergy card creation error:', error);
    return NextResponse.json({ 
      error: 'Lỗi server khi tạo thẻ dị ứng',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
