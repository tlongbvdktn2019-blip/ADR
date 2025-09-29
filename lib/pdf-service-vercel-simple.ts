// Ultra-simple PDF service for Vercel - Fallback solution
import { NextResponse } from 'next/server'

// Fallback HTML-to-PDF using simple approach
export class SimplePDFService {
  
  static async generateFallbackResponse(reportData: any): Promise<NextResponse> {
    try {
      // Instead of puppeteer, return a simple HTML response that can be printed as PDF
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ADR Report ${reportData.report_code}</title>
        <style>
          @media print {
            body { margin: 0; font-family: Arial, sans-serif; }
            .no-print { display: none; }
          }
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; color: #2563eb; }
          .section { margin-bottom: 20px; }
          .field { margin-bottom: 10px; }
          .label { font-weight: bold; display: inline-block; width: 200px; }
        </style>
        <script>
          window.onload = function() {
            // Auto-trigger print dialog
            setTimeout(() => window.print(), 500);
          }
        </script>
      </head>
      <body>
        <div class="header">
          <div class="title">BÁO CÁO PHẢN ỨNG CÓ HẠI CỦA THUỐC</div>
          <div>Mã báo cáo: ${reportData.report_code}</div>
        </div>
        
        <div class="section">
          <h3>I. THÔNG TIN BỆNH NHÂN</h3>
          <div class="field"><span class="label">Họ và tên:</span> ${reportData.patient_name}</div>
          <div class="field"><span class="label">Tuổi:</span> ${reportData.patient_age}</div>
          <div class="field"><span class="label">Giới tính:</span> ${reportData.patient_gender === 'male' ? 'Nam' : 'Nữ'}</div>
        </div>
        
        <div class="section">
          <h3>II. THÔNG TIN PHẢN ỨNG</h3>
          <div class="field"><span class="label">Ngày xảy ra ADR:</span> ${new Date(reportData.adr_occurrence_date).toLocaleDateString('vi-VN')}</div>
          <div class="field"><span class="label">Mô tả phản ứng:</span> ${reportData.adr_description}</div>
          <div class="field"><span class="label">Mức độ nghiêm trọng:</span> ${reportData.severity_level}</div>
        </div>
        
        <div class="section">
          <h3>III. THÔNG TIN NGƯỜI BÁO CÁO</h3>
          <div class="field"><span class="label">Người báo cáo:</span> ${reportData.reporter_name}</div>
          <div class="field"><span class="label">Cơ sở:</span> ${reportData.organization}</div>
        </div>
        
        <div class="no-print" style="position: fixed; top: 10px; right: 10px; background: #f0f0f0; padding: 10px; border-radius: 5px;">
          <p><strong>Hướng dẫn:</strong></p>
          <p>• Sử dụng Ctrl+P để in</p>
          <p>• Chọn "Save as PDF" trong print dialog</p>
          <p>• Hoặc đóng trang này và thử lại</p>
        </div>
      </body>
      </html>
      `
      
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache'
        }
      })
      
    } catch (error) {
      console.error('Fallback PDF service error:', error)
      
      return NextResponse.json({
        error: 'PDF generation temporarily unavailable',
        message: 'Please try again later or contact support',
        fallback: true
      }, { status: 503 })
    }
  }
}
