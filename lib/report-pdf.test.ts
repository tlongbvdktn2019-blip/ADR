import { describe, expect, it, vi } from 'vitest'
import { buildEmailMessage } from './email-service'
import {
  ADR_REPORT_PDF_RECIPIENT,
  buildReportPdfEmailContent,
  buildReportPdfEmailSubject,
} from './report-pdf-email'
import {
  buildReportPdfFilename,
  generateReportPdf,
  type ReportPdfBrowser,
  type ReportPdfPage,
} from './report-pdf-service'
import { generateReportPrintHTML } from './report-print-template'
import { ADRReport } from '../types/report'

function createReport(overrides: Partial<ADRReport> = {}): ADRReport {
  return {
    id: 'report-1',
    report_code: 'ADR-2026-0001',
    reporter_id: 'user-1',
    organization: 'Bệnh viện Đa khoa Trung tâm',
    patient_name: 'Nguyễn Văn A',
    patient_birth_date: '1985-06-15',
    patient_age: 41,
    patient_gender: 'male',
    patient_weight: 65,
    adr_occurrence_date: '2026-09-12',
    reaction_onset_time: '2 giờ',
    adr_description: 'Phát ban toàn thân và khó thở.',
    related_tests: 'Bạch cầu ái toan tăng.',
    medical_history: 'Không ghi nhận dị ứng trước đây.',
    treatment_response: 'Ngừng thuốc, dùng kháng histamin.',
    severity_level: 'hospitalization',
    outcome_after_treatment: 'recovering',
    causality_assessment: 'probable',
    assessment_scale: 'who',
    medical_staff_comment: 'Theo dõi thêm 24 giờ.',
    reporter_name: 'Trần Thị B',
    reporter_profession: 'Dược sĩ',
    reporter_phone: '0900000000',
    reporter_email: 'reporter@example.com',
    report_type: 'initial',
    report_date: '2026-09-13',
    severity_assessment_result: null,
    preventability_assessment_result: null,
    created_at: '2026-09-13T01:00:00.000Z',
    updated_at: '2026-09-13T01:00:00.000Z',
    suspected_drugs: [{
      id: 'drug-1',
      report_id: 'report-1',
      drug_name: 'Amoxicillin',
      commercial_name: 'Amox',
      dosage_form: 'Viên nang 500 mg',
      manufacturer: 'Nhà máy Dược A',
      batch_number: 'LO-001',
      dosage_and_frequency: null,
      dosage: '500 mg',
      frequency: '3 lần/ngày',
      route_of_administration: 'Uống',
      treatment_drug_group: 'Kháng sinh',
      start_date: '2026-09-10',
      end_date: '2026-09-12',
      indication: 'Nhiễm khuẩn hô hấp',
      reaction_improved_after_stopping: 'yes',
      reaction_reoccurred_after_rechallenge: 'not_rechallenged',
      created_at: '2026-09-13T01:00:00.000Z',
      updated_at: '2026-09-13T01:00:00.000Z',
    }],
    concurrent_drugs: [{
      id: 'concurrent-1',
      report_id: 'report-1',
      drug_name: 'Paracetamol',
      dosage_form_strength: 'Viên 500 mg',
      start_date: '2026-09-10',
      end_date: '2026-09-12',
      created_at: '2026-09-13T01:00:00.000Z',
      updated_at: '2026-09-13T01:00:00.000Z',
    }],
    ...overrides,
  }
}

describe('report print template', () => {
  it('renders a non-interactive, escaped PDF document with related drugs', () => {
    const html = generateReportPrintHTML(createReport({
      patient_name: '<script>alert("x")</script>',
    }), { interactive: false })

    expect(html).toContain('BÁO CÁO PHẢN ỨNG CÓ HẠI CỦA THUỐC')
    expect(html).toContain('Amoxicillin')
    expect(html).toContain('Paracetamol')
    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;')
    expect(html).not.toContain('<script>alert')
    expect(html).not.toContain('class="print-actions')
    expect(html).not.toContain('<script>')
  })
})

describe('report PDF generation', () => {
  it('prints A4 with JavaScript disabled and always closes the browser', async () => {
    const pdfBytes = new TextEncoder().encode('%PDF-test')
    const page = {
      setJavaScriptEnabled: vi.fn().mockResolvedValue(undefined),
      setRequestInterception: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      setContent: vi.fn().mockResolvedValue(undefined),
      emulateMediaType: vi.fn().mockResolvedValue(undefined),
      pdf: vi.fn().mockResolvedValue(pdfBytes),
    } as unknown as ReportPdfPage
    const browser = {
      newPage: vi.fn().mockResolvedValue(page),
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReportPdfBrowser

    const result = await generateReportPdf(createReport(), {
      launchBrowser: vi.fn().mockResolvedValue(browser),
    })

    expect(result.equals(Buffer.from(pdfBytes))).toBe(true)
    expect(page.setJavaScriptEnabled).toHaveBeenCalledWith(false)
    expect(page.setContent).toHaveBeenCalledWith(expect.any(String), {
      waitUntil: 'domcontentloaded',
    })
    expect(page.pdf).toHaveBeenCalledWith({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true,
    })
    expect(browser.close).toHaveBeenCalledOnce()
  })

  it('closes the browser when PDF generation fails', async () => {
    const page = {
      setJavaScriptEnabled: vi.fn().mockResolvedValue(undefined),
      setRequestInterception: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      setContent: vi.fn().mockResolvedValue(undefined),
      emulateMediaType: vi.fn().mockResolvedValue(undefined),
      pdf: vi.fn().mockRejectedValue(new Error('print failed')),
    } as unknown as ReportPdfPage
    const browser = {
      newPage: vi.fn().mockResolvedValue(page),
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReportPdfBrowser

    await expect(generateReportPdf(createReport(), {
      launchBrowser: vi.fn().mockResolvedValue(browser),
    })).rejects.toThrow('print failed')
    expect(browser.close).toHaveBeenCalledOnce()
  })

  it('creates a safe attachment filename', () => {
    expect(buildReportPdfFilename(' ADR/2026 001 ')).toBe('Bao-cao-ADR-ADR-2026-001.pdf')
  })
})

describe('report PDF email', () => {
  it('uses the fixed recipient, summary content, and PDF attachment', () => {
    const report = createReport({ organization: 'Đơn vị <A>\r\nBcc: attacker@example.com' })
    const sentAt = new Date('2026-09-13T02:03:04.000Z')
    const content = buildReportPdfEmailContent(report, sentAt)
    const attachment = {
      filename: buildReportPdfFilename(report.report_code),
      content: Buffer.from('%PDF-test'),
      contentType: 'application/pdf',
    }
    const message = buildEmailMessage({
      to: ADR_REPORT_PDF_RECIPIENT,
      subject: buildReportPdfEmailSubject(report),
      html: content.html,
      text: content.text,
      attachments: [attachment],
    })

    expect(ADR_REPORT_PDF_RECIPIENT).toBe('di.pvcenter@gmail.com')
    expect(message.to).toBe(ADR_REPORT_PDF_RECIPIENT)
    expect(message.subject).not.toContain('\r')
    expect(message.subject).not.toContain('\n')
    expect(message.attachments).toEqual([attachment])
    expect(content.html).toContain('Đơn vị &lt;A&gt;')
    expect(content.html).not.toContain(report.patient_name)
    expect(content.text).toContain('ADR-2026-0001')
    expect(content.text).toContain('Nhập viện')
    expect(content.text).toContain('9:03:04')
  })
})
