import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createAdminClient } from '@/lib/supabase'
import { canAccessOrganization, getAllergyCardAccessContext } from '@/lib/allergy-card-access'
import { allergyCardError, UUID_PATTERN } from '@/lib/allergy-card-api'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return allergyCardError('UNAUTHORIZED', 'Vui lòng đăng nhập', 401)
  if (!UUID_PATTERN.test(params.id)) return allergyCardError('VALIDATION_ERROR', 'ID thẻ không hợp lệ', 400)

  const context = await getAllergyCardAccessContext(session.user.id)
  if (!context) return allergyCardError('USER_NOT_FOUND', 'Không tìm thấy tài khoản', 404)
  const supabase = createAdminClient()
  const { data: card } = await supabase.from('allergy_cards').select('*').eq('id', params.id).maybeSingle()
  if (!card) return allergyCardError('NOT_FOUND', 'Không tìm thấy thẻ', 404)
  if (!canAccessOrganization(context, (card as any).organization_id)) {
    return allergyCardError('FORBIDDEN', 'Bạn không có quyền thao tác thẻ này', 403)
  }

  const publicToken = randomUUID()
  const { error } = await supabase.from('allergy_cards').update({
    public_token: publicToken,
    qr_code_data: null,
    qr_code_url: null,
    updated_at: new Date().toISOString(),
  }).eq('id', params.id)
  if (error) return allergyCardError('DATABASE_ERROR', 'Không thể tạo lại QR', 500)

  await supabase.from('allergy_card_audit_logs').insert({
    card_id: card.id,
    card_code: card.card_code,
    organization_id: (card as any).organization_id,
    action: 'public_token_rotated',
    actor_user_id: context.userId,
  })

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, '')
  return NextResponse.json({ success: true, public_url: `${baseUrl}/allergy-cards/view/${publicToken}` })
}

