import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { ADRQuizService } from '@/lib/adr-quiz-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const analytics = await ADRQuizService.getQuizAnalytics()

    return NextResponse.json({
      success: true,
      data: analytics
    })

  } catch (error) {
    console.error('Quiz analytics API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
        success: false 
      },
      { status: 500 }
    )
  }
}









