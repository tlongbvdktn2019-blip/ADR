import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'KhĂ´ng cĂ³ quyá»n truy cáº­p' },
        { status: 403 }
      )
    }

    const supabase = createClient()

    // Get system overview stats
    const [
      { data: questionStats },
      { data: sessionStats },
      { data: userStats },
      { data: categoryStats }
    ] = await Promise.all([
      // Question statistics
      supabase
        .from('quiz_questions')
        .select('difficulty, review_status, is_active')
        .eq('is_active', true),
      
      // Session statistics  
      supabase
        .from('quiz_sessions')
        .select('status, total_score, completion_percentage, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      
      // User engagement
      supabase
        .from('users')
        .select('id, created_at'),
        
      // Category performance
      supabase
        .from('quiz_categories')
        .select(`
          name,
          category_key,
          total_questions,
          sessions:quiz_sessions(count)
        `)
    ])

    // Calculate metrics
    const totalQuestions = questionStats?.length || 0
    const totalSessions = sessionStats?.length || 0
    const completedSessions = sessionStats?.filter(s => s.status === 'completed').length || 0
    const totalUsers = userStats?.length || 0
    
    const averageScore = completedSessions > 0 
      ? (sessionStats || [])
          .filter(s => s.status === 'completed')
          .reduce((acc, s) => acc + (s.total_score || 0), 0) / completedSessions
      : 0

    const completionRate = totalSessions > 0 
      ? (completedSessions / totalSessions) * 100 
      : 0

    // Question difficulty distribution
    const difficultyStats = questionStats?.reduce((acc: any, q: any) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1
      return acc
    }, {})

    // Daily activity (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      return date.toISOString().split('T')[0]
    }).reverse()

    const dailyActivity = last7Days.map(date => {
      const sessionsOnDate = sessionStats?.filter(s => 
        s.created_at?.startsWith(date)
      ).length || 0
      
      return {
        date,
        sessions: sessionsOnDate
      }
    })

    // Top performing categories
    const categoryPerformance = categoryStats?.map((cat: any) => ({
      name: cat.name,
      category_key: cat.category_key,
      total_questions: cat.total_questions,
      total_sessions: cat.sessions?.[0]?.count || 0
    }))

    // Question performance analysis
    const questionPerformanceQuery = await supabase
      .from('quiz_questions')
      .select(`
        id,
        question_text,
        difficulty,
        times_answered,
        times_correct,
        category:quiz_categories(name)
      `)
      .gt('times_answered', 0)
      .order('times_answered', { ascending: false })
      .limit(10)

    const topQuestions = questionPerformanceQuery.data?.map((q: any) => ({
      id: q.id,
      question_text: q.question_text.substring(0, 100) + '...',
      difficulty: q.difficulty,
      times_answered: q.times_answered,
      accuracy: q.times_answered > 0 ? (q.times_correct / q.times_answered * 100) : 0,
      category: q.category?.name
    })) || []

    const analytics = {
      systemOverview: {
        totalQuestions,
        totalSessions,
        completedSessions,
        totalUsers,
        averageScore: Math.round(averageScore * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10
      },
      
      contentAnalytics: {
        difficultyDistribution: difficultyStats || {},
        topQuestions,
        categoryPerformance: categoryPerformance || []
      },
      
      userEngagement: {
        dailyActivity,
        engagementTrend: 'stable' // You could calculate this based on historical data
      },
      
      recentActivity: sessionStats?.slice(0, 10).map((session: any) => ({
        id: session.id,
        created_at: session.created_at,
        status: session.status,
        score: session.total_score,
        completion: session.completion_percentage
      })) || []
    }

    return NextResponse.json({
      success: true,
      data: analytics
    })

  } catch (error) {
    console.error('Admin quiz analytics error:', error)
    return NextResponse.json(
      { error: 'Lá»—i server' },
      { status: 500 }
    )
  }
}



