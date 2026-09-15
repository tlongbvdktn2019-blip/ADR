export type TriState = 'yes' | 'no' | 'unknown'

export type CausalityLevel =
  | 'certain'
  | 'probable'
  | 'possible'
  | 'unlikely'
  | 'unclassified'
  | 'unclassifiable'

export type DataQuality = 'sufficient' | 'incomplete' | 'unassessable'

export interface AIConsultantDrugContext {
  clientRef: string
  name: string
  commercialName?: string
  dosageForm?: string
  dosage?: string
  frequency?: string
  route?: string
  indication?: string
  startDate?: string
  endDate?: string
  dechallenge: string
  rechallenge: string
}

export interface AIConsultantContext {
  clinicalFacts: Array<{
    id: string
    label: string
    value: string
  }>
  patient: {
    ageAtReaction?: string
    gender?: string
    weightKg?: number
    medicalHistory?: string
  }
  reaction: {
    occurrenceDate: string
    onsetDescription?: string
    description: string
    relatedTests?: string
    treatmentResponse?: string
    severity: string
    outcome: string
  }
  suspectedDrugs: AIConsultantDrugContext[]
  concurrentDrugs: Array<{
    name: string
    dosageFormStrength?: string
    startDate?: string
    endDate?: string
  }>
}

export interface ContextBuildResult {
  context: AIConsultantContext
  contextHash: string
  missingFields: string[]
  piiWarnings: string[]
  ready: boolean
}

export interface EvidenceSource {
  id: string
  url: string
  title: string
  domain: string
  qualityTier: 1 | 2 | 3 | 4
  accessedAt: string
  claimSummary?: string
  groundingMetadata?: Record<string, unknown>
}

export interface EvidencePacket {
  narrative: string
  sources: EvidenceSource[]
  searchQueries: string[]
  grounded: boolean
}

export interface CriterionEvidence {
  status: TriState
  clinicalFactIds: string[]
  sourceIds: string[]
  rationale: string
}

export interface StructuredDrugAssessment {
  drugRef: string
  timelineFacts: Array<{
    factId: string
    statement: string
    source: 'form' | 'evidence'
  }>
  whoCriteria: {
    temporalRelationship: CriterionEvidence
    alternativeCausesExcluded: CriterionEvidence
    dechallengeResponse: CriterionEvidence
    knownReaction: CriterionEvidence
    rechallengeResponse: CriterionEvidence
    pharmacologicPlausibility: CriterionEvidence
  }
  naranjoAnswers: Array<{
    questionId: `Q${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}`
    answer: TriState
    clinicalFactIds: string[]
    sourceIds: string[]
    rationale: string
  }>
  alternativeCauses: string[]
  missingInformation: string[]
  warnings: string[]
  draftComment: string
}

export interface StructuredAssessment {
  assessmentVersion: string
  caseSummary: string
  drugAssessments: StructuredDrugAssessment[]
  overallMissingInformation: string[]
}

export interface DrugAssessmentResult extends StructuredDrugAssessment {
  whoLevel: CausalityLevel
  naranjoScore: number
  naranjoLevel: CausalityLevel
  dataQuality: DataQuality
}

export interface ConsultationResult {
  assessmentVersion: string
  caseSummary: string
  drugAssessments: DrugAssessmentResult[]
  overallMissingInformation: string[]
  sources: EvidenceSource[]
  grounded: boolean
}

export type ConsultationStatus =
  | 'created'
  | 'retrieving_evidence'
  | 'evidence_ready'
  | 'structuring'
  | 'ready'
  | 'reviewed'
  | 'failed'
  | 'stale'

export interface PublicActorProof {
  sessionToken: string
}
