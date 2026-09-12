import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { ADRReport, SEVERITY_LABELS, GENDER_LABELS, OUTCOME_LABELS, CAUSALITY_LABELS, REPORT_TYPE_LABELS } from '@/types/report'
import { getPatientAgeLabel } from '@/lib/patient-age'

export function generateADRReportEmailHTML(report: ADRReport): string {
  const patientAgeLabel = getPatientAgeLabel(report.patient_birth_date, report.adr_occurrence_date)
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi })
    } catch {
      return dateString
    }
  }

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi })
    } catch {
      return dateString
    }
  }

  const getSeverityBadgeColor = (severity: typeof report.severity_level) => {
    switch (severity) {
      case 'death':
      case 'life_threatening':
        return '#dc2626' // red
      case 'hospitalization':
      case 'permanent_disability':
        return '#ea580c' // orange
      case 'birth_defect':
        return '#9333ea' // purple
      default:
        return '#16a34a' // green
    }
  }

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Báo cáo ADR - ${report.report_code}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333;
            background-color: #f8fafc;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .header h1 { font-size: 28px; margin-bottom: 8px; }
        .header p { opacity: 0.9; font-size: 16px; }
        .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            color: white;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 10px 0;
        }
        .section {
            margin: 30px 0;
            padding: 25px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background-color: #ffffff;
        }
        .section-title {
            color: #1e40af;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #3b82f6;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 15px;
        }
        .info-item {
            border-left: 4px solid #3b82f6;
            padding-left: 15px;
        }
        .info-label {
            font-weight: bold;
            color: #4b5563;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .info-value {
            font-size: 16px;
            color: #1f2937;
            margin-top: 5px;
        }
        .description-box {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #06b6d4;
            margin: 15px 0;
        }
        .drug-card {
            background-color: #fef7f3;
            border: 1px solid #fed7aa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
        }
        .drug-title {
            color: #c2410c;
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 10px;
        }
        .footer {
            background-color: #f1f5f9;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 8px 8px;
            margin-top: 30px;
            border-top: 3px solid #3b82f6;
        }
        .warning {
            background-color: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
        .warning-title {
            color: #92400e;
            font-weight: bold;
            margin-bottom: 5px;
        }
        @media (max-width: 600px) {
            .container { padding: 10px; }
            .header { padding: 20px; }
            .section { padding: 15px; }
            .info-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>Báo cáo Phản ứng có hại của thuốc (ADR)</h1>
            <p>Mã báo cáo: <strong>${report.report_code}</strong></p>
            <div class="badge" style="background-color: ${getSeverityBadgeColor(report.severity_level)};">
                ${SEVERITY_LABELS[report.severity_level]}
            </div>
        </div>

        <!-- Thông tin tóm tắt -->
        <div class="section">
            <div class="section-title">📋 Thông tin tổng quan</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Đơn vị báo cáo</div>
                    <div class="info-value">${report.organization}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Ngày tạo báo cáo</div>
                    <div class="info-value">${formatDateTime(report.created_at)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Loại báo cáo</div>
                    <div class="info-value">${REPORT_TYPE_LABELS[report.report_type]}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Người báo cáo</div>
                    <div class="info-value">${report.reporter_name} (${report.reporter_profession})</div>
                </div>
            </div>
        </div>

        <!-- Phần A: Thông tin bệnh nhân -->
        <div class="section">
            <div class="section-title">👤 Phần A. Thông tin bệnh nhân</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Họ và tên</div>
                    <div class="info-value">${report.patient_name}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Tuổi / Giới tính</div>
                    <div class="info-value">${patientAgeLabel} / ${GENDER_LABELS[report.patient_gender]}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Ngày sinh</div>
                    <div class="info-value">${formatDate(report.patient_birth_date)}</div>
                </div>
                ${report.patient_weight ? `
                <div class="info-item">
                    <div class="info-label">Cân nặng</div>
                    <div class="info-value">${report.patient_weight} kg</div>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- Phần B: Thông tin ADR -->
        <div class="section">
            <div class="section-title">⚠️ Phần B. Thông tin phản ứng có hại (ADR)</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Ngày xảy ra ADR</div>
                    <div class="info-value">${formatDate(report.adr_occurrence_date)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Mức độ nghiêm trọng</div>
                    <div class="info-value">
                        <span class="badge" style="background-color: ${getSeverityBadgeColor(report.severity_level)};">
                            ${SEVERITY_LABELS[report.severity_level]}
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="info-item" style="margin-top: 20px;">
                <div class="info-label">Mô tả biểu hiện ADR</div>
                <div class="description-box">
                    ${report.adr_description.replace(/\n/g, '<br>')}
                </div>
            </div>

            ${report.related_tests ? `
            <div class="info-item">
                <div class="info-label">Các xét nghiệm liên quan</div>
                <div class="info-value">${report.related_tests.replace(/\n/g, '<br>')}</div>
            </div>
            ` : ''}

            ${report.medical_history ? `
            <div class="info-item">
                <div class="info-label">Tiền sử bệnh</div>
                <div class="info-value">${report.medical_history.replace(/\n/g, '<br>')}</div>
            </div>
            ` : ''}

            ${report.treatment_response ? `
            <div class="info-item">
                <div class="info-label">Cách xử trí phản ứng</div>
                <div class="info-value">${report.treatment_response.replace(/\n/g, '<br>')}</div>
            </div>
            ` : ''}

            <div class="info-item">
                <div class="info-label">Kết quả sau xử trí</div>
                <div class="info-value">${OUTCOME_LABELS[report.outcome_after_treatment]}</div>
            </div>
        </div>

        <!-- Phần C: Thuốc nghi ngờ -->
        ${report.suspected_drugs && report.suspected_drugs.length > 0 ? `
        <div class="section">
            <div class="section-title">💊 Phần C. Thuốc nghi ngờ gây ADR (${report.suspected_drugs.length} thuốc)</div>
            ${report.suspected_drugs.map((drug, index) => `
                <div class="drug-card">
                    <div class="drug-title">Thuốc #${index + 1}: ${drug.drug_name}</div>
                    <div class="info-grid">
                        ${drug.commercial_name ? `
                        <div class="info-item">
                            <div class="info-label">Tên thương mại</div>
                            <div class="info-value">${drug.commercial_name}</div>
                        </div>
                        ` : ''}
                        ${drug.dosage_form ? `
                        <div class="info-item">
                            <div class="info-label">Dạng bào chế</div>
                            <div class="info-value">${drug.dosage_form}</div>
                        </div>
                        ` : ''}
                        ${drug.manufacturer ? `
                        <div class="info-item">
                            <div class="info-label">Nhà sản xuất</div>
                            <div class="info-value">${drug.manufacturer}</div>
                        </div>
                        ` : ''}
                        ${drug.dosage_and_frequency ? `
                        <div class="info-item">
                            <div class="info-label">Liều dùng và tần suất</div>
                            <div class="info-value">${drug.dosage_and_frequency}</div>
                        </div>
                        ` : ''}
                        ${drug.start_date ? `
                        <div class="info-item">
                            <div class="info-label">Ngày bắt đầu</div>
                            <div class="info-value">${formatDate(drug.start_date)}</div>
                        </div>
                        ` : ''}
                        ${drug.end_date ? `
                        <div class="info-item">
                            <div class="info-label">Ngày kết thúc</div>
                            <div class="info-value">${formatDate(drug.end_date)}</div>
                        </div>
                        ` : ''}
                    </div>
                    ${drug.indication ? `
                    <div class="info-item" style="margin-top: 15px;">
                        <div class="info-label">Lý do dùng thuốc</div>
                        <div class="info-value">${drug.indication}</div>
                    </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- Phần D: Thẩm định ADR -->
        <div class="section">
            <div class="section-title">🔍 Phần D. Thẩm định ADR</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Đánh giá mối liên quan</div>
                    <div class="info-value">${CAUSALITY_LABELS[report.causality_assessment]}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Thang đánh giá</div>
                    <div class="info-value">${report.assessment_scale === 'who' ? 'Thang WHO-UMC' : 'Thang Naranjo'}</div>
                </div>
            </div>
            
            ${report.medical_staff_comment ? `
            <div class="info-item" style="margin-top: 20px;">
                <div class="info-label">Bình luận của cán bộ y tế</div>
                <div class="description-box">
                    ${report.medical_staff_comment.replace(/\n/g, '<br>')}
                </div>
            </div>
            ` : ''}
        </div>

        <!-- Phần E: Thông tin người báo cáo -->
        <div class="section">
            <div class="section-title">📞 Phần E. Thông tin người báo cáo</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Họ và tên</div>
                    <div class="info-value">${report.reporter_name}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Nghề nghiệp</div>
                    <div class="info-value">${report.reporter_profession}</div>
                </div>
                ${report.reporter_phone ? `
                <div class="info-item">
                    <div class="info-label">Điện thoại</div>
                    <div class="info-value">${report.reporter_phone}</div>
                </div>
                ` : ''}
                ${report.reporter_email ? `
                <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value">${report.reporter_email}</div>
                </div>
                ` : ''}
                <div class="info-item">
                    <div class="info-label">Ngày báo cáo</div>
                    <div class="info-value">${formatDate(report.report_date)}</div>
                </div>
            </div>
        </div>

        <!-- Warning -->
        <div class="warning">
            <div class="warning-title">⚠️ Lưu ý quan trọng</div>
            <p>Đây là báo cáo ADR chính thức từ hệ thống quản lý. Vui lòng bảo mật thông tin bệnh nhân theo quy định pháp luật.</p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>Hệ thống Quản lý ADR</strong></p>
            <p>Tự động gửi từ hệ thống vào ${formatDateTime(new Date().toISOString())}</p>
            <p style="margin-top: 10px; font-size: 14px; color: #6b7280;">
                📧 Email: di.pvcenter@gmail.com | 🌐 ADR Management System
            </p>
        </div>
    </div>
</body>
</html>
  `
}

export function generateADRReportEmailSubject(report: ADRReport): string {
  return `[ADR] ${report.report_code} - ${report.patient_name} (${SEVERITY_LABELS[report.severity_level]})`
}

export function generateADRReportEmailText(report: ADRReport): string {
  const patientAgeLabel = getPatientAgeLabel(report.patient_birth_date, report.adr_occurrence_date)
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi })
    } catch {
      return dateString
    }
  }

  return `
BÁO CÁO PHẢN ỨNG CÓ HẠI CỦA THUỐC (ADR)

Mã báo cáo: ${report.report_code}
Mức độ nghiêm trọng: ${SEVERITY_LABELS[report.severity_level]}

=== THÔNG TIN BỆNH NHÂN ===
Họ tên: ${report.patient_name}
Tuổi: ${patientAgeLabel} (${GENDER_LABELS[report.patient_gender]})
Ngày sinh: ${formatDate(report.patient_birth_date)}
${report.patient_weight ? `Cân nặng: ${report.patient_weight} kg` : ''}

=== THÔNG TIN ADR ===
Ngày xảy ra: ${formatDate(report.adr_occurrence_date)}
Mô tả: ${report.adr_description}
Kết quả sau xử trí: ${OUTCOME_LABELS[report.outcome_after_treatment]}

=== THUỐC NGHI NGỜ ===
${report.suspected_drugs?.map((drug, index) => 
  `${index + 1}. ${drug.drug_name}${drug.commercial_name ? ` (${drug.commercial_name})` : ''}`
).join('\n') || 'Không có'}

=== ĐÁNH GIÁ ===
Mối liên quan thuốc-ADR: ${CAUSALITY_LABELS[report.causality_assessment]}
Thang đánh giá: ${report.assessment_scale === 'who' ? 'WHO-UMC' : 'Naranjo'}

=== NGƯỜI BÁO CÁO ===
Họ tên: ${report.reporter_name}
Nghề nghiệp: ${report.reporter_profession}
Đơn vị: ${report.organization}
${report.reporter_phone ? `Điện thoại: ${report.reporter_phone}` : ''}
${report.reporter_email ? `Email: ${report.reporter_email}` : ''}

---
Báo cáo tự động từ Hệ thống Quản lý ADR
Thời gian gửi: ${new Date().toLocaleString('vi-VN')}
  `.trim()
}


