import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createAdminClient } from '@/lib/supabase'
import { canAccessOrganization, getAllergyCardAccessContext } from '@/lib/allergy-card-access'
import { allergyCardError, UUID_PATTERN } from '@/lib/allergy-card-api'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return allergyCardError('UNAUTHORIZED', 'Vui lòng đăng nhập', 401)
  if (!UUID_PATTERN.test(params.id)) return allergyCardError('VALIDATION_ERROR', 'ID thẻ không hợp lệ', 400)

  const context = await getAllergyCardAccessContext(session.user.id)
  if (!context) return allergyCardError('USER_NOT_FOUND', 'Không tìm thấy tài khoản', 404)

  const supabase = createAdminClient()
  const { data: card, error: cardError } = await supabase
    .from('allergy_cards')
    .select('id, card_code, patient_name, organization_id')
    .eq('id', params.id)
    .maybeSingle()
  if (cardError || !card) return allergyCardError('NOT_FOUND', 'Không tìm thấy thẻ dị ứng', 404)
  if (!canAccessOrganization(context, card.organization_id)) return allergyCardError('FORBIDDEN', 'Bạn không có quyền xem lịch sử của thẻ này', 403)

  const { data: submissions, error } = await supabase
    .from('allergy_card_update_submissions')
    .select('*, allergy_card_update_items(*)')
    .eq('card_id', params.id)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('Load allergy-card updates failed:', error)
    return allergyCardError('DATABASE_ERROR', 'Không thể tải các đề nghị cập nhật', 500)
  }

  const updates = (submissions || []).map((submission: any) => ({
    ...submission,
    items: (submission.allergy_card_update_items || []).sort((a: any, b: any) => a.created_at.localeCompare(b.created_at)),
    allergy_card_update_items: undefined,
  }))
  const pendingItems = updates.reduce(
    (total: number, submission: any) => total + submission.items.filter((item: any) => item.review_status === 'pending').length,
    0
  )

  return NextResponse.json({
    success: true,
    card: { id: card.id, card_code: card.card_code, patient_name: card.patient_name },
    updates,
    total_updates: updates.length,
    pending_items: pendingItems,
  })
}

export async function POST() {
  return allergyCardError(
    'PUBLIC_WORKFLOW_REQUIRED',
    'Vui lòng dùng liên kết công khai trên mã QR để gửi đề nghị bổ sung',
    405
  )
}
