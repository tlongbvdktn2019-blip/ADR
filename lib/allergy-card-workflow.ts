import type {
  AllergyCardCreateInput,
  AllergyCardDraft,
  AllergyCardDraftAllergy,
  AllergyCardStatus,
  CertaintyLevel,
  PatientGender,
  SeverityLevel,
} from '@/types/allergy-card'

export const ASIA_HO_CHI_MINH_TIME_ZONE = 'Asia/Ho_Chi_Minh'

export interface IssuanceReportDrug {
  id: string
  drug_name: string | null
}

export interface IssuanceReport {
  id: string
  report_code: string
  organization: string
  organization_id: string
  patient_name: string
  patient_age: number
  patient_gender: PatientGender
  adr_description: string
  severity_level: string
  causality_assessment: string
  reporter_name: string
  reporter_profession: string
  reporter_phone: string | null
  updated_at: string
  suspected_drugs: IssuanceReportDrug[]
}

export class AllergyCardWorkflowError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly fieldErrors: Record<string, string> = {}
  ) {
    super(message)
    this.name = 'AllergyCardWorkflowError'
  }
}

export function normalizeAllergenName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi-VN')
}

export function mapCertainty(causality: string): CertaintyLevel {
  return causality === 'certain' ? 'confirmed' : 'suspected'
}

export function mapSeverity(severity: string): SeverityLevel | undefined {
  if (severity === 'death' || severity === 'life_threatening') return 'life_threatening'
  if (['hospitalization', 'permanent_disability', 'birth_defect'].includes(severity)) return 'severe'
  return undefined
}

export function getTodayInHoChiMinh(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ASIA_HO_CHI_MINH_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function getEffectiveCardStatus(
  storedStatus: AllergyCardStatus,
  expiryDate?: string | null,
  today = getTodayInHoChiMinh()
): AllergyCardStatus {
  if (storedStatus === 'inactive') return 'inactive'
  if (storedStatus === 'expired' || (expiryDate && expiryDate < today)) return 'expired'
  return 'active'
}

function validateSupplements(input: AllergyCardCreateInput, report: IssuanceReport) {
  const fieldErrors: Record<string, string> = {}
  const supplements = input.supplements || {}
  const doctorComesFromReport = report.reporter_profession.trim().toLocaleLowerCase('vi-VN') === 'bác sĩ'

  if (!doctorComesFromReport && !supplements.doctor_name?.trim()) {
    fieldErrors.doctor_name = 'Vui lòng nhập bác sĩ xác nhận chẩn đoán'
  }

  if (supplements.expiry_date && supplements.expiry_date < getTodayInHoChiMinh()) {
    fieldErrors.expiry_date = 'Ngày hết hạn không được trước ngày cấp'
  }

  const missingDrugIds = new Set(
    report.suspected_drugs.filter((drug) => !drug.drug_name?.trim()).map((drug) => drug.id)
  )
  const suppliedMissingIds = new Set(
    (supplements.missing_drugs || [])
      .filter((item) => item.source_report_drug_id && item.allergen_name.trim())
      .map((item) => item.source_report_drug_id as string)
  )

  for (const missingId of Array.from(missingDrugIds)) {
    if (!suppliedMissingIds.has(missingId)) {
      fieldErrors[`missing_drug.${missingId}`] = 'Vui lòng bổ sung tên thuốc/dị nguyên còn thiếu'
    }
  }

  if (report.suspected_drugs.length === 0) {
    const manualAllergies = supplements.manual_allergies || []
    if (!manualAllergies.some((item) => item.allergen_name.trim())) {
      fieldErrors.manual_allergies = 'Phải có ít nhất một dị nguyên/thuốc'
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new AllergyCardWorkflowError(
      'Vui lòng hoàn thiện các thông tin còn thiếu',
      'VALIDATION_ERROR',
      fieldErrors
    )
  }
}

export function buildAllergyCardDraft(
  report: IssuanceReport,
  input: AllergyCardCreateInput,
  now = new Date()
): AllergyCardDraft {
  validateSupplements(input, report)

  const supplements = input.supplements || {}
  const certainty = mapCertainty(report.causality_assessment)
  const severity = mapSeverity(report.severity_level)
  const missingDrugById = new Map(
    (supplements.missing_drugs || []).map((item) => [item.source_report_drug_id, item])
  )

  const allergies: AllergyCardDraftAllergy[] = report.suspected_drugs.map((drug) => {
    const supplement = missingDrugById.get(drug.id)
    const allergenName = drug.drug_name?.trim() || supplement?.allergen_name.trim() || ''

    return {
      allergen_name: allergenName,
      normalized_name: normalizeAllergenName(allergenName),
      certainty_level: certainty,
      clinical_manifestation: report.adr_description,
      severity_level: supplement?.severity_level || severity,
      reaction_type: supplement?.reaction_type?.trim() || undefined,
      source_type: drug.drug_name?.trim() ? 'report' : 'manual_missing',
      source_report_drug_id: drug.id,
    }
  })

  for (const manual of supplements.manual_allergies || []) {
    if (!manual.allergen_name.trim()) continue
    allergies.push({
      allergen_name: manual.allergen_name.trim(),
      normalized_name: normalizeAllergenName(manual.allergen_name),
      certainty_level: manual.certainty_level || certainty,
      clinical_manifestation: manual.clinical_manifestation?.trim() || report.adr_description,
      severity_level: manual.severity_level || severity,
      reaction_type: manual.reaction_type?.trim() || undefined,
      source_type: 'manual_missing',
    })
  }

  const uniqueAllergies = Array.from(
    new Map(allergies.map((allergy) => [allergy.normalized_name, allergy])).values()
  )
  if (uniqueAllergies.length === 0 || uniqueAllergies.some((item) => !item.normalized_name)) {
    throw new AllergyCardWorkflowError(
      'Phải có ít nhất một dị nguyên/thuốc hợp lệ',
      'VALIDATION_ERROR',
      { allergies: 'Phải có ít nhất một dị nguyên/thuốc hợp lệ' }
    )
  }

  const doctorFromReport = report.reporter_profession.trim().toLocaleLowerCase('vi-VN') === 'bác sĩ'
  const issuedDate = getTodayInHoChiMinh(now)
  const expiryDate = supplements.expiry_date?.trim() || undefined
  if (expiryDate && expiryDate < issuedDate) {
    throw new AllergyCardWorkflowError(
      'Ngày hết hạn không được trước ngày cấp',
      'VALIDATION_ERROR',
      { expiry_date: 'Ngày hết hạn không được trước ngày cấp' }
    )
  }

  return {
    report_id: report.id,
    report_code: report.report_code,
    source_report_updated_at: report.updated_at,
    organization_id: report.organization_id,
    patient_name: report.patient_name,
    patient_gender: report.patient_gender,
    patient_age: report.patient_age,
    patient_id_number: supplements.patient_id_number?.trim() || undefined,
    hospital_name: report.organization,
    department: supplements.department?.trim() || undefined,
    doctor_name: doctorFromReport ? report.reporter_name : supplements.doctor_name!.trim(),
    doctor_phone: doctorFromReport
      ? report.reporter_phone?.trim() || undefined
      : supplements.doctor_phone?.trim() || undefined,
    doctor_source: doctorFromReport ? 'reporter' : 'manual',
    issued_date: issuedDate,
    expiry_date: expiryDate,
    notes: supplements.notes?.trim() || undefined,
    allergies: uniqueAllergies,
  }
}

export function getMissingIssuanceFields(report: IssuanceReport): string[] {
  const missing: string[] = []
  if (report.reporter_profession.trim().toLocaleLowerCase('vi-VN') !== 'bác sĩ') missing.push('doctor_name')
  if (!report.reporter_phone?.trim()) missing.push('doctor_phone')
  if (report.suspected_drugs.length === 0) missing.push('manual_allergies')
  for (const drug of report.suspected_drugs) {
    if (!drug.drug_name?.trim()) missing.push(`missing_drug.${drug.id}`)
  }
  return missing
}
