import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createAdminClient } from '@/lib/supabase'
import { canAccessOrganization, getAllergyCardAccessContext } from '@/lib/allergy-card-access'
import {
  allergyCardError,
  clampInteger,
  mapDatabaseWorkflowError,
  parseJsonBody,
  sanitizeSearchTerm,
  UUID_PATTERN,
} from '@/lib/allergy-card-api'
import {
  AllergyCardWorkflowError,
  buildAllergyCardDraft,
  getEffectiveCardStatus,
  getTodayInHoChiMinh,
  type IssuanceReport,
} from '@/lib/allergy-card-workflow'
import type { AllergyCardCreateInput, AllergyCardStatus, SeverityLevel } from '@/types/allergy-card'

export const dynamic = 'force-dynamic'

function publicBaseUrl(request: NextRequest) {
  return (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, '')
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return allergyCardError('UNAUTHORIZED', 'Vui lòng đăng nhập', 401)

  const context = await getAllergyCardAccessContext(session.user.id)
  if (!context) return allergyCardError('USER_NOT_FOUND', 'Không tìm thấy tài khoản', 404)
  if (context.role !== 'admin' && !context.organizationId) {
    return allergyCardError('ORGANIZATION_REQUIRED', 'Tài khoản chưa được gắn đơn vị', 403)
  }

  const params = request.nextUrl.searchParams
  const page = clampInteger(params.get('page'), 1, 1, 100000)
  const limit = clampInteger(params.get('limit'), 10, 1, 50)
  const search = sanitizeSearchTerm(params.get('search'))
  const status = params.get('status') as AllergyCardStatus | null
  const severity = params.get('severity_level') as SeverityLevel | null
  const requestedOrgId = params.get('organization_id')
  if (requestedOrgId && !UUID_PATTERN.test(requestedOrgId)) {
    return allergyCardError('VALIDATION_ERROR', 'ID đơn vị không hợp lệ', 400)
  }
  const organizationId = context.role === 'admin'
    ? requestedOrgId || undefined
    : context.organizationId || undefined

  const supabase = createAdminClient()
  const matchingCardIds = new Set<string>()
  if (search) {
    const [{ data: matchingReports }, { data: matchingAllergies }] = await Promise.all([
      supabase.from('adr_reports').select('id').ilike('report_code', `%${search}%`),
      supabase.from('card_allergies').select('card_id').ilike('allergen_name', `%${search}%`),
    ])
    const reportIds = (matchingReports || []).map((row) => row.id)
    if (reportIds.length > 0) {
      const { data: reportCards } = await supabase.from('allergy_cards').select('id').in('report_id', reportIds)
      ;(reportCards || []).forEach((row) => matchingCardIds.add(row.id))
    }
    ;(matchingAllergies || []).forEach((row) => matchingCardIds.add(row.card_id))
  }

  if (severity) {
    const { data: severityRows } = await supabase.from('card_allergies').select('card_id').eq('severity_level', severity)
    const severityIds = new Set((severityRows || []).map((row) => row.card_id))
    if (matchingCardIds.size === 0 && !search) severityIds.forEach((id) => matchingCardIds.add(id))
    else for (const id of Array.from(matchingCardIds)) if (!severityIds.has(id)) matchingCardIds.delete(id)
  }

  let query = supabase
    .from('allergy_cards')
    .select('*, card_allergies(*)', { count: 'exact' })

  if (organizationId) query = query.eq('organization_id', organizationId)
  if (search) {
    const direct = `patient_name.ilike.%${search}%,card_code.ilike.%${search}%,hospital_name.ilike.%${search}%`
    query = matchingCardIds.size > 0
      ? query.or(`${direct},id.in.(${Array.from(matchingCardIds).join(',')})`)
      : query.or(direct)
  } else if (severity) {
    if (matchingCardIds.size === 0) {
      return NextResponse.json({ cards: [], pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false } })
    }
    query = query.in('id', Array.from(matchingCardIds))
  }

  const today = getTodayInHoChiMinh()
  if (status === 'active') query = query.eq('status', 'active').or(`expiry_date.is.null,expiry_date.gte.${today}`)
  else if (status === 'expired') query = query.or(`status.eq.expired,and(status.eq.active,expiry_date.lt.${today})`)
  else if (status === 'inactive') query = query.eq('status', 'inactive')

  const from = (page - 1) * limit
  const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, from + limit - 1)
  if (error) {
    console.error('Allergy-card list failed:', error)
    return allergyCardError('DATABASE_ERROR', 'Không thể tải danh sách thẻ', 500)
  }

  const reportIds = (data || []).map((card) => card.report_id).filter(Boolean) as string[]
  const cardIds = (data || []).map((card) => card.id)
  const [{ data: reports }, { data: pendingSubmissions }] = await Promise.all([
    reportIds.length
      ? supabase.from('adr_reports').select('id, report_code, updated_at').in('id', reportIds)
      : Promise.resolve({ data: [] as any[] }),
    cardIds.length
      ? supabase.from('allergy_card_update_submissions').select('card_id').in('card_id', cardIds).in('review_status', ['pending', 'partially_approved'])
      : Promise.resolve({ data: [] as any[] }),
  ])
  const reportsById = new Map((reports || []).map((report) => [report.id, report]))
  const pendingByCard = (pendingSubmissions || []).reduce((counts: Map<string, number>, item: any) => {
    counts.set(item.card_id, (counts.get(item.card_id) || 0) + 1)
    return counts
  }, new Map<string, number>())
  const baseUrl = publicBaseUrl(request)
  const cards = (data || []).map((card: any) => {
    const sourceReport = reportsById.get(card.report_id)
    return {
      ...card,
      allergies: card.card_allergies || [],
      card_allergies: undefined,
      status: getEffectiveCardStatus(card.status, card.expiry_date, today),
      report_code: sourceReport?.report_code,
      report_updated_at: sourceReport?.updated_at,
      source_changed: Boolean(sourceReport?.updated_at && card.source_report_updated_at && sourceReport.updated_at !== card.source_report_updated_at),
      pending_updates_count: pendingByCard.get(card.id) || 0,
      public_url: card.public_token ? `${baseUrl}/allergy-cards/view/${card.public_token}` : undefined,
    }
  })
  const total = count || 0

  return NextResponse.json({
    cards,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return allergyCardError('UNAUTHORIZED', 'Vui lòng đăng nhập', 401)

  const input = await parseJsonBody<AllergyCardCreateInput>(request)
  if (!input || !UUID_PATTERN.test(input.report_id || '') || !input.report_updated_at) {
    return allergyCardError('VALIDATION_ERROR', 'Báo cáo hoặc phiên bản dữ liệu không hợp lệ', 400)
  }

  const context = await getAllergyCardAccessContext(session.user.id)
  if (!context) return allergyCardError('USER_NOT_FOUND', 'Không tìm thấy tài khoản', 404)

  const supabase = createAdminClient()
  const { data: report, error: reportError } = await supabase.from('adr_reports').select(`
    id, report_code, organization, organization_id,
    patient_name, patient_age, patient_gender,
    adr_description, severity_level, causality_assessment,
    reporter_name, reporter_profession, reporter_phone, updated_at,
    suspected_drugs(id, drug_name)
  `).eq('id', input.report_id).maybeSingle()

  if (reportError || !report) return allergyCardError('NOT_FOUND', 'Không tìm thấy báo cáo', 404)
  if (!canAccessOrganization(context, (report as any).organization_id)) {
    return allergyCardError('FORBIDDEN', 'Bạn không có quyền cấp thẻ cho đơn vị này', 403)
  }
  if (input.report_updated_at !== (report as any).updated_at) {
    return allergyCardError('REPORT_STALE', 'Báo cáo vừa được cập nhật. Vui lòng tải lại.', 409)
  }

  try {
    const draft = buildAllergyCardDraft(report as unknown as IssuanceReport, input)
    const { data: cardId, error } = await (supabase.rpc as any)('issue_allergy_card', {
      p_report_id: report.id,
      p_issued_by: context.userId,
      p_organization_id: (report as any).organization_id,
      p_expected_report_updated_at: (report as any).updated_at,
      p_card: {
        patient_name: draft.patient_name,
        patient_gender: draft.patient_gender,
        patient_age: draft.patient_age,
        patient_id_number: draft.patient_id_number || '',
        hospital_name: draft.hospital_name,
        department: draft.department || '',
        doctor_name: draft.doctor_name,
        doctor_phone: draft.doctor_phone || '',
        doctor_source: draft.doctor_source,
        issued_date: draft.issued_date,
        expiry_date: draft.expiry_date || '',
        notes: draft.notes || '',
      },
      p_allergies: draft.allergies,
    })
    if (error || !cardId) {
      const mapped = mapDatabaseWorkflowError(error?.message)
      return allergyCardError(mapped.code, mapped.message, mapped.status)
    }

    const { data: card } = await supabase
      .from('allergy_cards')
      .select('*, card_allergies(*)')
      .eq('id', cardId)
      .single()
    return NextResponse.json({
      success: true,
      card: card ? {
        ...card,
        allergies: (card as any).card_allergies || [],
        card_allergies: undefined,
        public_url: `${publicBaseUrl(request)}/allergy-cards/view/${(card as any).public_token}`,
      } : { id: cardId },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof AllergyCardWorkflowError) {
      return allergyCardError(error.code, error.message, 400, error.fieldErrors)
    }
    console.error('Allergy-card issuance failed:', error)
    return allergyCardError('SERVER_ERROR', 'Không thể cấp thẻ. Vui lòng thử lại.', 500)
  }
}
