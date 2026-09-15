import { describe, expect, it } from 'vitest'
import { calculateDrugAssessment, classifyWho, scoreNaranjo } from './rules'
import { CriterionEvidence, StructuredDrugAssessment, TriState } from './types'

function answer(questionId: StructuredDrugAssessment['naranjoAnswers'][number]['questionId'], value: TriState) {
  return { questionId, answer: value, clinicalFactIds: [], sourceIds: [], rationale: '' }
}

function criterion(status: TriState): CriterionEvidence {
  return { status, clinicalFactIds: [], sourceIds: [], rationale: '' }
}

describe('Naranjo rule engine', () => {
  it('calculates the documented maximum score and definite classification', () => {
    const answers = [
      answer('Q1', 'yes'), answer('Q2', 'yes'), answer('Q3', 'yes'), answer('Q4', 'yes'),
      answer('Q5', 'no'), answer('Q6', 'no'), answer('Q7', 'yes'), answer('Q8', 'yes'),
      answer('Q9', 'yes'), answer('Q10', 'yes'),
    ]
    expect(scoreNaranjo(answers)).toEqual({ score: 13, level: 'certain' })
  })

  it('does not turn unknown answers into evidence', () => {
    const answers = Array.from({ length: 10 }, (_, index) =>
      answer(`Q${index + 1}` as StructuredDrugAssessment['naranjoAnswers'][number]['questionId'], 'unknown')
    )
    expect(scoreNaranjo(answers)).toEqual({ score: 0, level: 'unlikely' })
  })
})

describe('WHO-UMC rule engine', () => {
  it('requires all core evidence for certain', () => {
    expect(classifyWho({
      temporalRelationship: criterion('yes'),
      alternativeCausesExcluded: criterion('yes'),
      dechallengeResponse: criterion('yes'),
      knownReaction: criterion('yes'),
      rechallengeResponse: criterion('unknown'),
      pharmacologicPlausibility: criterion('yes'),
    })).toBe('certain')
  })

  it('returns unclassifiable when all core criteria are unknown', () => {
    expect(classifyWho({
      temporalRelationship: criterion('unknown'),
      alternativeCausesExcluded: criterion('unknown'),
      dechallengeResponse: criterion('unknown'),
      knownReaction: criterion('unknown'),
      rechallengeResponse: criterion('unknown'),
      pharmacologicPlausibility: criterion('unknown'),
    })).toBe('unclassifiable')
  })

  it('does not use tier 4 sources as sole evidence', () => {
    const yesFromWeakSource = { status: 'yes' as const, clinicalFactIds: [], sourceIds: ['source-1'], rationale: 'Nguồn web' }
    const drug: StructuredDrugAssessment = {
      drugRef: 'drug-1',
      timelineFacts: [],
      whoCriteria: {
        temporalRelationship: yesFromWeakSource,
        alternativeCausesExcluded: yesFromWeakSource,
        dechallengeResponse: yesFromWeakSource,
        knownReaction: yesFromWeakSource,
        rechallengeResponse: yesFromWeakSource,
        pharmacologicPlausibility: yesFromWeakSource,
      },
      naranjoAnswers: Array.from({ length: 10 }, (_, index) => answer(
        `Q${index + 1}` as StructuredDrugAssessment['naranjoAnswers'][number]['questionId'],
        'yes'
      )).map((item) => ({ ...item, sourceIds: ['source-1'] })),
      alternativeCauses: [], missingInformation: [], warnings: [], draftComment: '',
    }
    const result = calculateDrugAssessment(drug, [{
      id: 'source-1', url: 'https://example.com', title: 'Unknown', domain: 'example.com',
      qualityTier: 4, accessedAt: '2026-09-15',
    }])
    expect(result.whoLevel).toBe('unclassifiable')
    expect(result.naranjoScore).toBe(0)
  })
})
