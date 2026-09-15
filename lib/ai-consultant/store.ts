import { supabaseAdmin } from '@/lib/supabase-admin'
import { AIConsultantError } from './errors'
import { ConsultationResult, ConsultationStatus, EvidencePacket } from './types'

export interface ConsultationRow {
  id: string
  report_id: string | null
  actor_type: 'internal' | 'public'
  user_id: string | null
  public_session_hash: string | null
  status: ConsultationStatus
  context_snapshot: any
  context_hash: string
  evidence_packet: EvidencePacket | null
  result: ConsultationResult | null
  usage: Record<string, any>
  error_code: string | null
  expires_at: string | null
  created_at: string
}

export async function createConsultation(input: {
  actorType: 'internal' | 'public'
  userId?: string
  publicSessionHash?: string
  publicRateKey?: string
  context: unknown
  contextHash: string
  expiresAt?: string
}) {
  const { data, error } = await supabaseAdmin
    .from('ai_consultations')
    .insert({
      actor_type: input.actorType,
      user_id: input.userId || null,
      public_session_hash: input.publicSessionHash || null,
      context_snapshot: input.context,
      context_hash: input.contextHash,
      prompt_version: 'ai-consultant-v1',
      ruleset_version: 'who-umc-naranjo-v1',
      expires_at: input.expiresAt || null,
      usage: input.publicRateKey ? { publicRateKey: input.publicRateKey } : {},
    })
    .select('*')
    .single()
  if (error || !data) throw new Error(error?.message || 'Cannot create AI consultation')
  await logConsultationEvent(data.id, input.actorType, 'consultation_created', input.userId)
  return data as ConsultationRow
}

export async function getConsultation(id: string) {
  const { data, error } = await supabaseAdmin
    .from('ai_consultations')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new AIConsultantError('AI_UNAUTHORIZED', 'Không tìm thấy phiên AI Consultant.', 404)
  return data as ConsultationRow
}

export async function updateConsultation(
  id: string,
  updates: Partial<{
    status: ConsultationStatus
    evidence_packet: EvidencePacket
    result: ConsultationResult
    usage: Record<string, any>
    error_code: string | null
    completed_at: string | null
  }>
) {
  const { data, error } = await supabaseAdmin
    .from('ai_consultations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error || !data) throw new Error(error?.message || 'Cannot update AI consultation')
  return data as ConsultationRow
}

export async function replaceEvidenceSources(consultationId: string, evidence: EvidencePacket) {
  await supabaseAdmin.from('ai_evidence_sources').delete().eq('consultation_id', consultationId)
  if (evidence.sources.length === 0) return
  const { error } = await supabaseAdmin.from('ai_evidence_sources').insert(
    evidence.sources.map((source) => ({
      consultation_id: consultationId,
      source_key: source.id,
      url: source.url,
      title: source.title,
      domain: source.domain,
      quality_tier: source.qualityTier,
      accessed_at: source.accessedAt,
      grounding_metadata: source.groundingMetadata || {},
      claim_summary: source.claimSummary || null,
    }))
  )
  if (error) throw new Error(error.message)
}

export async function replaceDrugAssessments(consultation: ConsultationRow, result: ConsultationResult) {
  await supabaseAdmin.from('ai_drug_assessments').delete().eq('consultation_id', consultation.id)
  const sourceKeys = result.sources.map((source) => source.id)
  const { error } = await supabaseAdmin.from('ai_drug_assessments').insert(
    result.drugAssessments.map((assessment) => ({
      consultation_id: consultation.id,
      drug_client_ref: assessment.drugRef,
      drug_snapshot: consultation.context_snapshot.suspectedDrugs.find((drug: any) => drug.clientRef === assessment.drugRef) || {},
      who_input: assessment.whoCriteria,
      who_level: assessment.whoLevel,
      naranjo_answers: assessment.naranjoAnswers,
      naranjo_score: assessment.naranjoScore,
      naranjo_level: assessment.naranjoLevel,
      alternative_causes: assessment.alternativeCauses,
      missing_information: assessment.missingInformation,
      warnings: assessment.warnings,
      evidence_source_keys: sourceKeys,
      ai_draft_comment: assessment.draftComment,
    }))
  )
  if (error) throw new Error(error.message)
}

export async function reviewDrugAssessment(input: {
  consultationId: string
  drugRef: string
  status: 'accepted' | 'edited' | 'rejected'
  finalWhoLevel?: string
  finalNaranjoLevel?: string
  finalComment?: string
  reviewedBy?: string
}) {
  const { data, error } = await supabaseAdmin
    .from('ai_drug_assessments')
    .update({
      review_status: input.status,
      final_who_level: input.status === 'rejected' ? null : input.finalWhoLevel || null,
      final_naranjo_level: input.status === 'rejected' ? null : input.finalNaranjoLevel || null,
      final_comment: input.status === 'rejected' ? null : input.finalComment || '',
      reviewed_by: input.reviewedBy || null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('consultation_id', input.consultationId)
    .eq('drug_client_ref', input.drugRef)
    .select('*')
    .single()
  if (error || !data) throw new Error(error?.message || 'Cannot review AI drug assessment')
  return data
}

export async function getDrugReviews(consultationId: string) {
  const { data, error } = await supabaseAdmin
    .from('ai_drug_assessments')
    .select('*')
    .eq('consultation_id', consultationId)
    .order('created_at')
  if (error) throw new Error(error.message)
  return data || []
}

export async function validateReviewedSummary(input: {
  consultationId: string
  contextHash: string
  summaryDrugRef: string
  scale: 'who' | 'naranjo'
  causalityLevel: string
}) {
  const consultation = await getConsultation(input.consultationId)
  if (consultation.context_hash !== input.contextHash || !['ready', 'reviewed'].includes(consultation.status)) {
    throw new AIConsultantError('AI_CONTEXT_STALE', 'Phiên AI không còn khớp dữ liệu báo cáo.', 409)
  }
  const reviews = await getDrugReviews(input.consultationId)
  if (!reviews.length || reviews.some((review: any) => review.review_status === 'pending')) {
    throw new AIConsultantError('AI_CONTEXT_STALE', 'Chưa xử lý đầy đủ đánh giá của các thuốc.', 409)
  }
  const summary = reviews.find((review: any) => review.drug_client_ref === input.summaryDrugRef)
  if (!summary || summary.review_status === 'rejected') {
    throw new AIConsultantError('AI_CONTEXT_STALE', 'Thuốc dùng cho kết luận tổng hợp chưa được chấp nhận.', 409)
  }
  const expected = input.scale === 'who' ? summary.final_who_level : summary.final_naranjo_level
  if (expected !== input.causalityLevel) {
    throw new AIConsultantError('AI_CONTEXT_STALE', 'Kết luận tổng hợp không khớp nội dung đã xác nhận.', 409)
  }
  return consultation
}

export async function attachConsultationToReport(input: {
  consultationId: string
  reportId: string
  contextHash: string
}) {
  const { error } = await supabaseAdmin.rpc('attach_ai_consultation', {
    p_consultation_id: input.consultationId,
    p_report_id: input.reportId,
    p_context_hash: input.contextHash,
  })
  if (error) throw new Error(error.message)
  await logConsultationEvent(input.consultationId, 'system', 'consultation_attached', undefined, { reportId: input.reportId })
}

export async function countRecentConsultations(input: {
  userId?: string
  publicRateKey?: string
  since: string
}) {
  let query = supabaseAdmin.from('ai_consultations').select('id, usage', { count: 'exact', head: false }).gte('created_at', input.since)
  if (input.userId) query = query.eq('user_id', input.userId)
  if (input.publicRateKey) query = query.eq('actor_type', 'public')
  const { data, count, error } = await query
  if (error) throw new Error(error.message)
  if (!input.publicRateKey) return count || 0
  return (data || []).filter((row: any) => row.usage?.publicRateKey === input.publicRateKey).length
}

function estimateUsageCost(usage: Record<string, any>) {
  const stages = [usage?.evidence, usage?.assessment]
  const tokenCost = stages.reduce((total, stage) => {
    if (!stage) return total
    const input = Number(stage.promptTokens || 0)
    const output = Number(stage.outputTokens || 0) + Number(stage.thinkingTokens || 0)
    return total + (input / 1_000_000) * 1.25 + (output / 1_000_000) * 10
  }, 0)
  const groundingCost = usage?.evidence ? 0.035 : 0
  return tokenCost + groundingCost
}

export async function getPublicEstimatedCostSince(since: string) {
  const { data, error } = await supabaseAdmin
    .from('ai_consultations')
    .select('usage')
    .eq('actor_type', 'public')
    .gte('created_at', since)
  if (error) throw new Error(error.message)
  return (data || []).reduce((total: number, row: any) => total + estimateUsageCost(row.usage || {}), 0)
}

export async function countPublicFollowUps(consultationId: string) {
  const { count, error } = await supabaseAdmin
    .from('ai_chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('consultation_id', consultationId)
    .eq('role', 'user')
  if (error) throw new Error(error.message)
  return count || 0
}

export async function saveChatMessage(input: {
  consultationId: string
  role: 'user' | 'assistant'
  content: string
  citations?: unknown[]
  tokenUsage?: Record<string, unknown>
}) {
  const { data, error } = await supabaseAdmin.from('ai_chat_messages').insert({
    consultation_id: input.consultationId,
    role: input.role,
    content: input.content,
    citations: input.citations || [],
    token_usage: input.tokenUsage || {},
  }).select('*').single()
  if (error || !data) throw new Error(error?.message || 'Cannot save AI chat message')
  return data
}

export async function getChatMessages(consultationId: string) {
  const { data, error } = await supabaseAdmin
    .from('ai_chat_messages')
    .select('*')
    .eq('consultation_id', consultationId)
    .order('created_at')
  if (error) throw new Error(error.message)
  return data || []
}

export async function logConsultationEvent(
  consultationId: string,
  actorType: 'system' | 'internal' | 'public',
  action: string,
  actorUserId?: string,
  metadata: Record<string, unknown> = {}
) {
  const { error } = await supabaseAdmin.from('ai_consultation_events').insert({
    consultation_id: consultationId,
    actor_type: actorType,
    actor_user_id: actorUserId || null,
    action,
    metadata,
  })
  if (error) console.error('Cannot write AI consultation audit event:', error.message)
}
