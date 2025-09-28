// =====================================================
// ALLERGY CARD TYPES
// TypeScript definitions for allergy card management
// =====================================================

/**
 * Allergy Card Status enum
 */
export type AllergyCardStatus = 'active' | 'inactive' | 'expired';

/**
 * Certainty level for allergies
 */
export type CertaintyLevel = 'suspected' | 'confirmed';

/**
 * Severity level for allergic reactions
 */
export type SeverityLevel = 'mild' | 'moderate' | 'severe' | 'life_threatening';

/**
 * Patient gender options
 */
export type PatientGender = 'male' | 'female' | 'other';

/**
 * Individual allergy information
 */
export interface CardAllergy {
  id: string;
  card_id: string;
  allergen_name: string;
  certainty_level: CertaintyLevel;
  clinical_manifestation?: string;
  severity_level?: SeverityLevel;
  reaction_type?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Main allergy card interface
 */
export interface AllergyCard {
  // Primary identification
  id: string;
  card_code: string; // Format: AC-YYYY-XXXXXX
  
  // Link to ADR report (optional)
  report_id?: string;
  
  // Patient Information
  patient_name: string;
  patient_gender: PatientGender;
  patient_age: number;
  patient_id_number?: string; // CMND/CCCD/Passport
  
  // Medical facility information
  hospital_name: string;
  department?: string;
  doctor_name: string;
  doctor_phone?: string;
  
  // Card issuance information
  issued_date: string;
  issued_by_user_id: string;
  organization: string;
  
  // QR Code data
  qr_code_data: string; // JSON string
  qr_code_url?: string; // URL to QR code image
  
  // Card status
  status: AllergyCardStatus;
  expiry_date?: string;
  
  // Notes
  notes?: string;
  
  // System fields
  created_at: string;
  updated_at: string;
  
  // Related allergies (when populated)
  allergies?: CardAllergy[];
}

/**
 * QR Code data structure that will be encoded
 */
export interface QRCodeData {
  // Card identification
  cardCode: string;
  cardId: string;
  
  // Patient basic info
  patientName: string;
  patientAge: number;
  patientGender: PatientGender;
  
  // Emergency contact
  hospitalName: string;
  doctorName: string;
  doctorPhone?: string;
  
  // Critical allergy information
  allergies: {
    name: string;
    certainty: CertaintyLevel;
    severity?: SeverityLevel;
    symptoms?: string;
  }[];
  
  // Metadata
  issuedDate: string;
  emergencyInstructions: string;
  
  // Verification URL for detailed information
  verificationUrl: string;
}

/**
 * Form data for creating new allergy card
 */
export interface AllergyCardFormData {
  // Patient Information
  patient_name: string;
  patient_gender: PatientGender;
  patient_age: number;
  patient_id_number?: string;
  
  // Medical facility information
  hospital_name: string;
  department?: string;
  doctor_name: string;
  doctor_phone?: string;
  
  // Card details
  issued_date?: string;
  expiry_date?: string;
  notes?: string;
  
  // Allergies array
  allergies: {
    allergen_name: string;
    certainty_level: CertaintyLevel;
    clinical_manifestation?: string;
    severity_level?: SeverityLevel;
    reaction_type?: string;
  }[];
  
  // Optional link to existing ADR report
  report_id?: string;
}

/**
 * Response from allergy card creation
 */
export interface AllergyCardResponse {
  success: boolean;
  card?: AllergyCard;
  qr_code_url?: string;
  pdf_url?: string;
  error?: string;
}

/**
 * Allergy card list with pagination
 */
export interface AllergyCardListResponse {
  cards: AllergyCard[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Search filters for allergy cards
 */
export interface AllergyCardFilters {
  search?: string;
  status?: AllergyCardStatus;
  hospital?: string;
  doctor?: string;
  severity_level?: SeverityLevel;
  issued_from?: string;
  issued_to?: string;
  page?: number;
  limit?: number;
}

/**
 * Dashboard statistics for allergy cards
 */
export interface AllergyCardStats {
  total_cards: number;
  cards_this_month: number;
  active_cards: number;
  expired_cards: number;
  total_allergies?: number;
  severe_allergies?: number;
  most_common_allergens?: {
    name: string;
    count: number;
  }[];
}

/**
 * QR Scanner result
 */
export interface QRScanResult {
  success: boolean;
  data?: QRCodeData;
  error?: string;
  cardFound?: boolean;
}

/**
 * Emergency contact information extracted from QR code
 */
export interface EmergencyContact {
  hospitalName: string;
  doctorName: string;
  doctorPhone?: string;
  emergencyInstructions: string;
}

/**
 * Template data for generating allergy card PDF
 */
export interface AllergyCardTemplateData {
  // Header information
  hospitalName: string;
  department?: string;
  
  // Patient information
  patientName: string;
  patientGender: PatientGender;
  patientAge: number;
  patientIdNumber?: string;
  
  // Allergies data for table
  allergies: {
    allergenName: string;
    isSuspected: boolean;
    isConfirmed: boolean;
    clinicalManifestation: string;
  }[];
  
  // Doctor information
  doctorName: string;
  doctorPhone?: string;
  issuedDate: string;
  
  // QR Code
  qrCodeDataUrl: string; // Base64 data URL of QR code image
  
  // Card code
  cardCode: string;
}

/**
 * Validation errors for allergy card form
 */
export interface AllergyCardValidationError {
  field: string;
  message: string;
}

/**
 * Bulk operations on allergy cards
 */
export interface BulkAllergyCardOperation {
  action: 'activate' | 'deactivate' | 'expire' | 'delete';
  cardIds: string[];
  reason?: string;
}

/**
 * Export options for allergy card data
 */
export interface AllergyCardExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeExpired: boolean;
  includeInactive: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
  filters?: AllergyCardFilters;
}

/**
 * Audit log entry for allergy card operations
 */
export interface AllergyCardAuditLog {
  id: string;
  card_id: string;
  action: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  performed_by: string;
  performed_at: string;
  ip_address?: string;
  user_agent?: string;
}

