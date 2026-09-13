import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createAdminClient } from '@/lib/supabase'
import { canAccessOrganization, getAllergyCardAccessContext } from '@/lib/allergy-card-access'
import {
  allergyCardError,
  mapDatabaseWorkflowError,
  parseJsonBody,
  UUID_PATTERN,
} from '@/lib/allergy-card-api'
import { getEffectiveCardStatus } from '@/lib/allergy-card-workflow'

export const dynamic = 'force-dynamic'

async function getContextAndCard(userId: string, cardId: string) {
  const context = await getAllergyCardAccessContext(userId)
  if (!context) return { error: allergyCardError('USER_NOT_FOUND', 'Không tìm thấy tài khoản', 404) }

  const supabase = createAdminClient()
  const { data: card, error } = await supabase
    .from('allergy_cards')
    .select('*, card_allergies(*)')
    .eq('id', cardId)
    .maybeSingle()
  if (error || !card) return { error: allergyCardError('NOT_FOUND', 'Không tìm thấy thẻ dị ứng', 404) }
  if (!canAccessOrganization(context, (card as any).organization_id)) {
    return { error: allergyCardError('FORBIDDEN', 'Bạn không có quyền truy cập thẻ này', 403) }
  }
  return { context, card, supabase }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return allergyCardError('UNAUTHORIZED', 'Vui lòng đăng nhập', 401)
  if (!UUID_PATTERN.test(params.id)) return allergyCardError('VALIDATION_ERROR', 'ID thẻ không hợp lệ', 400)

  const result = await getContextAndCard(session.user.id, params.id)
  if (result.error) return result.error
  const { card, supabase } = result
  const { data: report } = card.report_id
    ? await supabase.from('adr_reports').select('report_code, updated_at').eq('id', card.report_id).maybeSingle()
    : { data: null }
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, '')

  return NextResponse.json({
    card: {
      ...card,
      allergies: (card as any).card_allergies || [],
      card_allergies: undefined,
      status: getEffectiveCardStatus(card.status as any, card.expiry_date),
      report_code: report?.report_code,
      report_updated_at: report?.updated_at,
      source_changed: Boolean(report?.updated_at && (card as any).source_report_updated_at && report.updated_at !== (card as any).source_report_updated_at),
      public_url: (card as any).public_token ? `${baseUrl}/allergy-cards/view/${(card as any).public_token}` : undefined,
    },
  })
}

interface CardSpecificUpdateInput {
  patient_id_number?: string
  department?: string
  doctor_name?: string
  doctor_phone?: string
  expiry_date?: string
  notes?: string
  status?: 'active' | 'inactive'
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return allergyCardError('UNAUTHORIZED', 'Vui lòng đăng nhập', 401)
  if (!UUID_PATTERN.test(params.id)) return allergyCardError('VALIDATION_ERROR', 'ID thẻ không hợp lệ', 400)
  const body = await parseJsonBody<CardSpecificUpdateInput>(request)
  if (!body) return allergyCardError('VALIDATION_ERROR', 'Dữ liệu cập nhật không hợp lệ', 400)

  const result = await getContextAndCard(session.user.id, params.id)
  if (result.error) return result.error
  const { context, card, supabase } = result
  const expiryDate = body.expiry_date?.trim() || null
  if (expiryDate && expiryDate < card.issued_date) {
    return allergyCardError('VALIDATION_ERROR', 'Ngày hết hạn không được trước ngày cấp', 400, {
      expiry_date: 'Ngày hết hạn không được trước ngày cấp',
    })
  }

  const update: Record<string, string | null> = {
    patient_id_number: body.patient_id_number?.trim() || null,
    department: body.department?.trim() || null,
    expiry_date: expiryDate,
    notes: body.notes?.trim() || null,
    status: body.status === 'inactive' ? 'inactive' : 'active',
    updated_at: new Date().toISOString(),
  }
  if (body.status) {
    if (!['active', 'inactive'].includes(body.status)) {
      return allergyCardError('VALIDATION_ERROR', 'Trạng thái thẻ không hợp lệ', 400)
    }
    update.status = body.status
  }
  if ((card as any).doctor_source === 'manual') {
    if (!body.doctor_name?.trim()) {
      return allergyCardError('VALIDATION_ERROR', 'Vui lòng nhập bác sĩ xác nhận', 400, {
        doctor_name: 'Vui lòng nhập bác sĩ xác nhận',
      })
    }
    update.doctor_name = body.doctor_name.trim()
    update.doctor_phone = body.doctor_phone?.trim() || null
  }

  const { data: updated, error } = await supabase
    .from('allergy_cards')
    .update(update)
    .eq('id', params.id)
    .select('*, card_allergies(*)')
    .single()
  if (error || !updated) {
    console.error('Allergy-card update failed:', error)
    return allergyCardError('DATABASE_ERROR', 'Không thể cập nhật thẻ', 500)
  }

  await supabase.from('allergy_card_audit_logs').insert({
    card_id: card.id,
    card_code: card.card_code,
    organization_id: (card as any).organization_id,
    action: 'updated',
    actor_user_id: context.userId,
    old_values: {
      patient_id_number: card.patient_id_number,
      department: card.department,
      doctor_name: card.doctor_name,
      doctor_phone: card.doctor_phone,
      expiry_date: card.expiry_date,
      notes: card.notes,
      status: card.status,
    },
    new_values: update,
  })

  return NextResponse.json({
    success: true,
    card: { ...updated, allergies: (updated as any).card_allergies || [], card_allergies: undefined },
  })
}

interface DeleteInput { card_code?: string; reason?: string }

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return allergyCardError('UNAUTHORIZED', 'Vui lòng đăng nhập', 401)
  if (!UUID_PATTERN.test(params.id)) return allergyCardError('VALIDATION_ERROR', 'ID thẻ không hợp lệ', 400)
  const body = await parseJsonBody<DeleteInput>(request)
  if (!body?.card_code || !body.reason) {
    return allergyCardError('VALIDATION_ERROR', 'Vui lòng nhập mã thẻ và lý do xóa', 400)
  }

  const context = await getAllergyCardAccessContext(session.user.id)
  if (!context) return allergyCardError('USER_NOT_FOUND', 'Không tìm thấy tài khoản', 404)
  const supabase = createAdminClient()
  const { error } = await (supabase.rpc as any)('delete_allergy_card', {
    p_card_id: params.id,
    p_actor_user_id: context.userId,
    p_expected_card_code: body.card_code,
    p_reason: body.reason,
  })
  if (error) {
    const mapped = mapDatabaseWorkflowError(error.message)
    return allergyCardError(mapped.code, mapped.message, mapped.status)
  }
  return NextResponse.json({ success: true, message: 'Đã xóa thẻ; báo cáo có thể được cấp lại.' })
}
