import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth-config'
import { createClient } from '../../../../lib/supabase'
import { InformationStats } from '../../../../types/adr-information'

// GET /api/adr-information/stats - Get statistics (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' }, 
        { status: 403 }
      )
    }

    const supabase = createClient()

    // Get basic counts by status
    const { data: statusCounts } = await supabase
      .from('adr_information')
      .select('status')

    const total_published = statusCounts?.filter(item => item.status === 'published').length || 0
    const total_draft = statusCounts?.filter(item => item.status === 'draft').length || 0
    const total_archived = statusCounts?.filter(item => item.status === 'archived').length || 0

    // Get total views and likes
    const { data: viewsData } = await supabase
      .from('information_views')
      .select('id')

    const { data: likesData } = await supabase
      .from('information_likes')  
      .select('id')

    const total_views = viewsData?.length || 0
    const total_likes = likesData?.length || 0

    // Get most viewed information
    const { data: mostViewed } = await supabase
      .from('adr_information')
      .select('id, title, view_count, published_at')
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(5)

    // Get most liked information  
    const { data: mostLiked } = await supabase
      .from('adr_information')
      .select('id, title, likes_count, published_at')
      .eq('status', 'published')
      .order('likes_count', { ascending: false })
      .limit(5)

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentPosts } = await supabase
      .from('adr_information')
      .select('id')
      .gte('created_at', sevenDaysAgo.toISOString())

    const { data: recentViews } = await supabase
      .from('information_views')
      .select('id')
      .gte('viewed_at', sevenDaysAgo.toISOString())

    const { data: recentLikes } = await supabase
      .from('information_likes')
      .select('id')
      .gte('liked_at', sevenDaysAgo.toISOString())

    const stats: InformationStats = {
      total_published,
      total_draft,
      total_archived,
      total_views,
      total_likes,
      most_viewed: mostViewed || [],
      most_liked: mostLiked || [],
      recent_activity: {
        new_posts: recentPosts?.length || 0,
        new_views: recentViews?.length || 0,
        new_likes: recentLikes?.length || 0
      }
    }

    return NextResponse.json({ data: stats })

  } catch (error) {
    console.error('Error in GET /api/adr-information/stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

