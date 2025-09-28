import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { ADRQuizService } from '@/lib/adr-quiz-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { challengeId } = body

    if (!challengeId) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      )
    }

    // Start daily challenge session
    const quizSession = await ADRQuizService.startDailyChallenge(session.user.id, challengeId)

    return NextResponse.json({
      success: true,
      data: quizSession
    })

  } catch (error) {
    console.error('Start daily challenge API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to start daily challenge',
        success: false 
      },
      { status: 500 }
    )
  }
}









