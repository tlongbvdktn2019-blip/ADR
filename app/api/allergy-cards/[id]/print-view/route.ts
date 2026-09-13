import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import QRCode from 'qrcode'
import { authOptions } from '@/lib/auth-config'
import { createAdminClient } from '@/lib/supabase'
import { canAccessOrganization, getAllergyCardAccessContext } from '@/lib/allergy-card-access'
import { allergyCardError, UUID_PATTERN } from '@/lib/allergy-card-api'
import { generateAllergyCardPrintHTML } from '@/lib/allergy-card-print-template'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return allergyCardError('UNAUTHORIZED', 'Vui lòng đăng nhập', 401)
  if (!UUID_PATTERN.test(params.id)) return allergyCardError('VALIDATION_ERROR', 'ID thẻ không hợp lệ', 400)
  const context = await getAllergyCardAccessContext(session.user.id)
  if (!context) return allergyCardError('USER_NOT_FOUND', 'Không tìm thấy tài khoản', 404)

  const supabase = createAdminClient()
  const { data: card, error } = await supabase.from('allergy_cards').select('*, card_allergies(*)').eq('id', params.id).maybeSingle()
  if (error || !card) return allergyCardError('NOT_FOUND', 'Không tìm thấy thẻ dị ứng', 404)
  if (!canAccessOrganization(context, (card as any).organization_id)) return allergyCardError('FORBIDDEN', 'Bạn không có quyền in thẻ này', 403)

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, '')
  const qrDataUrl = await QRCode.toDataURL(`${baseUrl}/allergy-cards/view/${(card as any).public_token}`, {
    width: 400, margin: 2, errorCorrectionLevel: 'H',
  })
  const html = generateAllergyCardPrintHTML({
    ...(card as any),
    allergies: (card as any).card_allergies || [],
    qr_code_url: qrDataUrl,
  })
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store, max-age=0',
      'Content-Security-Policy': "default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'self'",
    },
  })
}
