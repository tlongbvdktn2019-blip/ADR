import { ADRReport, SEVERITY_LABELS } from '../types/report'

export const ADR_REPORT_PDF_RECIPIENT = 'di.pvcenter@gmail.com'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

function formatSentAt(sentAt: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(sentAt)
}

export function buildReportPdfEmailSubject(report: ADRReport): string {
  const reportCode = sanitizeHeaderValue(report.report_code)
  const organization = sanitizeHeaderValue(report.organization)
  return `[ADR] Báo cáo ${reportCode} - ${organization}`
}

export function buildReportPdfEmailContent(
  report: ADRReport,
  sentAt: Date = new Date()
): { html: string; text: string } {
  const severity = SEVERITY_LABELS[report.severity_level]
  const sentTime = formatSentAt(sentAt)
  const reportCode = escapeHtml(report.report_code)
  const organization = escapeHtml(report.organization)

  return {
    html: `
      <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6">
        <h2 style="margin:0 0 16px">Báo cáo phản ứng có hại của thuốc (ADR)</h2>
        <p>File PDF của báo cáo được đính kèm trong email này.</p>
        <table style="border-collapse:collapse">
          <tr><td style="padding:4px 16px 4px 0"><strong>Mã báo cáo:</strong></td><td>${reportCode}</td></tr>
          <tr><td style="padding:4px 16px 4px 0"><strong>Đơn vị:</strong></td><td>${organization}</td></tr>
          <tr><td style="padding:4px 16px 4px 0"><strong>Mức độ:</strong></td><td>${escapeHtml(severity)}</td></tr>
          <tr><td style="padding:4px 16px 4px 0"><strong>Thời gian gửi:</strong></td><td>${escapeHtml(sentTime)}</td></tr>
        </table>
      </div>
    `.trim(),
    text: [
      'Báo cáo phản ứng có hại của thuốc (ADR)',
      'File PDF của báo cáo được đính kèm trong email này.',
      `Mã báo cáo: ${report.report_code}`,
      `Đơn vị: ${report.organization}`,
      `Mức độ: ${severity}`,
      `Thời gian gửi: ${sentTime}`,
    ].join('\n'),
  }
}
