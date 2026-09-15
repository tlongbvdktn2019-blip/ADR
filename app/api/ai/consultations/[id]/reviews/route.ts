import { NextRequest, NextResponse } from 'next/server'
import { errorResponse, requireConsultationAccess } from '@/lib/ai-consultant/api'
import { AIConsultantError } from '@/lib/ai-consultant/errors'
import { getDrugReviews, logConsultationEvent, reviewDrugAssessment, updateConsultation } from '@/lib/ai-consultant/store'
import { CausalityLevel } from '@/lib/ai-consultant/types'

const LEVELS = new Set<CausalityLevel>(['certain', 'probable', 'possible', 'unlikely', 'unclassified', 'unclassifiable'])

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { consultation, actorType, userId } = await requireConsultationAccess(request, params.id)
    if (!['ready', 'reviewed'].includes(consultation.status) || !consultation.result) {
      throw new AIConsultantError('AI_CONTEXT_STALE', 'Kết quả chưa sẵn sàng để xác nhận.', 409)
    }
    const body = await request.json()
    if (!['accepted', 'edited', 'rejected'].includes(body.status)) {
      throw new AIConsultantError('AI_SCHEMA_INVALID', 'Trạng thái xác nhận không hợp lệ.', 400)
    }
    const assessment = consultation.result.drugAssessments.find((item) => item.drugRef === body.drugRef)
    if (!assessment) throw new AIConsultantError('AI_SCHEMA_INVALID', 'Không tìm thấy thuốc cần xác nhận.', 404)

    const finalWhoLevel = body.finalWhoLevel || assessment.whoLevel
    const finalNaranjoLevel = body.finalNaranjoLevel || assessment.naranjoLevel
    if (body.status !== 'rejected' && (!LEVELS.has(finalWhoLevel) || !LEVELS.has(finalNaranjoLevel))) {
      throw new AIConsultantError('AI_SCHEMA_INVALID', 'Kết luận xác nhận không hợp lệ.', 400)
    }
    const finalComment = String(body.finalComment ?? assessment.draftComment).trim().slice(0, 8_000)
    const review = await reviewDrugAssessment({
      consultationId: consultation.id,
      drugRef: assessment.drugRef,
      status: body.status,
      finalWhoLevel,
      finalNaranjoLevel,
      finalComment,
      reviewedBy: userId,
    })
    await logConsultationEvent(consultation.id, actorType, `drug_${body.status}`, userId, {
      drugRef: assessment.drugRef,
      edited: body.status === 'edited',
    })

    const reviews = await getDrugReviews(consultation.id)
    if (reviews.length > 0 && reviews.every((item: any) => item.review_status !== 'pending')) {
      await updateConsultation(consultation.id, { status: 'reviewed' })
    }
    return NextResponse.json({ success: true, data: review })
  } catch (error) {
    return errorResponse(error)
  }
}
