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
    top: '0.5cm',
    right: '0.5cm', 
    bottom: '0.5cm',
    left: '0.5cm'
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
    console.log('=== PDFService.renderReportHTML START ===')
    console.log('Report ID:', report.id)
    console.log('Report Code:', report.report_code)
    console.log('Patient Name:', report.patient_name)
    console.log('Reaction Onset Time:', report.reaction_onset_time)
    
    let html = this.getTemplate()
    console.log('Template loaded, length:', html.length)

    // Header section - Report location and codes
    html = this.replaceFirstInput(html, `Nơi báo cáo: <input type="text"`, report.organization)
    html = this.replaceFirstInput(html, `Mã số báo cáo của đơn vị: <input type="text"`, report.report_code)
    html = this.replaceFirstInput(html, `Mã số báo cáo (do Trung tâm quốc gia quản lý): <input type="text"`, report.report_code)

    // Section A: Patient Information
    html = this.replaceFirstInput(html, `1. Họ và tên: <input type="text" style="width: 80%;"`, report.patient_name)
    html = this.replaceFirstInput(html, `2. Ngày sinh: <input type="text" style="width: 70%;"`, this.formatDate(report.patient_birth_date))
    html = this.replaceFirstInput(html, `Hoặc tuổi: <input type="text" style="width: 70%;"`, report.patient_age.toString())
    html = this.replaceFirstInput(html, `4. Cân nặng <br> <input type="text" style="width: 50%;"`, (report.patient_weight || '').toString())

    // Gender checkbox
    if (report.patient_gender === 'male') {
      html = html.replace('3. Giới tính <br> <input type="checkbox"> Nam', '3. Giới tính <br> <input type="checkbox" checked> Nam')
    } else {
      html = html.replace('<input type="checkbox"> Nữ', '<input type="checkbox" checked> Nữ')
    }

    // Section B: ADR Information
    html = this.replaceFirstInput(html, `5. Ngày xuất hiện phản ứng: <input type="text"`, this.formatDate(report.adr_occurrence_date))
    // Fix reaction_onset_time mapping
    const reactionOnsetPattern = `6. Phản ứng xuất hiện sau bao lâu (tính từ lần dùng cuối cùng của thuốc nghi ngờ): <input type="text">`
    const reactionOnsetReplacement = `6. Phản ứng xuất hiện sau bao lâu (tính từ lần dùng cuối cùng của thuốc nghi ngờ): <input type="text" value="${report.reaction_onset_time || ''}">`
    html = html.replace(reactionOnsetPattern, reactionOnsetReplacement)

    // Replace textareas by finding them based on their actual position relative to sections
    html = this.replaceTextareaAfterSection(html, '7. Mô tả biểu hiện ADR', report.adr_description || '')
    html = this.replaceTextareaAfterSection(html, '8. Các xét nghiệm liên quan đến phản ứng', report.related_tests || '')
    html = this.replaceTextareaAfterSection(html, '9. Tiền sử', report.medical_history || '')  
    html = this.replaceTextareaAfterSection(html, '10. Cách xử trí phản ứng', report.treatment_response || '')

    // Severity checkboxes
    html = this.checkSeverityBox(html, report.severity_level)

    // Outcome checkboxes  
    html = this.checkOutcomeBox(html, report.outcome_after_treatment)

    // Section C: Suspected Drugs
    if (report.suspected_drugs && report.suspected_drugs.length > 0) {
      html = this.populateDrugTables(html, report.suspected_drugs)
    }

    // Section 16: Concurrent Drugs
    if (report.concurrent_drugs && report.concurrent_drugs.length > 0) {
      html = this.populateConcurrentDrugTable(html, report.concurrent_drugs)
    }

    // Section D: Assessment
    html = this.checkCausalityBox(html, report.causality_assessment)
    html = this.checkAssessmentScale(html, report.assessment_scale)
    html = this.replaceNthTextarea(html, 5, report.medical_staff_comment || '')

    // Section E: Reporter Information
    html = this.replaceFirstInput(html, `20. Họ và tên: <input type="text" style="width: 80%;"`, report.reporter_name)
    html = this.replaceFirstInput(html, `Nghề nghiệp/Chức vụ: <input type="text" style="width: 70%;"`, report.reporter_profession)
    html = this.replaceFirstInput(html, `Điện thoại liên lạc: <input type="text" style="width: 75%;"`, report.reporter_phone || '')
    html = this.replaceFirstInput(html, `Email: <input type="text" style="width: 90%;"`, report.reporter_email || '')
    
    // Report type checkboxes
    if (report.report_type === 'initial') {
      html = html.replace('22. Dạng báo cáo: <input type="checkbox"> Lần đầu', '22. Dạng báo cáo: <input type="checkbox" checked> Lần đầu')
    } else {
      html = html.replace('<input type="checkbox"> Bổ sung', '<input type="checkbox" checked> Bổ sung')
    }

    html = this.replaceFirstInput(html, `23. Ngày báo cáo: <input type="text"`, this.formatDate(report.report_date))

    console.log('=== PDFService.renderReportHTML COMPLETE ===')
    console.log('Final HTML length:', html.length)
    
    // Check if reaction_onset_time was applied
    const hasReactionOnset = html.includes(report.reaction_onset_time || '')
    console.log('Reaction onset time applied:', hasReactionOnset)
    if (report.reaction_onset_time && hasReactionOnset) {
      console.log('✅ SUCCESS: reaction_onset_time found in final HTML')
    } else if (report.reaction_onset_time && !hasReactionOnset) {
      console.log('❌ WARNING: reaction_onset_time NOT found in final HTML')
    }

    return html
  }

  private static replaceFirstInput(html: string, pattern: string, value: string): string {
    const fullPattern = pattern + '>'
    const replacement = pattern + ` value="${value}">`
    return html.replace(fullPattern, replacement)
  }

  private static replaceFirstTextarea(html: string, value: string): string {
    const pattern = /<textarea[^>]*><\/textarea>/
    const replacement = `<textarea style="height: 95px;">${value}</textarea>`
    return html.replace(pattern, replacement)
  }

  private static replaceTextareaAfterSection(html: string, sectionText: string, value: string): string {
    const sectionIndex = html.indexOf(sectionText)
    if (sectionIndex === -1) return html
    
    // Special handling for sections 7 and 9 (left column in 2x2 table)
    if (sectionText.includes('7. Mô tả biểu hiện ADR')) {
      // For section 7, we need the first textarea in the left column of the table
      // Find the table row after section 7 and 8 headers
      const afterSection = html.substring(sectionIndex)
      const tableRowIndex = afterSection.indexOf('<tr>')
      if (tableRowIndex === -1) return html
      
      const tableRow = afterSection.substring(tableRowIndex)
      const firstCellEnd = tableRow.indexOf('</td>')
      if (firstCellEnd === -1) return html
      
      const firstCell = tableRow.substring(0, firstCellEnd)
      const textareaIndex = firstCell.indexOf('<textarea')
      if (textareaIndex === -1) return html
      
      const actualIndex = sectionIndex + tableRowIndex + textareaIndex
      const textareaEnd = firstCell.indexOf('</textarea>') + 11
      if (textareaEnd === 10) return html
      
      const textareaMatch = firstCell.substring(textareaIndex, textareaEnd)
      const replacement = `<textarea style="height: 95px;">${value}</textarea>`
      
      return html.substring(0, actualIndex) + replacement + html.substring(actualIndex + textareaMatch.length)
    }
    
    if (sectionText.includes('9. Tiền sử')) {
      // For section 9, we need the first textarea in the left column of the second row
      const afterSection = html.substring(sectionIndex)
      const tableRowIndex = afterSection.indexOf('<tr>')
      if (tableRowIndex === -1) return html
      
      const tableRow = afterSection.substring(tableRowIndex)
      const firstCellEnd = tableRow.indexOf('</td>')
      if (firstCellEnd === -1) return html
      
      const firstCell = tableRow.substring(0, firstCellEnd)
      const textareaIndex = firstCell.indexOf('<textarea')
      if (textareaIndex === -1) return html
      
      const actualIndex = sectionIndex + tableRowIndex + textareaIndex
      const textareaEnd = firstCell.indexOf('</textarea>') + 11
      if (textareaEnd === 10) return html
      
      const textareaMatch = firstCell.substring(textareaIndex, textareaEnd)
      const replacement = `<textarea style="height: 75px;">${value}</textarea>`
      
      return html.substring(0, actualIndex) + replacement + html.substring(actualIndex + textareaMatch.length)
    }
    
    // Special handling for sections 8 and 10 (right column in 2x2 table)
    if (sectionText.includes('8. Các xét nghiệm liên quan') || sectionText.includes('10. Cách xử trí phản ứng')) {
      // For sections 8 and 10, we need the textarea in the RIGHT column
      const afterSection = html.substring(sectionIndex)
      const tableRowIndex = afterSection.indexOf('<tr>')
      if (tableRowIndex === -1) return html
      
      const tableRow = afterSection.substring(tableRowIndex)
      const firstCellEnd = tableRow.indexOf('</td>')
      if (firstCellEnd === -1) return html
      
      // Skip the first cell (left column), find the second cell (right column)
      const afterFirstCell = tableRow.substring(firstCellEnd + 5) // +5 for "</td>"
      const secondCellEnd = afterFirstCell.indexOf('</td>')
      if (secondCellEnd === -1) return html
      
      const secondCell = afterFirstCell.substring(0, secondCellEnd)
      const textareaIndex = secondCell.indexOf('<textarea')
      if (textareaIndex === -1) return html
      
      const actualIndex = sectionIndex + tableRowIndex + firstCellEnd + 5 + textareaIndex
      const textareaEnd = secondCell.indexOf('</textarea>') + 11
      if (textareaEnd === 10) return html
      
      const textareaMatch = secondCell.substring(textareaIndex, textareaEnd)
      const height = sectionText.includes('10.') ? '75px' : '95px'
      const replacement = `<textarea style="height: ${height};">${value}</textarea>`
      
      return html.substring(0, actualIndex) + replacement + html.substring(actualIndex + textareaMatch.length)
    }
    
    // Default logic for section 19 only
    const afterSection = html.substring(sectionIndex)
    const textareaIndex = afterSection.indexOf('<textarea')
    if (textareaIndex === -1) return html
    
    const actualTextareaIndex = sectionIndex + textareaIndex
    const textareaEnd = afterSection.indexOf('</textarea>') + 11
    
    if (textareaEnd === 10) return html // Not found
    
    const textareaMatch = afterSection.substring(textareaIndex, textareaEnd)
    const replacement = `<textarea style="height: 80px;">${value}</textarea>`
    
    return html.substring(0, actualTextareaIndex) + replacement + html.substring(actualTextareaIndex + textareaMatch.length)
  }

  private static replaceNthTextarea(html: string, n: number, value: string): string {
    let count = 0
    return html.replace(/<textarea[^>]*><\/textarea>/g, (match) => {
      count++
      if (count === n) {
        // Apply specific styling for different textareas
        if (n === 1 || n === 2) {
          // Textareas for sections 7 & 8 (height: 95px)
          return `<textarea style="height: 95px;">${value}</textarea>`
        } else if (n === 3 || n === 4) {
          // Textareas for sections 9 & 10 (height: 75px)
          return `<textarea style="height: 75px;">${value}</textarea>`
        } else if (n === 5) {
          // Textarea for section 19 (height: 80px)
          return `<textarea style="height: 80px;">${value}</textarea>`
        }
        return match.replace('></textarea>', `>${value}</textarea>`)
      }
      return match
    })
  }

  private static checkSeverityBox(html: string, severity: string): string {
    const severityMap = {
      'death': 'Tử vong',
      'life_threatening': 'Đe dọa tính mạng',
      'hospitalization': 'Nhập viện/Kéo dài thời gian nằm viện',
      'permanent_disability': 'Tàn tật vĩnh viễn/nặng nề',
      'birth_defect': 'Dị tật thai nhi',
      'not_serious': 'Không nghiêm trọng'
    }

    const severityLabel = severityMap[severity as keyof typeof severityMap]
    if (severityLabel) {
      const pattern = `<input type="checkbox"> ${severityLabel}`
      const replacement = `<input type="checkbox" checked> ${severityLabel}`
      html = html.replace(pattern, replacement)
    }

    return html
  }

  private static checkOutcomeBox(html: string, outcome: string): string {
    const outcomeMap = {
      'death_by_adr': 'Tử vong do ADR',
      'death_unrelated': 'Tử vong không liên quan đến thuốc',
      'not_recovered': 'Chưa hồi phục',
      'recovering': 'Đang hồi phục',
      'recovered_with_sequelae': 'Hồi phục có di chứng',
      'recovered_without_sequelae': 'Hồi phục không có di chứng',
      'unknown': 'Không rõ'
    }

    const outcomeLabel = outcomeMap[outcome as keyof typeof outcomeMap]
    if (outcomeLabel) {
      const pattern = `<input type="checkbox"> ${outcomeLabel}`
      const replacement = `<input type="checkbox" checked> ${outcomeLabel}`
      html = html.replace(pattern, replacement)
    }

    return html
  }

  private static checkCausalityBox(html: string, causality: string): string {
    const causalityMap = {
      'certain': 'Chắc chắn',
      'probable': 'Có khả năng',
      'possible': 'Có thể',
      'unlikely': 'Không chắc chắn',
      'unclassified': 'Chưa phân loại',
      'unclassifiable': 'Không thể phân loại'
    }

    const causalityLabel = causalityMap[causality as keyof typeof causalityMap]
    if (causalityLabel) {
      const pattern = `<input type="checkbox"> ${causalityLabel}`
      const replacement = `<input type="checkbox" checked> ${causalityLabel}`
      html = html.replace(pattern, replacement)
    }

    return html
  }

  private static checkAssessmentScale(html: string, scale: string): string {
    if (scale === 'who') {
      html = html.replace('<input type="checkbox"> Thang WHO', '<input type="checkbox" checked> Thang WHO')
    } else if (scale === 'naranjo') {
      html = html.replace('<input type="checkbox"> Thang Naranjo', '<input type="checkbox" checked> Thang Naranjo')
    }
    return html
  }

  private static populateDrugTables(html: string, drugs: any[]): string {
    // First table - drug information
    const drugTableRows = ['i', 'ii', 'iii', 'iv']
    
    drugs.forEach((drug, index) => {
      if (index < 4) {
        const rowNumber = drugTableRows[index]
        
        // Find the row with empty cells and replace with drug data
        const rowPattern = new RegExp(`<td class="center">${rowNumber}</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>`)
        const drugName = drug.drug_name + (drug.commercial_name ? ` (${drug.commercial_name})` : '')
        
        // Split dosage info if possible, otherwise use as single dose
        const dosageParts = (drug.dosage_and_frequency || '').split(/[\/,;]/)
        const singleDose = dosageParts[0]?.trim() || ''
        const frequency = dosageParts.length > 1 ? dosageParts.slice(1).join('/').trim() : ''
        
        const replacement = `<td class="center">${rowNumber}</td><td>${drugName}</td><td>${drug.dosage_form || ''}</td><td>${drug.manufacturer || ''}</td><td>${drug.batch_number || ''}</td><td>${singleDose}</td><td>${frequency}</td><td>${drug.route_of_administration || ''}</td><td>${drug.start_date ? this.formatDate(drug.start_date) : ''}</td><td>${drug.end_date ? this.formatDate(drug.end_date) : ''}</td><td>${drug.indication || ''}</td>`
        
        html = html.replace(rowPattern, replacement)
      }
    })

    // Second table - reaction questions (individual checkbox replacement)
    drugs.forEach((drug, index) => {
      if (index < 4) {
        const rowNumber = drugTableRows[index]
        
        // Get the values with defaults
        const dechallengeValue = drug.reaction_improved_after_stopping || 'no_information'
        const rechallengeValue = drug.reaction_reoccurred_after_rechallenge || 'no_information'
        
        // For the second table (dechallenge/rechallenge questions), find the checkbox row
        // This table has actual checkboxes, separate from the drug info table
        
        // Find dechallenge checkboxes - search for the checkbox pattern after finding the row in second table
        // First find the row identifier in the second table (not the drug info table)
        let dechallengeIndex = -1
        let currentSearch = 0
        
        // Look for the row identifier, but skip the first table (which has empty cells)
        while (currentSearch < html.length) {
          const rowIndex = html.indexOf(`<td class="center">${rowNumber}</td>`, currentSearch)
          if (rowIndex === -1) break
          
          // Check if this row has checkboxes (not empty cells)
          const afterRow = html.substring(rowIndex, rowIndex + 300)
          if (afterRow.includes('<input type="checkbox"> Có')) {
            dechallengeIndex = rowIndex
            break
          }
          currentSearch = rowIndex + 1
        }
        if (dechallengeIndex !== -1) {
          // Find the exact checkbox pattern in this row
          const afterRow = html.substring(dechallengeIndex, dechallengeIndex + 500)
          const checkboxStart = afterRow.indexOf('<input type="checkbox"> Có')
          const checkboxEnd = afterRow.indexOf('</td>', checkboxStart) + 5
          
          if (checkboxStart !== -1 && checkboxEnd !== -1) {
            const originalCheckboxPattern = afterRow.substring(checkboxStart, checkboxEnd)
            let newCheckboxPattern = originalCheckboxPattern
            
            // Replace the appropriate checkbox based on the value
            if (dechallengeValue === 'yes') {
              newCheckboxPattern = newCheckboxPattern.replace('<input type="checkbox"> Có', '<input type="checkbox" checked> Có')
            } else if (dechallengeValue === 'no') {
              newCheckboxPattern = newCheckboxPattern.replace('<input type="checkbox"> Không', '<input type="checkbox" checked> Không')
            } else if (dechallengeValue === 'not_stopped') {
              newCheckboxPattern = newCheckboxPattern.replace('<input type="checkbox"> Không ngừng/giảm liều', '<input type="checkbox" checked> Không ngừng/giảm liều')
            } else {
              newCheckboxPattern = newCheckboxPattern.replace('<input type="checkbox"> Không có thông tin', '<input type="checkbox" checked> Không có thông tin')
            }
            
            // Replace in the original HTML
            html = html.replace(originalCheckboxPattern, newCheckboxPattern)
          }
        }
        
        // Find rechallenge checkboxes - use same approach as dechallenge
        let rechallengeIndex = -1
        currentSearch = 0
        
        // Look for the row identifier in the second table with rechallenge checkboxes
        while (currentSearch < html.length) {
          const rowIndex = html.indexOf(`<td class="center">${rowNumber}</td>`, currentSearch)
          if (rowIndex === -1) break
          
          // Check if this row has rechallenge checkboxes (not empty cells and not dechallenge)
          const afterRow = html.substring(rowIndex, rowIndex + 500)
          if (afterRow.includes('<input type="checkbox"> Có') && afterRow.includes('Không tái sử dụng')) {
            // Find the rechallenge cell specifically (it's the second checkbox cell in the row)
            const firstCheckboxEnd = afterRow.indexOf('</td>')
            const secondCheckboxStart = afterRow.indexOf('<td>', firstCheckboxEnd)
            if (secondCheckboxStart !== -1) {
              const secondCellStart = rowIndex + secondCheckboxStart
              const secondCell = html.substring(secondCellStart, secondCellStart + 300)
              if (secondCell.includes('Không tái sử dụng')) {
                rechallengeIndex = secondCellStart + secondCell.indexOf('<input type="checkbox"> Có')
                break
              }
            }
          }
          currentSearch = rowIndex + 1
        }
        
        if (rechallengeIndex !== -1) {
          // Find the exact rechallenge checkbox pattern
          const afterRecharenge = html.substring(rechallengeIndex)
          const checkboxEnd = afterRecharenge.indexOf('</td>') + 5
          
          if (checkboxEnd !== -1) {
            const originalRechallengePattern = afterRecharenge.substring(0, checkboxEnd)
            let newRechallengePattern = originalRechallengePattern
            
            // Replace the appropriate checkbox based on the value
            if (rechallengeValue === 'yes') {
              newRechallengePattern = newRechallengePattern.replace('<input type="checkbox"> Có', '<input type="checkbox" checked> Có')
            } else if (rechallengeValue === 'no') {
              newRechallengePattern = newRechallengePattern.replace('<input type="checkbox"> Không', '<input type="checkbox" checked> Không')
            } else if (rechallengeValue === 'not_rechallenged') {
              newRechallengePattern = newRechallengePattern.replace('<input type="checkbox"> Không tái sử dụng', '<input type="checkbox" checked> Không tái sử dụng')
            } else {
              newRechallengePattern = newRechallengePattern.replace('<input type="checkbox"> Không có thông tin', '<input type="checkbox" checked> Không có thông tin')
            }
            
            // Replace in the original HTML
            html = html.substring(0, rechallengeIndex) + newRechallengePattern + html.substring(rechallengeIndex + originalRechallengePattern.length)
          }
        }
      }
    })

    return html
  }

  private static populateConcurrentDrugTable(html: string, drugs: any[]): string {
    console.log('=== Populating Concurrent Drugs Table ===')
    console.log('Number of concurrent drugs:', drugs.length)
    
    // Find the concurrent drugs table (Section 16)
    const tableStartPattern = '<strong>16. THUỐC DÙNG ĐỒNG THỜI</strong>'
    const tableIndex = html.indexOf(tableStartPattern)
    
    if (tableIndex === -1) {
      console.warn('Concurrent drugs table not found in template')
      return html
    }

    console.log('Found concurrent drugs table at index:', tableIndex)

    // Replace up to 5 rows with drug data
    let updatedHtml = html
    const maxRows = Math.min(drugs.length, 5)
    
    for (let i = 0; i < maxRows; i++) {
      const drug = drugs[i]
      console.log(`Processing drug ${i + 1}:`, {
        drug_name: drug.drug_name,
        dosage_form_strength: drug.dosage_form_strength,
        start_date: drug.start_date,
        end_date: drug.end_date
      })
      
      // Pattern for empty row (4 columns, simple spacing)
      const emptyRowPattern = '<tr>\n                <td></td>\n                <td></td>\n                <td></td>\n                <td></td>\n            </tr>'
      
      const drugRow = `<tr>
                <td>${drug.drug_name || ''}</td>
                <td>${drug.dosage_form_strength || ''}</td>
                <td>${drug.start_date ? this.formatDate(drug.start_date) : ''}</td>
                <td>${drug.end_date ? this.formatDate(drug.end_date) : ''}</td>
            </tr>`
      
      // Replace the first occurrence of empty row with drug data
      const beforeReplace = updatedHtml.includes(emptyRowPattern)
      updatedHtml = updatedHtml.replace(emptyRowPattern, drugRow)
      const afterReplace = !updatedHtml.includes(emptyRowPattern) || updatedHtml.includes(drug.drug_name)
      
      console.log(`Drug ${i + 1} replacement:`, {
        foundEmptyRow: beforeReplace,
        replacementSuccess: afterReplace
      })
    }

    console.log(`✅ Successfully populated ${maxRows} concurrent drugs in PDF table`)
    return updatedHtml
  }

  static async generatePDF(
    report: ADRReport, 
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    console.log('=== PDFService.generatePDF START ===')
    console.log('Report ID:', report.id)
    console.log('Options:', options)
    
    const finalOptions = { ...defaultOptions, ...options }
    console.log('Final options:', finalOptions)
    
    console.log('Launching browser...')
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
    console.log('Browser launched successfully')

    try {
      console.log('Creating new page...')
      const page = await browser.newPage()
      console.log('Page created successfully')
      
      console.log('Setting viewport...')
      // Set viewport for consistent rendering
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 1
      })
      console.log('Viewport set successfully')

      console.log('Generating HTML content...')
      // Generate HTML with report data
      const html = this.renderReportHTML(report)
      console.log('HTML generated, length:', html.length)
      
      console.log('Setting page content...')
      // Set content
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000
      })
      console.log('Page content set successfully')

      console.log('Generating PDF...')
      // Generate PDF with optimized settings for the new template
      const pdfBuffer = await page.pdf({
        format: finalOptions.format,
        landscape: finalOptions.orientation === 'landscape',
        margin: finalOptions.margin,
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false
      })
      console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes')

      console.log('=== PDFService.generatePDF COMPLETE ===')
      return Buffer.from(pdfBuffer)

    } finally {
      console.log('Closing browser...')
      await browser.close()
      console.log('Browser closed successfully')
    }
  }
}
