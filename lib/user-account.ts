export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 50

const INVALID_USERNAME_CHARS = /[^a-z0-9._-]+/g
const EDGE_SEPARATORS = /^[._-]+|[._-]+$/g
const USERNAME_PATTERN = /^[a-z0-9._-]{3,50}$/

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function normalizeUsername(username: string): string {
  return username
    .trim()
    .toLowerCase()
    .replace(INVALID_USERNAME_CHARS, '-')
    .replace(EDGE_SEPARATORS, '')
    .slice(0, USERNAME_MAX_LENGTH)
}

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username)
}

export function getUsernameValidationMessage(username: string): string | null {
  if (!username) {
    return 'Tên đăng nhập là bắt buộc'
  }

  if (username.length < USERNAME_MIN_LENGTH) {
    return `Tên đăng nhập phải có ít nhất ${USERNAME_MIN_LENGTH} ký tự`
  }

  if (username.length > USERNAME_MAX_LENGTH) {
    return `Tên đăng nhập không được vượt quá ${USERNAME_MAX_LENGTH} ký tự`
  }

  if (!isValidUsername(username)) {
    return 'Tên đăng nhập chỉ được chứa chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang'
  }

  return null
}

export function buildUsernameFromEmail(email: string): string {
  const localPart = normalizeEmail(email).split('@')[0] || 'user'
  const candidate = normalizeUsername(localPart) || 'user'

  if (candidate.length >= USERNAME_MIN_LENGTH) {
    return candidate
  }

  return candidate.padEnd(USERNAME_MIN_LENGTH, '0')
}
