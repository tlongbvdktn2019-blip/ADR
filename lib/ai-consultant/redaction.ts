const REDACTED = '[ĐÃ ẨN]'

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const PHONE_PATTERN = /(?<!\d)(?:\+?84|0)(?:[\s.-]*\d){8,10}(?!\d)/g
const LABELED_ID_PATTERN = /\b(?:cccd|cmnd|mã\s*(?:bệnh\s*nhân|báo\s*cáo|hồ\s*sơ))\s*[:#-]?\s*[A-Z0-9./-]{4,}\b/gi
const REPORT_CODE_PATTERN = /\b\d{4}-\d{4,}\b/g

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export interface RedactionResult {
  value: string
  changed: boolean
  warnings: string[]
}

export function redactClinicalText(
  input: unknown,
  knownIdentifiers: Array<string | null | undefined> = []
): RedactionResult {
  const original = typeof input === 'string' ? input.normalize('NFC').trim() : ''
  if (!original) return { value: '', changed: false, warnings: [] }

  let value = original
  const warnings = new Set<string>()

  for (const identifier of knownIdentifiers) {
    const normalized = identifier?.normalize('NFC').trim()
    if (!normalized || normalized.length < 3) continue
    const pattern = new RegExp(escapeRegExp(normalized), 'gi')
    if (pattern.test(value)) {
      value = value.replace(pattern, REDACTED)
      warnings.add('Đã ẩn thông tin định danh được lặp lại trong nội dung lâm sàng.')
    }
  }

  const patterns: Array<[RegExp, string]> = [
    [EMAIL_PATTERN, 'Đã ẩn địa chỉ email trong nội dung lâm sàng.'],
    [PHONE_PATTERN, 'Đã ẩn số điện thoại trong nội dung lâm sàng.'],
    [LABELED_ID_PATTERN, 'Đã ẩn số giấy tờ hoặc mã định danh trong nội dung lâm sàng.'],
    [REPORT_CODE_PATTERN, 'Đã ẩn mã báo cáo trong nội dung lâm sàng.'],
  ]

  for (const [pattern, warning] of patterns) {
    pattern.lastIndex = 0
    if (pattern.test(value)) {
      pattern.lastIndex = 0
      value = value.replace(pattern, REDACTED)
      warnings.add(warning)
    }
  }

  return {
    value: value.slice(0, 8_000),
    changed: value !== original,
    warnings: Array.from(warnings),
  }
}
