import puppeteer, { Browser, Page } from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { ADRReport } from '@/types/report'
import { join } from 'path'
import { readFileSync, existsSync } from 'fs'

// PDF generation options interface
interface PDFGenerationOptions {
  format?: 'A4' | 'A3' | 'Letter'
  orientation?: 'portrait' | 'landscape'
  margin?: {
    top: string
    right: string
    bottom: string
    left: string
  }
}

// Default options
const defaultOptions: PDFGenerationOptions = {
  format: 'A4',
  orientation: 'portrait',
  margin: {
    top: '1cm',
    right: '1cm',
    bottom: '1cm',
    left: '1cm'
  }
}

export class PDFServiceVercel {
  private static getTemplate(): string {
    const templatePath = join(process.cwd(), 'template.html')
    if (existsSync(templatePath)) {
      return readFileSync(templatePath, 'utf-8')
    }
    // Fallback to embedded template
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo cáo ADR</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    .section-title {
      background-color: #f3f4f6;
      padding: 12px;
      border-left: 4px solid #2563eb;
      font-weight: bold;
      margin-bottom: 15px;
      font-size: 16px;
    }
    .field-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
    }
    .field {
      display: flex;
      flex-direction: column;
    }
    .field-label {
      font-weight: bold;
      color: #374151;
      margin-bottom: 5px;
    }
    .field-value {
      background-color: #f9fafb;
      padding: 8px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      min-height: 32px;
    }
    .full-width {
      grid-column: span 2;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    .table th,
    .table td {
      border: 1px solid #d1d5db;
      padding: 12px;
      text-align: left;
      vertical-align: top;
    }
    .table th {
      background-color: #f3f4f6;
      font-weight: bold;
    }
    .signature-section {
      margin-top: 40px;
      page-break-inside: avoid;
    }
    .signature-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      margin-top: 30px;
    }
    .signature {
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #333;
      margin-top: 60px;
      padding-top: 10px;
      font-weight: bold;
    }
    @media print {
      body {
        padding: 0;
      }
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">CODEX ADR</div>
    <div class="title">BÁO CÁO PHẢN ỨNG CÓ HẠI CỦA THUỐC</div>
    <div>Mã báo cáo: {{report_code}}</div>
  </div>

  <div class="section">
    <div class="section-title">I. THÔNG TIN NGƯỜI BỆNH</div>
    <div class="field-group">
      <div class="field">
        <div class="field-label">Họ và tên:</div>
        <div class="field-value">{{patient_name}}</div>
      </div>
      <div class="field">
        <div class="field-label">Tuổi:</div>
        <div class="field-value">{{patient_age}}</div>
      </div>
      <div class="field">
        <div class="field-label">Giới tính:</div>
        <div class="field-value">{{patient_gender}}</div>
      </div>
      <div class="field">
        <div class="field-label">Cân nặng (kg):</div>
        <div class="field-value">{{patient_weight}}</div>
      </div>
      <div class="field full-width">
        <div class="field-label">Địa chỉ:</div>
        <div class="field-value">{{patient_address}}</div>
      </div>
      <div class="field">
        <div class="field-label">Số điện thoại:</div>
        <div class="field-value">{{patient_phone}}</div>
      </div>
      <div class="field">
        <div class="field-label">Email:</div>
        <div class="field-value">{{patient_email}}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">II. THUỐC NGHI NGỜ GÂY ADR</div>
    <table class="table">
      <thead>
        <tr>
          <th>Tên thuốc</th>
          <th>Hoạt chất</th>
          <th>Liều dùng</th>
          <th>Đường dùng</th>
          <th>Ngày bắt đầu</th>
          <th>Ngày kết thúc</th>
        </tr>
      </thead>
      <tbody>
        {{suspected_drugs_rows}}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">III. MÔ TẢ PHẢN ỨNG CÓ HẠI</div>
    <div class="field-group">
      <div class="field">
        <div class="field-label">Ngày xuất hiện ADR:</div>
        <div class="field-value">{{adr_occurrence_date}}</div>
      </div>
      <div class="field">
        <div class="field-label">Thời gian từ dùng thuốc đến xuất hiện ADR:</div>
        <div class="field-value">{{reaction_onset_time}}</div>
      </div>
      <div class="field full-width">
        <div class="field-label">Mô tả chi tiết phản ứng:</div>
        <div class="field-value">{{adr_description}}</div>
      </div>
      <div class="field">
        <div class="field-label">Mức độ nghiêm trọng:</div>
        <div class="field-value">{{severity_level}}</div>
      </div>
      <div class="field">
        <div class="field-label">Kết quả:</div>
        <div class="field-value">{{outcome}}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">IV. THÔNG TIN NGƯỜI BÁO CÁO</div>
    <div class="field-group">
      <div class="field">
        <div class="field-label">Họ và tên:</div>
        <div class="field-value">{{reporter_name}}</div>
      </div>
      <div class="field">
        <div class="field-label">Chức danh:</div>
        <div class="field-value">{{reporter_title}}</div>
      </div>
      <div class="field">
        <div class="field-label">Cơ sở y tế:</div>
        <div class="field-value">{{health_facility}}</div>
      </div>
      <div class="field">
        <div class="field-label">Số điện thoại:</div>
        <div class="field-value">{{reporter_phone}}</div>
      </div>
    </div>
  </div>

  <div class="signature-section">
    <div class="signature-box">
      <div class="signature">
        <div>Người báo cáo</div>
        <div class="signature-line">{{reporter_name}}</div>
      </div>
      <div class="signature">
        <div>Ngày lập báo cáo</div>
        <div class="signature-line">{{report_date}}</div>
      </div>
    </div>
  </div>
</body>
</html>`
  }

  private static renderReportHTML(report: ADRReport): string {
    let htmlTemplate = this.getTemplate()
    
    // Basic patient information
    htmlTemplate = htmlTemplate.replace(/{{patient_name}}/g, report.patient_name || 'N/A')
    htmlTemplate = htmlTemplate.replace(/{{patient_age}}/g, report.patient_age?.toString() || 'N/A')
    htmlTemplate = htmlTemplate.replace(/{{patient_gender}}/g, 
      report.patient_gender === 'male' ? 'Nam' : 
      report.patient_gender === 'female' ? 'Nữ' : 'Khác')
    htmlTemplate = htmlTemplate.replace(/{{patient_weight}}/g, report.patient_weight?.toString() || 'N/A')
    htmlTemplate = htmlTemplate.replace(/{{patient_address}}/g, 'N/A') // Not available in ADRReport type
    htmlTemplate = htmlTemplate.replace(/{{patient_phone}}/g, 'N/A') // Not available in ADRReport type
    htmlTemplate = htmlTemplate.replace(/{{patient_email}}/g, 'N/A') // Not available in ADRReport type

    // Report information
    htmlTemplate = htmlTemplate.replace(/{{report_code}}/g, report.report_code || 'N/A')
    htmlTemplate = htmlTemplate.replace(/{{adr_occurrence_date}}/g, 
      report.adr_occurrence_date ? new Date(report.adr_occurrence_date).toLocaleDateString('vi-VN') : 'N/A')
    htmlTemplate = htmlTemplate.replace(/{{reaction_onset_time}}/g, report.reaction_onset_time || 'N/A')
    htmlTemplate = htmlTemplate.replace(/{{adr_description}}/g, report.adr_description || 'N/A')
    htmlTemplate = htmlTemplate.replace(/{{severity_level}}/g, report.severity_level || 'N/A')
    htmlTemplate = htmlTemplate.replace(/{{outcome}}/g, report.outcome_after_treatment || 'N/A')

    // Reporter information
    htmlTemplate = htmlTemplate.replace(/{{reporter_name}}/g, report.reporter_name || 'N/A')
    htmlTemplate = htmlTemplate.replace(/{{reporter_title}}/g, report.reporter_profession || 'N/A')
    htmlTemplate = htmlTemplate.replace(/{{health_facility}}/g, report.organization || 'N/A')
    htmlTemplate = htmlTemplate.replace(/{{reporter_phone}}/g, report.reporter_phone || 'N/A')
    htmlTemplate = htmlTemplate.replace(/{{report_date}}/g, 
      report.created_at ? new Date(report.created_at).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'))

    // Suspected drugs table
    let suspectedDrugsRows = ''
    if (report.suspected_drugs && report.suspected_drugs.length > 0) {
      suspectedDrugsRows = report.suspected_drugs.map(drug => `
        <tr>
          <td>${drug.drug_name || 'N/A'}</td>
          <td>${drug.commercial_name || 'N/A'}</td>
          <td>${drug.dosage_and_frequency || 'N/A'}</td>
          <td>${drug.route_of_administration || 'N/A'}</td>
          <td>${drug.start_date ? new Date(drug.start_date).toLocaleDateString('vi-VN') : 'N/A'}</td>
          <td>${drug.end_date ? new Date(drug.end_date).toLocaleDateString('vi-VN') : 'N/A'}</td>
        </tr>
      `).join('')
    } else {
      suspectedDrugsRows = '<tr><td colspan="6">Không có thông tin thuốc nghi ngờ</td></tr>'
    }
    
    htmlTemplate = htmlTemplate.replace(/{{suspected_drugs_rows}}/g, suspectedDrugsRows)

    return htmlTemplate
  }

  private static async getBrowser(): Promise<Browser> {
    const isDev = process.env.NODE_ENV === 'development'
    const isVercel = process.env.VERCEL === '1'

    if (isDev) {
      // Local development - use full Chromium
      return puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
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

  static async generatePDF(
    report: ADRReport, 
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    console.log('=== PDFServiceVercel.generatePDF START ===')
    console.log('Report ID:', report.id)
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      AWS_EXECUTION_ENV: process.env.AWS_EXECUTION_ENV
    })
    
    const finalOptions = { ...defaultOptions, ...options }
    console.log('Final options:', finalOptions)
    
    let browser: Browser | null = null
    let page: Page | null = null

    try {
      console.log('Launching browser...')
      browser = await this.getBrowser()
      console.log('Browser launched successfully')

      console.log('Creating new page...')
      page = await browser.newPage()
      console.log('Page created successfully')
      
      // Set viewport for consistent rendering
      console.log('Setting viewport...')
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 1
      })
      console.log('Viewport set successfully')

      console.log('Generating HTML content...')
      const html = this.renderReportHTML(report)
      console.log('HTML generated, length:', html.length)
      
      console.log('Setting page content...')
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000
      })
      console.log('Page content set successfully')

      console.log('Generating PDF...')
      const pdfBuffer = await page.pdf({
        format: finalOptions.format,
        landscape: finalOptions.orientation === 'landscape',
        margin: finalOptions.margin,
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false
      })
      console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes')

      console.log('=== PDFServiceVercel.generatePDF COMPLETE ===')
      return Buffer.from(pdfBuffer)

    } catch (error) {
      console.error('❌ PDF generation failed:', error)
      throw error
    } finally {
      if (page) {
        try {
          await page.close()
          console.log('Page closed')
        } catch (e) {
          console.warn('Failed to close page:', e)
        }
      }
      if (browser) {
        try {
          await browser.close()
          console.log('Browser closed')
        } catch (e) {
          console.warn('Failed to close browser:', e)
        }
      }
    }
  }

  static async generatePDFFromHTML(html: string, options: PDFGenerationOptions = {}): Promise<Buffer> {
    console.log('=== PDFServiceVercel.generatePDFFromHTML START ===')
    
    const finalOptions = { ...defaultOptions, ...options }
    let browser: Browser | null = null
    let page: Page | null = null

    try {
      browser = await this.getBrowser()
      page = await browser.newPage()
      
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 1
      })

      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000
      })

      const pdfBuffer = await page.pdf({
        format: finalOptions.format,
        landscape: finalOptions.orientation === 'landscape',
        margin: finalOptions.margin,
        printBackground: true,
        preferCSSPageSize: true
      })

      console.log('=== PDFServiceVercel.generatePDFFromHTML COMPLETE ===')
      return Buffer.from(pdfBuffer)

    } catch (error) {
      console.error('❌ HTML PDF generation failed:', error)
      throw error
    } finally {
      if (page) {
        try {
          await page.close()
        } catch (e) {
          console.warn('Failed to close page:', e)
        }
      }
      if (browser) {
        try {
          await browser.close()
        } catch (e) {
          console.warn('Failed to close browser:', e)
        }
      }
    }
  }
}
