import { describe, expect, it } from 'vitest'
import { validateStructuredAssessment } from './schema'
import { AIConsultantContext, EvidencePacket, StructuredDrugAssessment } from './types'

const context: AIConsultantContext = {
  clinicalFacts: [{ id: 'fact-1', label: 'Mô tả ADR', value: 'Phát ban' }],
  patient: {},
  reaction: { occurrenceDate: '2026-09-01', description: 'Phát ban', severity: 'not_serious', outcome: 'recovering' },
  suspectedDrugs: [{ clientRef: 'drug-1', name: 'Amoxicillin', dechallenge: 'yes', rechallenge: 'not_rechallenged' }],
  concurrentDrugs: [],
}

const evidence: EvidencePacket = {
  narrative: '',
  grounded: true,
  searchQueries: [],
  sources: [{ id: 'source-1', url: 'https://who.int/a', title: 'WHO', domain: 'who.int', qualityTier: 1, accessedAt: '2026-09-15' }],
}

function validDrug(): StructuredDrugAssessment {
  const criterion = { status: 'unknown' as const, clinicalFactIds: ['fact-1'], sourceIds: [], rationale: 'Thiếu dữ liệu' }
  return {
    drugRef: 'drug-1',
    timelineFacts: [{ factId: 'fact-1', statement: 'ADR được ghi nhận', source: 'form' }],
    whoCriteria: {
      temporalRelationship: criterion,
      alternativeCausesExcluded: criterion,
      dechallengeResponse: criterion,
      knownReaction: criterion,
      rechallengeResponse: criterion,
      pharmacologicPlausibility: criterion,
    },
    naranjoAnswers: Array.from({ length: 10 }, (_, index) => ({
      questionId: `Q${index + 1}` as StructuredDrugAssessment['naranjoAnswers'][number]['questionId'],
      answer: 'unknown' as const,
      clinicalFactIds: ['fact-1'],
      sourceIds: [],
      rationale: 'Thiếu dữ liệu',
    })),
    alternativeCauses: [],
    missingInformation: [],
    warnings: [],
    draftComment: '',
  }
}

describe('AI structured assessment validator', () => {
  it('accepts a complete assessment for every requested drug', () => {
    const value = { assessmentVersion: 'v1', caseSummary: 'Ca ADR', drugAssessments: [validDrug()], overallMissingInformation: [] }
    expect(validateStructuredAssessment(value, context, evidence)).toEqual(value)
  })

  it('rejects source identifiers that were not grounded', () => {
    const drug = validDrug()
    drug.whoCriteria.knownReaction.sourceIds = ['invented-source']
    expect(() => validateStructuredAssessment({
      assessmentVersion: 'v1', caseSummary: 'Ca ADR', drugAssessments: [drug], overallMissingInformation: [],
    }, context, evidence)).toThrow(/nguồn không tồn tại/i)
  })
})
