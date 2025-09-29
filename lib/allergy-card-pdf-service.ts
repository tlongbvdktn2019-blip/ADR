// =====================================================
// ALLERGY CARD PDF SERVICE
// Service for generating PDF allergy cards from HTML template
// =====================================================

import puppeteer, { Browser } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import fs from 'fs/promises';
import path from 'path';
import { QRCodeService } from './qr-service';
import { AllergyCard, AllergyCardTemplateData } from '@/types/allergy-card';

/**
 * Service for generating PDF allergy cards
 */
export class AllergyCardPDFService {
  
  /**
   * Generate PDF buffer from allergy card data
   */
  static async generatePDF(card: AllergyCard): Promise<Buffer> {
    try {
      // Load HTML template
      const templatePath = path.join(process.cwd(), 'capthe.html');
      let htmlTemplate = await fs.readFile(templatePath, 'utf-8');

      // Generate QR code data URL
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const qrData = QRCodeService.createQRData(card, baseUrl);
      const qrCodeDataUrl = await QRCodeService.generateQRCodeDataURL(qrData);

      // Prepare template data
      const templateData: AllergyCardTemplateData = {
        hospitalName: card.hospital_name,
        department: card.department,
        patientName: card.patient_name,
        patientGender: card.patient_gender,
        patientAge: card.patient_age,
        patientIdNumber: card.patient_id_number,
        allergies: (card.allergies || []).slice(0, 5).map(allergy => ({
          allergenName: allergy.allergen_name,
          isSuspected: allergy.certainty_level === 'suspected',
          isConfirmed: allergy.certainty_level === 'confirmed',
          clinicalManifestation: allergy.clinical_manifestation || ''
        })),
        doctorName: card.doctor_name,
        doctorPhone: card.doctor_phone,
        issuedDate: new Date(card.issued_date).toLocaleDateString('vi-VN'),
        qrCodeDataUrl,
        cardCode: card.card_code
      };

      // Populate HTML template
      htmlTemplate = this.populateTemplate(htmlTemplate, templateData);

      // Generate PDF using Puppeteer
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      
      // Set content and wait for images to load
      await page.setContent(htmlTemplate, { 
        waitUntil: 'networkidle0' 
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5cm',
          right: '0.5cm',
          bottom: '0.5cm',
          left: '0.5cm'
        }
      });

      await browser.close();

      return Buffer.from(pdfBuffer);

    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Không thể tạo file PDF thẻ dị ứng');
    }
  }

  private static async getBrowser(): Promise<Browser> {
    const isDev = process.env.NODE_ENV === 'development'

    if (isDev) {
      // Local development - try to use full Chromium if available
      try {
        return puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        })
      } catch (error) {
        console.warn('Failed to launch local Chromium, falling back to @sparticuz/chromium')
      }
    }

    // Production/Vercel - use @sparticuz/chromium
    const executablePath = await chromium.executablePath()

    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: true,
      ignoreDefaultArgs: ['--disable-extensions'],
    })
  }

  /**
   * Populate HTML template with card data
   */
  private static populateTemplate(html: string, data: AllergyCardTemplateData): string {
    let populatedHtml = html;

    // Replace QR code placeholder
    populatedHtml = populatedHtml.replace(
      /src="https:\/\/placehold\.co\/90x90\/ffffff\/000000\?text=QR\+CODE"/g,
      `src="${data.qrCodeDataUrl}"`
    );

    // Replace hospital and department information
    populatedHtml = populatedHtml.replace(
      /Bệnh viện: \.+/g,
      `Bệnh viện: ${data.hospitalName}`
    );
    
    populatedHtml = populatedHtml.replace(
      /Khoa\/Trung tâm: \.+/g,
      `Khoa/Trung tâm: ${data.department || '.............................'}`
    );

    // Replace patient information
    populatedHtml = populatedHtml.replace(
      /Họ tên: \.+/g,
      `Họ tên: ${data.patientName}`
    );

    // Handle gender checkboxes
    if (data.patientGender === 'male') {
      populatedHtml = populatedHtml.replace(/Nam □/, 'Nam ☑');
    } else if (data.patientGender === 'female') {
      populatedHtml = populatedHtml.replace(/Nữ □/, 'Nữ ☑');
    }

    populatedHtml = populatedHtml.replace(
      /Tuổi: \.+/g,
      `Tuổi: ${data.patientAge}`
    );

    // Replace ID number
    populatedHtml = populatedHtml.replace(
      /Số CMND hoặc thẻ căn cước hoặc số định danh công dân: \.+/g,
      `Số CMND hoặc thẻ căn cước hoặc số định danh công dân: ${data.patientIdNumber || '.............................'}`
    );

    // Replace allergy table rows
    const allergyTableBody = this.generateAllergyTableRows(data.allergies);
    populatedHtml = populatedHtml.replace(
      /<tbody>[\s\S]*?<\/tbody>/g,
      `<tbody>${allergyTableBody}</tbody>`
    );

    // Replace doctor information
    populatedHtml = populatedHtml.replace(
      /Họ và tên: \.+/g,
      `Họ và tên: ${data.doctorName}`
    );

    populatedHtml = populatedHtml.replace(
      /ĐT: \.+/g,
      `ĐT: ${data.doctorPhone || '.............................'}`
    );

    populatedHtml = populatedHtml.replace(
      /Ngày cấp thẻ: \.+/g,
      `Ngày cấp thẻ: ${data.issuedDate}`
    );

    // Add card code to header
    populatedHtml = populatedHtml.replace(
      /<div class="header">[\s\S]*?<\/div>/g,
      `<div class="header">
        <p>PHỤ LỤC VII</p>
        <p style="margin-top: 10px; font-size: 12px; color: #666;">Mã thẻ: ${data.cardCode}</p>
      </div>`
    );

    return populatedHtml;
  }

  /**
   * Generate allergy table rows HTML
   */
  private static generateAllergyTableRows(allergies: AllergyCardTemplateData['allergies']): string {
    let rows = '';

    // Add allergy rows (up to 5)
    for (let i = 0; i < 5; i++) {
      const allergy = allergies[i];
      
      if (allergy) {
        rows += `
          <tr>
            <td style="text-align: left; padding-left: 8px;">${allergy.allergenName}</td>
            <td>${allergy.isSuspected ? '☑' : '□'}</td>
            <td>${allergy.isConfirmed ? '☑' : '□'}</td>
            <td style="text-align: left; padding-left: 8px;">${allergy.clinicalManifestation}</td>
          </tr>
        `;
      } else {
        // Empty row
        rows += `
          <tr>
            <td>&nbsp;</td>
            <td>□</td>
            <td>□</td>
            <td></td>
          </tr>
        `;
      }
    }

    return rows;
  }

  /**
   * Generate preview HTML (for development/testing)
   */
  static async generatePreviewHTML(card: AllergyCard): Promise<string> {
    try {
      // Load HTML template
      const templatePath = path.join(process.cwd(), 'capthe.html');
      let htmlTemplate = await fs.readFile(templatePath, 'utf-8');

      // Generate QR code data URL
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const qrData = QRCodeService.createQRData(card, baseUrl);
      const qrCodeDataUrl = await QRCodeService.generateQRCodeDataURL(qrData);

      // Prepare template data
      const templateData: AllergyCardTemplateData = {
        hospitalName: card.hospital_name,
        department: card.department,
        patientName: card.patient_name,
        patientGender: card.patient_gender,
        patientAge: card.patient_age,
        patientIdNumber: card.patient_id_number,
        allergies: (card.allergies || []).slice(0, 5).map(allergy => ({
          allergenName: allergy.allergen_name,
          isSuspected: allergy.certainty_level === 'suspected',
          isConfirmed: allergy.certainty_level === 'confirmed',
          clinicalManifestation: allergy.clinical_manifestation || ''
        })),
        doctorName: card.doctor_name,
        doctorPhone: card.doctor_phone,
        issuedDate: new Date(card.issued_date).toLocaleDateString('vi-VN'),
        qrCodeDataUrl,
        cardCode: card.card_code
      };

      // Populate and return HTML
      return this.populateTemplate(htmlTemplate, templateData);

    } catch (error) {
      console.error('HTML preview generation error:', error);
      throw new Error('Không thể tạo preview HTML');
    }
  }

  /**
   * Validate card data before PDF generation
   */
  static validateCardData(card: AllergyCard): string[] {
    const errors: string[] = [];

    if (!card.patient_name) {
      errors.push('Thiếu tên bệnh nhân');
    }

    if (!card.hospital_name) {
      errors.push('Thiếu tên bệnh viện');
    }

    if (!card.doctor_name) {
      errors.push('Thiếu tên bác sĩ');
    }

    if (!card.allergies || card.allergies.length === 0) {
      errors.push('Không có thông tin dị ứng');
    }

    if (!card.card_code) {
      errors.push('Thiếu mã thẻ');
    }

    return errors;
  }
}

