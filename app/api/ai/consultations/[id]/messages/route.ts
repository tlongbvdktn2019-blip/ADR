import { NextRequest, NextResponse } from 'next/server'
import { errorResponse, requireConsultationAccess } from '@/lib/ai-consultant/api'
import { AIConsultantError } from '@/lib/ai-consultant/errors'
import { answerFollowUp } from '@/lib/ai-consultant/gemini'
import { redactClinicalText } from '@/lib/ai-consultant/redaction'
import { countPublicFollowUps, logConsultationEvent, saveChatMessage } from '@/lib/ai-consultant/store'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { consultation, actorType, userId } = await requireConsultationAccess(request, params.id)
    if (!['ready', 'reviewed'].includes(consultation.status) || !consultation.result) {
      throw new AIConsultantError('AI_CONTEXT_STALE', 'Kết quả chưa sẵn sàng để hỏi đáp.', 409)
    }
    const body = await request.json()
    const redacted = redactClinicalText(body.message)
    const message = redacted.value.slice(0, 2_000)
    if (!message) throw new AIConsultantError('AI_SCHEMA_INVALID', 'Vui lòng nhập câu hỏi.', 400)
    if (actorType === 'public' && await countPublicFollowUps(consultation.id) >= 3) {
      throw new AIConsultantError('AI_RATE_LIMITED', 'Phiên công khai đã dùng đủ ba câu hỏi.', 429)
    }

    const userMessage = await saveChatMessage({ consultationId: consultation.id, role: 'user', content: message })
    const generated = await answerFollowUp(consultation.context_snapshot, consultation.result, message)
    const assistantMessage = await saveChatMessage({
      consultationId: consultation.id,
      role: 'assistant',
      content: generated.content,
      tokenUsage: generated.usage,
    })
    await logConsultationEvent(consultation.id, actorType, 'follow_up_answered', userId, { redacted: redacted.changed })
    return NextResponse.json({ success: true, data: { userMessage, assistantMessage } })
  } catch (error) {
    return errorResponse(error)
  }
}
