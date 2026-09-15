import { createHash } from 'crypto'
import { getPatientAgeLabel } from '../patient-age'
import { redactClinicalText } from './redaction'
import { AIConsultantContext, ContextBuildResult } from './types'

interface FormDrugInput {
  id?: string
  client_ref?: string
  drug_name?: string
  commercial_name?: string
  dosage_form?: string
  dosage_and_frequency?: string
  dosage?: string
  frequency?: string
  route_of_administration?: string
  indication?: string
  start_date?: string
  end_date?: string
  reaction_improved_after_stopping?: string
  reaction_reoccurred_after_rechallenge?: string
}

interface FormInput {
  patient_name?: string
  patient_birth_date?: string
  patient_gender?: string
  patient_weight?: number
  reporter_name?: string
  reporter_phone?: string
  reporter_email?: string
  report_code?: string
  organization?: string
  adr_occurrence_date?: string
  reaction_onset_time?: string
  adr_description?: string
  related_tests?: string
  medical_history?: string
  treatment_response?: string
  severity_level?: string
  outcome_after_treatment?: string
  suspected_drugs?: FormDrugInput[]
  concurrent_drugs?: Array<{
    drug_name?: string
    dosage_form_strength?: string
    start_date?: string
    end_date?: string
  }>
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.normalize('NFC').trim() : ''
}

function hashContext(context: AIConsultantContext) {
  return createHash('sha256').update(JSON.stringify(context)).digest('hex')
}

export function buildClinicalContext(formData: FormInput): ContextBuildResult {
  const identifiers = [
    formData.patient_name,
    formData.patient_birth_date,
    formData.reporter_name,
    formData.reporter_phone,
    formData.reporter_email,
    formData.report_code,
    formData.organization,
  ]
  const piiWarnings = new Set<string>()

  const redact = (value: unknown) => {
    const result = redactClinicalText(value, identifiers)
    result.warnings.forEach((warning) => piiWarnings.add(warning))
    return result.value || undefined
  }

  const suspectedDrugs = (formData.suspected_drugs || [])
    .filter((drug) => clean(drug.drug_name))
    .map((drug, index) => ({
      clientRef: clean(drug.client_ref) || clean(drug.id) || `drug-${index + 1}`,
      name: clean(drug.drug_name),
      commercialName: redact(drug.commercial_name),
      dosageForm: redact(drug.dosage_form),
      dosage: redact(drug.dosage || drug.dosage_and_frequency),
      frequency: redact(drug.frequency),
      route: redact(drug.route_of_administration),
      indication: redact(drug.indication),
      startDate: clean(drug.start_date) || undefined,
      endDate: clean(drug.end_date) || undefined,
      dechallenge: clean(drug.reaction_improved_after_stopping) || 'no_information',
      rechallenge: clean(drug.reaction_reoccurred_after_rechallenge) || 'no_information',
    }))

  const context: AIConsultantContext = {
    clinicalFacts: [],
    patient: {
      ageAtReaction:
        formData.patient_birth_date && formData.adr_occurrence_date
          ? getPatientAgeLabel(formData.patient_birth_date, formData.adr_occurrence_date)
          : undefined,
      gender: clean(formData.patient_gender) || undefined,
      weightKg:
        typeof formData.patient_weight === 'number' && formData.patient_weight > 0
          ? formData.patient_weight
          : undefined,
      medicalHistory: redact(formData.medical_history),
    },
    reaction: {
      occurrenceDate: clean(formData.adr_occurrence_date),
      onsetDescription: redact(formData.reaction_onset_time),
      description: redact(formData.adr_description) || '',
      relatedTests: redact(formData.related_tests),
      treatmentResponse: redact(formData.treatment_response),
      severity: clean(formData.severity_level),
      outcome: clean(formData.outcome_after_treatment),
    },
    suspectedDrugs,
    concurrentDrugs: (formData.concurrent_drugs || [])
      .filter((drug) => clean(drug.drug_name))
      .map((drug) => ({
        name: clean(drug.drug_name),
        dosageFormStrength: redact(drug.dosage_form_strength),
        startDate: clean(drug.start_date) || undefined,
        endDate: clean(drug.end_date) || undefined,
      })),
  }

  const addFact = (id: string, label: string, value: unknown) => {
    if (typeof value === 'number' || (typeof value === 'string' && value.trim())) {
      context.clinicalFacts.push({ id, label, value: String(value) })
    }
  }
  addFact('patient.age', 'Tuổi tại thời điểm ADR', context.patient.ageAtReaction)
  addFact('patient.gender', 'Giới tính', context.patient.gender)
  addFact('patient.weight', 'Cân nặng (kg)', context.patient.weightKg)
  addFact('patient.history', 'Tiền sử bệnh', context.patient.medicalHistory)
  addFact('reaction.date', 'Ngày xuất hiện ADR', context.reaction.occurrenceDate)
  addFact('reaction.onset', 'Mô tả thời gian khởi phát', context.reaction.onsetDescription)
  addFact('reaction.description', 'Mô tả ADR', context.reaction.description)
  addFact('reaction.tests', 'Xét nghiệm liên quan', context.reaction.relatedTests)
  addFact('reaction.response', 'Xử trí và đáp ứng', context.reaction.treatmentResponse)
  addFact('reaction.severity', 'Mức độ nghiêm trọng', context.reaction.severity)
  addFact('reaction.outcome', 'Kết quả sau xử trí', context.reaction.outcome)
  context.suspectedDrugs.forEach((drug) => {
    const prefix = `drug.${drug.clientRef}`
    addFact(`${prefix}.name`, 'Tên thuốc nghi ngờ', drug.name)
    addFact(`${prefix}.dose`, 'Liều dùng', drug.dosage)
    addFact(`${prefix}.frequency`, 'Tần suất dùng', drug.frequency)
    addFact(`${prefix}.route`, 'Đường dùng', drug.route)
    addFact(`${prefix}.indication`, 'Chỉ định', drug.indication)
    addFact(`${prefix}.start`, 'Ngày bắt đầu thuốc', drug.startDate)
    addFact(`${prefix}.end`, 'Ngày kết thúc thuốc', drug.endDate)
    addFact(`${prefix}.dechallenge`, 'Đáp ứng khi ngừng thuốc', drug.dechallenge)
    addFact(`${prefix}.rechallenge`, 'Đáp ứng khi dùng lại thuốc', drug.rechallenge)
  })

  const missingFields: string[] = []
  if (!context.reaction.description) missingFields.push('Mô tả ADR')
  if (!context.reaction.occurrenceDate) missingFields.push('Ngày xuất hiện ADR')
  if (context.suspectedDrugs.length === 0) missingFields.push('Ít nhất một thuốc nghi ngờ')
  if (
    context.suspectedDrugs.length > 0 &&
    context.suspectedDrugs.every((drug) => !drug.startDate && !context.reaction.onsetDescription)
  ) {
    missingFields.push('Thời điểm bắt đầu thuốc hoặc mô tả thời gian khởi phát')
  }

  return {
    context,
    contextHash: hashContext(context),
    missingFields,
    piiWarnings: Array.from(piiWarnings),
    ready: missingFields.length === 0,
  }
}
