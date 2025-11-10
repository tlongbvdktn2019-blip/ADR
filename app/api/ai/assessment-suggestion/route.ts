import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { AIAssessmentService } from '@/lib/ai-assessment-service'
import { ADRFormData } from '@/app/reports/new/page'

export async function POST(request: NextRequest) {
  try {
    // Check authentication (optional - allows guest access)
    const session = await getServerSession(authOptions)

    const body = await request.json()
    const { formData }: { formData: ADRFormData } = body
    
    // Validate input
    if (!formData) {
      return NextResponse.json(
        { error: 'Thiếu dữ liệu form ADR' },
        { status: 400 }
      )
    }

    // Perform AI analysis
    const suggestion = await AIAssessmentService.analyzeCausality(formData)
    
    // Log the suggestion for monitoring (optional)
    const userIdentifier = session?.user?.email || 'guest'
    console.log(`AI Assessment generated for user ${userIdentifier}:`, {
      whoSuggestion: suggestion.whoSuggestion.suggestedLevel,
      naranjoSuggestion: suggestion.naranjoSuggestion.suggestedLevel,
      overallRecommendation: suggestion.overallRecommendation,
      confidence: suggestion.confidence
    })

    return NextResponse.json({
      success: true,
      data: suggestion
    })

  } catch (error) {
    console.error('AI Assessment API Error:', error)
    
    // Return user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra trong quá trình phân tích AI'
    
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false 
      },
      { status: 500 }
    )
  }
}

// Optional: GET method to check API status
export async function GET() {
  return NextResponse.json({
    status: 'AI Assessment API is running',
    version: '1.0.0',
    features: [
      'WHO Causality Assessment',
      'Naranjo Scale Scoring', 
      'Confidence Calculation',
      'Detailed Reasoning'
    ]
  })
}



