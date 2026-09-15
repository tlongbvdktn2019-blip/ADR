import { NextRequest, NextResponse } from 'next/server'
import { validateTurnstileToken } from '@/lib/turnstile'
import { buildClinicalContext } from '@/lib/ai-consultant/context'
import {
  AI_PUBLIC_COOKIE,
  assertAIEnabled,
  createPublicSessionToken,
  getClientIp,
  getInternalUserId,
  hashPublicRateKey,
  hashPublicSession,
} from '@/lib/ai-consultant/access'
import { AIConsultantError } from '@/lib/ai-consultant/errors'
import { createConsultation, countRecentConsultations, getPublicEstimatedCostSince } from '@/lib/ai-consultant/store'
import { errorResponse, publicConsultation } from '@/lib/ai-consultant/api'

function isoHoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = await getInternalUserId()
    const publicActor = body.actorMode === 'public' || !userId
    if (body.actorMode === 'internal' && !userId) {
      throw new AIConsultantError('AI_UNAUTHORIZED', 'Bạn cần đăng nhập để dùng AI Consultant nội bộ.', 401)
    }
    assertAIEnabled(publicActor)

    const built = buildClinicalContext(body.formData || {})
    if (!built.ready) {
      throw new AIConsultantError(
        'AI_CONTEXT_INCOMPLETE',
        'Chưa đủ dữ liệu để phân tích ADR.',
        400,
        { missingFields: built.missingFields, piiWarnings: built.piiWarnings }
      )
    }

    let publicToken: string | undefined
    let publicSessionHash: string | undefined
    let publicRateKey: string | undefined

    if (publicActor) {
      const captcha = await validateTurnstileToken(body.turnstileToken || '', getClientIp(request), 'ai_consultant')
      if (!captcha.success) {
        throw new AIConsultantError('AI_UNAUTHORIZED', 'Xác minh chống lạm dụng không hợp lệ.', 403, { captchaCode: captcha.code })
      }
      publicRateKey = hashPublicRateKey(request)
      const hourly = await countRecentConsultations({ publicRateKey, since: isoHoursAgo(1) })
      const daily = await countRecentConsultations({ publicRateKey, since: isoHoursAgo(24) })
      if (hourly >= 2 || daily >= 5) {
        throw new AIConsultantError('AI_RATE_LIMITED', 'Đã đạt giới hạn phiên AI công khai.', 429)
      }
      const configuredBudget = Number(process.env.AI_CONSULTANT_PUBLIC_DAILY_BUDGET_USD)
      const currentSpend = await getPublicEstimatedCostSince(isoHoursAgo(24))
      if (currentSpend >= configuredBudget) {
        throw new AIConsultantError('AI_BUDGET_EXCEEDED', 'Ngân sách AI công khai trong ngày đã được sử dụng hết.', 429)
      }
      publicToken = createPublicSessionToken()
      publicSessionHash = hashPublicSession(publicToken)
    } else {
      const hourly = await countRecentConsultations({ userId, since: isoHoursAgo(1) })
      if (hourly >= 10) {
        throw new AIConsultantError('AI_RATE_LIMITED', 'Bạn đã đạt giới hạn 10 lượt phân tích mỗi giờ.', 429)
      }
    }

    const consultation = await createConsultation({
      actorType: publicActor ? 'public' : 'internal',
      userId: userId || undefined,
      publicSessionHash,
      publicRateKey,
      context: built.context,
      contextHash: built.contextHash,
      expiresAt: publicActor ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined,
    })

    const response = NextResponse.json({
      success: true,
      data: publicConsultation(consultation, { piiWarnings: built.piiWarnings }),
    }, { status: 201 })

    if (publicToken) {
      response.cookies.set(AI_PUBLIC_COOKIE, publicToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60,
      })
    }
    return response
  } catch (error) {
    return errorResponse(error)
  }
}
