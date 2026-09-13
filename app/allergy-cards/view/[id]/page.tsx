'use client'

import Script from 'next/script'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import {
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

declare global {
  interface Window {
    allergyTurnstileCallback?: (token: string) => void
    allergyTurnstileExpired?: () => void
    turnstile?: { reset: () => void }
  }
}

type PublicCard = {
  card_code: string
  patient_name: string
  patient_gender: string
  patient_age: number
  hospital_name: string
  department?: string
  doctor_name: string
  doctor_phone?: string
  issued_date: string
  expiry_date?: string
  organization: string
  allergies: Array<{
    id: string
    allergen_name: string
    certainty_level: string
    clinical_manifestation?: string
    severity_level?: string
    reaction_type?: string
  }>
}

function apiMessage(payload: any, fallback: string) {
  return payload?.error?.message || payload?.message || fallback
}

function formatDate(value?: string) {
  return value ? new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`)) : 'Không thời hạn'
}

const severityText: Record<string, string> = {
  life_threatening: 'Đe dọa tính mạng',
  severe: 'Nghiêm trọng',
  moderate: 'Trung bình',
  mild: 'Nhẹ',
}

export default function PublicAllergyCardView({ params }: { params: { id: string } }) {
  const [card, setCard] = useState<PublicCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatesEnabled, setUpdatesEnabled] = useState(false)
  const [siteKey, setSiteKey] = useState('')
  const [showUpdate, setShowUpdate] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [itemKind, setItemKind] = useState<'new_allergy' | 'modify_allergy' | 'additional_note'>('new_allergy')
  const [targetAllergyId, setTargetAllergyId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/allergy-cards/view/${params.id}`, { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(apiMessage(payload, 'Không thể tải thông tin thẻ'))
      setCard(payload.card)
      setUpdatesEnabled(Boolean(payload.public_updates_enabled))
      setSiteKey(payload.turnstile_site_key || '')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể tải thông tin thẻ')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    window.allergyTurnstileCallback = setCaptchaToken
    window.allergyTurnstileExpired = () => setCaptchaToken('')
    return () => {
      delete window.allergyTurnstileCallback
      delete window.allergyTurnstileExpired
    }
  }, [])

  async function submitUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    const values = new FormData(event.currentTarget)
    setSubmitting(true)
    try {
      const itemType = String(values.get('item_type'))
      const response = await fetch(`/api/allergy-cards/view/${params.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updated_by_name: values.get('updated_by_name'),
          updated_by_organization: values.get('updated_by_organization'),
          updated_by_role: values.get('updated_by_role'),
          updated_by_phone: values.get('updated_by_phone'),
          updated_by_email: values.get('updated_by_email'),
          facility_name: values.get('facility_name'),
          facility_department: values.get('facility_department'),
          reason_for_update: values.get('reason_for_update'),
          submission_notes: values.get('submission_notes'),
          turnstile_token: captchaToken,
          items: [{
            item_type: itemType,
            target_allergy_id: itemType === 'modify_allergy' ? values.get('target_allergy_id') : undefined,
            allergen_name: itemType === 'additional_note' ? undefined : values.get('allergen_name'),
            certainty_level: itemType === 'additional_note' ? undefined : values.get('certainty_level'),
            clinical_manifestation: itemType === 'additional_note' ? undefined : values.get('clinical_manifestation'),
            severity_level: itemType === 'additional_note' ? undefined : values.get('severity_level'),
            reaction_type: itemType === 'additional_note' ? undefined : values.get('reaction_type'),
            note: itemType === 'additional_note' ? values.get('note') : undefined,
          }],
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(apiMessage(payload, 'Không thể gửi thông tin'))
      setSuccess(payload.message)
      setShowUpdate(false)
      setItemKind('new_allergy')
      setTargetAllergyId('')
      event.currentTarget.reset()
      setCaptchaToken('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể gửi thông tin')
      setCaptchaToken('')
      window.turnstile?.reset()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <main className="min-h-screen bg-slate-50 grid place-items-center"><LoadingSpinner size="lg" /></main>
  if (!card) return (
    <main className="min-h-screen bg-slate-50 grid place-items-center p-4">
      <Card className="max-w-lg p-8 text-center">
        <ExclamationTriangleIcon className="mx-auto h-14 w-14 text-red-600" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">Không thể tra cứu thẻ</h1>
        <p className="mt-2 text-slate-600">{error || 'Thẻ không tồn tại hoặc không còn hiệu lực.'}</p>
      </Card>
    </main>
  )

  const dangerous = card.allergies.some((item) => ['severe', 'life_threatening'].includes(item.severity_level || ''))
  const selectedTarget = card.allergies.find((item) => item.id === targetAllergyId)

  return (
    <main className="min-h-screen bg-slate-100 py-6 sm:py-10">
      <div className="mx-auto max-w-3xl px-4">
        <header className="rounded-t-2xl bg-blue-900 px-5 py-6 text-white sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-200">THẺ DỊ ỨNG ĐIỆN TỬ</p>
              <h1 className="mt-1 text-2xl font-bold">{card.patient_name}</h1>
              <p className="mt-1 font-mono text-blue-100">{card.card_code}</p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-400/20 px-3 py-1.5 text-sm text-emerald-100">
              <ShieldCheckIcon className="h-5 w-5" /> Còn hiệu lực
            </div>
          </div>
        </header>

        {dangerous && (
          <div className="flex gap-3 border-x border-red-300 bg-red-50 px-5 py-4 text-red-900 sm:px-8">
            <ExclamationTriangleIcon className="h-7 w-7 shrink-0 text-red-600" />
            <div><strong>Cảnh báo dị ứng nghiêm trọng.</strong><p className="text-sm">Không sử dụng các thuốc/dị nguyên được liệt kê nếu chưa có chỉ định chuyên môn.</p></div>
          </div>
        )}

        <div className="space-y-5 rounded-b-2xl bg-white p-5 shadow-sm sm:p-8">
          <section aria-labelledby="allergens-title">
            <h2 id="allergens-title" className="text-lg font-bold text-slate-900">Thuốc và dị nguyên cần lưu ý</h2>
            <div className="mt-3 space-y-3">
              {card.allergies.map((allergy) => (
                <article key={allergy.id} className="rounded-xl border border-red-200 bg-red-50/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-red-950">{allergy.allergen_name}</h3>
                    <div className="flex gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-white px-2.5 py-1 text-red-800">{allergy.certainty_level === 'confirmed' ? 'Đã xác định' : 'Nghi ngờ'}</span>
                      {allergy.severity_level && <span className="rounded-full bg-red-700 px-2.5 py-1 text-white">{severityText[allergy.severity_level]}</span>}
                    </div>
                  </div>
                  {allergy.clinical_manifestation && <p className="mt-2 text-sm text-slate-700"><strong>Biểu hiện:</strong> {allergy.clinical_manifestation}</p>}
                  {allergy.reaction_type && <p className="mt-1 text-sm text-slate-700"><strong>Loại phản ứng:</strong> {allergy.reaction_type}</p>}
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-4 border-t pt-5 sm:grid-cols-2" aria-label="Thông tin thẻ">
            <p className="flex gap-2 text-sm"><UserIcon className="h-5 w-5 text-blue-700" /><span><strong>Người bệnh:</strong><br />{card.patient_age} tuổi · {card.patient_gender === 'male' ? 'Nam' : card.patient_gender === 'female' ? 'Nữ' : 'Khác'}</span></p>
            <p className="flex gap-2 text-sm"><BuildingOffice2Icon className="h-5 w-5 text-blue-700" /><span><strong>Đơn vị cấp:</strong><br />{card.organization || card.hospital_name}{card.department ? ` · ${card.department}` : ''}</span></p>
            <p className="flex gap-2 text-sm"><CalendarDaysIcon className="h-5 w-5 text-blue-700" /><span><strong>Ngày cấp:</strong> {formatDate(card.issued_date)}<br /><strong>Hết hạn:</strong> {formatDate(card.expiry_date)}</span></p>
            <p className="flex gap-2 text-sm"><PhoneIcon className="h-5 w-5 text-blue-700" /><span><strong>Người xác nhận:</strong><br />{card.doctor_name}{card.doctor_phone ? ` · ${card.doctor_phone}` : ''}</span></p>
          </section>

          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Thông tin này hỗ trợ cảnh báo an toàn, không thay thế chẩn đoán hoặc chỉ định của nhân viên y tế.</p>
          {success && <p className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircleIcon className="h-5 w-5" />{success}</p>}
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          {updatesEnabled && (
            <section className="border-t pt-5">
              <button type="button" onClick={() => setShowUpdate((value) => !value)} className="w-full rounded-lg border border-blue-700 px-4 py-2.5 font-semibold text-blue-800 hover:bg-blue-50">
                {showUpdate ? 'Đóng biểu mẫu' : 'Gửi thông tin dị ứng mới'}
              </button>
              {showUpdate && (
                <form onSubmit={submitUpdate} className="mt-5 space-y-5 rounded-xl bg-slate-50 p-4 sm:p-6">
                  <div><h2 className="font-bold text-slate-900">Đề nghị bổ sung thông tin</h2><p className="mt-1 text-sm text-slate-600">Thông tin chỉ hiển thị trên thẻ sau khi đơn vị phát hành duyệt từng nội dung.</p></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field name="updated_by_name" label="Họ tên người cung cấp" required />
                    <Field name="updated_by_role" label="Vai trò/chức danh" required />
                    <Field name="updated_by_organization" label="Đơn vị công tác" required />
                    <Field name="facility_name" label="Cơ sở ghi nhận" required />
                    <Field name="facility_department" label="Khoa/phòng" />
                    <Field name="updated_by_phone" label="Số điện thoại" type="tel" />
                    <Field name="updated_by_email" label="Email" type="email" />
                  </div>
                  <label className="block text-sm font-medium text-slate-700">Loại nội dung
                    <select name="item_type" className="mt-1 w-full rounded-lg border-slate-300" value={itemKind} onChange={(event) => { setItemKind(event.target.value as typeof itemKind); setTargetAllergyId('') }}>
                      <option value="new_allergy">Thêm thuốc/dị nguyên mới</option>
                      <option value="modify_allergy">Đính chính dị nguyên đã có</option>
                      <option value="additional_note">Gửi ghi chú bổ sung</option>
                    </select>
                  </label>
                  {itemKind === 'modify_allergy' && <label className="block text-sm font-medium text-slate-700">Dị nguyên cần đính chính *
                    <select name="target_allergy_id" required className="mt-1 w-full rounded-lg border-slate-300" value={targetAllergyId} onChange={(event) => setTargetAllergyId(event.target.value)}>
                      <option value="">Chọn dị nguyên</option>
                      {card.allergies.map((item) => <option key={item.id} value={item.id}>{item.allergen_name}</option>)}
                    </select>
                  </label>}
                  {itemKind !== 'additional_note' && <div key={targetAllergyId || itemKind} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field name="allergen_name" label={itemKind === 'new_allergy' ? 'Tên thuốc/dị nguyên mới' : 'Tên sau đính chính'} required={itemKind === 'new_allergy'} defaultValue={selectedTarget?.allergen_name} />
                      <label className="block text-sm font-medium text-slate-700">Mức chắc chắn<select name="certainty_level" className="mt-1 w-full rounded-lg border-slate-300" defaultValue={selectedTarget?.certainty_level || 'suspected'}><option value="suspected">Nghi ngờ</option><option value="confirmed">Đã xác định</option></select></label>
                      <label className="block text-sm font-medium text-slate-700">Mức nghiêm trọng<select name="severity_level" className="mt-1 w-full rounded-lg border-slate-300" defaultValue={selectedTarget?.severity_level || ''}><option value="">Chưa xác định</option><option value="mild">Nhẹ</option><option value="moderate">Trung bình</option><option value="severe">Nghiêm trọng</option><option value="life_threatening">Đe dọa tính mạng</option></select></label>
                      <Field name="reaction_type" label="Loại phản ứng" defaultValue={selectedTarget?.reaction_type} />
                    </div>
                    <TextField name="clinical_manifestation" label="Biểu hiện lâm sàng" defaultValue={selectedTarget?.clinical_manifestation} />
                  </div>}
                  {itemKind === 'additional_note' && <TextField name="note" label="Nội dung ghi chú bổ sung" required />}
                  <TextField name="reason_for_update" label="Lý do đề nghị cập nhật" required />
                  <TextField name="submission_notes" label="Ghi chú chung" />
                  <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
                  <div className="cf-turnstile" data-sitekey={siteKey} data-action="allergy_card_update" data-callback="allergyTurnstileCallback" data-expired-callback="allergyTurnstileExpired" />
                  <p className="text-xs text-slate-500">Thông tin liên hệ chỉ được đơn vị phát hành dùng để xác minh đề nghị; không hiển thị trên bản tra cứu công khai.</p>
                  <button disabled={submitting || !captchaToken} className="w-full rounded-lg bg-blue-800 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                    {submitting ? 'Đang gửi…' : 'Gửi để đơn vị phát hành xem xét'}
                  </button>
                </form>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  )
}

function Field({ name, label, required = false, type = 'text', defaultValue }: { name: string; label: string; required?: boolean; type?: string; defaultValue?: string }) {
  return <label className="block text-sm font-medium text-slate-700">{label}{required && ' *'}<input name={name} type={type} required={required} defaultValue={defaultValue || ''} className="mt-1 w-full rounded-lg border-slate-300" /></label>
}

function TextField({ name, label, required = false, defaultValue }: { name: string; label: string; required?: boolean; defaultValue?: string }) {
  return <label className="block text-sm font-medium text-slate-700">{label}{required && ' *'}<textarea name={name} required={required} defaultValue={defaultValue || ''} rows={3} className="mt-1 w-full rounded-lg border-slate-300" /></label>
}
