import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { notifyAllUsersAboutNewReport } from '@/lib/notification-service'
import {
  createReportWithUniqueCode,
  ReportCodeError,
} from '@/lib/report-code'

/**
 * POST /api/public/reports
 * Public API - tạo báo cáo không cần authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const requiredFields = [
      'organization',
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
      'report_date',
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Thiếu trường bắt buộc: ${field}` },
          { status: 400 }
        )
      }
    }

    if (!body.suspected_drugs || body.suspected_drugs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Phải có ít nhất một thuốc nghi ngờ' },
        { status: 400 }
      )
    }

    const { data: reportData, error: reportError } =
      await createReportWithUniqueCode(supabaseAdmin, {
        organization: body.organization,
        values: {
          reporter_id: null,

          patient_name: body.patient_name,
          patient_birth_date: body.patient_birth_date,
          patient_age: body.patient_age,
          patient_gender: body.patient_gender,
          patient_weight: body.patient_weight || null,

          adr_occurrence_date: body.adr_occurrence_date,
          reaction_onset_time: body.reaction_onset_time || null,
          adr_description: body.adr_description,
          related_tests: body.related_tests || null,
          medical_history: body.medical_history || null,
          treatment_response: body.treatment_response || null,
          severity_level: body.severity_level,
          outcome_after_treatment: body.outcome_after_treatment,

          causality_assessment: body.causality_assessment,
          assessment_scale: body.assessment_scale,
          medical_staff_comment: body.medical_staff_comment || null,

          reporter_name: body.reporter_name,
          reporter_profession: body.reporter_profession,
          reporter_phone: body.reporter_phone || null,
          reporter_email: body.reporter_email || null,
          report_type: body.report_type,
          report_date: body.report_date,

          severity_assessment_result:
            body.severity_assessment_result || null,
          preventability_assessment_result:
            body.preventability_assessment_result || null,

          approval_status: 'pending',
        },
      })

    if (reportError || !reportData) {
      console.error('Report creation error:', reportError)
      return NextResponse.json(
        {
          success: false,
          error:
            reportError?.message ||
            'Không thể tạo báo cáo. Vui lòng thử lại.',
        },
        { status: 500 }
      )
    }

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
      reaction_improved_after_stopping:
        drug.reaction_improved_after_stopping,
      reaction_reoccurred_after_rechallenge:
        drug.reaction_reoccurred_after_rechallenge,
    }))

    const { error: drugsError } = await (supabaseAdmin
      .from('suspected_drugs') as any)
      .insert(drugsToInsert)

    if (drugsError) {
      console.error('Drugs creation error:', drugsError)

      await (supabaseAdmin
        .from('adr_reports') as any)
        .delete()
        .eq('id', reportData.id)

      return NextResponse.json(
        {
          success: false,
          error: 'Không thể tạo thông tin thuốc: ' + drugsError.message,
        },
        { status: 500 }
      )
    }

    if (body.concurrent_drugs && body.concurrent_drugs.length > 0) {
      const concurrentDrugsToInsert = body.concurrent_drugs.map(
        (drug: any) => ({
          report_id: reportData.id,
          drug_name: drug.drug_name,
          dosage_form_strength: drug.dosage_form_strength || null,
          start_date: drug.start_date || null,
          end_date: drug.end_date || null,
        })
      )

      const { error: concurrentDrugsError } = await (supabaseAdmin
        .from('concurrent_drugs') as any)
        .insert(concurrentDrugsToInsert)

      if (concurrentDrugsError) {
        console.error(
          'Concurrent drugs creation error:',
          concurrentDrugsError
        )
      }
    }

    try {
      await notifyAllUsersAboutNewReport(reportData, null)
    } catch (notificationError) {
      console.error(
        'Notification error for public report:',
        notificationError
      )
    }

    const reportResponse = {
      id: reportData.id,
      report_code: reportData.report_code,
      approval_status: reportData.approval_status,
    }

    return NextResponse.json(
      {
        success: true,
        data: reportResponse,
        report: reportResponse,
        message: 'Báo cáo đã được tiếp nhận',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof ReportCodeError
            ? error.message
            : 'Lỗi máy chủ nội bộ',
      },
      { status: error instanceof ReportCodeError ? error.status : 500 }
    )
  }
}
