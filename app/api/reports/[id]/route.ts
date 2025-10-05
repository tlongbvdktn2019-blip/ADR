import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import { Database } from '@/types/supabase'

// Create Supabase admin client
const supabaseAdmin = createClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey
)

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const reportId = params.id

    // Get the report with suspected drugs and concurrent drugs
    let query = supabaseAdmin
      .from('adr_reports')
      .select(`
        *,
        suspected_drugs(*),
        concurrent_drugs(*)
      `)
      .eq('id', reportId)
      .single()

    const { data: report, error } = await query

    if (error || !report) {
      return NextResponse.json(
        { error: 'Không tìm thấy báo cáo' },
        { status: 404 }
      )
    }

    // All authenticated users can view all reports
    return NextResponse.json({ report })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy báo cáo' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const reportId = params.id
    const body = await request.json()

    // First, check if report exists and user has permission
    const { data: existingReport, error: fetchError } = await supabaseAdmin
      .from('adr_reports')
      .select('id, reporter_id')
      .eq('id', reportId)
      .single()

    if (fetchError || !existingReport) {
      return NextResponse.json(
        { error: 'Không tìm thấy báo cáo' },
        { status: 404 }
      )
    }

    // All authenticated users can edit all reports
    
    // Validate required fields
    const requiredFields = [
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
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Thiếu trường bắt buộc: ${field}` },
          { status: 400 }
        )
      }
    }

    if (!body.suspected_drugs || body.suspected_drugs.length === 0) {
      return NextResponse.json(
        { error: 'Phải có ít nhất một thuốc nghi ngờ' },
        { status: 400 }
      )
    }

    // Start transaction by updating the main report
    const { data: reportData, error: reportError } = await (supabaseAdmin as any)
      .from('adr_reports')
      .update({
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
        
        // Update timestamp
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single()

    if (reportError) {
      console.error('Report update error:', reportError)
      return NextResponse.json(
        { error: 'Không thể cập nhật báo cáo: ' + reportError.message },
        { status: 500 }
      )
    }

    // Delete existing suspected drugs
    const { error: deleteError } = await supabaseAdmin
      .from('suspected_drugs')
      .delete()
      .eq('report_id', reportId)

    if (deleteError) {
      console.error('Delete drugs error:', deleteError)
      return NextResponse.json(
        { error: 'Không thể xóa thông tin thuốc cũ: ' + deleteError.message },
        { status: 500 }
      )
    }

    // Insert new suspected drugs
    const drugsToInsert = body.suspected_drugs.map((drug: any) => ({
      report_id: reportId,
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
    }))

    const { error: drugsError } = await supabaseAdmin
      .from('suspected_drugs')
      .insert(drugsToInsert)

    if (drugsError) {
      console.error('Drugs update error:', drugsError)
      return NextResponse.json(
        { error: 'Không thể cập nhật thông tin thuốc: ' + drugsError.message },
        { status: 500 }
      )
    }

    // Update concurrent drugs: Delete old ones and insert new ones
    if (body.concurrent_drugs !== undefined) {
      // Delete existing concurrent drugs
      const { error: deleteConcurrentError } = await supabaseAdmin
        .from('concurrent_drugs')
        .delete()
        .eq('report_id', reportId)

      if (deleteConcurrentError) {
        console.error('Delete concurrent drugs error:', deleteConcurrentError)
        // Don't fail the entire request, just log the error
      }

      // Insert new concurrent drugs if provided
      if (body.concurrent_drugs.length > 0) {
        const concurrentDrugsToInsert = body.concurrent_drugs.map((drug: any) => ({
          report_id: reportId,
          drug_name: drug.drug_name,
          dosage_form_strength: drug.dosage_form_strength || null,
          start_date: drug.start_date || null,
          end_date: drug.end_date || null,
        }))

        const { error: concurrentDrugsError } = await supabaseAdmin
          .from('concurrent_drugs')
          .insert(concurrentDrugsToInsert)

        if (concurrentDrugsError) {
          console.error('Concurrent drugs update error:', concurrentDrugsError)
          // Don't fail the entire request, just log the error
        }
      }
    }

    return NextResponse.json({
      message: 'Báo cáo ADR đã được cập nhật thành công',
      report: {
        id: reportData.id,
        report_code: reportData.report_code,
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật báo cáo' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admin can delete reports
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Chỉ admin mới có quyền xóa báo cáo' },
        { status: 403 }
      )
    }

    const reportId = params.id

    // Check if report exists
    const { data: existingReport, error: fetchError } = await supabaseAdmin
      .from('adr_reports')
      .select('id, report_code')
      .eq('id', reportId)
      .single() as { data: { id: string; report_code: string } | null; error: any }

    if (fetchError || !existingReport) {
      return NextResponse.json(
        { error: 'Không tìm thấy báo cáo' },
        { status: 404 }
      )
    }

    // Delete related suspected drugs first (cascade delete)
    const { error: deleteDrugsError } = await supabaseAdmin
      .from('suspected_drugs')
      .delete()
      .eq('report_id', reportId)

    if (deleteDrugsError) {
      console.error('Delete suspected drugs error:', deleteDrugsError)
      // Continue even if this fails - foreign key constraints should handle it
    }

    // Delete related concurrent drugs
    const { error: deleteConcurrentError } = await supabaseAdmin
      .from('concurrent_drugs')
      .delete()
      .eq('report_id', reportId)

    if (deleteConcurrentError) {
      console.error('Delete concurrent drugs error:', deleteConcurrentError)
      // Continue even if this fails
    }

    // Delete the report
    const { error: deleteReportError } = await supabaseAdmin
      .from('adr_reports')
      .delete()
      .eq('id', reportId)

    if (deleteReportError) {
      console.error('Delete report error:', deleteReportError)
      return NextResponse.json(
        { error: 'Không thể xóa báo cáo: ' + deleteReportError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Báo cáo ${existingReport.report_code} đã được xóa thành công`
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa báo cáo' },
      { status: 500 }
    )
  }
}
