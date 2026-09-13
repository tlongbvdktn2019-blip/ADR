import { describe, expect, it } from 'vitest'
import {
  AllergyCardWorkflowError,
  buildAllergyCardDraft,
  getEffectiveCardStatus,
  mapCertainty,
  mapSeverity,
  normalizeAllergenName,
  type IssuanceReport,
} from './allergy-card-workflow'

const report = (overrides: Partial<IssuanceReport> = {}): IssuanceReport => ({
  id: '00000000-0000-4000-8000-000000000001',
  report_code: 'ADR-001',
  organization: 'Bệnh viện A',
  organization_id: '00000000-0000-4000-8000-000000000002',
  patient_name: 'Nguyễn Văn A',
  patient_age: 35,
  patient_gender: 'male',
  adr_description: 'Phát ban và khó thở',
  severity_level: 'hospitalization',
  causality_assessment: 'certain',
  reporter_name: 'BS. Trần B',
  reporter_profession: 'Bác sĩ',
  reporter_phone: '0900000000',
  updated_at: '2026-09-13T00:00:00.000Z',
  suspected_drugs: [
    { id: '00000000-0000-4000-8000-000000000003', drug_name: ' Amoxicillin ' },
  ],
  ...overrides,
})

describe('allergy-card workflow mappings', () => {
  it('maps certainty and severity conservatively', () => {
    expect(mapCertainty('certain')).toBe('confirmed')
    expect(mapCertainty('probable')).toBe('suspected')
    expect(mapSeverity('death')).toBe('life_threatening')
    expect(mapSeverity('hospitalization')).toBe('severe')
    expect(mapSeverity('not_serious')).toBeUndefined()
  })

  it('normalizes allergen names for duplicate detection', () => {
    expect(normalizeAllergenName('  Amoxicillin   500 mg ')).toBe('amoxicillin 500 mg')
  })

  it('builds a locked draft from the report', () => {
    const draft = buildAllergyCardDraft(
      report(),
      { report_id: report().id, report_updated_at: report().updated_at, supplements: {} },
      new Date('2026-09-12T18:00:00.000Z')
    )

    expect(draft.issued_date).toBe('2026-09-13')
    expect(draft.doctor_source).toBe('reporter')
    expect(draft.allergies).toEqual([
      expect.objectContaining({
        allergen_name: 'Amoxicillin',
        certainty_level: 'confirmed',
        severity_level: 'severe',
        source_type: 'report',
      }),
    ])
  })

  it('requires a doctor when the reporter is not a doctor', () => {
    expect(() =>
      buildAllergyCardDraft(
        report({ reporter_profession: 'Dược sĩ' }),
        { report_id: report().id, report_updated_at: report().updated_at, supplements: {} }
      )
    ).toThrow(AllergyCardWorkflowError)
  })

  it('allows filling a missing drug name without overwriting report data', () => {
    const missingReport = report({
      suspected_drugs: [{ id: '00000000-0000-4000-8000-000000000003', drug_name: '' }],
    })
    const draft = buildAllergyCardDraft(missingReport, {
      report_id: missingReport.id,
      report_updated_at: missingReport.updated_at,
      supplements: {
        missing_drugs: [{
          source_report_drug_id: missingReport.suspected_drugs[0].id,
          allergen_name: 'Ceftriaxone',
        }],
      },
    })

    expect(draft.allergies[0]).toMatchObject({
      allergen_name: 'Ceftriaxone',
      source_type: 'manual_missing',
    })
  })
})

describe('effective card status', () => {
  it('derives expiry without mutating the stored status', () => {
    expect(getEffectiveCardStatus('active', '2026-09-12', '2026-09-13')).toBe('expired')
    expect(getEffectiveCardStatus('active', '2026-09-13', '2026-09-13')).toBe('active')
    expect(getEffectiveCardStatus('inactive', null, '2026-09-13')).toBe('inactive')
  })
})

