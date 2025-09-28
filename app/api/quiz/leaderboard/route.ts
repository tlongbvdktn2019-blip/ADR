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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'overall' | 'monthly' | 'weekly' || 'overall'
    const categoryId = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '10')

    const leaderboard = await ADRQuizService.getLeaderboard(type, categoryId || undefined, limit)

    return NextResponse.json({
      success: true,
      data: leaderboard
    })

  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch leaderboard',
        success: false 
      },
      { status: 500 }
    )
  }
}









