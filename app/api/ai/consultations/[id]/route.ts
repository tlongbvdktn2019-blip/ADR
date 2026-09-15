import { NextRequest, NextResponse } from 'next/server'
import { errorResponse, publicConsultation, requireConsultationAccess } from '@/lib/ai-consultant/api'
import { getChatMessages, getDrugReviews } from '@/lib/ai-consultant/store'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { consultation } = await requireConsultationAccess(request, params.id)
    const [drugReviews, messages] = await Promise.all([
      getDrugReviews(consultation.id),
      getChatMessages(consultation.id),
    ])
    return NextResponse.json({
      success: true,
      data: publicConsultation(consultation, { drugReviews, messages }),
    })
  } catch (error) {
    return errorResponse(error)
  }
}
