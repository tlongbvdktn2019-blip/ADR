import { describe, expect, it } from 'vitest'
import { buildClinicalContext } from './context'

describe('AI Consultant clinical context', () => {
  it('removes direct identifiers and keeps only clinical fields', () => {
    const result = buildClinicalContext({
      patient_name: 'Nguyễn Văn A',
      patient_birth_date: '1980-01-02',
      reporter_name: 'Dược sĩ B',
      reporter_email: 'duocsi@example.com',
      report_code: '2026-000123',
      adr_occurrence_date: '2026-09-01',
      adr_description: 'Nguyễn Văn A nổi ban. Liên hệ duocsi@example.com. Hồ sơ 2026-000123.',
      medical_history: 'Sinh ngày 1980-01-02',
      patient_gender: 'male',
      suspected_drugs: [{
        id: 'drug-1',
        drug_name: 'Amoxicillin',
        start_date: '2026-08-30',
        reaction_improved_after_stopping: 'yes',
        reaction_reoccurred_after_rechallenge: 'not_rechallenged',
      }],
    })

    const serialized = JSON.stringify(result.context)
    expect(serialized).not.toContain('Nguyễn Văn A')
    expect(serialized).not.toContain('duocsi@example.com')
    expect(serialized).not.toContain('1980-01-02')
    expect(serialized).not.toContain('2026-000123')
    expect(serialized).toContain('Amoxicillin')
    expect(result.ready).toBe(true)
  })

  it('returns a concrete readiness checklist', () => {
    const result = buildClinicalContext({ suspected_drugs: [] })
    expect(result.ready).toBe(false)
    expect(result.missingFields).toContain('Mô tả ADR')
    expect(result.missingFields).toContain('Ngày xuất hiện ADR')
    expect(result.missingFields).toContain('Ít nhất một thuốc nghi ngờ')
  })
})
