import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import { Database } from '@/types/supabase'
import { ADRReport } from '@/types/report'
import { SimplePDFService } from '@/lib/pdf-service-vercel-simple'

// Force Node.js runtime (not Edge)
export const runtime = 'nodejs'

// Create Supabase admin client
const supabaseAdmin = createClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey
)

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const reportId = params.id

  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the report with suspected and concurrent drugs
    const { data: reportData, error } = await supabaseAdmin
      .from('adr_reports')
      .select(`
        *,
        suspected_drugs(*),
        concurrent_drugs(*)
      `)
      .eq('id', reportId)
      .single()

    if (error || !reportData) {
      return NextResponse.json(
        { error: 'Không tìm thấy báo cáo' },
        { status: 404 }
      )
    }

    const report = reportData as ADRReport

    console.log('=== FALLBACK PDF GENERATION ===')
    console.log('Report ID:', reportId)
    console.log('Using fallback HTML solution...')

    // Use fallback HTML solution instead of puppeteer
    return await SimplePDFService.generateFallbackResponse(report)

  } catch (error: unknown) {
    const err = error instanceof Error ? error : null

    console.error('=== FALLBACK PDF GENERATION ERROR ===')
    console.error('Report ID:', reportId)
    console.error('Error:', err?.message ?? String(error))

    return NextResponse.json(
      { 
        error: 'Có lỗi xảy ra khi tạo báo cáo PDF',
        details: err?.message ?? String(error),
        fallback: true
      },
      { status: 500 }
    )
  }
}
