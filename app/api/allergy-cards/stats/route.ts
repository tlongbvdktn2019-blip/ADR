import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createAdminClient } from '@/lib/supabase'
import { getAllergyCardAccessContext } from '@/lib/allergy-card-access'
import { allergyCardError, UUID_PATTERN } from '@/lib/allergy-card-api'
import { getEffectiveCardStatus, getTodayInHoChiMinh } from '@/lib/allergy-card-workflow'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return allergyCardError('UNAUTHORIZED', 'Vui lòng đăng nhập', 401)
  const context = await getAllergyCardAccessContext(session.user.id)
  if (!context) return allergyCardError('USER_NOT_FOUND', 'Không tìm thấy tài khoản', 404)

  const requestedOrg = request.nextUrl.searchParams.get('organization_id')
  if (requestedOrg && !UUID_PATTERN.test(requestedOrg)) return allergyCardError('VALIDATION_ERROR', 'ID đơn vị không hợp lệ', 400)
  const organizationId = context.role === 'admin' ? requestedOrg : context.organizationId
  if (!organizationId && context.role !== 'admin') return allergyCardError('ORGANIZATION_REQUIRED', 'Tài khoản chưa được gắn đơn vị', 403)

  const supabase = createAdminClient()
  let cardQuery = supabase.from('allergy_cards').select('id, status, expiry_date')
  if (organizationId) cardQuery = cardQuery.eq('organization_id', organizationId)
  const { data: cards, error } = await cardQuery
  if (error) return allergyCardError('DATABASE_ERROR', 'Không thể tải thống kê', 500)

  const cardIds = (cards || []).map((card) => card.id)
  let pendingUpdates = 0
  if (cardIds.length) {
    const { count } = await supabase
      .from('allergy_card_update_submissions')
      .select('id', { count: 'exact', head: true })
      .in('card_id', cardIds)
      .in('review_status', ['pending', 'partially_approved'])
    pendingUpdates = count || 0
  }

  const today = getTodayInHoChiMinh()
  const soon = new Date(`${today}T00:00:00+07:00`)
  soon.setDate(soon.getDate() + 30)
  const soonDate = getTodayInHoChiMinh(soon)
  const statuses = (cards || []).map((card) => getEffectiveCardStatus(card.status as any, card.expiry_date, today))

  return NextResponse.json({
    total: statuses.length,
    active: statuses.filter((status) => status === 'active').length,
    expired: statuses.filter((status) => status === 'expired').length,
    expiring_soon: (cards || []).filter((card) =>
      getEffectiveCardStatus(card.status as any, card.expiry_date, today) === 'active' &&
      card.expiry_date && card.expiry_date <= soonDate
    ).length,
    pending_updates: pendingUpdates,
  })
}

