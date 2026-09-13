import { describe, expect, it } from 'vitest'
import { escapeHtml, generateAllergyCardPrintHTML } from './allergy-card-print-template'

describe('allergy-card print template', () => {
  it('escapes every dangerous HTML character', () => {
    expect(escapeHtml(`<script>alert('x') & "y"</script>`)).toBe(
      '&lt;script&gt;alert(&#039;x&#039;) &amp; &quot;y&quot;&lt;/script&gt;'
    )
  })

  it('does not interpolate report content as executable HTML', () => {
    const html = generateAllergyCardPrintHTML({
      card_code: 'AC-2026-000001',
      patient_name: '<img src=x onerror=alert(1)>',
      patient_gender: 'female',
      patient_age: 40,
      hospital_name: 'Bệnh viện & Trung tâm',
      doctor_name: 'BS. An',
      issued_date: '2026-09-13',
      qr_code_url: 'data:image/png;base64,abc',
      allergies: [{
        allergen_name: '<script>alert(1)</script>',
        certainty_level: 'confirmed',
        clinical_manifestation: 'Ban đỏ > 2 giờ',
      }],
    })

    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).not.toContain('<img src=x onerror=alert(1)>')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain('Bệnh viện &amp; Trung tâm')
  })
})
