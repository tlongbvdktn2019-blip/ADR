export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'user'
          organization: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: 'admin' | 'user'
          organization?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'user'
          organization?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      adr_reports: {
        Row: {
          id: string
          report_code: string
          reporter_id: string
          organization: string
          
          // Thông tin bệnh nhân (Phần A)
          patient_name: string
          patient_birth_date: string
          patient_age: number
          patient_gender: 'male' | 'female'
          patient_weight: number | null
          
          // Thông tin ADR (Phần B)
          adr_occurrence_date: string
          adr_description: string
          related_tests: string | null
          medical_history: string | null
          treatment_response: string | null
          severity_level: 'death' | 'life_threatening' | 'hospitalization' | 'birth_defect' | 'permanent_disability' | 'not_serious'
          outcome_after_treatment: 'death_by_adr' | 'death_unrelated' | 'not_recovered' | 'recovering' | 'recovered_with_sequelae' | 'recovered_without_sequelae' | 'unknown'
          
          // Thẩm định ADR (Phần D)
          causality_assessment: 'certain' | 'probable' | 'possible' | 'unlikely' | 'unclassified' | 'unclassifiable'
          assessment_scale: 'who' | 'naranjo'
          medical_staff_comment: string | null
          
          // Thông tin người báo cáo (Phần E)
          reporter_name: string
          reporter_profession: string
          reporter_phone: string | null
          reporter_email: string | null
          report_type: 'initial' | 'follow_up'
          report_date: string
          
          // Thông tin duyệt báo cáo
          approval_status: 'pending' | 'approved' | 'rejected'
          approved_by: string | null
          approved_at: string | null
          approval_note: string | null
          
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          report_code?: string
          reporter_id: string
          organization: string
          
          patient_name: string
          patient_birth_date: string
          patient_age: number
          patient_gender: 'male' | 'female'
          patient_weight?: number | null
          
          adr_occurrence_date: string
          adr_description: string
          related_tests?: string | null
          medical_history?: string | null
          treatment_response?: string | null
          severity_level: 'death' | 'life_threatening' | 'hospitalization' | 'birth_defect' | 'permanent_disability' | 'not_serious'
          outcome_after_treatment: 'death_by_adr' | 'death_unrelated' | 'not_recovered' | 'recovering' | 'recovered_with_sequelae' | 'recovered_without_sequelae' | 'unknown'
          
          causality_assessment: 'certain' | 'probable' | 'possible' | 'unlikely' | 'unclassified' | 'unclassifiable'
          assessment_scale: 'who' | 'naranjo'
          medical_staff_comment?: string | null
          
          reporter_name: string
          reporter_profession: string
          reporter_phone?: string | null
          reporter_email?: string | null
          report_type: 'initial' | 'follow_up'
          report_date: string
          
          approval_status?: 'pending' | 'approved' | 'rejected'
          approved_by?: string | null
          approved_at?: string | null
          approval_note?: string | null
          
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          report_code?: string
          reporter_id?: string
          organization?: string
          
          patient_name?: string
          patient_birth_date?: string
          patient_age?: number
          patient_gender?: 'male' | 'female'
          patient_weight?: number | null
          
          adr_occurrence_date?: string
          adr_description?: string
          related_tests?: string | null
          medical_history?: string | null
          treatment_response?: string | null
          severity_level?: 'death' | 'life_threatening' | 'hospitalization' | 'birth_defect' | 'permanent_disability' | 'not_serious'
          outcome_after_treatment?: 'death_by_adr' | 'death_unrelated' | 'not_recovered' | 'recovering' | 'recovered_with_sequelae' | 'recovered_without_sequelae' | 'unknown'
          
          causality_assessment?: 'certain' | 'probable' | 'possible' | 'unlikely' | 'unclassified' | 'unclassifiable'
          assessment_scale?: 'who' | 'naranjo'
          medical_staff_comment?: string | null
          
          reporter_name?: string
          reporter_profession?: string
          reporter_phone?: string | null
          reporter_email?: string | null
          report_type?: 'initial' | 'follow_up'
          report_date?: string
          
          approval_status?: 'pending' | 'approved' | 'rejected'
          approved_by?: string | null
          approved_at?: string | null
          approval_note?: string | null
          
          created_at?: string
          updated_at?: string
        }
      }
      suspected_drugs: {
        Row: {
          id: string
          report_id: string
          drug_name: string
          commercial_name: string | null
          dosage_form: string | null
          manufacturer: string | null
          batch_number: string | null
          dosage_and_frequency: string | null
          route_of_administration: string | null
          start_date: string | null
          end_date: string | null
          indication: string | null
          
          // Câu hỏi đánh giá
          reaction_improved_after_stopping: 'yes' | 'no' | 'not_stopped' | 'no_information'
          reaction_reoccurred_after_rechallenge: 'yes' | 'no' | 'not_rechallenged' | 'no_information'
          
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          report_id: string
          drug_name: string
          commercial_name?: string | null
          dosage_form?: string | null
          manufacturer?: string | null
          batch_number?: string | null
          dosage_and_frequency?: string | null
          route_of_administration?: string | null
          start_date?: string | null
          end_date?: string | null
          indication?: string | null
          
          reaction_improved_after_stopping: 'yes' | 'no' | 'not_stopped' | 'no_information'
          reaction_reoccurred_after_rechallenge: 'yes' | 'no' | 'not_rechallenged' | 'no_information'
          
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          drug_name?: string
          commercial_name?: string | null
          dosage_form?: string | null
          manufacturer?: string | null
          batch_number?: string | null
          dosage_and_frequency?: string | null
          route_of_administration?: string | null
          start_date?: string | null
          end_date?: string | null
          indication?: string | null
          
          reaction_improved_after_stopping?: 'yes' | 'no' | 'not_stopped' | 'no_information'
          reaction_reoccurred_after_rechallenge?: 'yes' | 'no' | 'not_rechallenged' | 'no_information'
          
          created_at?: string
          updated_at?: string
        }
      }
      organization_settings: {
        Row: {
          id: string
          organization_name: string
          notification_email: string
          contact_person: string | null
          contact_phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_name: string
          notification_email: string
          contact_person?: string | null
          contact_phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_name?: string
          notification_email?: string
          contact_person?: string | null
          contact_phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'user'
      gender: 'male' | 'female'
      severity_level: 'death' | 'life_threatening' | 'hospitalization' | 'birth_defect' | 'permanent_disability' | 'not_serious'
      outcome_after_treatment: 'death_by_adr' | 'death_unrelated' | 'not_recovered' | 'recovering' | 'recovered_with_sequelae' | 'recovered_without_sequelae' | 'unknown'
      causality_assessment: 'certain' | 'probable' | 'possible' | 'unlikely' | 'unclassified' | 'unclassifiable'
      assessment_scale: 'who' | 'naranjo'
      report_type: 'initial' | 'follow_up'
      drug_reaction_assessment: 'yes' | 'no' | 'not_stopped' | 'no_information' | 'not_rechallenged'
    }
  }
}


