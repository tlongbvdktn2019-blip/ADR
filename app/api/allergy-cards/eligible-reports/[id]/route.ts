import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createAdminClient } from '@/lib/supabase'
import { canAccessOrganization, getAllergyCardAccessContext } from '@/lib/allergy-card-access'
import { allergyCardError, UUID_PATTERN } from '@/lib/allergy-card-api'
import { getMissingIssuanceFields, type IssuanceReport } from '@/lib/allergy-card-workflow'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return allergyCardError('UNAUTHORIZED', 'Vui lòng đăng nhập', 401)
  if (!UUID_PATTERN.test(params.id)) return allergyCardError('VALIDATION_ERROR', 'ID báo cáo không hợp lệ', 400)

  const context = await getAllergyCardAccessContext(session.user.id)
  if (!context) return allergyCardError('USER_NOT_FOUND', 'Không tìm thấy tài khoản', 404)

  const supabase = createAdminClient()
  const [{ data: report, error }, { data: card }] = await Promise.all([
    supabase.from('adr_reports').select(`
      id, report_code, organization, organization_id,
      patient_name, patient_age, patient_gender,
      adr_description, severity_level, causality_assessment,
      reporter_name, reporter_profession, reporter_phone,
      report_date, approval_status, updated_at,
      suspected_drugs(id, drug_name)
    `).eq('id', params.id).maybeSingle(),
    supabase.from('allergy_cards').select('id').eq('report_id', params.id).maybeSingle(),
  ])

  if (error || !report) return allergyCardError('NOT_FOUND', 'Không tìm thấy báo cáo', 404)
  if (!canAccessOrganization(context, (report as any).organization_id)) {
    return allergyCardError('FORBIDDEN', 'Bạn không có quyền xem báo cáo của đơn vị này', 403)
  }
  if (card) return allergyCardError('REPORT_ALREADY_ISSUED', 'Báo cáo này đã được cấp thẻ', 409)

  return NextResponse.json({
    report: {
      ...(report as any),
      suspected_drug_names: ((report as any).suspected_drugs || []).map((drug: any) => drug.drug_name).filter(Boolean),
      missing_fields: getMissingIssuanceFields(report as unknown as IssuanceReport),
    },
  })
}

