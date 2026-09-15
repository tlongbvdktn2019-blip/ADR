export type AIConsultantErrorCode =
  | 'AI_CONTEXT_INCOMPLETE'
  | 'AI_CONTEXT_STALE'
  | 'AI_UNAUTHORIZED'
  | 'AI_PUBLIC_SESSION_EXPIRED'
  | 'AI_RATE_LIMITED'
  | 'AI_BUDGET_EXCEEDED'
  | 'AI_PROVIDER_TIMEOUT'
  | 'AI_PROVIDER_UNAVAILABLE'
  | 'AI_SAFETY_BLOCKED'
  | 'AI_GROUNDING_UNAVAILABLE'
  | 'AI_SCHEMA_INVALID'
  | 'AI_SOURCE_VALIDATION_FAILED'
  | 'AI_DISABLED'

export class AIConsultantError extends Error {
  constructor(
    public readonly code: AIConsultantErrorCode,
    message: string,
    public readonly status = 500,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'AIConsultantError'
  }
}
export function normalizeAIError(error: unknown) {
  if (error instanceof AIConsultantError) return error
  const message = error instanceof Error ? error.message : String(error)
  if (/429|quota|rate.?limit/i.test(message)) {
    return new AIConsultantError('AI_RATE_LIMITED', 'Gemini đang giới hạn lượt gọi. Vui lòng thử lại sau.', 429)
  }
  if (/abort|timeout|deadline/i.test(message)) {
    return new AIConsultantError('AI_PROVIDER_TIMEOUT', 'Gemini phản hồi quá thời gian cho phép.', 504)
  }
  if (/safety|blocked/i.test(message)) {
    return new AIConsultantError('AI_SAFETY_BLOCKED', 'Nội dung bị bộ lọc an toàn của Gemini chặn.', 422)
  }
  return new AIConsultantError('AI_PROVIDER_UNAVAILABLE', 'Không thể kết nối Gemini 2.5 Pro.', 502)
}
