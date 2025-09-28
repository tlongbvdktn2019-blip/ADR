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
    const { categoryId, sessionName, difficulty, questionCount, timeLimit } = body

    // Validation
    if (!categoryId || !sessionName || !difficulty || !questionCount) {
      return NextResponse.json(
        { error: 'Missing required fields: categoryId, sessionName, difficulty, questionCount' },
        { status: 400 }
      )
    }

    const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert']
    if (!validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty level' },
        { status: 400 }
      )
    }

    if (questionCount < 1 || questionCount > 50) {
      return NextResponse.json(
        { error: 'Question count must be between 1 and 50' },
        { status: 400 }
      )
    }

    // Create quiz session
    const quizSession = await ADRQuizService.createQuizSession(
      session.user.id,
      categoryId,
      {
        sessionName,
        difficulty,
        questionCount: parseInt(questionCount),
        timeLimit: timeLimit ? parseInt(timeLimit) : undefined
      }
    )

    return NextResponse.json({
      success: true,
      data: quizSession
    })

  } catch (error) {
    console.error('Create quiz session API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create quiz session',
        success: false 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const quizHistory = await ADRQuizService.getUserQuizHistory(
      session.user.id,
      limit,
      offset
    )

    return NextResponse.json({
      success: true,
      data: quizHistory
    })

  } catch (error) {
    console.error('Get quiz history API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch quiz history',
        success: false 
      },
      { status: 500 }
    )
  }
}









