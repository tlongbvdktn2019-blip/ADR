import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { ADRQuizService } from '@/lib/adr-quiz-service'

interface RouteParams {
  params: {
    sessionId: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { sessionId } = params
    const body = await request.json()
    const { questionId, selectedAnswer, timeTaken, wasSkipped, hintUsed } = body

    // Validation
    if (!questionId || !selectedAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields: questionId, selectedAnswer' },
        { status: 400 }
      )
    }

    // Verify session belongs to user
    const quizSession = await ADRQuizService.getQuizSession(sessionId)
    if (!quizSession || quizSession.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Quiz session not found or access denied' },
        { status: 403 }
      )
    }

    // Submit answer
    const answer = await ADRQuizService.submitAnswer(
      sessionId,
      questionId,
      selectedAnswer,
      parseInt(timeTaken) || 0,
      {
        wasSkipped: wasSkipped || false,
        hintUsed: hintUsed || false
      }
    )

    return NextResponse.json({
      success: true,
      data: answer
    })

  } catch (error) {
    console.error('Submit answer API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to submit answer',
        success: false 
      },
      { status: 500 }
    )
  }
}



