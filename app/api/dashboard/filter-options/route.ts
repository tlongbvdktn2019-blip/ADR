import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('adr_reports')
      .select('reporter_profession')
      .not('reporter_profession', 'is', null)
      .order('reporter_profession', { ascending: true })

    if (error) {
      console.error('Dashboard filter options error:', error)
      return NextResponse.json({ error: 'Không thể tải bộ lọc nghề nghiệp' }, { status: 500 })
    }

    const professions = Array.from(
      new Set(
        (data || [])
          .map((row: { reporter_profession: string | null }) => row.reporter_profession?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    )

    return NextResponse.json({
      success: true,
      professions,
    })
  } catch (error) {
    console.error('Dashboard filter options API error:', error)
    return NextResponse.json({ error: 'Lỗi server khi tải bộ lọc' }, { status: 500 })
  }
}
