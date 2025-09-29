import puppeteer, { Browser, Page } from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { ADRReport } from '@/types/report'

// Minimal PDF generation options
interface MinimalPDFOptions {
  format?: 'A4'
}

// Minimal report interface for testing
interface MinimalReport {
  id: string
  report_code: string
  patient_name: string
  patient_age: number
  patient_gender: 'male' | 'female'
  adr_occurrence_date: string
  adr_description: string
  severity_level: string
  reporter_name: string
  organization: string
}

// Ultra-minimal PDF service for Vercel deployment
export class MinimalPDFService {
  
  // Simple browser launcher with extensive error handling
  private static async launchBrowser(): Promise<Browser> {
    console.log('🚀 MinimalPDFService: Starting browser launch...')
    
    const isProduction = process.env.NODE_ENV === 'production'
    const isVercel = process.env.VERCEL === '1'
    
    console.log('Environment:', { isProduction, isVercel })

    try {
      if (isVercel) {
        console.log('Using @sparticuz/chromium for Vercel...')
        
        // Get chromium executable path
        const executablePath = await chromium.executablePath()
        console.log('Chromium executable path:', executablePath)
        
        return await puppeteer.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath,
          headless: true
        })
      } else {
        console.log('Using local puppeteer for development...')
        return await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        })
      }
    } catch (error) {
      console.error('❌ Browser launch failed:', error)
      throw new Error(`Failed to launch browser: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Generate minimal HTML template
  private static generateSimpleHTML(report: ADRReport | MinimalReport): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>ADR Report ${report.report_code}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 14px; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 18px; font-weight: bold; color: #2563eb; }
        .section { margin-bottom: 20px; }
        .label { font-weight: bold; display: inline-block; width: 150px; }
        .value { display: inline-block; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">BÁO CÁO PHẢN ỨNG CÓ HẠI CỦA THUỐC</div>
        <div>Mã: ${report.report_code}</div>
      </div>
      
      <div class="section">
        <div><span class="label">Tên bệnh nhân:</span> <span class="value">${report.patient_name || 'N/A'}</span></div>
        <div><span class="label">Tuổi:</span> <span class="value">${report.patient_age || 'N/A'}</span></div>
        <div><span class="label">Giới tính:</span> <span class="value">${report.patient_gender === 'male' ? 'Nam' : 'Nữ'}</span></div>
      </div>
      
      <div class="section">
        <div><span class="label">Ngày xảy ra ADR:</span> <span class="value">${new Date(report.adr_occurrence_date).toLocaleDateString('vi-VN')}</span></div>
        <div><span class="label">Mô tả:</span> <span class="value">${report.adr_description || 'N/A'}</span></div>
        <div><span class="label">Mức độ:</span> <span class="value">${report.severity_level || 'N/A'}</span></div>
      </div>
      
      <div class="section">
        <div><span class="label">Người báo cáo:</span> <span class="value">${report.reporter_name || 'N/A'}</span></div>
        <div><span class="label">Cơ sở:</span> <span class="value">${report.organization || 'N/A'}</span></div>
      </div>
    </body>
    </html>
    `
  }

  // Main PDF generation function
  static async generatePDF(report: ADRReport | MinimalReport, options: MinimalPDFOptions = {}): Promise<Buffer> {
    console.log('📄 MinimalPDFService: Starting PDF generation for report:', report.id)
    
    let browser: Browser | null = null
    let page: Page | null = null
    
    try {
      // Launch browser
      browser = await this.launchBrowser()
      console.log('✅ Browser launched successfully')

      // Create page
      page = await browser.newPage()
      console.log('✅ Page created')

      // Generate simple HTML
      const html = this.generateSimpleHTML(report)
      console.log('✅ HTML generated, length:', html.length)

      // Set content
      await page.setContent(html, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      })
      console.log('✅ Content set')

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
      })
      
      console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes')
      return Buffer.from(pdfBuffer)

    } catch (error) {
      console.error('❌ MinimalPDFService error:', error)
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      // Cleanup
      if (page) {
        try {
          await page.close()
          console.log('✅ Page closed')
        } catch (e) {
          console.warn('⚠️ Failed to close page:', e)
        }
      }
      
      if (browser) {
        try {
          await browser.close()
          console.log('✅ Browser closed')
        } catch (e) {
          console.warn('⚠️ Failed to close browser:', e)
        }
      }
    }
  }
}
