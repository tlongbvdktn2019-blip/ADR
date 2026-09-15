import { NextRequest } from 'next/server'
import { requireConsultationAccess } from './api'
import { AIConsultantError } from './errors'
import { attachConsultationToReport, validateReviewedSummary } from './store'
import { buildClinicalContext } from './context'

export async function prepareAIAttachment(
  request: NextRequest,
  body: Record<string, any>,
  expectedActor: 'internal' | 'public'
) {
  if (!body.ai_consultation_id) return null
  if (!body.ai_context_hash || !body.ai_summary_drug_ref) {
    throw new AIConsultantError('AI_CONTEXT_STALE', 'Thiếu thông tin liên kết kết quả AI.', 400)
  }
  const currentContext = buildClinicalContext(body)
  if (!currentContext.ready || currentContext.contextHash !== body.ai_context_hash) {
    throw new AIConsultantError('AI_CONTEXT_STALE', 'Dữ liệu lâm sàng đã thay đổi sau lần phân tích AI.', 409)
  }
  const access = await requireConsultationAccess(request, body.ai_consultation_id)
  if (access.actorType !== expectedActor) {
    throw new AIConsultantError('AI_UNAUTHORIZED', 'Loại phiên AI không phù hợp với biểu mẫu.', 403)
  }
  await validateReviewedSummary({
    consultationId: body.ai_consultation_id,
    contextHash: body.ai_context_hash,
    summaryDrugRef: body.ai_summary_drug_ref,
    scale: body.assessment_scale,
    causalityLevel: body.causality_assessment,
  })
  return {
    consultationId: body.ai_consultation_id as string,
    contextHash: body.ai_context_hash as string,
  }
}

export async function completeAIAttachment(
  prepared: Awaited<ReturnType<typeof prepareAIAttachment>>,
  reportId: string
) {
  if (!prepared) return
  await attachConsultationToReport({ ...prepared, reportId })
}
