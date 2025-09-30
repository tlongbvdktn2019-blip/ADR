// =====================================================
// QR CODE SERVICE
// Service for generating and processing QR codes for allergy cards
// =====================================================

import QRCode from 'qrcode';
import { QRCodeData, AllergyCard, QRScanResult } from '@/types/allergy-card';

/**
 * QR Code Service for Allergy Cards
 */
export class QRCodeService {
  
  /**
   * Generate QR code data from allergy card
   */
  static createQRData(card: any, baseUrl: string): QRCodeData {
    const qrData: QRCodeData = {
      // Card identification
      cardCode: card.card_code,
      cardId: card.id,
      
      // Patient basic info
      patientName: card.patient_name,
      patientAge: card.patient_age,
      patientGender: card.patient_gender,
      
      // Emergency contact
      hospitalName: card.hospital_name,
      doctorName: card.doctor_name,
      doctorPhone: card.doctor_phone,
      
      // Critical allergy information
      allergies: (card.allergies || []).map((allergy: any) => ({
        name: allergy.allergen_name,
        certainty: allergy.certainty_level,
        severity: allergy.severity_level,
        symptoms: allergy.clinical_manifestation
      })),
      
      // Suspected drugs from ADR report (if available)
      suspectedDrugs: (card.suspected_drugs || []).map((drug: any) => ({
        drugName: drug.drug_name,
        commercialName: drug.commercial_name,
        dosageForm: drug.dosage_form,
        indication: drug.indication,
        reactionImprovedAfterStopping: drug.reaction_improved_after_stopping
      })),
      
      // Metadata
      issuedDate: card.issued_date,
      emergencyInstructions: "Trong trường hợp khẩn cấp, tiêm adrenalin ngay và gọi 115",
      
      // Verification URL for detailed information (public access for Zalo, camera QR, etc.)
      verificationUrl: `${baseUrl}/allergy-cards/view/${card.card_code}`
    };
    
    return qrData;
  }
  
  /**
   * Generate QR code as Data URL (base64)
   * Creates QR with public URL for universal scanning (Zalo, camera, etc.)
   */
  static async generateQRCodeDataURL(qrData: QRCodeData): Promise<string> {
    try {
      // Use verification URL instead of JSON for universal QR scanner compatibility
      // This allows Zalo, camera, and any QR scanner to open the card info
      const qrContent = qrData.verificationUrl;
      
      const qrCodeDataURL = await QRCode.toDataURL(qrContent, {
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256,
        errorCorrectionLevel: 'M'
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Không thể tạo mã QR');
    }
  }
  
  /**
   * Generate QR code as Buffer for file saving
   * Uses URL format for universal compatibility
   */
  static async generateQRCodeBuffer(qrData: QRCodeData): Promise<Buffer> {
    try {
      // Use verification URL for universal QR scanner compatibility
      const qrContent = qrData.verificationUrl;
      
      const qrCodeBuffer = await QRCode.toBuffer(qrContent, {
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300,
        errorCorrectionLevel: 'H'
      });
      
      return qrCodeBuffer;
    } catch (error) {
      console.error('Error generating QR code buffer:', error);
      throw new Error('Không thể tạo mã QR');
    }
  }
  
  /**
   * Parse QR code data from scanned string
   */
  static parseQRData(qrString: string): QRScanResult {
    try {
      const qrData: QRCodeData = JSON.parse(qrString);
      
      // Validate required fields
      if (!qrData.cardCode || !qrData.patientName || !qrData.allergies) {
        return {
          success: false,
          error: 'Dữ liệu QR không hợp lệ - thiếu thông tin bắt buộc',
          cardFound: false
        };
      }
      
      // Validate card code format (AC-YYYY-XXXXXX)
      const cardCodeRegex = /^AC-\d{4}-\d{6}$/;
      if (!cardCodeRegex.test(qrData.cardCode)) {
        return {
          success: false,
          error: 'Mã thẻ không đúng định dạng',
          cardFound: false
        };
      }
      
      return {
        success: true,
        data: qrData,
        cardFound: true
      };
      
    } catch (error) {
      return {
        success: false,
        error: 'Không thể đọc mã QR - dữ liệu không hợp lệ',
        cardFound: false
      };
    }
  }
  
  /**
   * Create emergency info text from QR data for quick display
   */
  static createEmergencyText(qrData: QRCodeData): string {
    const allergyList = qrData.allergies
      .filter(a => a.certainty === 'confirmed' || a.severity === 'severe' || a.severity === 'life_threatening')
      .map(a => `${a.name} (${a.certainty === 'confirmed' ? 'Chắc chắn' : 'Nghi ngờ'})`)
      .join(', ');
    
    const suspectedDrugsList = qrData.suspectedDrugs && qrData.suspectedDrugs.length > 0
      ? qrData.suspectedDrugs.map(d => d.drugName).join(', ')
      : '';
    
    return `🚨 DỊ ỨNG KHẨN CẤP
    
BN: ${qrData.patientName} (${qrData.patientAge} tuổi)
    
DỊ ỨNG: ${allergyList || 'Chưa xác định'}
${suspectedDrugsList ? `\n⚠️ THUỐC NGHI NGỜ: ${suspectedDrugsList}` : ''}
    
BS: ${qrData.doctorName}
BV: ${qrData.hospitalName}
SĐT: ${qrData.doctorPhone || 'Không có'}
    
⚠️ ${qrData.emergencyInstructions}
    
Mã thẻ: ${qrData.cardCode}
Ngày cấp: ${new Date(qrData.issuedDate).toLocaleDateString('vi-VN')}`;
  }
  
  /**
   * Validate QR data structure
   */
  static validateQRData(data: any): data is QRCodeData {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.cardCode === 'string' &&
      typeof data.patientName === 'string' &&
      typeof data.patientAge === 'number' &&
      Array.isArray(data.allergies) &&
      typeof data.hospitalName === 'string' &&
      typeof data.issuedDate === 'string'
    );
  }
  
  /**
   * Generate compact QR data for smaller QR codes (emergency use)
   */
  static createCompactQRData(card: AllergyCard): string {
    // Create a more compact format for emergency scanning
    const compactData = {
      c: card.card_code,           // card code
      n: card.patient_name,        // name
      a: card.patient_age,         // age
      h: card.hospital_name,       // hospital
      d: card.doctor_name,         // doctor
      p: card.doctor_phone,        // phone
      al: (card.allergies || []).map(allergy => ({
        n: allergy.allergen_name,  // allergen name
        s: allergy.severity_level, // severity
        c: allergy.certainty_level // certainty
      }))
    };
    
    return JSON.stringify(compactData);
  }
  
  /**
   * Parse compact QR data
   */
  static parseCompactQRData(compactString: string): QRCodeData | null {
    try {
      const compact = JSON.parse(compactString);
      
      return {
        cardCode: compact.c,
        cardId: '', // Not available in compact format
        patientName: compact.n,
        patientAge: compact.a,
        patientGender: 'other', // Not available in compact format
        hospitalName: compact.h,
        doctorName: compact.d,
        doctorPhone: compact.p,
        allergies: (compact.al || []).map((a: any) => ({
          name: a.n,
          certainty: a.c,
          severity: a.s,
          symptoms: undefined
        })),
        issuedDate: new Date().toISOString(),
        emergencyInstructions: "Tiêm adrenalin ngay và gọi 115",
        verificationUrl: ''
      };
    } catch {
      return null;
    }
  }
  
  /**
   * Generate emergency contact card QR (uses URL for universal access)
   */
  static async generateEmergencyQR(card: AllergyCard, baseUrl: string): Promise<string> {
    // Use same URL format for consistency and universal compatibility
    const emergencyUrl = `${baseUrl}/allergy-cards/view/${card.card_code}`;
    
    return await QRCode.toDataURL(emergencyUrl, {
      width: 150,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#DC2626', // Red for emergency
        light: '#FFFFFF'
      }
    });
  }
  
  /**
   * Check if QR data is from allergy card system
   * Supports both URL format (new) and JSON format (legacy)
   */
  static isAllergyCardQR(qrString: string): boolean {
    // Check if it's a URL pointing to our allergy card view
    if (qrString.includes('/allergy-cards/view/AC-')) {
      return true;
    }
    
    // Check if it's legacy JSON format
    try {
      const data = JSON.parse(qrString);
      return data.cardCode && data.cardCode.startsWith('AC-');
    } catch {
      // Check if it's a direct card code
      return /^AC-\d{4}-\d{6}$/.test(qrString.trim().toUpperCase());
    }
  }
}

