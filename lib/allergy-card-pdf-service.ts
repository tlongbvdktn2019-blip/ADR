// =====================================================
// ALLERGY CARD PDF SERVICE - TEMPORARY HTML FALLBACK
// Service for generating allergy cards (HTML version)
// =====================================================

import fs from 'fs/promises';
import path from 'path';
import { QRCardService } from './qr-card-service';
import { AllergyCard, AllergyCardTemplateData } from '@/types/allergy-card';

/**
 * Service for generating allergy cards (HTML version)
 */
export class AllergyCardPDFService {
  
  /**
   * Generate HTML response instead of PDF (temporary solution)
   */
  static async generateHTML(card: AllergyCard): Promise<string> {
    try {
      // Generate QR code data URL
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const qrCodeDataUrl = await QRCardService.generateCardQR(card.card_code, baseUrl);

      // Generate simple HTML representation
      const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thẻ Dị Ứng - ${card.patient_name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .card { border: 2px solid #e74c3c; border-radius: 10px; padding: 20px; margin: 20px 0; background: #fff; }
          .header { text-align: center; border-bottom: 2px solid #e74c3c; padding-bottom: 15px; margin-bottom: 20px; }
          .title { color: #e74c3c; font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .subtitle { color: #666; font-size: 16px; }
          .section { margin: 15px 0; }
          .label { font-weight: bold; color: #333; margin-bottom: 5px; }
          .value { color: #555; margin-bottom: 10px; }
          .allergy-item { background: #f8f9fa; padding: 10px; margin: 5px 0; border-left: 4px solid #e74c3c; border-radius: 3px; }
          .qr-code { text-align: center; margin: 20px 0; }
          .qr-code img { border: 1px solid #ddd; padding: 10px; border-radius: 5px; }
          .print-btn { background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 10px 5px; }
          .emergency { background: #ffe6e6; padding: 15px; border-radius: 5px; border: 1px solid #e74c3c; margin: 20px 0; }
          @media print { .print-btn, .no-print { display: none !important; } }
        </style>
        <script>
          function printCard() { window.print(); }
          function closeWindow() { window.close(); }
        </script>
      </head>
      <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
          <button class="print-btn" onclick="printCard()">🖨️ In thẻ</button>
          <button class="print-btn" onclick="closeWindow()" style="background: #666;">✖️ Đóng</button>
        </div>

        <div class="card">
          <div class="header">
            <div class="title">THẺ DỊ ỨNG</div>
            <div class="subtitle">ALLERGY CARD</div>
          </div>

          <div class="section">
            <div class="label">🏥 Cơ sở y tế:</div>
            <div class="value">${card.hospital_name}</div>
            <div class="label">🏢 Khoa:</div>
            <div class="value">${card.department}</div>
          </div>

          <div class="section">
            <div class="label">👤 Tên bệnh nhân:</div>
            <div class="value">${card.patient_name}</div>
            <div class="label">⚥ Giới tính:</div>
            <div class="value">${card.patient_gender}</div>
            <div class="label">🎂 Tuổi:</div>
            <div class="value">${card.patient_age}</div>
            <div class="label">🆔 CCCD/CMT:</div>
            <div class="value">${card.patient_id_number}</div>
          </div>

          <div class="section">
            <div class="label">⚠️ Các chất gây dị ứng:</div>
            ${(card.allergies || []).map(allergy => `
              <div class="allergy-item">
                <strong>${allergy.allergen_name}</strong>
                <br><small>Mức độ: ${allergy.certainty_level === 'confirmed' ? 'Chắc chắn' : 'Nghi ngờ'}</small>
                ${allergy.clinical_manifestation ? `<br><small>Biểu hiện: ${allergy.clinical_manifestation}</small>` : ''}
              </div>
            `).join('')}
          </div>

          <div class="section">
            <div class="label">👨‍⚕️ Bác sĩ kê đơn:</div>
            <div class="value">${card.doctor_name}</div>
            <div class="label">📞 Điện thoại:</div>
            <div class="value">${card.doctor_phone}</div>
          </div>

          <div class="section">
            <div class="label">📅 Ngày cấp:</div>
            <div class="value">${new Date(card.issued_date).toLocaleDateString('vi-VN')}</div>
            <div class="label">🔢 Mã thẻ:</div>
            <div class="value">${card.card_code}</div>
          </div>

          <div class="qr-code">
            <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 100px; height: 100px;" />
            <br><small>Quét mã QR để xem chi tiết</small>
          </div>

          <div class="emergency">
            <strong style="color: #e74c3c;">⚠️ LƯU Ý KHẨN CẤP:</strong><br>
            Trong trường hợp khẩn cấp, vui lòng thông báo ngay cho nhân viên y tế về tình trạng dị ứng của bệnh nhân.
          </div>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 30px; color: #666;">
          <p><em>Được tạo bởi hệ thống CODEX ADR</em></p>
          <p><small>Để in thành PDF: Ctrl+P → Chọn "Save as PDF"</small></p>
        </div>
      </body>
      </html>
      `;

      return html;

    } catch (error) {
      console.error('HTML generation error:', error);
      throw new Error('Không thể tạo thẻ dị ứng HTML');
    }
  }

  /**
   * Legacy method - returns HTML instead of PDF buffer
   */
  static async generatePDF(card: AllergyCard): Promise<string> {
    console.log('⚠️ AllergyCardPDFService: Using HTML fallback instead of PDF generation');
    return this.generateHTML(card);
  }
}