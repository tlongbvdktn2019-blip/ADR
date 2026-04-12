import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createAdminClient } from '@/lib/supabase'
import { generateAllergyCardPrintHTML } from '@/lib/allergy-card-print-template'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    void request

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const cardId = params.id

    const { data: card, error } = await supabase
      .from('allergy_cards_with_details')
      .select('*')
      .eq('id', cardId)
      .single()

    if (error || !card) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Khong tim thay the di ung' }, { status: 404 })
    }

    const isAdmin = session.user.role === 'admin'
    const isOwner = card.issued_by_user_id === session.user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Khong co quyen truy cap' }, { status: 403 })
    }

    const html = generateAllergyCardPrintHTML(card)

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Loi server' }, { status: 500 })
  }
}
