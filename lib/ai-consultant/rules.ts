import {
  CausalityLevel,
  DataQuality,
  DrugAssessmentResult,
  StructuredDrugAssessment,
  TriState,
  EvidenceSource,
} from './types'

const NARANJO_SCORES: Record<string, Record<TriState, number>> = {
  Q1: { yes: 1, no: 0, unknown: 0 },
  Q2: { yes: 2, no: -1, unknown: 0 },
  Q3: { yes: 1, no: 0, unknown: 0 },
  Q4: { yes: 2, no: -1, unknown: 0 },
  Q5: { yes: -1, no: 2, unknown: 0 },
  Q6: { yes: -1, no: 1, unknown: 0 },
  Q7: { yes: 1, no: 0, unknown: 0 },
  Q8: { yes: 1, no: 0, unknown: 0 },
  Q9: { yes: 1, no: 0, unknown: 0 },
  Q10: { yes: 1, no: 0, unknown: 0 },
}

export function scoreNaranjo(
  answers: StructuredDrugAssessment['naranjoAnswers']
): { score: number; level: CausalityLevel } {
  const score = answers.reduce((total, item) => {
    return total + (NARANJO_SCORES[item.questionId]?.[item.answer] ?? 0)
  }, 0)

  const level: CausalityLevel =
    score >= 9 ? 'certain' : score >= 5 ? 'probable' : score >= 1 ? 'possible' : 'unlikely'

  return { score, level }
}

export function classifyWho(
  criteria: StructuredDrugAssessment['whoCriteria']
): CausalityLevel {
  const temporal = criteria.temporalRelationship.status
  const alternativesExcluded = criteria.alternativeCausesExcluded.status
  const dechallenge = criteria.dechallengeResponse.status
  const known = criteria.knownReaction.status
  const rechallenge = criteria.rechallengeResponse.status
  const plausible = criteria.pharmacologicPlausibility.status

  if (temporal === 'no') return 'unlikely'

  const coreStatuses = [temporal, alternativesExcluded, dechallenge, known, plausible]
  if (coreStatuses.every((status) => status === 'unknown')) return 'unclassifiable'

  if (
    temporal === 'yes' &&
    alternativesExcluded === 'yes' &&
    dechallenge === 'yes' &&
    known === 'yes' &&
    plausible === 'yes' &&
    rechallenge !== 'no'
  ) {
    return 'certain'
  }

  if (
    temporal === 'yes' &&
    alternativesExcluded === 'yes' &&
    dechallenge === 'yes' &&
    rechallenge !== 'no'
  ) {
    return 'probable'
  }

  if (temporal === 'yes') return 'possible'
  if (temporal === 'unknown') return 'unclassified'
  return 'unclassifiable'
}

export function getDataQuality(
  assessment: StructuredDrugAssessment
): DataQuality {
  const criteria = Object.values(assessment.whoCriteria)
  const cannotAssess =
    assessment.whoCriteria.temporalRelationship.status === 'unknown' &&
    assessment.naranjoAnswers.find((answer) => answer.questionId === 'Q2')?.answer === 'unknown'

  if (cannotAssess) return 'unassessable'
  if (criteria.some((criterion) => criterion.status === 'unknown')) return 'incomplete'
  return 'sufficient'
}

export function calculateDrugAssessment(
  assessment: StructuredDrugAssessment,
  sources: EvidenceSource[] = []
): DrugAssessmentResult {
  const sourceMap = new Map(sources.map((source) => [source.id, source]))
  const onlyLowQualitySources = (sourceIds: string[]) =>
    sourceIds.length > 0 && sourceIds.every((id) => sourceMap.get(id)?.qualityTier === 4)
  const whoCriteria = Object.fromEntries(Object.entries(assessment.whoCriteria).map(([key, criterion]) => {
    if (criterion.clinicalFactIds.length === 0 && criterion.status !== 'unknown' && onlyLowQualitySources(criterion.sourceIds)) {
      return [key, { ...criterion, status: 'unknown' as const, rationale: `Nguồn cấp 4 không đủ để kết luận. ${criterion.rationale}` }]
    }
    return [key, criterion]
  })) as StructuredDrugAssessment['whoCriteria']
  const naranjoAnswers = assessment.naranjoAnswers.map((answer) => {
    if (answer.clinicalFactIds.length === 0 && answer.answer !== 'unknown' && onlyLowQualitySources(answer.sourceIds)) {
      return { ...answer, answer: 'unknown' as const, rationale: `Nguồn cấp 4 không đủ để chấm điểm. ${answer.rationale}` }
    }
    return answer
  })
  const normalized = { ...assessment, whoCriteria, naranjoAnswers }
  const naranjo = scoreNaranjo(naranjoAnswers)
  return {
    ...normalized,
    whoLevel: classifyWho(whoCriteria),
    naranjoScore: naranjo.score,
    naranjoLevel: naranjo.level,
    dataQuality: getDataQuality(normalized),
  }
}
