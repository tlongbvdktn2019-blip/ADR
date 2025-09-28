import puppeteer from 'puppeteer'
import { readFileSync } from 'fs'
import { join } from 'path'
import { ADRReport } from '@/types/report'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter'
  orientation?: 'portrait' | 'landscape'
  margin?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
}

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

export class PDFService {
  private static getTemplate(): string {
    const templatePath = join(process.cwd(), 'template.html')
    return readFileSync(templatePath, 'utf-8')
  }

  private static formatDate(dateString: string): string {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi })
    } catch {
      return dateString
    }
  }

  private static renderReportHTML(report: ADRReport): string {
    let html = this.getTemplate()

    // Replace basic info
    html = html.replace('id="report_location">', `id="report_location" value="${report.organization}">`)
    html = html.replace('id="unit_report_code">', `id="unit_report_code" value="${report.report_code}">`)
    html = html.replace('id="national_report_code">', `id="national_report_code" value="${report.report_code}">`)

    // Section A: Patient Information
    html = html.replace('id="patient_name">', `id="patient_name" value="${report.patient_name}">`)
    html = html.replace('id="patient_dob">', `id="patient_dob" value="${report.patient_birth_date}">`)
    html = html.replace('id="patient_age">', `id="patient_age" value="${report.patient_age}">`)
    
    // Gender radio buttons
    if (report.patient_gender === 'male') {
      html = html.replace('id="male" name="gender"', 'id="male" name="gender" checked')
    } else {
      html = html.replace('id="female" name="gender"', 'id="female" name="gender" checked')
    }
    
    html = html.replace('id="patient_weight">', `id="patient_weight" value="${report.patient_weight || ''}">`)

    // Section B: ADR Information
    html = html.replace('id="reaction_date">', `id="reaction_date" value="${report.adr_occurrence_date}">`)
    html = html.replace('id="adr_description">', `id="adr_description">${report.adr_description}</textarea>`)
    html = html.replace('id="related_tests">', `id="related_tests">${report.related_tests || ''}</textarea>`)
    html = html.replace('id="medical_history">', `id="medical_history">${report.medical_history || ''}</textarea>`)
    html = html.replace('id="reaction_treatment">', `id="reaction_treatment">${report.treatment_response || ''}</textarea>`)

    // Severity checkboxes
    const severityMap = {
      'death': 'sev_death',
      'life_threatening': 'sev_lifethreat', 
      'hospitalization': 'sev_hospitalization',
      'permanent_disability': 'sev_disability',
      'birth_defect': 'sev_birthdefect',
      'not_serious': 'sev_notserious'
    }
    
    const severityId = severityMap[report.severity_level]
    if (severityId) {
      html = html.replace(`id="${severityId}"`, `id="${severityId}" checked`)
    }

    // Outcome checkboxes
    const outcomeMap = {
      'death_by_adr': 'res_death_adr',
      'death_unrelated': 'res_death_unrelated',
      'not_recovered': 'res_not_recovered', 
      'recovering': 'res_recovering',
      'recovered_with_sequelae': 'res_recovered_sequelae',
      'recovered_without_sequelae': 'res_recovered_no_sequelae',
      'unknown': 'res_unknown'
    }
    
    const outcomeId = outcomeMap[report.outcome_after_treatment]
    if (outcomeId) {
      html = html.replace(`id="${outcomeId}"`, `id="${outcomeId}" checked`)
    }

    // Section C: Suspected Drugs - Replace table rows
    if (report.suspected_drugs && report.suspected_drugs.length > 0) {
      // First table - basic drug information
      let drugRows = ''
      
      report.suspected_drugs.forEach((drug, index) => {
        const rowNumber = index === 0 ? 'i' : index === 1 ? 'ii' : index === 2 ? 'iii' : index === 3 ? 'iv' : `${index + 1}`
        
        drugRows += `
          <tr>
            <td>${rowNumber}</td>
            <td><input type="text" value="${drug.drug_name}${drug.commercial_name ? ' (' + drug.commercial_name + ')' : ''}" readonly></td>
            <td><input type="text" value="${drug.dosage_form || ''}" readonly></td>
            <td><input type="text" value="${drug.manufacturer || ''}" readonly></td>
            <td><input type="text" value="${drug.batch_number || ''}" readonly></td>
            <td><input type="text" value="${drug.dosage_and_frequency || ''}" readonly></td>
            <td><input type="text" value="${drug.route_of_administration || ''}" readonly></td>
            <td><input type="text" value="${drug.indication || ''}" readonly></td>
            <td><input type="date" value="${drug.start_date || ''}" readonly></td>
            <td><input type="date" value="${drug.end_date || ''}" readonly></td>
            <td><input type="text" value="" readonly></td>
          </tr>
        `
      })

      // Replace first table's tbody
      const firstTableStart = html.indexOf('<tbody>')
      const firstTableEnd = html.indexOf('</tbody>') + 8
      const beforeFirstTable = html.substring(0, firstTableStart + 7)
      const afterFirstTable = html.substring(firstTableEnd)
      
      html = beforeFirstTable + drugRows + afterFirstTable

      // Second table - reaction questions
      let reactionRows = ''
      
      report.suspected_drugs.forEach((drug, index) => {
        const rowNumber = index === 0 ? 'i' : index === 1 ? 'ii' : index === 2 ? 'iii' : index === 3 ? 'iv' : `${index + 1}`
        
        // Generate radio button HTML with checked state
        const dechallengeRadios = this.generateRadioButtons(`dechallenge_${index + 1}`, drug.reaction_improved_after_stopping)
        const rechallengeRadios = this.generateRadioButtons(`rechallenge_${index + 1}`, drug.reaction_reoccurred_after_rechallenge)
        
        reactionRows += `
          <tr>
            <td>${rowNumber}</td>
            <td class="radio-group">${dechallengeRadios}</td>
            <td class="radio-group">${rechallengeRadios}</td>
          </tr>
        `
      })

      // Replace second table's tbody
      const secondTableStart = html.indexOf('<tbody>', firstTableEnd)
      if (secondTableStart !== -1) {
        const secondTableEnd = html.indexOf('</tbody>', secondTableStart) + 8
        const beforeSecondTable = html.substring(0, secondTableStart + 7)
        const afterSecondTable = html.substring(secondTableEnd)
        
        html = beforeSecondTable + reactionRows + afterSecondTable
      }
    }

    // Section D: Assessment - handle causality checkboxes
    const causalityMap = {
      'certain': 'Chắc chắn',
      'probable': 'Có khả năng', 
      'possible': 'Có thể',
      'unlikely': 'Không chắc chắn',
      'unclassified': 'Chưa phân loại',
      'unclassifiable': 'Không thể phân loại'
    }
    
    // Check the appropriate causality checkbox
    const causalityLabel = causalityMap[report.causality_assessment]
    if (causalityLabel) {
      // Find and check the appropriate checkbox
      const causalityPattern = new RegExp(`<input type="checkbox"><label>${causalityLabel}</label>`)
      html = html.replace(causalityPattern, `<input type="checkbox" checked><label>${causalityLabel}</label>`)
    }
    
    // Handle assessment scale checkboxes
    if (report.assessment_scale === 'who') {
      html = html.replace('<input type="checkbox"><label>Thang WHO</label>', '<input type="checkbox" checked><label>Thang WHO</label>')
    } else if (report.assessment_scale === 'naranjo') {
      html = html.replace('<input type="checkbox"><label>Thang Naranjo</label>', '<input type="checkbox" checked><label>Thang Naranjo</label>')
    }
    
    // Replace assessment comments
    html = html.replace('id="hcp_comments">', `id="hcp_comments">${report.medical_staff_comment || ''}</textarea>`)

    // Section E: Reporter Information
    html = html.replace('id="reporter_name">', `id="reporter_name" value="${report.reporter_name}">`)
    html = html.replace('id="reporter_occupation">', `id="reporter_occupation" value="${report.reporter_profession}">`)
    html = html.replace('id="reporter_phone">', `id="reporter_phone" value="${report.reporter_phone || ''}">`)
    html = html.replace('id="reporter_email">', `id="reporter_email" value="${report.reporter_email || ''}">`)

    // Report type
    if (report.report_type === 'initial') {
      html = html.replace('id="report_first"', 'id="report_first" checked')
    } else {
      html = html.replace('id="report_followup"', 'id="report_followup" checked')
    }

    html = html.replace('id="report_date">', `id="report_date" value="${report.report_date}">`)

    return html
  }

  private static getDrugReactionLabel(reaction: string): string {
    const labels = {
      'yes': 'Có',
      'no': 'Không',
      'not_stopped': 'Không ngừng/giảm liều',
      'not_rechallenged': 'Không tái sử dụng',
      'no_information': 'Không có thông tin'
    }
    return labels[reaction as keyof typeof labels] || reaction
  }

  private static getCausalityLabel(causality: string): string {
    const labels = {
      'certain': 'Chắc chắn',
      'probable': 'Có khả năng',
      'possible': 'Có thể',
      'unlikely': 'Không chắc chắn',
      'unclassified': 'Chưa phân loại',
      'unclassifiable': 'Không thể phân loại'
    }
    return labels[causality as keyof typeof labels] || causality
  }

  private static generateRadioButtons(name: string, selectedValue: string): string {
    const options = [
      { value: 'yes', label: 'Có' },
      { value: 'no', label: 'Không' },
      { value: 'not_stopped', label: 'Không ngừng/giảm liều' },
      { value: 'not_rechallenged', label: 'Không tái sử dụng' },
      { value: 'no_information', label: 'Không có thông tin' }
    ]

    return options.map((option, index) => {
      const checked = selectedValue === option.value ? 'checked' : ''
      return `<input type="radio" name="${name}" value="${option.value}" ${checked}><label>${option.label}</label>`
    }).join('')
  }

  static async generatePDF(
    report: ADRReport, 
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    const finalOptions = { ...defaultOptions, ...options }
    
    // Launch browser with optimized settings for server environment
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--disable-extensions'
      ]
    })

    try {
      const page = await browser.newPage()
      
      // Set viewport for consistent rendering
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 1
      })

      // Generate HTML with report data
      const html = this.renderReportHTML(report)
      
      // Set content
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000
      })

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: finalOptions.format,
        landscape: finalOptions.orientation === 'landscape',
        margin: finalOptions.margin,
        printBackground: true,
        preferCSSPageSize: true
      })

      return Buffer.from(pdfBuffer)

    } finally {
      await browser.close()
    }
  }

  static async generatePDFFromHTML(html: string, options: PDFGenerationOptions = {}): Promise<Buffer> {
    const finalOptions = { ...defaultOptions, ...options }
    
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    })

    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })
      
      const pdfBuffer = await page.pdf({
        format: finalOptions.format,
        landscape: finalOptions.orientation === 'landscape',
        margin: finalOptions.margin,
        printBackground: true
      })

      return Buffer.from(pdfBuffer)

    } finally {
      await browser.close()
    }
  }
}
