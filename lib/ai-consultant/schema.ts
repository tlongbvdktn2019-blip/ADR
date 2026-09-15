import { AIConsultantError } from './errors'
import { AIConsultantContext, EvidencePacket, StructuredAssessment, StructuredDrugAssessment, TriState } from './types'

const TRI_STATES = new Set<TriState>(['yes', 'no', 'unknown'])
const QUESTION_IDS = Array.from({ length: 10 }, (_, index) => `Q${index + 1}`)
const WHO_KEYS = [
  'temporalRelationship',
  'alternativeCausesExcluded',
  'dechallengeResponse',
  'knownReaction',
  'rechallengeResponse',
  'pharmacologicPlausibility',
] as const

const criterionSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', enum: ['yes', 'no', 'unknown'] },
    clinicalFactIds: { type: 'array', items: { type: 'string' } },
    sourceIds: { type: 'array', items: { type: 'string' } },
    rationale: { type: 'string' },
  },
  required: ['status', 'clinicalFactIds', 'sourceIds', 'rationale'],
}

export const assessmentResponseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    assessmentVersion: { type: 'string' },
    caseSummary: { type: 'string' },
    drugAssessments: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          drugRef: { type: 'string' },
          timelineFacts: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                factId: { type: 'string' },
                statement: { type: 'string' },
                source: { type: 'string', enum: ['form', 'evidence'] },
              },
              required: ['factId', 'statement', 'source'],
            },
          },
          whoCriteria: {
            type: 'object',
            additionalProperties: false,
            properties: Object.fromEntries(WHO_KEYS.map((key) => [key, criterionSchema])),
            required: [...WHO_KEYS],
          },
          naranjoAnswers: {
            type: 'array',
            minItems: 10,
            maxItems: 10,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                questionId: { type: 'string', enum: QUESTION_IDS },
                answer: { type: 'string', enum: ['yes', 'no', 'unknown'] },
                clinicalFactIds: { type: 'array', items: { type: 'string' } },
                sourceIds: { type: 'array', items: { type: 'string' } },
                rationale: { type: 'string' },
              },
              required: ['questionId', 'answer', 'clinicalFactIds', 'sourceIds', 'rationale'],
            },
          },
          alternativeCauses: { type: 'array', items: { type: 'string' } },
          missingInformation: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
          draftComment: { type: 'string' },
        },
        required: [
          'drugRef', 'timelineFacts', 'whoCriteria', 'naranjoAnswers',
          'alternativeCauses', 'missingInformation', 'warnings', 'draftComment',
        ],
      },
    },
    overallMissingInformation: { type: 'array', items: { type: 'string' } },
  },
  required: ['assessmentVersion', 'caseSummary', 'drugAssessments', 'overallMissingInformation'],
} as const

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function validateCriterion(value: unknown) {
  return isRecord(value) &&
    TRI_STATES.has(value.status) &&
    isStringArray(value.clinicalFactIds) &&
    isStringArray(value.sourceIds) &&
    typeof value.rationale === 'string'
}

export function validateStructuredAssessment(
  value: unknown,
  context: AIConsultantContext,
  evidence: EvidencePacket
): StructuredAssessment {
  if (!isRecord(value) || typeof value.assessmentVersion !== 'string' || typeof value.caseSummary !== 'string') {
    throw new AIConsultantError('AI_SCHEMA_INVALID', 'Gemini trả về cấu trúc đánh giá không hợp lệ.', 422)
  }
  if (!Array.isArray(value.drugAssessments) || !isStringArray(value.overallMissingInformation)) {
    throw new AIConsultantError('AI_SCHEMA_INVALID', 'Thiếu danh sách đánh giá thuốc.', 422)
  }

  const expectedDrugRefs = new Set(context.suspectedDrugs.map((drug) => drug.clientRef))
  const seenDrugRefs = new Set<string>()
  const sourceIds = new Set(evidence.sources.map((source) => source.id))
  const allowedFactIds = new Set(context.clinicalFacts.map((fact) => fact.id))

  for (const rawDrug of value.drugAssessments) {
    if (!isRecord(rawDrug) || typeof rawDrug.drugRef !== 'string' || !expectedDrugRefs.has(rawDrug.drugRef)) {
      throw new AIConsultantError('AI_SCHEMA_INVALID', 'Kết quả chứa thuốc không tồn tại trong biểu mẫu.', 422)
    }
    if (seenDrugRefs.has(rawDrug.drugRef)) {
      throw new AIConsultantError('AI_SCHEMA_INVALID', 'Kết quả chứa đánh giá thuốc bị lặp.', 422)
    }
    seenDrugRefs.add(rawDrug.drugRef)

    if (!Array.isArray(rawDrug.timelineFacts) || !isRecord(rawDrug.whoCriteria)) {
      throw new AIConsultantError('AI_SCHEMA_INVALID', 'Thiếu timeline hoặc tiêu chí WHO-UMC.', 422)
    }
    const factIds = new Set<string>()
    for (const fact of rawDrug.timelineFacts) {
      if (!isRecord(fact) || typeof fact.factId !== 'string' || typeof fact.statement !== 'string' || !['form', 'evidence'].includes(fact.source)) {
        throw new AIConsultantError('AI_SCHEMA_INVALID', 'Timeline không hợp lệ.', 422)
      }
      if (!allowedFactIds.has(fact.factId)) {
        throw new AIConsultantError('AI_SCHEMA_INVALID', 'Timeline tham chiếu dữ kiện không do hệ thống cung cấp.', 422)
      }
      factIds.add(fact.factId)
    }

    for (const key of WHO_KEYS) {
      const criterion = rawDrug.whoCriteria[key]
      if (!validateCriterion(criterion)) {
        throw new AIConsultantError('AI_SCHEMA_INVALID', `Tiêu chí WHO-UMC ${key} không hợp lệ.`, 422)
      }
      if (criterion.clinicalFactIds.some((id: string) => !factIds.has(id))) {
        throw new AIConsultantError('AI_SCHEMA_INVALID', 'Tiêu chí WHO-UMC tham chiếu dữ kiện không tồn tại.', 422)
      }
      if (criterion.sourceIds.some((id: string) => !sourceIds.has(id))) {
        throw new AIConsultantError('AI_SOURCE_VALIDATION_FAILED', 'Tiêu chí WHO-UMC tham chiếu nguồn không tồn tại.', 422)
      }
      if (criterion.status !== 'unknown' && criterion.clinicalFactIds.length === 0 && criterion.sourceIds.length === 0) {
        throw new AIConsultantError('AI_SCHEMA_INVALID', 'Tiêu chí WHO-UMC có kết luận nhưng không có dữ kiện hỗ trợ.', 422)
      }
    }

    if (!Array.isArray(rawDrug.naranjoAnswers) || rawDrug.naranjoAnswers.length !== 10) {
      throw new AIConsultantError('AI_SCHEMA_INVALID', 'Phải có đúng 10 câu trả lời Naranjo.', 422)
    }
    const seenQuestions = new Set<string>()
    for (const answer of rawDrug.naranjoAnswers) {
      if (!isRecord(answer) || !QUESTION_IDS.includes(answer.questionId) || !TRI_STATES.has(answer.answer) ||
          !isStringArray(answer.clinicalFactIds) || !isStringArray(answer.sourceIds) || typeof answer.rationale !== 'string') {
        throw new AIConsultantError('AI_SCHEMA_INVALID', 'Câu trả lời Naranjo không hợp lệ.', 422)
      }
      if (seenQuestions.has(answer.questionId)) {
        throw new AIConsultantError('AI_SCHEMA_INVALID', 'Câu trả lời Naranjo bị lặp.', 422)
      }
      seenQuestions.add(answer.questionId)
      if (answer.clinicalFactIds.some((id: string) => !factIds.has(id))) {
        throw new AIConsultantError('AI_SCHEMA_INVALID', 'Naranjo tham chiếu dữ kiện không tồn tại.', 422)
      }
      if (answer.sourceIds.some((id: string) => !sourceIds.has(id))) {
        throw new AIConsultantError('AI_SOURCE_VALIDATION_FAILED', 'Naranjo tham chiếu nguồn không tồn tại.', 422)
      }
      if (answer.answer !== 'unknown' && answer.clinicalFactIds.length === 0 && answer.sourceIds.length === 0) {
        throw new AIConsultantError('AI_SCHEMA_INVALID', 'Câu Naranjo có câu trả lời nhưng không có dữ kiện hỗ trợ.', 422)
      }
    }

    if (!isStringArray(rawDrug.alternativeCauses) || !isStringArray(rawDrug.missingInformation) ||
        !isStringArray(rawDrug.warnings) || typeof rawDrug.draftComment !== 'string') {
      throw new AIConsultantError('AI_SCHEMA_INVALID', 'Chi tiết đánh giá thuốc không hợp lệ.', 422)
    }
  }

  if (seenDrugRefs.size !== expectedDrugRefs.size) {
    throw new AIConsultantError('AI_SCHEMA_INVALID', 'Gemini chưa đánh giá đủ các thuốc nghi ngờ.', 422)
  }

  return value as StructuredAssessment
}
