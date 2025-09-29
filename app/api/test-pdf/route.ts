import { NextRequest, NextResponse } from 'next/server'
import { MinimalPDFService } from '@/lib/pdf-service-minimal'

// Force Node.js runtime
export const runtime = 'nodejs'

// Test endpoint for PDF generation
export async function GET(request: NextRequest) {
  console.log('🧪 Test PDF endpoint called')
  
  try {
    // Mock report data
    const mockReport = {
      id: 'test-123',
      report_code: 'TEST-001',
      patient_name: 'Nguyễn Văn Test',
      patient_age: 30,
      patient_gender: 'male' as const,
      adr_occurrence_date: '2024-01-15',
      adr_description: 'Test reaction description',
      severity_level: 'not_serious',
      reporter_name: 'Dr. Test',
      organization: 'Test Hospital'
    }

    console.log('📄 Generating test PDF...')
    const pdfBuffer = await MinimalPDFService.generatePDF(mockReport)
    
    console.log('✅ Test PDF generated, size:', pdfBuffer.length)

    return new NextResponse(pdfBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test-report.pdf"',
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('❌ Test PDF failed:', error)
    
    return NextResponse.json({
      error: 'Test PDF generation failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Health check endpoint  
export async function POST(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      runtime: 'nodejs'
    },
    timestamp: new Date().toISOString()
  })
}
