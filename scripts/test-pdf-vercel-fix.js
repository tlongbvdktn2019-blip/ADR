/**
 * Test script to verify PDF generation works with new Vercel-compatible setup
 * Run: node scripts/test-pdf-vercel-fix.js
 */

const { PDFServiceVercel } = require('../lib/pdf-service-vercel')

// Mock ADR report data for testing
const mockReport = {
  id: 'test-123',
  report_code: 'ADR-TEST-001',
  reporter_id: 'reporter-123',
  organization: 'Bệnh viện Test',
  
  // Patient info
  patient_name: 'Nguyễn Văn A',
  patient_birth_date: '1990-01-01',
  patient_age: 34,
  patient_gender: 'male',
  patient_weight: 70,
  
  // ADR info  
  adr_occurrence_date: '2024-01-15',
  reaction_onset_time: '2 giờ sau khi dùng thuốc',
  adr_description: 'Phát ban đỏ trên da, ngứa nhiều',
  related_tests: null,
  medical_history: 'Không có tiền sử dị ứng',
  treatment_response: 'Cải thiện sau khi ngừng thuốc',
  severity_level: 'not_serious',
  outcome_after_treatment: 'recovered_without_sequelae',
  
  // Assessment
  causality_assessment: 'probable',
  assessment_scale: 'who',
  medical_staff_comment: 'Có khả năng cao do thuốc',
  
  // Reporter info
  reporter_name: 'Dr. Nguyễn Văn B',
  reporter_profession: 'Bác sĩ da liễu',
  reporter_phone: '0901234567',
  reporter_email: 'doctor@hospital.com',
  report_type: 'initial',
  report_date: '2024-01-15',
  
  // Timestamps
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
  
  // Mock suspected drugs
  suspected_drugs: [
    {
      id: 'drug-1',
      report_id: 'test-123',
      drug_name: 'Paracetamol',
      commercial_name: 'Efferalgan',
      dosage_form: 'Viên nén',
      manufacturer: 'Bristol-Myers Squibb',
      batch_number: 'LOT123456',
      dosage_and_frequency: '500mg x 3 lần/ngày',
      route_of_administration: 'Đường uống',
      start_date: '2024-01-14',
      end_date: '2024-01-15',
      indication: 'Hạ sốt',
      reaction_improved_after_stopping: 'yes',
      reaction_reoccurred_after_rechallenge: 'not_rechallenged',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z'
    }
  ],
  
  concurrent_drugs: []
}

async function testPDFGeneration() {
  console.log('🧪 Testing PDF generation with Vercel-compatible setup...')
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL
  })
  
  try {
    const startTime = Date.now()
    
    console.log('📄 Generating PDF...')
    const pdfBuffer = await PDFServiceVercel.generatePDF(mockReport)
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log('✅ PDF generated successfully!')
    console.log(`📊 Stats:`)
    console.log(`   - Size: ${pdfBuffer.length} bytes (${(pdfBuffer.length / 1024).toFixed(2)} KB)`)
    console.log(`   - Duration: ${duration}ms`)
    
    // Optionally save to file for inspection
    const fs = require('fs')
    const testFile = 'test-pdf-output.pdf'
    fs.writeFileSync(testFile, pdfBuffer)
    console.log(`💾 PDF saved to: ${testFile}`)
    
    console.log('🎉 All tests passed! Ready for Vercel deployment.')
    
  } catch (error) {
    console.error('❌ PDF generation failed:')
    console.error(error)
    process.exit(1)
  }
}

async function testHTMLGeneration() {
  console.log('🧪 Testing HTML generation...')
  
  try {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test HTML</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .test { background: #f0f0f0; padding: 10px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <h1>Test HTML to PDF</h1>
      <div class="test">This is a test HTML content</div>
      <p>Generated at: ${new Date().toLocaleString()}</p>
    </body>
    </html>
    `
    
    console.log('📄 Generating PDF from HTML...')
    const pdfBuffer = await PDFServiceVercel.generatePDFFromHTML(html)
    
    console.log('✅ HTML PDF generated successfully!')
    console.log(`📊 Size: ${pdfBuffer.length} bytes`)
    
  } catch (error) {
    console.error('❌ HTML PDF generation failed:')
    console.error(error)
    throw error
  }
}

// Run tests
async function runAllTests() {
  try {
    await testPDFGeneration()
    await testHTMLGeneration()
    
    console.log('\n🎯 All tests completed successfully!')
    console.log('🚀 Ready to deploy to Vercel!')
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  runAllTests()
}

module.exports = { mockReport, testPDFGeneration, testHTMLGeneration }
