import { NextRequest, NextResponse } from 'next/server'
import { errorResponse, markConsultationFailed, publicConsultation, requireConsultationAccess } from '@/lib/ai-consultant/api'
import { AIConsultantError } from '@/lib/ai-consultant/errors'
import { retrieveEvidence } from '@/lib/ai-consultant/gemini'
import { logConsultationEvent, replaceEvidenceSources, updateConsultation } from '@/lib/ai-consultant/store'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  let current
  try {
    const access = await requireConsultationAccess(request, params.id)
    current = access.consultation
    if (['evidence_ready', 'structuring', 'ready', 'reviewed'].includes(current.status)) {
      return NextResponse.json({ success: true, data: publicConsultation(current) })
    }
    if (!['created', 'failed'].includes(current.status)) {
      throw new AIConsultantError('AI_CONTEXT_STALE', 'Phiên không ở trạng thái có thể tìm bằng chứng.', 409)
    }

    current = await updateConsultation(current.id, { status: 'retrieving_evidence', error_code: null })
    await logConsultationEvent(current.id, 'system', 'evidence_started')
    const generated = await retrieveEvidence(current.context_snapshot)
    await replaceEvidenceSources(current.id, generated.packet)
    current = await updateConsultation(current.id, {
      status: 'evidence_ready',
      evidence_packet: generated.packet,
      usage: { ...current.usage, evidence: generated.usage, evidenceModelVersion: generated.modelVersion },
    })
    await logConsultationEvent(current.id, 'system', 'evidence_completed', undefined, {
      grounded: generated.packet.grounded,
      sourceCount: generated.packet.sources.length,
    })
    return NextResponse.json({ success: true, data: publicConsultation(current) })
  } catch (error) {
    if (current) error = await markConsultationFailed(current, error)
    return errorResponse(error)
  }
}
