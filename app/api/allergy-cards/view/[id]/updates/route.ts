import { createHmac } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { allergyCardError, mapDatabaseWorkflowError, parseJsonBody, UUID_PATTERN } from '@/lib/allergy-card-api'
import { normalizeAllergenName } from '@/lib/allergy-card-workflow'
import { notifyOrganizationAboutAllergyUpdate } from '@/lib/notification-service'
import { validateTurnstileToken } from '@/lib/turnstile'
import type { PublicAllergyCardUpdateInput, PublicAllergyCardUpdateItemInput } from '@/types/allergy-card'

export const dynamic = 'force-dynamic'

function clean(value: unknown, maximum = 500): string {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : ''
}

function clientIp(request: NextRequest): string {
  return clean(request.headers.get('cf-connecting-ip'), 100)
    || clean(request.headers.get('x-real-ip'), 100)
    || clean(request.headers.get('x-forwarded-for')?.split(',')[0], 100)
    || 'unknown'
}

function validateInput(input: PublicAllergyCardUpdateInput | null) {
  const errors: Record<string, string> = {}
  if (!input) return { body: null, errors: { body: 'Dữ liệu gửi lên không hợp lệ' } }

  const body = {
    updated_by_name: clean(input.updated_by_name, 255),
    updated_by_organization: clean(input.updated_by_organization, 255),
    updated_by_role: clean(input.updated_by_role, 100),
    updated_by_phone: clean(input.updated_by_phone, 20),
    updated_by_email: clean(input.updated_by_email, 255),
    facility_name: clean(input.facility_name, 255),
    facility_department: clean(input.facility_department, 255),
    reason_for_update: clean(input.reason_for_update, 2000),
    submission_notes: clean(input.submission_notes, 2000),
    turnstile_token: clean(input.turnstile_token, 2048),
    items: Array.isArray(input.items) ? input.items.slice(0, 10) : [],
  }

  if (body.updated_by_name.length < 2) errors.updated_by_name = 'Vui lòng nhập họ tên người cung cấp'
  if (body.updated_by_organization.length < 2) errors.updated_by_organization = 'Vui lòng nhập đơn vị công tác'
  if (body.updated_by_role.length < 2) errors.updated_by_role = 'Vui lòng nhập vai trò/chức danh'
  if (body.facility_name.length < 2) errors.facility_name = 'Vui lòng nhập cơ sở ghi nhận thông tin'
  if (body.reason_for_update.length < 5) errors.reason_for_update = 'Lý do phải có ít nhất 5 ký tự'
  if (body.updated_by_email && !/^\S+@\S+\.\S+$/.test(body.updated_by_email)) errors.updated_by_email = 'Email không hợp lệ'
  if (body.items.length === 0) errors.items = 'Vui lòng thêm ít nhất một nội dung cần cập nhật'
  if (!body.turnstile_token) errors.turnstile_token = 'Vui lòng hoàn tất xác minh chống spam'

  const allowedTypes = new Set(['new_allergy', 'modify_allergy', 'additional_note'])
  const allowedCertainty = new Set(['suspected', 'confirmed'])
  const allowedSeverity = new Set(['mild', 'moderate', 'severe', 'life_threatening'])
  const items = body.items.map((raw: PublicAllergyCardUpdateItemInput, index) => {
    const item = {
      item_type: clean(raw.item_type, 30),
      target_allergy_id: clean(raw.target_allergy_id, 40),
      allergen_name: clean(raw.allergen_name, 255),
      certainty_level: clean(raw.certainty_level, 20),
      clinical_manifestation: clean(raw.clinical_manifestation, 2000),
      severity_level: clean(raw.severity_level, 30),
      reaction_type: clean(raw.reaction_type, 100),
      discovered_date: clean(raw.discovered_date, 10),
      note: clean(raw.note, 2000),
    }
    if (!allowedTypes.has(item.item_type)) errors[`items.${index}.item_type`] = 'Loại nội dung không hợp lệ'
    if (item.item_type === 'new_allergy' && item.allergen_name.length < 2) errors[`items.${index}.allergen_name`] = 'Vui lòng nhập tên thuốc/dị nguyên'
    if (item.item_type === 'modify_allergy' && !UUID_PATTERN.test(item.target_allergy_id)) errors[`items.${index}.target_allergy_id`] = 'Dị nguyên cần sửa không hợp lệ'
    if (item.item_type === 'additional_note' && item.note.length < 3) errors[`items.${index}.note`] = 'Nội dung bổ sung phải có ít nhất 3 ký tự'
    if (item.certainty_level && !allowedCertainty.has(item.certainty_level)) errors[`items.${index}.certainty_level`] = 'Mức độ chắc chắn không hợp lệ'
    if (item.severity_level && !allowedSeverity.has(item.severity_level)) errors[`items.${index}.severity_level`] = 'Mức độ nghiêm trọng không hợp lệ'
    return { ...item, normalized_name: item.allergen_name ? normalizeAllergenName(item.allergen_name) : '' }
  })

  return { body: { ...body, items }, errors }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (process.env.ALLERGY_PUBLIC_UPDATES_ENABLED !== 'true') {
    return allergyCardError('FEATURE_DISABLED', 'Chức năng gửi bổ sung hiện chưa được bật', 404)
  }
  if (!UUID_PATTERN.test(params.id)) return allergyCardError('NOT_FOUND', 'Không tìm thấy thẻ dị ứng', 404)

  const { body, errors } = validateInput(await parseJsonBody<PublicAllergyCardUpdateInput>(request))
  if (!body || Object.keys(errors).length) return allergyCardError('VALIDATION_ERROR', 'Vui lòng kiểm tra lại thông tin', 400, errors)

  const ip = clientIp(request)
  const captcha = await validateTurnstileToken(body.turnstile_token, ip === 'unknown' ? undefined : ip)
  if (!captcha.success) {
    return allergyCardError('CAPTCHA_FAILED', 'Không thể xác minh chống spam. Vui lòng thử lại.', 400, {
      turnstile_token: captcha.code || 'CAPTCHA_FAILED',
    })
  }

  const supabase = createAdminClient()
  const { data: card, error: cardError } = await supabase
    .from('allergy_cards')
    .select('id, card_code, patient_name, organization_id, card_allergies(id)')
    .eq('public_token', params.id)
    .maybeSingle()
  if (cardError) console.error('Resolve public allergy card failed:', cardError)
  if (!card) return allergyCardError('NOT_FOUND', 'Không tìm thấy thẻ dị ứng', 404)
  const validAllergyIds = new Set(((card as any).card_allergies || []).map((item: any) => item.id))
  if (body.items.some((item) => item.item_type === 'modify_allergy' && !validAllergyIds.has(item.target_allergy_id))) {
    return allergyCardError('VALIDATION_ERROR', 'Dị nguyên cần đính chính không thuộc thẻ này', 400, {
      items: 'Vui lòng tải lại thẻ và chọn đúng dị nguyên',
    })
  }

  const hmacSecret = process.env.ALLERGY_RATE_LIMIT_SECRET || process.env.NEXTAUTH_SECRET
  if (!hmacSecret) return allergyCardError('SERVICE_UNAVAILABLE', 'Chức năng tạm thời chưa sẵn sàng', 503)
  const ipHash = createHmac('sha256', hmacSecret).update(ip).digest('hex')
  const { data: submissionId, error } = await (supabase.rpc as any)('submit_allergy_card_update', {
    p_card_id: card.id,
    p_ip_hash: ipHash,
    p_submission: {
      updated_by_name: body.updated_by_name,
      updated_by_organization: body.updated_by_organization,
      updated_by_role: body.updated_by_role,
      updated_by_phone: body.updated_by_phone,
      updated_by_email: body.updated_by_email,
      facility_name: body.facility_name,
      facility_department: body.facility_department,
      reason_for_update: body.reason_for_update,
      submission_notes: body.submission_notes,
    },
    p_items: body.items,
  })

  if (error || !submissionId) {
    if (error?.message?.includes('RATE_LIMITED')) return allergyCardError('RATE_LIMITED', 'Bạn đã gửi quá nhiều lần. Vui lòng thử lại sau.', 429)
    if (error?.message?.includes('CARD_NOT_ACTIVE')) return allergyCardError('CARD_NOT_ACTIVE', 'Thẻ không còn hiệu lực', 410)
    const mapped = mapDatabaseWorkflowError(error?.message)
    return allergyCardError(mapped.code, mapped.message, mapped.status)
  }

  if (card.organization_id) {
    await notifyOrganizationAboutAllergyUpdate({
      organizationId: card.organization_id,
      cardId: card.id,
      cardCode: card.card_code,
      patientName: card.patient_name,
      submissionId,
    })
  }

  return NextResponse.json({
    success: true,
    submission_id: submissionId,
    message: 'Thông tin đã được gửi và đang chờ đơn vị phát hành duyệt.',
  }, { status: 201, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } })
}
