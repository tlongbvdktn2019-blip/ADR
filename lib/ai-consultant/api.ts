import { NextRequest, NextResponse } from 'next/server'
import { AI_PUBLIC_COOKIE, getInternalUserId, publicSessionMatches } from './access'
import { AIConsultantError, normalizeAIError } from './errors'
import { ConsultationRow, getConsultation, logConsultationEvent, updateConsultation } from './store'

export async function requireConsultationAccess(request: NextRequest, id: string) {
  const consultation = await getConsultation(id)
  const userId = await getInternalUserId()

  if (consultation.actor_type === 'internal') {
    if (!userId || consultation.user_id !== userId) {
      throw new AIConsultantError('AI_UNAUTHORIZED', 'Bạn không có quyền truy cập phiên này.', 403)
    }
    return { consultation, actorType: 'internal' as const, userId }
  }

  const token = request.cookies.get(AI_PUBLIC_COOKIE)?.value
  if (!token || !consultation.public_session_hash || !publicSessionMatches(token, consultation.public_session_hash)) {
    throw new AIConsultantError('AI_PUBLIC_SESSION_EXPIRED', 'Phiên AI công khai đã hết hạn.', 401)
  }
  if (consultation.expires_at && new Date(consultation.expires_at) <= new Date()) {
    throw new AIConsultantError('AI_PUBLIC_SESSION_EXPIRED', 'Phiên AI công khai đã hết hạn.', 401)
  }
  return { consultation, actorType: 'public' as const, userId: undefined }
}
export function publicConsultation(row: ConsultationRow, extra: Record<string, unknown> = {}) {
  return {
    id: row.id,
    status: row.status,
    contextHash: row.context_hash,
    result: row.result,
    evidence: row.evidence_packet,
    errorCode: row.error_code,
    createdAt: row.created_at,
    ...extra,
  }
}

export async function markConsultationFailed(consultation: ConsultationRow, error: unknown) {
  const normalized = normalizeAIError(error)
  try {
    await updateConsultation(consultation.id, { status: 'failed', error_code: normalized.code })
    await logConsultationEvent(consultation.id, 'system', 'consultation_failed', undefined, { code: normalized.code })
  } catch (auditError) {
    console.error('Cannot mark AI consultation failed:', auditError)
  }
  return normalized
}

export function errorResponse(error: unknown) {
  const normalized = error instanceof AIConsultantError ? error : normalizeAIError(error)
  return NextResponse.json({
    success: false,
    error: normalized.message,
    code: normalized.code,
    details: normalized.details,
  }, { status: normalized.status })
}
