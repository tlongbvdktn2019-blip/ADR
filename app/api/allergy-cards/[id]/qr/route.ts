import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createAdminClient } from '@/lib/supabase'
import { canAccessOrganization, getAllergyCardAccessContext } from '@/lib/allergy-card-access'
import { allergyCardError, UUID_PATTERN } from '@/lib/allergy-card-api'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return allergyCardError('UNAUTHORIZED', 'Vui lòng đăng nhập', 401)
  if (!UUID_PATTERN.test(params.id)) return allergyCardError('VALIDATION_ERROR', 'ID thẻ không hợp lệ', 400)
  const context = await getAllergyCardAccessContext(session.user.id)
  if (!context) return allergyCardError('USER_NOT_FOUND', 'Không tìm thấy tài khoản', 404)
  const supabase = createAdminClient()
  const { data: card } = await supabase.from('allergy_cards').select('id, organization_id, public_token').eq('id', params.id).maybeSingle()
  if (!card) return allergyCardError('NOT_FOUND', 'Không tìm thấy thẻ', 404)
  if (!canAccessOrganization(context, (card as any).organization_id)) return allergyCardError('FORBIDDEN', 'Bạn không có quyền truy cập thẻ này', 403)

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, '')
  const png = await QRCode.toBuffer(`${baseUrl}/allergy-cards/view/${(card as any).public_token}`, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: { dark: '#7f1d1d', light: '#ffffff' },
  })
  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `inline; filename="allergy-card-${card.id}.png"`,
      'Cache-Control': 'private, no-store, max-age=0',
    },
  })
}
