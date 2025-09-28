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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
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
          { error: `Thi???u tr?????ng b???t bu???c: ${field}` },
          { status: 400 }
        )
      }
    }

    if (!body.suspected_drugs || body.suspected_drugs.length === 0) {
      return NextResponse.json(
        { error: 'Ph???i c?? ??t nh???t m???t thu???c nghi ng???' },
        { status: 400 }
      )
    }

    // Create the main ADR report
    const { data: reportData, error: reportError } = await (supabaseAdmin as any)
      .from('adr_reports')
      .insert({
        reporter_id: session.user.id,
        organization: body.organization || session.user.organization || '',
        
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
      })
      .select()
      .single()

    if (reportError) {
      console.error('Report creation error:', reportError)
      return NextResponse.json(
        { error: 'Kh??ng th??? t???o b??o c??o: ' + reportError.message },
        { status: 500 }
      )
    }

    // Create suspected drugs entries
    const drugsToInsert = body.suspected_drugs.map((drug: any) => ({
      report_id: reportData.id,
      drug_name: drug.drug_name,
      commercial_name: drug.commercial_name || null,
      dosage_form: drug.dosage_form || null,
      manufacturer: drug.manufacturer || null,
      batch_number: drug.batch_number || null,
      dosage_and_frequency: drug.dosage_and_frequency || null,
      route_of_administration: drug.route_of_administration || null,
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
      console.error('Drugs creation error:', drugsError)
      // Try to delete the report if drug insertion failed
      await supabaseAdmin
        .from('adr_reports')
        .delete()
        .eq('id', reportData.id)
      
      return NextResponse.json(
        { error: 'Kh??ng th??? t???o th??ng tin thu???c: ' + drugsError.message },
        { status: 500 }
      )
    }

    // Create concurrent drugs entries (optional)
    if (body.concurrent_drugs && body.concurrent_drugs.length > 0) {
      const concurrentDrugsToInsert = body.concurrent_drugs.map((drug: any) => ({
        report_id: reportData.id,
        drug_name: drug.drug_name,
        dosage_form_strength: drug.dosage_form_strength || null,
        start_date: drug.start_date || null,
        end_date: drug.end_date || null,
      }))

      const { error: concurrentDrugsError } = await supabaseAdmin
        .from('concurrent_drugs')
        .insert(concurrentDrugsToInsert)

      if (concurrentDrugsError) {
        console.error('Concurrent drugs creation error:', concurrentDrugsError)
        // Note: We don't fail the entire request if concurrent drugs fail
        // as they are optional additional information
      }
    }

    return NextResponse.json({
      message: 'B??o c??o ADR ???? ???????c t???o th??nh c??ng',
      report: {
        id: reportData.id,
        report_code: reportData.report_code,
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'L???i m??y ch??? n???i b???' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit
    const search = searchParams.get('search')
    const severity = searchParams.get('severity')

    // Check user role first to apply proper filtering
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single<{ role: string }>()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const isAdmin = userData.role === 'admin'

    // Base query with joined data
    let query = supabaseAdmin
      .from('adr_reports')
      .select(`
        *,
        suspected_drugs(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply role-based filtering using application logic
    if (!isAdmin) {
      // Regular users only see their own reports
      query = query.eq('reporter_id', session.user.id)
    }
    // Admins see all reports (no additional filter)

    // Apply search filter
    if (search && search.trim()) {
      query = query.or(`report_code.ilike.%${search}%,patient_name.ilike.%${search}%,adr_description.ilike.%${search}%,organization.ilike.%${search}%,reporter_name.ilike.%${search}%`)
    }

    // Apply severity filter
    if (severity && severity !== '') {
      query = query.eq('severity_level', severity)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: reports, error, count } = await query

    if (error) {
      console.error('Get reports error:', error)
      return NextResponse.json(
        { error: 'Kh??ng th??? l???y danh s??ch b??o c??o: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      reports: reports || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'L???i m??y ch??? n???i b???' },
      { status: 500 }
    )
  }
}




