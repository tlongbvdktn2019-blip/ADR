import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendAutoReportEmail } from '@/lib/auto-email-service';
import { ADRReport } from '@/types/report';

/**
 * POST /api/public/reports
 * Public API - Tạo báo cáo KHÔNG CẦN authentication
 * Dùng cho báo cáo từ người dùng chưa đăng nhập
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'organization',
      'report_code',
      'patient_name',
      'patient_birth_date',
      'patient_age',
      'patient_gender',
      'adr_occurrence_date',
      'adr_description',
      'severity_level',
      'outcome_after_treatment',
      'causality_assessment',
      'assessment_scale',
      'reporter_name',
      'reporter_profession',
      'report_type',
      'report_date'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Thiếu trường bắt buộc: ${field}` },
          { status: 400 }
        );
      }
    }

    if (!body.suspected_drugs || body.suspected_drugs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Phải có ít nhất một thuốc nghi ngờ' },
        { status: 400 }
      );
    }

    // Create the main ADR report (WITHOUT reporter_id since not logged in)
    // @ts-ignore
    const { data: reportData, error: reportError } = await (supabaseAdmin
      .from('adr_reports') as any)
      .insert({
        // NO reporter_id for public reports
        reporter_id: null,
        organization: body.organization,
        report_code: body.report_code,
        
        // Patient info
        patient_name: body.patient_name,
        patient_birth_date: body.patient_birth_date,
        patient_age: body.patient_age,
        patient_gender: body.patient_gender,
        patient_weight: body.patient_weight || null,
        
        // ADR info
        adr_occurrence_date: body.adr_occurrence_date,
        reaction_onset_time: body.reaction_onset_time || null,
        adr_description: body.adr_description,
        related_tests: body.related_tests || null,
        medical_history: body.medical_history || null,
        treatment_response: body.treatment_response || null,
        severity_level: body.severity_level,
        outcome_after_treatment: body.outcome_after_treatment,
        
        // Assessment
        causality_assessment: body.causality_assessment,
        assessment_scale: body.assessment_scale,
        medical_staff_comment: body.medical_staff_comment || null,
        
        // Reporter info
        reporter_name: body.reporter_name,
        reporter_profession: body.reporter_profession,
        reporter_phone: body.reporter_phone || null,
        reporter_email: body.reporter_email || null,
        report_type: body.report_type,
        report_date: body.report_date,
        
        // Assessment results
        severity_assessment_result: body.severity_assessment_result || null,
        preventability_assessment_result: body.preventability_assessment_result || null,
        
        // Default to pending approval
        approval_status: 'pending'
      })
      .select()
      .single();

    if (reportError) {
      console.error('Report creation error:', reportError);
      return NextResponse.json(
        { success: false, error: 'Không thể tạo báo cáo: ' + reportError.message },
        { status: 500 }
      );
    }

    // Create suspected drugs entries
    console.log('=== DEBUG PUBLIC REPORT: Suspected drugs from request ===')
    console.log('First drug:', JSON.stringify(body.suspected_drugs[0], null, 2))
    
    const drugsToInsert = body.suspected_drugs.map((drug: any) => ({
      report_id: reportData.id,
      drug_name: drug.drug_name,
      commercial_name: drug.commercial_name || null,
      dosage_form: drug.dosage_form || null,
      manufacturer: drug.manufacturer || null,
      batch_number: drug.batch_number || null,
      dosage_and_frequency: drug.dosage_and_frequency || null,
      dosage: drug.dosage || null,
      frequency: drug.frequency || null,
      route_of_administration: drug.route_of_administration || null,
      treatment_drug_group: drug.treatment_drug_group || null,
      start_date: drug.start_date || null,
      end_date: drug.end_date || null,
      indication: drug.indication || null,
      reaction_improved_after_stopping: drug.reaction_improved_after_stopping,
      reaction_reoccurred_after_rechallenge: drug.reaction_reoccurred_after_rechallenge,
    }));
    
    console.log('=== DEBUG PUBLIC REPORT: Data to insert ===')
    console.log('First drug to insert:', JSON.stringify(drugsToInsert[0], null, 2))

    // @ts-ignore
    const { error: drugsError } = await (supabaseAdmin
      .from('suspected_drugs') as any)
      .insert(drugsToInsert);

    if (drugsError) {
      console.error('Drugs creation error:', drugsError);
      return NextResponse.json(
        { success: false, error: 'Không thể tạo thông tin thuốc: ' + drugsError.message },
        { status: 500 }
      );
    }

    // Create concurrent drugs entries (optional)
    if (body.concurrent_drugs && body.concurrent_drugs.length > 0) {
      const concurrentDrugsToInsert = body.concurrent_drugs.map((drug: any) => ({
        report_id: reportData.id,
        drug_name: drug.drug_name,
        dosage_form_strength: drug.dosage_form_strength || null,
        start_date: drug.start_date || null,
        end_date: drug.end_date || null,
      }));

      // @ts-ignore
      const { error: concurrentDrugsError } = await (supabaseAdmin
        .from('concurrent_drugs') as any)
        .insert(concurrentDrugsToInsert);

      if (concurrentDrugsError) {
        console.error('Concurrent drugs creation error:', concurrentDrugsError);
        // Don't fail the entire request
      }
    }

    // =====================================================
    // AUTO-SEND EMAIL NOTIFICATION - DISABLED
    // =====================================================
    // Tính năng tự động gửi email đã được TẮT
    // Để BẬT LẠI: Bỏ comment (/* */) ở đoạn code bên dưới
    
    /* DISABLED - Remove this comment block to enable auto-email
    try {
      // Fetch complete report with suspected drugs for email
      const { data: completeReport } = await (supabaseAdmin
        .from('adr_reports') as any)
        .select(`
          *,
          suspected_drugs(*)
        `)
        .eq('id', reportData.id)
        .single();

      if (completeReport) {
        // Send auto email asynchronously
        sendAutoReportEmail(completeReport as ADRReport, {
          includeReporter: true, // Gửi cho người báo cáo
          includeOrganization: true // Gửi cho tổ chức
        }).then(result => {
          if (result.success) {
            console.log(`📧 Auto email sent for public report ${reportData.report_code}:`, {
              sentTo: result.sentTo
            });
          } else {
            console.warn(`⚠️ Auto email failed for public report ${reportData.report_code}:`, {
              failures: result.failures
            });
          }
        }).catch(err => {
          console.error(`❌ Auto email error for public report ${reportData.report_code}:`, err);
        });
      }
    } catch (emailError) {
      // Log error but don't fail the request
      console.error('Auto email sending error (public report):', emailError);
    }
    */
    
    console.log(`✅ Public report created: ${reportData.report_code} (Auto-email: DISABLED)`)

    return NextResponse.json({
      success: true,
      message: 'Báo cáo ADR đã được gửi thành công',
      report: {
        id: reportData.id,
        report_code: reportData.report_code,
      }
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi máy chủ nội bộ' },
      { status: 500 }
    );
  }
}



