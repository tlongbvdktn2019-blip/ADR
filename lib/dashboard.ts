import {
  APPROVAL_STATUS_LABELS,
  CAUSALITY_LABELS,
  OUTCOME_LABELS,
  REPORT_TYPE_LABELS,
  SEVERITY_LABELS,
} from '@/types/report'

export type DashboardSectionKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export interface DashboardFilters {
  year: string
  organization: string
  approvalStatus: string
  severity: string
  reportType: string
  profession: string
}

export interface DashboardFilterOption {
  value: string
  label: string
}

export interface DashboardSectionMeta {
  key: DashboardSectionKey
  shortLabel: string
  title: string
  description: string
}

export interface DashboardSectionSummary extends DashboardSectionMeta {
  completeCount: number
  missingCount: number
  completionRate: number
}

export interface DashboardKpis {
  totalReports: number
  seriousReports: number
  pendingReports: number
  completenessRate: number
  followUpRate: number
  preventableRate: number
  newReportsThisMonth: number
  newReportsToday: number
}

export interface DashboardQualitySignal {
  key: string
  label: string
  count: number
  percentage: number
}

export interface DashboardMissingField {
  key: string
  label: string
  sectionKey: DashboardSectionKey
  count: number
  percentage: number
}

export interface DashboardReportPreview {
  id: string
  reportCode: string
  patientName: string
  organization: string
  reportDate: string
  createdAt: string
  severityLevel: string
  severityLabel: string
  approvalStatus: string
  approvalLabel: string
  reportType: string
  reportTypeLabel: string
  reporterName: string
  reporterProfession: string
  suspectedDrugCount: number
  concurrentDrugCount: number
  completedSections: number
  sectionStatus: Record<DashboardSectionKey, boolean>
  queueReasons: string[]
  preventabilityCategory: string | null
}

export interface DashboardStatsResponse {
  filters: DashboardFilters
  kpis: DashboardKpis
  sectionSummaries: DashboardSectionSummary[]
  qualitySignals: DashboardQualitySignal[]
  missingFields: DashboardMissingField[]
  pendingQueue: DashboardReportPreview[]
  reportPreviews: DashboardReportPreview[]
}

export interface DashboardBreakdownDatum {
  key: string
  label: string
  count: number
  percentage: number
}

export interface DashboardChartData {
  ageDistribution?: Array<{ ageRange: string; count: number; percentage: number }>
  severityDistribution?: Array<{ severity: string; severityKey: string; count: number; percentage: number }>
  outcomeDistribution?: Array<{ outcome: string; outcomeKey: string; count: number; percentage: number }>
  genderDistribution?: Array<{ gender: string; genderKey: string; count: number; percentage: number }>
  reportsByDate?: Array<{ date: string; dateKey: string; total: number; serious: number; nonSerious: number }>
  topFacilities?: Array<{ facilityName: string; count: number; percentage: number }>
  topDrugs?: Array<{ drugName: string; count: number; commercialNames: string; percentage: number }>
  treatmentDrugGroups?: Array<{ groupName: string; count: number; percentage: number }>
  occupationAnalysis?: Array<{ profession: string; count: number; percentage: number }>
  drugDistribution?: Array<{ drugName: string; count: number; percentage: number }>
  routeDistribution?: DashboardBreakdownDatum[]
  reportTypeDistribution?: DashboardBreakdownDatum[]
  causalityDistribution?: DashboardBreakdownDatum[]
  assessmentScaleDistribution?: DashboardBreakdownDatum[]
  preventabilityDistribution?: DashboardBreakdownDatum[]
  severityAssessmentDistribution?: DashboardBreakdownDatum[]
}

export interface DashboardChartsResponse {
  success: boolean
  data: DashboardChartData
}

export interface DashboardReportRow {
  id: string
  report_code: string
  organization: string
  patient_name: string
  patient_birth_date: string | null
  patient_age: number | null
  patient_gender: string | null
  patient_weight: number | null
  adr_occurrence_date: string | null
  reaction_onset_time: string | null
  adr_description: string | null
  related_tests: string | null
  medical_history: string | null
  treatment_response: string | null
  severity_level: string | null
  outcome_after_treatment: string | null
  causality_assessment: string | null
  assessment_scale: string | null
  medical_staff_comment: string | null
  reporter_name: string
  reporter_profession: string | null
  reporter_phone: string | null
  reporter_email: string | null
  report_type: string | null
  report_date: string | null
  severity_assessment_result: string | null
  preventability_assessment_result: string | null
  approval_status: string | null
  created_at: string
}

export interface DashboardDrugRow {
  report_id: string
  drug_name: string | null
  commercial_name?: string | null
  dosage?: string | null
  frequency?: string | null
  dosage_and_frequency?: string | null
  route_of_administration?: string | null
  treatment_drug_group?: string | null
  start_date?: string | null
  indication?: string | null
  reaction_improved_after_stopping?: string | null
  reaction_reoccurred_after_rechallenge?: string | null
}

export interface DashboardConcurrentDrugRow {
  report_id: string
  id: string
}

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilters = {
  year: 'all',
  organization: 'all',
  approvalStatus: 'all',
  severity: 'all',
  reportType: 'all',
  profession: 'all',
}

export const DASHBOARD_SECTION_META: DashboardSectionMeta[] = [
  {
    key: 'A',
    shortLabel: 'Phần A',
    title: 'Bệnh nhân',
    description: 'Nhân khẩu học và thông tin nền của người bệnh',
  },
  {
    key: 'B',
    shortLabel: 'Phần B',
    title: 'ADR',
    description: 'Diễn biến phản ứng, xét nghiệm và kết quả xử trí',
  },
  {
    key: 'C',
    shortLabel: 'Phần C',
    title: 'Thuốc nghi ngờ',
    description: 'Hoạt chất nghi ngờ, nhóm điều trị và bối cảnh sử dụng',
  },
  {
    key: 'D',
    shortLabel: 'Phần D',
    title: 'Thẩm định',
    description: 'Đánh giá mối liên quan thuốc - ADR tại đơn vị',
  },
  {
    key: 'E',
    shortLabel: 'Phần E',
    title: 'Người báo cáo',
    description: 'Nguồn báo cáo, nghề nghiệp và thông tin liên hệ',
  },
  {
    key: 'F',
    shortLabel: 'Phần F',
    title: 'Đánh giá',
    description: 'Mức độ nặng và khả năng phòng tránh ADR',
  },
]

export const DASHBOARD_APPROVAL_OPTIONS: DashboardFilterOption[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: APPROVAL_STATUS_LABELS.pending },
  { value: 'approved', label: APPROVAL_STATUS_LABELS.approved },
  { value: 'rejected', label: APPROVAL_STATUS_LABELS.rejected },
]

export const DASHBOARD_SEVERITY_OPTIONS: DashboardFilterOption[] = [
  { value: 'all', label: 'Tất cả mức độ' },
  ...Object.entries(SEVERITY_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
]

export const DASHBOARD_REPORT_TYPE_OPTIONS: DashboardFilterOption[] = [
  { value: 'all', label: 'Tất cả loại báo cáo' },
  { value: 'initial', label: REPORT_TYPE_LABELS.initial },
  { value: 'follow_up', label: REPORT_TYPE_LABELS.follow_up },
]

export const SERIOUS_SEVERITY_KEYS = new Set([
  'death',
  'life_threatening',
  'hospitalization',
  'birth_defect',
  'permanent_disability',
])

export const SEVERITY_ASSESSMENT_LABELS: Record<string, string> = {
  level_1: 'Mức độ 1',
  level_2: 'Mức độ 2',
  level_3: 'Mức độ 3',
  level_4: 'Mức độ 4',
  level_5: 'Mức độ 5',
  unknown: 'Chưa đánh giá',
}

export const PREVENTABILITY_LABELS: Record<string, string> = {
  preventable: 'Có thể phòng tránh',
  not_preventable: 'Không thể phòng tránh',
  insufficient_information: 'Thiếu thông tin',
  incomplete: 'Chưa hoàn thành',
  unknown: 'Chưa đánh giá',
}

export function parseDashboardFilters(searchParams: URLSearchParams): DashboardFilters {
  return {
    year: searchParams.get('year') || DEFAULT_DASHBOARD_FILTERS.year,
    organization: searchParams.get('organization') || DEFAULT_DASHBOARD_FILTERS.organization,
    approvalStatus: searchParams.get('approvalStatus') || DEFAULT_DASHBOARD_FILTERS.approvalStatus,
    severity: searchParams.get('severity') || DEFAULT_DASHBOARD_FILTERS.severity,
    reportType: searchParams.get('reportType') || DEFAULT_DASHBOARD_FILTERS.reportType,
    profession: searchParams.get('profession') || DEFAULT_DASHBOARD_FILTERS.profession,
  }
}

export function buildDashboardQueryParams(filters: DashboardFilters): URLSearchParams {
  const params = new URLSearchParams()

  const entries = Object.entries(filters) as Array<[keyof DashboardFilters, string]>
  entries.forEach(([key, value]) => {
    if (value && value !== 'all') {
      params.set(key, value)
    }
  })

  return params
}

export function getSeverityLabel(value: string | null | undefined): string {
  if (!value) {
    return 'Chưa xác định'
  }

  return SEVERITY_LABELS[value as keyof typeof SEVERITY_LABELS] || value
}

export function getOutcomeLabel(value: string | null | undefined): string {
  if (!value) {
    return 'Chưa xác định'
  }

  return OUTCOME_LABELS[value as keyof typeof OUTCOME_LABELS] || value
}

export function getCausalityLabel(value: string | null | undefined): string {
  if (!value) {
    return 'Chưa xác định'
  }

  return CAUSALITY_LABELS[value as keyof typeof CAUSALITY_LABELS] || value
}

export function getApprovalLabel(value: string | null | undefined): string {
  if (!value) {
    return 'Chưa xác định'
  }

  return APPROVAL_STATUS_LABELS[value as keyof typeof APPROVAL_STATUS_LABELS] || value
}

export function getReportTypeLabel(value: string | null | undefined): string {
  if (!value) {
    return 'Chưa xác định'
  }

  return REPORT_TYPE_LABELS[value as keyof typeof REPORT_TYPE_LABELS] || value
}

export function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false
  }

  if (typeof value === 'string') {
    return value.trim().length > 0
  }

  if (typeof value === 'number') {
    return Number.isFinite(value)
  }

  return true
}

export function normalizeText(value: string | null | undefined): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function parseSeverityAssessmentCategory(value: string | null | undefined): string {
  const normalized = normalizeText(value)

  if (!normalized) {
    return 'unknown'
  }

  if (normalized.includes('muc do 5')) return 'level_5'
  if (normalized.includes('muc do 4')) return 'level_4'
  if (normalized.includes('muc do 3')) return 'level_3'
  if (normalized.includes('muc do 2')) return 'level_2'
  if (normalized.includes('muc do 1')) return 'level_1'

  return 'unknown'
}

export function parsePreventabilityCategory(value: string | null | undefined): string {
  const normalized = normalizeText(value)

  if (!normalized) {
    return 'unknown'
  }

  if (normalized.includes('co the phong tranh')) return 'preventable'
  if (normalized.includes('khong the phong tranh')) return 'not_preventable'
  if (normalized.includes('thieu thong tin') || normalized.includes('khong danh gia duoc')) {
    return 'insufficient_information'
  }
  if (normalized.includes('chua hoan thanh')) return 'incomplete'

  return 'unknown'
}

export function getSeverityAssessmentLabel(value: string): string {
  return SEVERITY_ASSESSMENT_LABELS[value] || value
}

export function getPreventabilityLabel(value: string): string {
  return PREVENTABILITY_LABELS[value] || value
}

export function getReportSectionStatus(
  report: DashboardReportRow,
  suspectedDrugs: DashboardDrugRow[],
): Record<DashboardSectionKey, boolean> {
  const hasDrugDose = suspectedDrugs.some((drug) => isFilled(drug.dosage) || isFilled(drug.dosage_and_frequency))
  const hasDrugFrequency = suspectedDrugs.some((drug) => isFilled(drug.frequency) || isFilled(drug.dosage_and_frequency))

  return {
    A:
      isFilled(report.patient_name) &&
      isFilled(report.patient_birth_date) &&
      report.patient_age !== null &&
      report.patient_age !== undefined &&
      isFilled(report.patient_gender) &&
      report.patient_weight !== null &&
      report.patient_weight !== undefined &&
      Number(report.patient_weight) > 0,
    B:
      isFilled(report.adr_occurrence_date) &&
      isFilled(report.reaction_onset_time) &&
      isFilled(report.adr_description) &&
      isFilled(report.related_tests) &&
      isFilled(report.medical_history) &&
      isFilled(report.treatment_response) &&
      isFilled(report.severity_level) &&
      isFilled(report.outcome_after_treatment),
    C:
      suspectedDrugs.length > 0 &&
      suspectedDrugs.every((drug) => isFilled(drug.drug_name)) &&
      hasDrugDose &&
      hasDrugFrequency &&
      suspectedDrugs.some((drug) => isFilled(drug.route_of_administration)) &&
      suspectedDrugs.some((drug) => isFilled(drug.treatment_drug_group)) &&
      suspectedDrugs.some((drug) => isFilled(drug.start_date)) &&
      suspectedDrugs.some((drug) => isFilled(drug.indication)) &&
      suspectedDrugs.every((drug) => isFilled(drug.reaction_improved_after_stopping)) &&
      suspectedDrugs.every((drug) => isFilled(drug.reaction_reoccurred_after_rechallenge)),
    D:
      isFilled(report.causality_assessment) &&
      isFilled(report.assessment_scale) &&
      isFilled(report.medical_staff_comment),
    E:
      isFilled(report.reporter_name) &&
      isFilled(report.reporter_profession) &&
      (isFilled(report.reporter_phone) || isFilled(report.reporter_email)) &&
      isFilled(report.report_type) &&
      isFilled(report.report_date),
    // Section F assessments are recommended, not required.
    F: true,
  }
}

export function buildQueueReasons(
  report: DashboardReportRow,
  sectionStatus: Record<DashboardSectionKey, boolean>,
): string[] {
  const reasons: string[] = []

  if (report.approval_status === 'pending') {
    reasons.push('Chưa duyệt')
  }

  DASHBOARD_SECTION_META.forEach((section) => {
    if (!sectionStatus[section.key]) {
      reasons.push(`Thiếu ${section.shortLabel}`)
    }
  })

  if (SERIOUS_SEVERITY_KEYS.has(report.severity_level || '')) {
    reasons.push('Ca nghiêm trọng')
  }

  return reasons.slice(0, 4)
}
