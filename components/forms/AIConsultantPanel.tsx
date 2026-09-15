'use client'

import Script from 'next/script'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import {
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { CausalityLevel, ConsultationResult, DrugAssessmentResult } from '@/lib/ai-consultant/types'

declare global {
  interface Window {
    aiConsultantTurnstileCallback?: (token: string) => void
    aiConsultantTurnstileExpired?: () => void
    turnstile?: { reset: () => void }
  }
}

interface Props {
  isOpen: boolean
  onClose: () => void
  formData: Record<string, any>
  publicMode?: boolean
  onApply: (updates: {
    causality_assessment: CausalityLevel
    assessment_scale: 'who' | 'naranjo'
    medical_staff_comment: string
    ai_consultation_id: string
    ai_context_hash: string
    ai_summary_drug_ref: string
  }) => void
}

interface ConsultationPayload {
  id: string
  status: string
  contextHash: string
  result?: ConsultationResult
  errorCode?: string
}

interface DrugEdit {
  whoLevel: CausalityLevel
  naranjoLevel: CausalityLevel
  comment: string
  status?: 'accepted' | 'edited' | 'rejected'
}

const LEVEL_LABELS: Record<CausalityLevel, string> = {
  certain: 'Chắc chắn',
  probable: 'Có khả năng',
  possible: 'Có thể',
  unlikely: 'Không chắc chắn',
  unclassified: 'Chưa phân loại',
  unclassifiable: 'Không thể phân loại',
}

const QUALITY_LABELS = {
  sufficient: 'Đủ dữ kiện',
  incomplete: 'Còn thiếu dữ kiện',
  unassessable: 'Không thể đánh giá',
}

const CRITERION_LABELS: Record<string, string> = {
  temporalRelationship: 'Quan hệ thời gian',
  alternativeCausesExcluded: 'Đã loại trừ nguyên nhân khác',
  dechallengeResponse: 'Đáp ứng khi ngừng thuốc',
  knownReaction: 'Phản ứng đã được biết',
  rechallengeResponse: 'Đáp ứng khi dùng lại',
  pharmacologicPlausibility: 'Tính hợp lý dược lý',
}

const ANSWER_LABELS = { yes: 'Có', no: 'Không', unknown: 'Chưa rõ' }

function clinicalFingerprint(data: Record<string, any>) {
  return JSON.stringify({
    patient_birth_date: data.patient_birth_date,
    patient_gender: data.patient_gender,
    patient_weight: data.patient_weight,
    adr_occurrence_date: data.adr_occurrence_date,
    reaction_onset_time: data.reaction_onset_time,
    adr_description: data.adr_description,
    related_tests: data.related_tests,
    medical_history: data.medical_history,
    treatment_response: data.treatment_response,
    severity_level: data.severity_level,
    outcome_after_treatment: data.outcome_after_treatment,
    suspected_drugs: data.suspected_drugs,
    concurrent_drugs: data.concurrent_drugs,
  })
}

async function postJson(url: string, body: unknown = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.error || 'Không thể xử lý yêu cầu AI Consultant') as Error & { details?: any; code?: string }
    error.details = payload.details
    error.code = payload.code
    throw error
  }
  return payload.data
}

export default function AIConsultantPanel({ isOpen, onClose, formData, publicMode = false, onApply }: Props) {
  const [phase, setPhase] = useState<'idle' | 'creating' | 'evidence' | 'assessment' | 'ready' | 'error'>('idle')
  const [consultation, setConsultation] = useState<ConsultationPayload | null>(null)
  const [result, setResult] = useState<ConsultationResult | null>(null)
  const [baseline, setBaseline] = useState('')
  const [stale, setStale] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [drugEdits, setDrugEdits] = useState<Record<string, DrugEdit>>({})
  const [summaryDrugRef, setSummaryDrugRef] = useState('')
  const [summaryScale, setSummaryScale] = useState<'who' | 'naranjo'>('who')
  const [commentMode, setCommentMode] = useState<'append' | 'replace' | 'keep'>('append')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [sendingMessage, setSendingMessage] = useState(false)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

  useEffect(() => {
    window.aiConsultantTurnstileCallback = setCaptchaToken
    window.aiConsultantTurnstileExpired = () => setCaptchaToken('')
    return () => {
      delete window.aiConsultantTurnstileCallback
      delete window.aiConsultantTurnstileExpired
    }
  }, [])

  useEffect(() => {
    if (baseline && clinicalFingerprint(formData) !== baseline) setStale(true)
  }, [baseline, formData])

  const reviewed = useMemo(
    () => Object.values(drugEdits).filter((edit) => edit.status).length,
    [drugEdits]
  )
  const accepted = useMemo(
    () => Object.entries(drugEdits).filter(([, edit]) => edit.status === 'accepted' || edit.status === 'edited'),
    [drugEdits]
  )

  useEffect(() => {
    if (!accepted.some(([drugRef]) => drugRef === summaryDrugRef)) {
      setSummaryDrugRef(accepted[0]?.[0] || '')
    }
  }, [accepted, summaryDrugRef])

  if (!isOpen) return null

  const startAnalysis = async () => {
    if (publicMode && !captchaToken) {
      toast.error('Vui lòng hoàn tất xác minh chống spam')
      return
    }
    setPhase('creating')
    setStale(false)
    setResult(null)
    setDrugEdits({})
    setMessages([])
    try {
      const created = await postJson('/api/ai/consultations', {
        formData,
        turnstileToken: captchaToken,
        actorMode: publicMode ? 'public' : 'internal',
      })
      setConsultation(created)
      setBaseline(clinicalFingerprint(formData))

      setPhase('evidence')
      await postJson(`/api/ai/consultations/${created.id}/evidence`)

      setPhase('assessment')
      const assessed = await postJson(`/api/ai/consultations/${created.id}/assessment`)
      const assessmentResult = assessed.result as ConsultationResult
      setConsultation(assessed)
      setResult(assessmentResult)
      const initialEdits = Object.fromEntries(assessmentResult.drugAssessments.map((drug) => [drug.drugRef, {
        whoLevel: drug.whoLevel,
        naranjoLevel: drug.naranjoLevel,
        comment: drug.draftComment,
      }]))
      setDrugEdits(initialEdits)
      setSummaryDrugRef(assessmentResult.drugAssessments[0]?.drugRef || '')
      setPhase('ready')
      toast.success('AI Consultant đã hoàn tất phân tích')
    } catch (error) {
      const typed = error as Error & { details?: { missingFields?: string[] } }
      setPhase('error')
      const missing = typed.details?.missingFields?.join(', ')
      toast.error(missing ? `${typed.message}: ${missing}` : typed.message)
    }
  }

  const setDrugEdit = (drugRef: string, updates: Partial<DrugEdit>) => {
    const changesReviewedContent = 'whoLevel' in updates || 'naranjoLevel' in updates || 'comment' in updates
    setDrugEdits((current) => ({
      ...current,
      [drugRef]: {
        ...current[drugRef],
        ...updates,
        status: changesReviewedContent ? undefined : updates.status ?? current[drugRef]?.status,
      },
    }))
  }

  const reviewDrug = async (drug: DrugAssessmentResult, rejected = false) => {
    if (!consultation || stale) return
    const edit = drugEdits[drug.drugRef]
    const status = rejected
      ? 'rejected'
      : edit.whoLevel !== drug.whoLevel || edit.naranjoLevel !== drug.naranjoLevel || edit.comment !== drug.draftComment
        ? 'edited'
        : 'accepted'
    try {
      await postJson(`/api/ai/consultations/${consultation.id}/reviews`, {
        drugRef: drug.drugRef,
        status,
        finalWhoLevel: edit.whoLevel,
        finalNaranjoLevel: edit.naranjoLevel,
        finalComment: edit.comment,
      })
      setDrugEdit(drug.drugRef, { status })
      toast.success(rejected ? 'Đã ghi nhận không sử dụng đề xuất' : 'Đã xác nhận đánh giá thuốc')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xác nhận')
    }
  }

  const applySummary = () => {
    if (!consultation || !result || stale || accepted.length === 0 || reviewed !== result.drugAssessments.length) return
    const selected = drugEdits[summaryDrugRef]
    if (!selected || selected.status === 'rejected') {
      toast.error('Vui lòng chọn một thuốc đã được chấp nhận')
      return
    }
    const comments = result.drugAssessments.flatMap((drug) => {
      const edit = drugEdits[drug.drugRef]
      if (!edit || edit.status === 'rejected') return []
      const name = formData.suspected_drugs?.find((item: any) => (item.client_ref || item.id) === drug.drugRef)?.drug_name || drug.drugRef
      return [`${name}: ${edit.comment}`]
    })
    const generatedComment = comments.join('\n\n')
    const existingComment = String(formData.medical_staff_comment || '').trim()
    const medicalStaffComment = !existingComment || commentMode === 'replace'
      ? generatedComment
      : commentMode === 'keep'
        ? existingComment
        : `${existingComment}\n\n--- Nội dung đã xác nhận từ AI Consultant ---\n${generatedComment}`
    onApply({
      causality_assessment: summaryScale === 'who' ? selected.whoLevel : selected.naranjoLevel,
      assessment_scale: summaryScale,
      medical_staff_comment: medicalStaffComment,
      ai_consultation_id: consultation.id,
      ai_context_hash: consultation.contextHash,
      ai_summary_drug_ref: summaryDrugRef,
    })
    toast.success('Đã áp dụng nội dung được xác nhận vào Phần D')
    onClose()
  }

  const sendMessage = async () => {
    if (!consultation || !question.trim() || sendingMessage || stale) return
    const value = question.trim()
    setQuestion('')
    setSendingMessage(true)
    setMessages((current) => [...current, { role: 'user', content: value }])
    try {
      const response = await postJson(`/api/ai/consultations/${consultation.id}/messages`, { message: value })
      setMessages((current) => [...current, { role: 'assistant', content: response.assistantMessage.content }])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể gửi câu hỏi')
    } finally {
      setSendingMessage(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="AI Consultant">
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b bg-gradient-to-r from-indigo-700 to-blue-600 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <SparklesIcon className="h-6 w-6" />
            <div>
              <h2 className="text-lg font-semibold">AI Consultant · Gemini 2.5 Pro</h2>
              <p className="text-xs text-indigo-100">Hỗ trợ thẩm định, không thay thế quyết định chuyên môn</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-white/10" aria-label="Đóng"><XMarkIcon className="h-6 w-6" /></button>
        </div>

        <div className="overflow-y-auto p-5">
          {stale && (
            <div className="mb-4 flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
              Dữ liệu lâm sàng đã thay đổi. Kết quả cũ không thể áp dụng; hãy phân tích lại.
            </div>
          )}

          {phase === 'idle' || phase === 'error' || stale ? (
            <div className="mx-auto max-w-2xl space-y-5 py-8 text-center">
              <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-indigo-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Phân tích WHO-UMC và Naranjo theo từng thuốc</h3>
                <p className="mt-2 text-sm text-gray-600">Hệ thống chỉ gửi dữ liệu lâm sàng đã khử định danh, tìm nguồn tham khảo rồi tính điểm bằng bộ quy tắc kiểm soát.</p>
              </div>
              {publicMode && (
                <div className="flex flex-col items-center gap-2">
                  {siteKey ? <>
                    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
                    <div className="cf-turnstile" data-sitekey={siteKey} data-action="ai_consultant" data-callback="aiConsultantTurnstileCallback" data-expired-callback="aiConsultantTurnstileExpired" />
                    <p className="text-xs text-gray-500">Phiên công khai gồm một lần phân tích và tối đa ba câu hỏi.</p>
                  </> : <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">Chưa cấu hình Turnstile cho AI Consultant công khai.</p>}
                </div>
              )}
              <button onClick={startAnalysis} disabled={publicMode && (!siteKey || !captchaToken)} className="rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                {phase === 'error' || stale ? 'Phân tích lại' : 'Bắt đầu phân tích'}
              </button>
            </div>
          ) : phase !== 'ready' ? (
            <div className="mx-auto max-w-xl py-16 text-center">
              <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              <h3 className="font-semibold text-gray-900">
                {phase === 'creating' && 'Đang kiểm tra và khử định danh dữ liệu…'}
                {phase === 'evidence' && 'Đang tìm bằng chứng và nguồn tham khảo…'}
                {phase === 'assessment' && 'Đang chuẩn hóa tiêu chí và tính điểm…'}
              </h3>
              <p className="mt-2 text-sm text-gray-500">Có thể mất vài chục giây. Không đóng cửa sổ trong khi xử lý.</p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="font-semibold text-blue-950">Tóm tắt ca</h3>
                <p className="mt-1 text-sm text-blue-900">{result.caseSummary}</p>
                {!result.grounded && <p className="mt-2 text-sm font-medium text-amber-700">Chưa xác minh được bằng nguồn ngoài.</p>}
              </div>

              {result.drugAssessments.map((drug, index) => {
                const edit = drugEdits[drug.drugRef]
                const drugName = formData.suspected_drugs?.find((item: any) => (item.client_ref || item.id) === drug.drugRef)?.drug_name || `Thuốc ${index + 1}`
                return <div key={drug.drugRef} className="rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{drugName}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${drug.dataQuality === 'sufficient' ? 'bg-green-100 text-green-800' : drug.dataQuality === 'incomplete' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                      {QUALITY_LABELS[drug.dataQuality]}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="text-sm text-gray-700">WHO-UMC
                      <select value={edit?.whoLevel || drug.whoLevel} onChange={(event) => setDrugEdit(drug.drugRef, { whoLevel: event.target.value as CausalityLevel })} className="mt-1 w-full rounded-md border-gray-300">
                        {Object.entries(LEVEL_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                    <label className="text-sm text-gray-700">Naranjo: {drug.naranjoScore} điểm
                      <select value={edit?.naranjoLevel || drug.naranjoLevel} onChange={(event) => setDrugEdit(drug.drugRef, { naranjoLevel: event.target.value as CausalityLevel })} className="mt-1 w-full rounded-md border-gray-300">
                        {Object.entries(LEVEL_LABELS).filter(([value]) => !['unclassified', 'unclassifiable'].includes(value)).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">Thông tin còn thiếu</h4>
                      <ul className="mt-1 list-disc pl-5 text-sm text-gray-600">
                        {drug.missingInformation.length ? drug.missingInformation.map((item, i) => <li key={i}>{item}</li>) : <li>Không ghi nhận thiếu dữ kiện chính.</li>}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">Nguyên nhân thay thế</h4>
                      <ul className="mt-1 list-disc pl-5 text-sm text-gray-600">
                        {drug.alternativeCauses.length ? drug.alternativeCauses.map((item, i) => <li key={i}>{item}</li>) : <li>Chưa xác định.</li>}
                      </ul>
                    </div>
                  </div>
                  <details className="mt-4 rounded-lg bg-gray-50 p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-gray-800">Xem dữ kiện WHO-UMC, Naranjo và timeline</summary>
                    <div className="mt-3 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">Timeline</h4>
                        <ul className="mt-1 list-disc pl-5 text-sm text-gray-600">
                          {drug.timelineFacts.map((fact) => <li key={fact.factId}>{fact.statement}</li>)}
                        </ul>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead><tr className="border-b"><th className="p-2">Tiêu chí WHO-UMC</th><th className="p-2">Trạng thái</th><th className="p-2">Giải thích</th></tr></thead>
                          <tbody>{Object.entries(drug.whoCriteria).map(([key, criterion]) => <tr key={key} className="border-b align-top"><td className="p-2 font-medium">{CRITERION_LABELS[key] || key}</td><td className="p-2">{ANSWER_LABELS[criterion.status]}</td><td className="p-2 text-gray-600">{criterion.rationale}</td></tr>)}</tbody>
                        </table>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead><tr className="border-b"><th className="p-2">Câu Naranjo</th><th className="p-2">Trả lời</th><th className="p-2">Giải thích</th></tr></thead>
                          <tbody>{drug.naranjoAnswers.map((answer) => <tr key={answer.questionId} className="border-b align-top"><td className="p-2 font-medium">{answer.questionId}</td><td className="p-2">{ANSWER_LABELS[answer.answer]}</td><td className="p-2 text-gray-600">{answer.rationale}</td></tr>)}</tbody>
                        </table>
                      </div>
                      {drug.warnings.length > 0 && <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900"><strong>Cảnh báo:</strong> {drug.warnings.join('; ')}</div>}
                    </div>
                  </details>
                  <label className="mt-4 block text-sm font-medium text-gray-800">Nhận xét chuyên môn dự thảo
                    <textarea value={edit?.comment || ''} onChange={(event) => setDrugEdit(drug.drugRef, { comment: event.target.value })} rows={4} className="mt-1 w-full rounded-md border-gray-300 text-sm" />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => reviewDrug(drug)} disabled={stale} className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                      {edit?.status === 'accepted' || edit?.status === 'edited' ? 'Đã xác nhận' : 'Xác nhận'}
                    </button>
                    <button onClick={() => reviewDrug(drug, true)} disabled={stale} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 disabled:opacity-50">Không sử dụng</button>
                  </div>
                </div>
              })}

              <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2"><LinkIcon className="h-5 w-5 text-blue-600" /><h3 className="font-semibold">Nguồn tham khảo</h3></div>
                <div className="mt-3 space-y-2">
                  {result.sources.length ? result.sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="block rounded-md bg-gray-50 p-3 text-sm text-blue-700 hover:bg-blue-50">
                    <span className="font-medium">{source.title}</span><span className="ml-2 text-xs text-gray-500">Cấp {source.qualityTier} · {source.domain}</span>
                  </a>) : <p className="text-sm text-amber-700">Không có nguồn grounding đủ điều kiện.</p>}
                </div>
              </div>

              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <h3 className="font-semibold text-indigo-950">Áp dụng kết luận tổng hợp</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="text-sm">Thuốc đại diện cho kết luận
                    <select value={summaryDrugRef} onChange={(event) => setSummaryDrugRef(event.target.value)} className="mt-1 w-full rounded-md border-gray-300 bg-white">
                      {accepted.map(([ref]) => <option key={ref} value={ref}>{formData.suspected_drugs?.find((item: any) => (item.client_ref || item.id) === ref)?.drug_name || ref}</option>)}
                    </select>
                  </label>
                  <label className="text-sm">Thang dùng cho kết luận chung
                    <select value={summaryScale} onChange={(event) => setSummaryScale(event.target.value as 'who' | 'naranjo')} className="mt-1 w-full rounded-md border-gray-300 bg-white"><option value="who">WHO-UMC</option><option value="naranjo">Naranjo</option></select>
                  </label>
                </div>
                {formData.medical_staff_comment?.trim() && <label className="mt-3 block text-sm">Xử lý bình luận hiện có
                  <select value={commentMode} onChange={(event) => setCommentMode(event.target.value as typeof commentMode)} className="mt-1 w-full rounded-md border-gray-300 bg-white">
                    <option value="append">Nối nội dung AI đã xác nhận</option>
                    <option value="replace">Thay thế bằng nội dung AI đã xác nhận</option>
                    <option value="keep">Giữ nguyên bình luận hiện có</option>
                  </select>
                </label>}
                <button onClick={applySummary} disabled={stale || reviewed !== result.drugAssessments.length || accepted.length === 0} className="mt-4 rounded-md bg-indigo-700 px-5 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
                  Áp dụng nội dung đã xác nhận vào Phần D
                </button>
                <p className="mt-2 text-xs text-indigo-800">Đã xử lý {reviewed}/{result.drugAssessments.length} thuốc. Phải xác nhận hoặc từ chối từng thuốc trước khi áp dụng.</p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2"><ChatBubbleLeftRightIcon className="h-5 w-5 text-green-600" /><h3 className="font-semibold">Hỏi thêm về ca ADR</h3></div>
                <div className="mt-3 max-h-64 space-y-3 overflow-y-auto">
                  {messages.map((message, index) => <div key={index} className={`rounded-lg p-3 text-sm ${message.role === 'user' ? 'ml-8 bg-blue-50' : 'mr-8 bg-gray-100'}`}>{message.content}</div>)}
                </div>
                <div className="mt-3 flex gap-2">
                  <input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') sendMessage() }} placeholder="Ví dụ: Vì sao thuốc này được xếp Có khả năng?" className="min-w-0 flex-1 rounded-md border-gray-300 text-sm" />
                  <button onClick={sendMessage} disabled={sendingMessage || !question.trim() || stale} className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{sendingMessage ? 'Đang gửi…' : 'Gửi'}</button>
                </div>
                {publicMode && <p className="mt-2 text-xs text-gray-500">Còn {Math.max(0, 3 - messages.filter((item) => item.role === 'user').length)} câu hỏi trong phiên công khai.</p>}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
