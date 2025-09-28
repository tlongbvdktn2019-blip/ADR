import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { ADRQuizService } from '@/lib/adr-quiz-service'

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

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
    const userId = searchParams.get('userId') || session.user.id

    // Only allow users to view their own stats (unless admin)
    if (userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const [stats, achievements] = await Promise.all([
      ADRQuizService.getUserStats(userId),
      ADRQuizService.getUserAchievements(userId)
    ])

    return NextResponse.json({
      success: true,
      data: {
        stats,
        achievements
      }
    })

  } catch (error) {
    console.error('Quiz stats API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch quiz statistics',
        success: false 
      },
      { status: 500 }
    )
  }
}










