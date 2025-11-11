// =====================================================
// QR CODE SERVICE FOR ALLERGY CARDS
// Service tạo QR code cho thẻ dị ứng
// QR chứa link đến trang chi tiết thẻ trong app
// =====================================================

import QRCode from 'qrcode';

export class QRCardService {
  /**
   * Tạo QR code cho thẻ dị ứng dựa trên MÃ THẺ
   * QR sẽ chứa URL CÔNG KHAI để bất kỳ ai quét cũng có thể xem thông tin
   * @param cardCode - Mã thẻ (ví dụ: AC-2024-000001)
   * @param baseUrl - Domain của app (tùy chọn, mặc định lấy từ env)
   * @returns Data URL của QR code (base64)
   */
  static async generateCardQR(cardCode: string, baseUrl?: string): Promise<string> {
    try {
      // Lấy base URL từ env hoặc parameter
      const appUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      // QR chứa URL CÔNG KHAI đến trang xem thẻ
      // Ví dụ: https://your-domain.com/allergy-cards/public/AC-2024-000001
      // Khi quét bằng bất kỳ app QR nào, sẽ mở được trang public với đầy đủ thông tin
      const qrContent = `${appUrl}/allergy-cards/public/${cardCode}`;

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(qrContent, {
        errorCorrectionLevel: 'H', // High error correction for medical data
        type: 'image/png',
        width: 512, // Larger for better scanning
        margin: 2,
        color: {
          dark: '#dc2626', // Red color for allergy warning
          light: '#FFFFFF',
        },
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating card QR code:', error);
      throw new Error('Không thể tạo mã QR cho thẻ');
    }
  }

  /**
   * Tạo QR code cho thẻ với thông tin chi tiết (JSON)
   * Cho phép scan offline và hiển thị thông tin cơ bản
   */
  static async generateCardQRWithData(cardData: {
    id: string;
    card_code: string;
    patient_name: string;
    allergies: Array<{
      allergen_name: string;
      severity_level?: string;
    }>;
  }): Promise<string> {
    try {
      // Create compact JSON data
      const qrData = {
        type: 'allergy_card',
        id: cardData.id,
        code: cardData.card_code,
        patient: cardData.patient_name,
        allergies: cardData.allergies.map(a => ({
          name: a.allergen_name,
          severity: a.severity_level
        }))
      };

      // Generate QR code with JSON data
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 512,
        margin: 2,
        color: {
          dark: '#dc2626', // Red for allergy warning
          light: '#FFFFFF',
        },
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating card QR with data:', error);
      throw new Error('Không thể tạo mã QR với dữ liệu thẻ');
    }
  }

  /**
   * Parse QR data to check if it's an allergy card
   * Hỗ trợ nhiều định dạng: mã thẻ, URL, JSON
   */
  static parseQRData(data: string): { 
    isAllergyCard: boolean; 
    cardCode?: string; 
    cardId?: string;
  } {
    try {
      // 1. Check if it's a card code (format: AC-YYYY-XXXXXX)
      if (/^AC-\d{4}-\d{6}$/.test(data.trim())) {
        return { isAllergyCard: true, cardCode: data.trim() };
      }

      // 2. Check if it's a URL
      if (data.startsWith('http')) {
        const url = new URL(data);
        // Match /allergy-cards/view/[id]
        const idMatch = url.pathname.match(/\/allergy-cards\/view\/([a-f0-9-]+)/);
        if (idMatch) {
          return { isAllergyCard: true, cardId: idMatch[1] };
        }
      }

      // 3. Check if it's JSON data
      const parsed = JSON.parse(data);
      if (parsed.type === 'allergy_card') {
        return { 
          isAllergyCard: true, 
          cardCode: parsed.code,
          cardId: parsed.id 
        };
      }
    } catch {
      // Not a valid allergy card QR
    }

    return { isAllergyCard: false };
  }

  /**
   * Tạo QR cho in ấn (PNG buffer)
   * Dùng khi export PDF hoặc in thẻ
   * @param cardCode - Mã thẻ để tạo QR
   */
  static async generateQRBuffer(cardCode: string): Promise<Buffer> {
    try {
      // QR chứa mã thẻ đơn giản để dễ quét
      const buffer = await QRCode.toBuffer(cardCode, {
        errorCorrectionLevel: 'H',
        type: 'png',
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return buffer;
    } catch (error) {
      console.error('Error generating QR buffer:', error);
      throw new Error('Không thể tạo QR buffer');
    }
  }
}

