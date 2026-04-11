import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createAdminClient } from '@/lib/supabase'
import { ADRReport } from '@/types/report'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

// Force Node.js runtime (not Edge)
export const runtime = 'nodejs'

interface RouteParams {
  params: {
    id: string
  }
}

// Labels for display (Vietnamese)
const SEVERITY_LABELS = {
  'death': 'Tử vong',
  'life_threatening': 'Đe dọa tính mạng',
  'hospitalization': 'Nhập viện/Kéo dài thời gian nằm viện',
  'permanent_disability': 'Tàn tật vĩnh viễn/nặng nề',
  'birth_defect': 'Dị tật thai nhi',
  'not_serious': 'Không nghiêm trọng'
}

const OUTCOME_LABELS = {
  'death_by_adr': 'Tử vong do ADR',
  'death_unrelated': 'Tử vong không liên quan đến thuốc',
  'not_recovered': 'Chưa hồi phục',
  'recovering': 'Đang hồi phục',
  'recovered_with_sequelae': 'Hồi phục có di chứng',
  'recovered_without_sequelae': 'Hồi phục không có di chứng',
  'unknown': 'Không rõ'
}

const CAUSALITY_LABELS = {
  'certain': 'Chắc chắn',
  'probable': 'Có khả năng',
  'possible': 'Có thể',
  'unlikely': 'Không chắc chắn',
  'unclassified': 'Chưa phân loại',
  'unclassifiable': 'Không thể phân loại'
}

const GENDER_LABELS = {
  'male': 'Nam',
  'female': 'Nữ'
}

const REPORT_TYPE_LABELS = {
  'initial': 'Lần đầu',
  'follow_up': 'Bổ sung'
}

function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi })
  } catch {
    return dateString
  }
}

function generatePrintHTML(report: ADRReport): string {
  // Generate suspected drugs rows exactly like template (i, ii, iii, iv)
  const suspectedDrugsRows = ['i', 'ii', 'iii', 'iv'].map((roman, index) => {
    const drug = report.suspected_drugs?.[index]
    if (drug) {
      // Use new dosage and frequency fields, fallback to split old field if needed
      let singleDose = drug.dosage || ''
      let frequency = drug.frequency || ''
      
      // Fallback: if new fields are empty but old field exists, split it
      if ((!singleDose || singleDose === 'null') && (!frequency || frequency === 'null') && drug.dosage_and_frequency) {
        const dosageParts = drug.dosage_and_frequency.split(/[xX×\s]+/)
        singleDose = dosageParts[0]?.trim() || ''
        frequency = dosageParts.length > 1 ? dosageParts.slice(1).join(' ').trim() : ''
      }
      
      return `
        <tr>
          <td class="center">${roman}</td>
          <td>${drug.drug_name}${drug.commercial_name ? ' (' + drug.commercial_name + ')' : ''}</td>
          <td>${drug.dosage_form || ''}</td>
          <td>${drug.manufacturer || ''}</td>
          <td>${drug.batch_number || ''}</td>
          <td>${singleDose}</td>
          <td>${frequency}</td>
          <td>${drug.route_of_administration || ''}</td>
          <td>${drug.start_date ? formatDate(drug.start_date) : ''}</td>
          <td>${drug.end_date ? formatDate(drug.end_date) : ''}</td>
          <td>${drug.indication || ''}</td>
        </tr>
      `
    }
    return `<tr><td class="center">${roman}</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`
  }).join('')

  // Generate reaction checkboxes exactly like template  
  const drugReactionsRows = ['i', 'ii', 'iii', 'iv'].map((roman, index) => {
    const drug = report.suspected_drugs?.[index]
    const dechallengeValue = drug?.reaction_improved_after_stopping || 'no_information'
    const rechallengeValue = drug?.reaction_reoccurred_after_rechallenge || 'no_information'
    
    return `
      <tr>
        <td class="center">${roman}</td>
        <td>
          <input type="checkbox"${dechallengeValue === 'yes' ? ' checked' : ''}> Có 
          <input type="checkbox"${dechallengeValue === 'no' ? ' checked' : ''}> Không 
          <input type="checkbox"${dechallengeValue === 'not_stopped' ? ' checked' : ''}> Không ngừng/giảm liều 
          <input type="checkbox"${dechallengeValue === 'no_information' ? ' checked' : ''}> Không có thông tin
        </td>
        <td>
          <input type="checkbox"${rechallengeValue === 'yes' ? ' checked' : ''}> Có 
          <input type="checkbox"${rechallengeValue === 'no' ? ' checked' : ''}> Không 
          <input type="checkbox"${rechallengeValue === 'not_rechallenged' ? ' checked' : ''}> Không tái sử dụng 
          <input type="checkbox"${rechallengeValue === 'no_information' ? ' checked' : ''}> Không có thông tin
        </td>
      </tr>
    `
  }).join('')

  // Generate concurrent drugs rows (5 rows max)
  const concurrentDrugsRows = Array.from({length: 5}, (_, index) => {
    const drug = report.concurrent_drugs?.[index]
    if (drug) {
      return `
        <tr>
          <td>${drug.drug_name}</td>
          <td>${drug.dosage_form_strength || ''}</td>
          <td>${drug.start_date ? formatDate(drug.start_date) : ''}</td>
          <td>${drug.end_date ? formatDate(drug.end_date) : ''}</td>
        </tr>
      `
    }
    return '<tr><td></td><td></td><td></td><td></td></tr>'
  }).join('')

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Báo cáo ADR - ${report.report_code}</title>
    <style>
        /* Exact copy of template.html styles */
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            background-color: #ccc;
            margin: 0;
            padding: 15px;
        }
        .container {
            width: 800px;
            background-color: #fff;
            margin: auto;
            border: 2px solid black;
            padding: 15px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid black;
        }
        td, th {
            border: 1px solid black;
            padding: 4px;
            vertical-align: top;
        }
        input[type="text"], textarea {
            width: 98%;
            border: none;
            border-bottom: 1px dotted #000;
            font-family: Arial, sans-serif;
            font-size: 10px;
            background: transparent;
            color: #000;
        }
        textarea {
            resize: vertical;
        }
        input[type="checkbox"], input[type="radio"] {
            margin-right: 5px;
        }
        .header-title {
            text-align: center;
            font-weight: bold;
        }
        .header-title h1 {
            font-size: 16px;
            margin: 5px 0;
        }
        .header-title p {
            font-size: 12px;
            margin: 5px 0;
        }
        .section-header {
            background-color: #000;
            color: #fff;
            font-weight: bold;
            padding: 5px;
            text-align: left;
        }
        .no-border, .no-border td {
            border: none;
        }
        .full-width-cell {
            padding: 0;
        }
        .full-width-cell table {
            border: none;
        }
        .full-width-cell table td {
            border-top: 1px solid black;
            border-bottom: 1px solid black;
            border-left: none;
            border-right: none;
        }
        .small-text {
            font-size: 9px;
        }
        .light-blue-bg {
            background-color: #e6f2ff;
        }
        .center {
            text-align: center;
        }
        
        /* Print optimizations */
        @media print {
            body {
                background-color: #fff;
                padding: 10px;
                font-size: 10px;
            }
            .container {
                border: 2px solid black;
            }
            .no-print {
                display: none !important;
            }
            .page-break {
                page-break-before: always;
            }
            table {
                page-break-inside: avoid;
            }
        }

        /* Print button styles */
        .print-actions {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            border: 1px solid #ccc;
            font-size: 14px;
        }

        .print-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            margin-right: 10px;
            transition: background-color 0.2s;
        }

        .print-btn:hover {
            background: #2563eb;
        }

        .close-btn {
            background: #6b7280;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .close-btn:hover {
            background: #4b5563;
        }
        
        /* Signature box */
        .signature-box {
            height: 40px;
            border: 1px dotted #000;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="print-actions no-print">
        <button class="print-btn" onclick="window.print()">🖨️ In báo cáo</button>
        <button class="close-btn" onclick="window.close()">✕ Đóng</button>
    </div>

    <div class="container">
        <!-- HEADER - Exact copy from template -->
        <table class="no-border">
            <tr>
                <td style="width: 50%; font-weight: bold; font-size: 12px;">PDF FORM</td>
                <td style="width: 50%; text-align: right; font-weight: bold; font-size: 16px;">ADR</td>
            </tr>
            <tr>
                <td colspan="2" class="header-title">
                    <h1>BÁO CÁO PHẢN ỨNG CÓ HẠI CỦA THUỐC</h1>
                    <p>THÔNG TIN VỀ NGƯỜI BÁO CÁO, BỆNH NHÂN VÀ ĐƠN VỊ BÁO CÁO</p>
                    <p style="font-weight: normal;">SẼ ĐƯỢC BẢO MẬT</p>
                </td>
            </tr>
        </table>
        
        <table class="no-border" style="margin-top: -10px;">
            <tr>
                <td style="width: 60%; vertical-align: bottom;">
                    <i>Xin anh/chị hãy báo cáo kể cả khi không chắc chắn về sản phẩm đã gây ra phản ứng và/hoặc không có đầy đủ các thông tin</i>
                </td>
                <td style="width: 40%;">
                    <table style="border: 2px solid black;">
                        <tr><td>Nơi báo cáo: <input type="text" value="${report.organization}"></td></tr>
                        <tr><td>Mã số báo cáo của đơn vị: <input type="text" value="${report.report_code}"></td></tr>
                        <tr><td>Mã số báo cáo (do Trung tâm quốc gia quản lý): <input type="text" value="${report.report_code}"></td></tr>
                    </table>
                </td>
            </tr>
        </table>

        <!-- A. THÔNG TIN VỀ BỆNH NHÂN -->
        <div class="section-header">A. THÔNG TIN VỀ BỆNH NHÂN</div>
        <table>
            <tr>
                <td style="width: 40%;">1. Họ và tên: <input type="text" style="width: 80%;" value="${report.patient_name}"></td>
                <td style="width: 25%;">2. Ngày sinh: <input type="text" style="width: 70%;" value="${formatDate(report.patient_birth_date)}"><br>Hoặc tuổi: <input type="text" style="width: 70%;" value="${report.patient_age}"></td>
                <td style="width: 20%;">3. Giới tính <br> <input type="checkbox"${report.patient_gender === 'male' ? ' checked' : ''}> Nam <input type="checkbox"${report.patient_gender === 'female' ? ' checked' : ''}> Nữ</td>
                <td style="width: 15%;">4. Cân nặng <br> <input type="text" style="width: 50%;" value="${report.patient_weight || ''}"> kg</td>
            </tr>
        </table>

        <!-- B. THÔNG TIN VỀ PHẢN ỨNG CÓ HẠI (ADR) -->
        <div class="section-header">B. THÔNG TIN VỀ PHẢN ỨNG CÓ HẠI (ADR)</div>
        <table>
            <tr>
                <td style="width: 50%;">5. Ngày xuất hiện phản ứng: <input type="text" value="${formatDate(report.adr_occurrence_date)}"></td>
                <td>6. Phản ứng xuất hiện sau bao lâu (tính từ lần dùng cuối cùng của thuốc nghi ngờ): <input type="text" value="${report.reaction_onset_time || ''}"></td>
            </tr>
            <tr>
                <td colspan="2" class="full-width-cell">
                    <table>
                        <tr>
                            <td class="light-blue-bg" style="width: 50%;">7. Mô tả biểu hiện ADR</td>
                            <td class="light-blue-bg" style="width: 50%;">8. Các xét nghiệm liên quan đến phản ứng</td>
                        </tr>
                        <tr>
                            <td style="height: 100px;"><textarea style="height: 95px;">${report.adr_description}</textarea></td>
                            <td style="height: 100px;"><textarea style="height: 95px;">${report.related_tests || ''}</textarea></td>
                        </tr>
                        <tr>
                            <td class="light-blue-bg">9. Tiền sử (dị ứng, thai nghén, nghiện thuốc lá, nghiện rượu, bệnh gan, bệnh thận...)</td>
                            <td class="light-blue-bg">10. Cách xử trí phản ứng</td>
                        </tr>
                        <tr>
                            <td style="height: 80px;"><textarea style="height: 75px;">${report.medical_history || ''}</textarea></td>
                            <td style="height: 80px;"><textarea style="height: 75px;">${report.treatment_response || ''}</textarea></td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td colspan="3" class="full-width-cell">
                     <table class="no-border">
                        <tr>
                            <td style="width: 33.3%;">
                                11. Mức độ nghiêm trọng của phản ứng<br>
                                <input type="checkbox"${report.severity_level === 'death' ? ' checked' : ''}> Tử vong <br>
                                <input type="checkbox"${report.severity_level === 'life_threatening' ? ' checked' : ''}> Đe dọa tính mạng
                            </td>
                            <td style="width: 33.3%;">
                                <br>
                                <input type="checkbox"${report.severity_level === 'hospitalization' ? ' checked' : ''}> Nhập viện/Kéo dài thời gian nằm viện <br>
                                <input type="checkbox"${report.severity_level === 'permanent_disability' ? ' checked' : ''}> Tàn tật vĩnh viễn/nặng nề
                            </td>
                            <td style="width: 33.3%;">
                                <br>
                                <input type="checkbox"${report.severity_level === 'birth_defect' ? ' checked' : ''}> Dị tật thai nhi <br>
                                <input type="checkbox"${report.severity_level === 'not_serious' ? ' checked' : ''}> Không nghiêm trọng
                            </td>
                        </tr>
                        <tr>
                            <td>
                                12. Kết quả sau khi xử trí phản ứng<br>
                                <input type="checkbox"${report.outcome_after_treatment === 'death_by_adr' ? ' checked' : ''}> Tử vong do ADR<br>
                                <input type="checkbox"${report.outcome_after_treatment === 'death_unrelated' ? ' checked' : ''}> Tử vong không liên quan đến thuốc
                            </td>
                            <td>
                                <br>
                                <input type="checkbox"${report.outcome_after_treatment === 'not_recovered' ? ' checked' : ''}> Chưa hồi phục<br>
                                <input type="checkbox"${report.outcome_after_treatment === 'recovering' ? ' checked' : ''}> Đang hồi phục
                            </td>
                            <td>
                                <br>
                                <input type="checkbox"${report.outcome_after_treatment === 'recovered_with_sequelae' ? ' checked' : ''}> Hồi phục có di chứng<br>
                                <input type="checkbox"${report.outcome_after_treatment === 'recovered_without_sequelae' ? ' checked' : ''}> Hồi phục không có di chứng
                            </td>
                             <td>
                                <br>
                                <input type="checkbox"${report.outcome_after_treatment === 'unknown' ? ' checked' : ''}> Không rõ
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        
        <!-- C. THÔNG TIN VỀ THUỐC NGHI NGỜ GÂY ADR -->
        <div class="section-header">C. THÔNG TIN VỀ THUỐC NGHI NGỜ GÂY ADR</div>
        <table>
            <tr class="center light-blue-bg">
                <td style="width: 4%;">STT</td>
                <td style="width: 15%;">13. Thuốc (tên gốc và tên thương mại)</td>
                <td style="width: 10%;">Dạng bào chế, hàm lượng</td>
                <td style="width: 10%;">Nhà sản xuất</td>
                <td style="width: 8%;">Số lô</td>
                <td style="width: 8%;">Liều dùng một lần</td>
                <td style="width: 10%;">Số lần dùng trong ngày/ tuần/ tháng</td>
                <td style="width: 8%;">Đường dùng</td>
                <td colspan="2">Ngày điều trị (ngày/tháng/năm)</td>
                <td style="width: 15%;">Lý do dùng thuốc</td>
            </tr>
            <tr class="center light-blue-bg">
                <td colspan="8"></td>
                <td style="width: 7%;">Bắt đầu</td>
                <td style="width: 7%;">Kết thúc</td>
                <td></td>
            </tr>
            ${suspectedDrugsRows}
        </table>
        
        <table>
            <tr class="light-blue-bg">
                <td class="center" style="width: 4%;">STT (Tương ứng 13.)</td>
                <td class="center">14. Sau khi ngừng/giảm liều của thuốc bị nghi ngờ, phản ứng có được cải thiện không?</td>
                <td class="center">15. Tái sử dụng thuốc bị nghi ngờ có xuất hiện lại phản ứng không?</td>
            </tr>
            ${drugReactionsRows}
        </table>

        <!-- Section 16: Concurrent Drugs Table -->
        <table>
            <tr class="light-blue-bg">
                <td colspan="4"><strong>16. THUỐC DÙNG ĐỒNG THỜI</strong></td>
            </tr>
            <tr class="center light-blue-bg">
                <td style="width: 25%;"><strong>Tên thuốc</strong></td>
                <td style="width: 25%;"><strong>Dạng bào chế, hàm lượng</strong></td>
                <td style="width: 25%;"><strong>Ngày bắt đầu điều trị</strong></td>
                <td style="width: 25%;"><strong>Ngày kết thúc điều trị</strong></td>
            </tr>
            ${concurrentDrugsRows}
        </table>
        
        <!-- D. PHẦN THẨM ĐỊNH -->
        <div class="section-header">D. PHẦN THẨM ĐỊNH ADR CỦA ĐƠN VỊ</div>
        <table>
            <tr>
                <td style="width: 50%;">17. Đánh giá mối liên quan giữa thuốc và ADR: <br>
                    <input type="checkbox"${report.causality_assessment === 'certain' ? ' checked' : ''}> Chắc chắn <input type="checkbox"${report.causality_assessment === 'unlikely' ? ' checked' : ''}> Không chắc chắn <br>
                    <input type="checkbox"${report.causality_assessment === 'probable' ? ' checked' : ''}> Có khả năng <input type="checkbox"${report.causality_assessment === 'unclassified' ? ' checked' : ''}> Chưa phân loại <br>
                    <input type="checkbox"${report.causality_assessment === 'possible' ? ' checked' : ''}> Có thể <input type="checkbox"${report.causality_assessment === 'unclassifiable' ? ' checked' : ''}> Không thể phân loại
                </td>
                <td style="width: 50%;" rowspan="2">19. Phần bình luận của cán bộ y tế (nếu có)
                    <textarea style="height: 80px;">${report.medical_staff_comment || ''}</textarea>
                </td>
            </tr>
            <tr>
                <td>18. Đơn vị thẩm định ADR theo thang nào? <br>
                    <input type="checkbox"${report.assessment_scale === 'who' ? ' checked' : ''}> Thang WHO <input type="checkbox"${report.assessment_scale === 'naranjo' ? ' checked' : ''}> Thang Naranjo <input type="checkbox"> Thang khác: <input type="text" style="width: 20%;">
                </td>
            </tr>
        </table>
        
        <!-- E. THÔNG TIN VỀ NGƯỜI BÁO CÁO -->
        <div class="section-header">E. THÔNG TIN VỀ NGƯỜI BÁO CÁO</div>
        <table>
            <tr>
                <td style="width: 50%;">20. Họ và tên: <input type="text" style="width: 80%;" value="${report.reporter_name}"></td>
                <td>Nghề nghiệp/Chức vụ: <input type="text" style="width: 70%;" value="${report.reporter_profession}"></td>
            </tr>
            <tr>
                <td>Điện thoại liên lạc: <input type="text" style="width: 75%;" value="${report.reporter_phone || ''}"></td>
                <td>Email: <input type="text" style="width: 90%;" value="${report.reporter_email || ''}"></td>
            </tr>
            <tr>
                <td>21. Chữ ký: <div class="signature-box"></div></td>
                <td>
                    22. Dạng báo cáo: <input type="checkbox"${report.report_type === 'initial' ? ' checked' : ''}> Lần đầu <input type="checkbox"${report.report_type === 'follow_up' ? ' checked' : ''}> Bổ sung <br><br>
                    23. Ngày báo cáo: <input type="text" value="${formatDate(report.report_date)}">
                </td>
            </tr>
        </table>
        
        <div style="text-align:center; font-weight:bold; padding: 5px;">Xin chân thành cảm ơn!</div>
    </div>

    <script>
        // Auto focus when page loads
        window.addEventListener('load', function() {
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                window.print();
            }
            if (e.key === 'Escape') {
                window.close();
            }
        });
    </script>
</body>
</html>`
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

    // Get the report with suspected and concurrent drugs
    const supabase = createAdminClient()
    const { data: reportData, error } = await supabase
      .from('adr_reports')
      .select(`
        *,
        suspected_drugs(*),
        concurrent_drugs(*)
      `)
      .eq('id', reportId)
      .single()

    if (error || !reportData) {
      console.error('Report not found:', error)
      return NextResponse.json(
        { error: 'Không tìm thấy báo cáo' },
        { status: 404 }
      )
    }

    const report = reportData as ADRReport

    // Generate form-style HTML exactly like template.html
    const html = generatePrintHTML(report)

    // Return HTML response
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    })

  } catch (error) {
    console.error('Print view error:', error)
    return NextResponse.json(
      { 
        error: 'Có lỗi xảy ra khi tạo view in', 
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'Error'
      },
      { status: 500 }
    )
  }
}
