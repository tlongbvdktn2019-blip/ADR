import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { ADRQuizService } from '@/lib/adr-quiz-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const dailyChallenge = await ADRQuizService.getDailyChallenge(session.user.id)

    return NextResponse.json({
      success: true,
      data: dailyChallenge
    })

  } catch (error) {
    console.error('Daily challenge API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch daily challenge',
        success: false 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only admins can create daily challenges
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { date, title, description, categoryId, difficulty, questionCount, timeLimit } = body

    // Validation
    if (!date || !title || !categoryId || !difficulty || !questionCount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const challenge = await ADRQuizService.createDailyChallenge({
      date,
      title,
      description,
      categoryId,
      difficulty,
      questionCount,
      timeLimit
    })

    return NextResponse.json({
      success: true,
      data: challenge
    })

  } catch (error) {
    console.error('Create daily challenge API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create daily challenge',
        success: false 
      },
      { status: 500 }
    )
  }
}









