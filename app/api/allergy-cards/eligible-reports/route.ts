import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createAdminClient } from '@/lib/supabase'
import { getAllergyCardAccessContext } from '@/lib/allergy-card-access'
import { allergyCardError, clampInteger, sanitizeSearchTerm, UUID_PATTERN } from '@/lib/allergy-card-api'
import { getMissingIssuanceFields, type IssuanceReport } from '@/lib/allergy-card-workflow'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return allergyCardError('UNAUTHORIZED', 'Vui lòng đăng nhập', 401)

  const context = await getAllergyCardAccessContext(session.user.id)
  if (!context) return allergyCardError('USER_NOT_FOUND', 'Không tìm thấy tài khoản', 404)

  const params = request.nextUrl.searchParams
  const page = clampInteger(params.get('page'), 1, 1, 100000)
  const limit = clampInteger(params.get('limit'), 20, 1, 50)
  const search = sanitizeSearchTerm(params.get('search'))
  const requestedOrgId = params.get('organization_id')

  if (requestedOrgId && !UUID_PATTERN.test(requestedOrgId)) {
    return allergyCardError('VALIDATION_ERROR', 'ID đơn vị không hợp lệ', 400)
  }

  const organizationId = context.role === 'admin'
    ? requestedOrgId || undefined
    : context.organizationId || undefined
  if (!organizationId && context.role !== 'admin') {
    return allergyCardError('ORGANIZATION_REQUIRED', 'Tài khoản chưa được gắn đơn vị', 403)
  }

  const supabase = createAdminClient()
  let issuedQuery = supabase.from('allergy_cards').select('report_id').not('report_id', 'is', null)
  if (organizationId) issuedQuery = issuedQuery.eq('organization_id', organizationId)
  const { data: issuedRows, error: issuedError } = await issuedQuery
  if (issuedError) return allergyCardError('DATABASE_ERROR', 'Không thể kiểm tra thẻ đã cấp', 500)
  const issuedReportIds = (issuedRows || []).map((row) => row.report_id).filter(Boolean) as string[]

  let query = supabase
    .from('adr_reports')
    .select(`
      id, report_code, organization, organization_id,
      patient_name, patient_age, patient_gender,
      adr_description, severity_level, causality_assessment,
      reporter_name, reporter_profession, reporter_phone,
      report_date, updated_at,
      suspected_drugs(id, drug_name)
    `, { count: 'exact' })

  if (organizationId) query = query.eq('organization_id', organizationId)
  if (issuedReportIds.length > 0) query = query.not('id', 'in', `(${issuedReportIds.join(',')})`)
  if (search) query = query.or(`patient_name.ilike.%${search}%,report_code.ilike.%${search}%`)

  const from = (page - 1) * limit
  const { data, error, count } = await query
    .order('report_date', { ascending: false })
    .range(from, from + limit - 1)

  if (error) {
    console.error('Eligible reports query failed:', error)
    return allergyCardError('DATABASE_ERROR', 'Không thể tải danh sách bệnh nhân', 500)
  }

  const reports = (data || []).map((row: any) => {
    const typed = row as IssuanceReport
    return {
      id: row.id,
      report_code: row.report_code,
      patient_name: row.patient_name,
      patient_age: row.patient_age,
      patient_gender: row.patient_gender,
      organization: row.organization,
      organization_id: row.organization_id,
      report_date: row.report_date,
      suspected_drug_names: (row.suspected_drugs || []).map((drug: any) => drug.drug_name).filter(Boolean),
      missing_fields: getMissingIssuanceFields(typed),
    }
  })

  return NextResponse.json({
    reports,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  })
}
