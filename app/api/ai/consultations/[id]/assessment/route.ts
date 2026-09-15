import { NextRequest, NextResponse } from 'next/server'
import { errorResponse, markConsultationFailed, publicConsultation, requireConsultationAccess } from '@/lib/ai-consultant/api'
import { AIConsultantError } from '@/lib/ai-consultant/errors'
import { createAssessment } from '@/lib/ai-consultant/gemini'
import { logConsultationEvent, replaceDrugAssessments, updateConsultation } from '@/lib/ai-consultant/store'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  let current
  try {
    const access = await requireConsultationAccess(request, params.id)
    current = access.consultation
    if (['ready', 'reviewed'].includes(current.status) && current.result) {
      return NextResponse.json({ success: true, data: publicConsultation(current) })
    }
    if (current.status !== 'evidence_ready' || !current.evidence_packet) {
      throw new AIConsultantError('AI_CONTEXT_STALE', 'Cần hoàn tất bước tìm bằng chứng trước.', 409)
    }

    const evidencePacket = current.evidence_packet
    current = await updateConsultation(current.id, { status: 'structuring', error_code: null })
    await logConsultationEvent(current.id, 'system', 'assessment_started')
    const generated = await createAssessment(current.context_snapshot, evidencePacket)
    await replaceDrugAssessments(current, generated.result)
    current = await updateConsultation(current.id, {
      status: 'ready',
      result: generated.result,
      completed_at: new Date().toISOString(),
      usage: { ...current.usage, assessment: generated.usage, assessmentModelVersion: generated.modelVersion },
    })
    await logConsultationEvent(current.id, 'system', 'assessment_completed', undefined, {
      drugCount: generated.result.drugAssessments.length,
      grounded: generated.result.grounded,
    })
    return NextResponse.json({ success: true, data: publicConsultation(current) })
  } catch (error) {
    if (current) error = await markConsultationFailed(current, error)
    return errorResponse(error)
  }
}
