import { describe, expect, it } from 'vitest'
import { redactClinicalText } from './redaction'

describe('redactClinicalText', () => {
  it('removes known identifiers and common contact fields', () => {
    const result = redactClinicalText(
      'Nguyễn Văn A gọi 0901 234 567, email nguyenvana@example.com, mã hồ sơ: HS-12345.',
      ['Nguyễn Văn A']
    )

    expect(result.value).not.toContain('Nguyễn Văn A')
    expect(result.value).not.toContain('0901 234 567')
    expect(result.value).not.toContain('nguyenvana@example.com')
    expect(result.value).not.toContain('HS-12345')
    expect(result.changed).toBe(true)
    expect(result.warnings.length).toBeGreaterThanOrEqual(4)
  })

  it('preserves clinical content without identifiers', () => {
    const input = 'Nổi ban đỏ toàn thân sau liều thứ hai.'
    expect(redactClinicalText(input)).toEqual({ value: input, changed: false, warnings: [] })
  })
})
