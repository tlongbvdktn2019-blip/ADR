import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createAdminClient } from '@/lib/supabase'
import { canAccessOrganization, getAllergyCardAccessContext } from '@/lib/allergy-card-access'
import { allergyCardError, mapDatabaseWorkflowError, parseJsonBody, UUID_PATTERN } from '@/lib/allergy-card-api'

type ReviewInput = {
  decision?: 'approved' | 'rejected'
  review_note?: string
  merge_target_allergy_id?: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; updateId: string; itemId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return allergyCardError('UNAUTHORIZED', 'Vui lòng đăng nhập', 401)
  if (![params.id, params.updateId, params.itemId].every((id) => UUID_PATTERN.test(id))) {
    return allergyCardError('VALIDATION_ERROR', 'ID dữ liệu không hợp lệ', 400)
  }

  const body = await parseJsonBody<ReviewInput>(request)
  const reviewNote = typeof body?.review_note === 'string' ? body.review_note.trim().slice(0, 2000) : ''
  const mergeTarget = typeof body?.merge_target_allergy_id === 'string' ? body.merge_target_allergy_id : ''
  if (!body || !['approved', 'rejected'].includes(body.decision || '')) {
    return allergyCardError('VALIDATION_ERROR', 'Quyết định duyệt không hợp lệ', 400)
  }
  if (body.decision === 'rejected' && reviewNote.length < 3) {
    return allergyCardError('VALIDATION_ERROR', 'Vui lòng nhập lý do từ chối', 400, { review_note: 'Ít nhất 3 ký tự' })
  }
  if (mergeTarget && !UUID_PATTERN.test(mergeTarget)) {
    return allergyCardError('VALIDATION_ERROR', 'Dị nguyên đích không hợp lệ', 400)
  }

  const context = await getAllergyCardAccessContext(session.user.id)
  if (!context) return allergyCardError('USER_NOT_FOUND', 'Không tìm thấy tài khoản', 404)
  const supabase = createAdminClient()
  const { data: card } = await supabase.from('allergy_cards').select('id, organization_id').eq('id', params.id).maybeSingle()
  if (!card) return allergyCardError('NOT_FOUND', 'Không tìm thấy thẻ dị ứng', 404)
  if (!canAccessOrganization(context, card.organization_id)) return allergyCardError('FORBIDDEN', 'Bạn không có quyền duyệt thông tin này', 403)

  const { data: item } = await supabase
    .from('allergy_card_update_items')
    .select('id, submission_id, allergy_card_update_submissions!inner(card_id)')
    .eq('id', params.itemId)
    .eq('submission_id', params.updateId)
    .maybeSingle()
  if (!item || (item as any).allergy_card_update_submissions?.card_id !== params.id) {
    return allergyCardError('NOT_FOUND', 'Không tìm thấy nội dung cần duyệt', 404)
  }

  const { error } = await (supabase.rpc as any)('review_allergy_card_update_item', {
    p_item_id: params.itemId,
    p_actor_user_id: context.userId,
    p_decision: body.decision,
    p_review_note: reviewNote,
    p_merge_target_allergy_id: mergeTarget || null,
  })
  if (error) {
    if (error.message.includes('UPDATE_ITEM_ALREADY_REVIEWED')) return allergyCardError('ALREADY_REVIEWED', 'Nội dung này đã được xử lý', 409)
    if (error.message.includes('DUPLICATE_ALLERGEN_REQUIRES_MERGE')) return allergyCardError('DUPLICATE_ALLERGEN', 'Dị nguyên đã tồn tại; hãy chọn dị nguyên cần gộp', 409)
    if (error.message.includes('REVIEW_NOTE_REQUIRED')) return allergyCardError('VALIDATION_ERROR', 'Vui lòng nhập lý do từ chối', 400)
    const mapped = mapDatabaseWorkflowError(error.message)
    return allergyCardError(mapped.code, mapped.message, mapped.status)
  }

  return NextResponse.json({ success: true, item_id: params.itemId, decision: body.decision })
}
