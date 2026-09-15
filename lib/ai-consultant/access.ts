import { createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { AIConsultantError } from './errors'

export const AI_PUBLIC_COOKIE = 'adr_ai_session'

function sessionSecret() {
  const secret = process.env.AI_PUBLIC_SESSION_SECRET
  if (!secret || secret.length < 24) {
    throw new AIConsultantError('AI_DISABLED', 'AI_PUBLIC_SESSION_SECRET chưa được cấu hình an toàn.', 503)
  }
  return secret
}

export function createPublicSessionToken() {
  return randomBytes(32).toString('base64url')
}

export function hashPublicSession(token: string) {
  return createHmac('sha256', sessionSecret()).update(token).digest('hex')
}

export function publicSessionMatches(token: string, expectedHash: string) {
  const actual = Buffer.from(hashPublicSession(token), 'hex')
  const expected = Buffer.from(expectedHash, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function getClientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
}

export function hashPublicRateKey(request: NextRequest) {
  const date = new Date().toISOString().slice(0, 10)
  const input = `${date}|${getClientIp(request)}|${request.headers.get('user-agent') || 'unknown'}`
  return createHmac('sha256', sessionSecret()).update(input).digest('hex')
}

export async function getInternalUserId() {
  const session = await getServerSession(authOptions)
  return session?.user?.id || null
}

export function assertAIEnabled(publicActor = false) {
  if (process.env.AI_CONSULTANT_ENABLED !== 'true') {
    throw new AIConsultantError('AI_DISABLED', 'AI Consultant đang được tắt.', 503)
  }
  if (publicActor) {
    if (process.env.AI_CONSULTANT_PUBLIC_ENABLED !== 'true') {
      throw new AIConsultantError('AI_DISABLED', 'AI Consultant công khai đang được tắt.', 503)
    }
    const cap = Number(process.env.AI_CONSULTANT_PUBLIC_DAILY_BUDGET_USD)
    if (!Number.isFinite(cap) || cap <= 0) {
      throw new AIConsultantError('AI_BUDGET_EXCEEDED', 'Chưa cấu hình ngân sách AI công khai.', 503)
    }
  }
}
