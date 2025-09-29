import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import { Database } from '@/types/supabase'
import { ADRReport } from '@/types/report'

// Force Node.js runtime (not Edge)
export const runtime = 'nodejs'

// Create Supabase admin client
const supabaseAdmin = createClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey
)

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const reportId = params.id

  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the report for HTML generation
    const { data: reportData, error } = await supabaseAdmin
      .from('adr_reports')
      .select(`
        *,
        suspected_drugs(*),
        concurrent_drugs(*)
      `)
      .eq('id', reportId)
      .single()

    if (error || !reportData) {
      return NextResponse.json(
        { error: 'Không tìm thấy báo cáo' },
        { status: 404 }
      )
    }

    const report = reportData as ADRReport

    console.log('=== SIMPLE HTML PDF SOLUTION ===')
    console.log('Report ID:', reportId)
    
    // Return HTML page that can be printed as PDF
    const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ADR Report ${report.report_code}</title>
      <style>
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          line-height: 1.6; 
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #333; 
          padding-bottom: 20px; 
        }
        .title { 
          font-size: 20px; 
          font-weight: bold; 
          color: #2563eb; 
          margin-bottom: 10px;
        }
        .section { 
          margin-bottom: 25px; 
        }
        .section-title {
          background-color: #f3f4f6;
          padding: 10px;
          border-left: 4px solid #2563eb;
          font-weight: bold;
          margin-bottom: 15px;
        }
        .field { 
          margin-bottom: 10px; 
          display: flex;
        }
        .label { 
          font-weight: bold; 
          display: inline-block; 
          width: 200px; 
          flex-shrink: 0;
        }
        .value {
          flex: 1;
        }
        .print-instructions {
          position: fixed;
          top: 10px;
          right: 10px;
          background: #e3f2fd;
          padding: 15px;
          border-radius: 5px;
          border: 1px solid #2196f3;
          max-width: 300px;
          z-index: 1000;
        }
        .btn {
          background: #2563eb;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          margin: 5px;
        }
        .btn:hover {
          background: #1d4ed8;
        }
      </style>
      <script>
        function printDocument() {
          window.print();
        }
        
        function closeWindow() {
          window.close();
        }
        
        // Auto-print after 1 second
        setTimeout(() => {
          const autoPrint = confirm("Tự động mở hộp thoại in PDF?");
          if (autoPrint) {
            window.print();
          }
        }, 1000);
      </script>
    </head>
    <body>
      <div class="print-instructions no-print">
        <h4 style="margin-top: 0; color: #1976d2;">📄 Hướng dẫn in PDF</h4>
        <ol style="padding-left: 20px; font-size: 14px;">
          <li>Nhấn <strong>Ctrl+P</strong> (PC) hoặc <strong>Cmd+P</strong> (Mac)</li>
          <li>Chọn <strong>"Save as PDF"</strong></li>
          <li>Nhấn <strong>"Save"</strong></li>
        </ol>
        <button class="btn" onclick="printDocument()">🖨️ In PDF</button>
        <button class="btn" onclick="closeWindow()" style="background: #666;">✖️ Đóng</button>
      </div>

      <div class="header">
        <div class="title">BÁO CÁO PHẢN ỨNG CÓ HẠI CỦA THUỐC</div>
        <div style="font-size: 16px; color: #666;">Mã báo cáo: <strong>${report.report_code}</strong></div>
        <div style="font-size: 14px; color: #888; margin-top: 5px;">
          Ngày tạo: ${new Date(report.created_at).toLocaleDateString('vi-VN')}
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">I. THÔNG TIN BỆNH NHÂN</div>
        <div class="field">
          <span class="label">Họ và tên:</span> 
          <span class="value">${report.patient_name || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="label">Tuổi:</span> 
          <span class="value">${report.patient_age || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="label">Giới tính:</span> 
          <span class="value">${report.patient_gender === 'male' ? 'Nam' : report.patient_gender === 'female' ? 'Nữ' : 'N/A'}</span>
        </div>
        <div class="field">
          <span class="label">Cân nặng:</span> 
          <span class="value">${report.patient_weight ? report.patient_weight + ' kg' : 'N/A'}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">II. THÔNG TIN PHẢN ỨNG CÓ HẠI</div>
        <div class="field">
          <span class="label">Ngày xảy ra ADR:</span> 
          <span class="value">${report.adr_occurrence_date ? new Date(report.adr_occurrence_date).toLocaleDateString('vi-VN') : 'N/A'}</span>
        </div>
        <div class="field">
          <span class="label">Thời gian xuất hiện:</span> 
          <span class="value">${report.reaction_onset_time || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="label">Mô tả phản ứng:</span> 
          <span class="value">${report.adr_description || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="label">Mức độ nghiêm trọng:</span> 
          <span class="value">${report.severity_level || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="label">Kết quả sau điều trị:</span> 
          <span class="value">${report.outcome_after_treatment || 'N/A'}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">III. THUỐC NGHI NGỜ GÂY ADR</div>
        ${report.suspected_drugs && report.suspected_drugs.length > 0 
          ? report.suspected_drugs.map(drug => `
            <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 5px;">
              <div class="field">
                <span class="label">Tên thuốc:</span>
                <span class="value">${drug.drug_name || 'N/A'}</span>
              </div>
              <div class="field">
                <span class="label">Tên thương mại:</span>
                <span class="value">${drug.commercial_name || 'N/A'}</span>
              </div>
              <div class="field">
                <span class="label">Liều dùng:</span>
                <span class="value">${drug.dosage_and_frequency || 'N/A'}</span>
              </div>
              <div class="field">
                <span class="label">Đường dùng:</span>
                <span class="value">${drug.route_of_administration || 'N/A'}</span>
              </div>
              <div class="field">
                <span class="label">Ngày bắt đầu:</span>
                <span class="value">${drug.start_date ? new Date(drug.start_date).toLocaleDateString('vi-VN') : 'N/A'}</span>
              </div>
              <div class="field">
                <span class="label">Ngày kết thúc:</span>
                <span class="value">${drug.end_date ? new Date(drug.end_date).toLocaleDateString('vi-VN') : 'N/A'}</span>
              </div>
            </div>
          `).join('')
          : '<p style="color: #666; font-style: italic;">Không có thông tin thuốc nghi ngờ</p>'
        }
      </div>
      
      <div class="section">
        <div class="section-title">IV. THÔNG TIN NGƯỜI BÁO CÁO</div>
        <div class="field">
          <span class="label">Người báo cáo:</span> 
          <span class="value">${report.reporter_name || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="label">Chuyên môn:</span> 
          <span class="value">${report.reporter_profession || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="label">Cơ sở y tế:</span> 
          <span class="value">${report.organization || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="label">Điện thoại:</span> 
          <span class="value">${report.reporter_phone || 'N/A'}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">V. ĐÁNH GIÁ MỐI LIÊN QUAN</div>
        <div class="field">
          <span class="label">Đánh giá mối liên quan:</span> 
          <span class="value">${report.causality_assessment || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="label">Thang đánh giá:</span> 
          <span class="value">${report.assessment_scale || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="label">Nhận xét:</span> 
          <span class="value">${report.medical_staff_comment || 'N/A'}</span>
        </div>
      </div>

      <div class="page-break"></div>
      
      <div style="text-align: center; margin-top: 50px; color: #666;">
        <p>--- Hết báo cáo ---</p>
        <p style="font-size: 12px;">
          Được tạo bởi hệ thống CODEX ADR | ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}
        </p>
      </div>
    </body>
    </html>
    `

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error: unknown) {
    const err = error instanceof Error ? error : null

    console.error('=== HTML PDF GENERATION ERROR ===')
    console.error('Report ID:', reportId)
    console.error('Error:', err?.message ?? String(error))

    return NextResponse.json(
      { 
        error: 'Có lỗi xảy ra khi tạo báo cáo PDF',
        details: err?.message ?? String(error),
        solution: 'PDF generation is temporarily using HTML print mode'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  // Redirect POST to GET for simplicity
  return NextResponse.redirect(new URL(`/api/reports/${params.id}/export-pdf`, request.url))
}