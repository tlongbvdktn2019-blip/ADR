interface TurnstileResponse {
  success: boolean
  hostname?: string
  action?: string
  'error-codes'?: string[]
}

export interface TurnstileValidationResult {
  success: boolean
  code?: string
}

export async function validateTurnstileToken(
  token: string,
  remoteIp?: string,
  expectedAction = 'allergy_card_update'
): Promise<TurnstileValidationResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return { success: false, code: 'CAPTCHA_UNAVAILABLE' }
  if (!token || token.length > 2048) return { success: false, code: 'CAPTCHA_INVALID' }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: remoteIp }),
      signal: controller.signal,
      cache: 'no-store',
    })
    const result = await response.json() as TurnstileResponse
    const configuredHostname = process.env.TURNSTILE_ALLOWED_HOSTNAME
    if (!result.success) return { success: false, code: result['error-codes']?.[0] || 'CAPTCHA_INVALID' }
    if (configuredHostname && result.hostname !== configuredHostname) return { success: false, code: 'CAPTCHA_HOSTNAME_MISMATCH' }
    if (result.action !== expectedAction) return { success: false, code: 'CAPTCHA_ACTION_MISMATCH' }
    return { success: true }
  } catch (error) {
    console.error('Turnstile validation failed:', error)
    return { success: false, code: 'CAPTCHA_UNAVAILABLE' }
  } finally {
    clearTimeout(timeout)
  }
}
