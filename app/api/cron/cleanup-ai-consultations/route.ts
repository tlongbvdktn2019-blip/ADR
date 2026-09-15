import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data, error } = await supabaseAdmin.rpc('cleanup_expired_ai_consultations')
  if (error) {
    console.error('AI consultation cleanup failed:', error.message)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
  return NextResponse.json({ success: true, deleted: data || 0 })
}
