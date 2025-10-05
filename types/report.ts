export interface ADRReport {
  id: string
  report_code: string
  reporter_id: string
  organization: string
  
  // Patient info (Section A)
  patient_name: string
  patient_birth_date: string
  patient_age: number
  patient_gender: 'male' | 'female'
  patient_weight: number | null
  
  // ADR info (Section B)
  adr_occurrence_date: string
  reaction_onset_time: string | null
  adr_description: string
  related_tests: string | null
  medical_history: string | null
  treatment_response: string | null
  severity_level: 'death' | 'life_threatening' | 'hospitalization' | 'birth_defect' | 'permanent_disability' | 'not_serious'
  outcome_after_treatment: 'death_by_adr' | 'death_unrelated' | 'not_recovered' | 'recovering' | 'recovered_with_sequelae' | 'recovered_without_sequelae' | 'unknown'
  
  // Assessment (Section D)
  causality_assessment: 'certain' | 'probable' | 'possible' | 'unlikely' | 'unclassified' | 'unclassifiable'
  assessment_scale: 'who' | 'naranjo'
  medical_staff_comment: string | null
  
  // Reporter info (Section E)
  reporter_name: string
  reporter_profession: string
  reporter_phone: string | null
  reporter_email: string | null
  report_type: 'initial' | 'follow_up'
  report_date: string
  
  // Approval info
  approval_status: 'pending' | 'approved' | 'rejected'
  approved_by: string | null
  approved_at: string | null
  approval_note: string | null
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Related data
  suspected_drugs?: SuspectedDrug[]
  concurrent_drugs?: ConcurrentDrug[]
}

export interface SuspectedDrug {
  id: string
  report_id: string
  drug_name: string
  commercial_name: string | null
  dosage_form: string | null
  manufacturer: string | null
  batch_number: string | null
  dosage_and_frequency: string | null  // Kept for backward compatibility
  dosage: string | null  // Liều dùng
  frequency: string | null  // Số lần dùng
  route_of_administration: string | null
  treatment_drug_group: string | null  // Nhóm thuốc điều trị
  start_date: string | null
  end_date: string | null
  indication: string | null
  
  // Assessment questions
  reaction_improved_after_stopping: 'yes' | 'no' | 'not_stopped' | 'no_information'
  reaction_reoccurred_after_rechallenge: 'yes' | 'no' | 'not_rechallenged' | 'no_information'
  
  created_at: string
  updated_at: string
}

export interface ConcurrentDrug {
  id: string
  report_id: string
  drug_name: string
  dosage_form_strength: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface ReportListResponse {
  reports: ADRReport[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Label mappings for display
export const SEVERITY_LABELS = {
  'death': 'Tử vong',
  'life_threatening': 'Đe dọa tính mạng', 
  'hospitalization': 'Nhập viện',
  'birth_defect': 'Dị tật thai nhi',
  'permanent_disability': 'Tàn tật vĩnh viễn',
  'not_serious': 'Không nghiêm trọng',
} as const

export const OUTCOME_LABELS = {
  'death_by_adr': 'Tử vong do ADR',
  'death_unrelated': 'Tử vong không liên quan',
  'not_recovered': 'Chưa hồi phục',
  'recovering': 'Đang hồi phục', 
  'recovered_with_sequelae': 'Hồi phục có di chứng',
  'recovered_without_sequelae': 'Hồi phục không di chứng',
  'unknown': 'Không rõ',
} as const

export const CAUSALITY_LABELS = {
  'certain': 'Chắc chắn',
  'probable': 'Có khả năng',
  'possible': 'Có thể',
  'unlikely': 'Không chắc chắn',
  'unclassified': 'Chưa phân loại',
  'unclassifiable': 'Không thể phân loại',
} as const

export const GENDER_LABELS = {
  'male': 'Nam',
  'female': 'Nữ',
} as const

export const REPORT_TYPE_LABELS = {
  'initial': 'Lần đầu',
  'follow_up': 'Bổ sung',
} as const

export const DRUG_REACTION_LABELS = {
  'yes': 'Có',
  'no': 'Không', 
  'not_stopped': 'Không ngừng/giảm liều',
  'not_rechallenged': 'Không tái sử dụng',
  'no_information': 'Không có thông tin',
} as const

export const APPROVAL_STATUS_LABELS = {
  'pending': 'Chưa duyệt',
  'approved': 'Đã duyệt',
  'rejected': 'Từ chối',
} as const


