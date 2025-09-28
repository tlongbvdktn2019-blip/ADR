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
  static createQRData(card: AllergyCard, baseUrl: string): QRCodeData {
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
      allergies: (card.allergies || []).map(allergy => ({
        name: allergy.allergen_name,
        certainty: allergy.certainty_level,
        severity: allergy.severity_level,
        symptoms: allergy.clinical_manifestation
      })),
      
      // Metadata
      issuedDate: card.issued_date,
      emergencyInstructions: "Trong trường hợp khẩn cấp, tiêm adrenalin ngay và gọi 115",
      
      // Verification URL for detailed information
      verificationUrl: `${baseUrl}/allergy-cards/verify/${card.card_code}`
    };
    
    return qrData;
  }
  
  /**
   * Generate QR code as Data URL (base64)
   */
  static async generateQRCodeDataURL(qrData: QRCodeData): Promise<string> {
    try {
      const jsonString = JSON.stringify(qrData);
      
      const qrCodeDataURL = await QRCode.toDataURL(jsonString, {
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
   */
  static async generateQRCodeBuffer(qrData: QRCodeData): Promise<Buffer> {
    try {
      const jsonString = JSON.stringify(qrData);
      
      const qrCodeBuffer = await QRCode.toBuffer(jsonString, {
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
    
    return `🚨 DỊ ỨNG KHẨN CẤP
    
BN: ${qrData.patientName} (${qrData.patientAge} tuổi)
    
DỊ ỨNG: ${allergyList || 'Chưa xác định'}
    
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
   * Generate emergency contact card QR (very compact)
   */
  static async generateEmergencyQR(card: AllergyCard): Promise<string> {
    const emergencyData = {
      n: card.patient_name,
      a: card.patient_age,
      al: (card.allergies || [])
        .filter(a => a.certainty_level === 'confirmed' && a.severity_level && ['severe', 'life_threatening'].includes(a.severity_level))
        .map(a => a.allergen_name)
        .join(','),
      e: "Tiêm adrenalin + gọi 115"
    };
    
    return await QRCode.toDataURL(JSON.stringify(emergencyData), {
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
   */
  static isAllergyCardQR(qrString: string): boolean {
    try {
      const data = JSON.parse(qrString);
      return data.cardCode && data.cardCode.startsWith('AC-');
    } catch {
      return false;
    }
  }
}

