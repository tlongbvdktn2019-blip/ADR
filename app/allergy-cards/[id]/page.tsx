'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  PrinterIcon,
  QrCodeIcon,
  ShareIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { AllergyCard } from '@/types/allergy-card'

type UpdateItem = {
  id: string; item_type: string; target_allergy_id?: string; allergen_name?: string;
  certainty_level?: string; clinical_manifestation?: string; severity_level?: string;
  reaction_type?: string; note?: string; review_status: string; review_note?: string; created_at: string
}
type Submission = {
  id: string; updated_by_name: string; updated_by_organization: string; updated_by_role: string;
  facility_name: string; reason_for_update: string; submission_notes?: string; review_status: string;
  created_at: string; items: UpdateItem[]
}

function message(payload: any, fallback: string) { return payload?.error?.message || payload?.message || fallback }
function date(value?: string) { return value ? new Intl.DateTimeFormat('vi-VN').format(new Date(value.length === 10 ? `${value}T00:00:00` : value)) : '—' }
const severity: Record<string, string> = { mild: 'Nhẹ', moderate: 'Trung bình', severe: 'Nghiêm trọng', life_threatening: 'Đe dọa tính mạng' }
const itemType: Record<string, string> = { new_allergy: 'Dị nguyên mới', modify_allergy: 'Đính chính dị nguyên', additional_note: 'Ghi chú bổ sung' }

export default function AllergyCardDetailPage({ params }: { params: { id: string } }) {
  const [card, setCard] = useState<AllergyCard | null>(null)
  const [updates, setUpdates] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewing, setReviewing] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [cardResponse, updateResponse] = await Promise.all([
        fetch(`/api/allergy-cards/${params.id}`, { cache: 'no-store' }),
        fetch(`/api/allergy-cards/${params.id}/updates`, { cache: 'no-store' }),
      ])
      const cardPayload = await cardResponse.json()
      if (!cardResponse.ok) throw new Error(message(cardPayload, 'Không thể tải thẻ'))
      setCard(cardPayload.card)
      if (updateResponse.ok) setUpdates((await updateResponse.json()).updates || [])
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể tải thẻ') }
    finally { setLoading(false) }
  }, [params.id])

  useEffect(() => { void load() }, [load])

  async function share() {
    if (!card?.public_url) return
    try {
      if (navigator.share) await navigator.share({ title: `Thẻ dị ứng ${card.card_code}`, url: card.public_url })
      else { await navigator.clipboard.writeText(card.public_url); toast.success('Đã sao chép liên kết công khai') }
    } catch { /* User can cancel the native share sheet. */ }
  }

  async function rotateToken() {
    if (!confirm('QR cũ sẽ ngừng hoạt động ngay. Bạn có chắc muốn tạo liên kết công khai mới?')) return
    try {
      const response = await fetch(`/api/allergy-cards/${params.id}/rotate-public-token`, { method: 'POST' })
      const payload = await response.json()
      if (!response.ok) throw new Error(message(payload, 'Không thể đổi mã QR'))
      toast.success('Đã tạo QR mới; QR cũ không còn hiệu lực')
      await load()
    } catch (caught) { toast.error(caught instanceof Error ? caught.message : 'Không thể đổi mã QR') }
  }

  async function review(submissionId: string, item: UpdateItem, decision: 'approved' | 'rejected') {
    const note = decision === 'rejected' ? prompt('Nhập lý do từ chối (ít nhất 3 ký tự):') : prompt('Ghi chú duyệt (không bắt buộc):', '')
    if (note === null || (decision === 'rejected' && note.trim().length < 3)) return
    setReviewing(item.id)
    try {
      const matchingAllergy = decision === 'approved' && item.item_type === 'new_allergy'
        ? card?.allergies?.find((allergy) => allergy.allergen_name.trim().toLocaleLowerCase('vi-VN') === item.allergen_name?.trim().toLocaleLowerCase('vi-VN'))
        : undefined
      const response = await fetch(`/api/allergy-cards/${params.id}/updates/${submissionId}/items/${item.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, review_note: note, merge_target_allergy_id: matchingAllergy?.id }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(message(payload, 'Không thể duyệt nội dung'))
      toast.success(decision === 'approved' ? 'Đã duyệt và áp dụng vào thẻ' : 'Đã từ chối nội dung')
      await load()
    } catch (caught) { toast.error(caught instanceof Error ? caught.message : 'Không thể duyệt nội dung') }
    finally { setReviewing('') }
  }

  if (loading) return <main className="min-h-screen bg-slate-50 grid place-items-center"><LoadingSpinner size="lg" /></main>
  if (!card) return <main className="min-h-screen bg-slate-50 grid place-items-center p-4"><Card className="max-w-md p-8 text-center"><ExclamationTriangleIcon className="mx-auto h-14 w-14 text-red-600" /><h1 className="mt-3 text-xl font-bold">Không thể mở thẻ</h1><p className="mt-2 text-slate-600">{error}</p><Link href="/allergy-cards"><Button className="mt-5">Về danh sách</Button></Link></Card></main>

  return (
    <main className="min-h-screen bg-slate-50 py-6 sm:py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3"><Link href="/allergy-cards" className="rounded-lg p-2 text-slate-600 hover:bg-white"><ArrowLeftIcon className="h-5 w-5" /></Link><div><h1 className="text-2xl font-bold text-slate-900">Thẻ {card.card_code}</h1><p className="mt-1 text-slate-600">{card.patient_name} · {card.organization}</p></div></div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => window.open(`/api/allergy-cards/${card.id}/print-view`, '_blank')}><PrinterIcon className="mr-2 h-4 w-4" />In thẻ</Button><Button variant="outline" onClick={() => void share()}><ShareIcon className="mr-2 h-4 w-4" />Chia sẻ</Button><Link href={`/allergy-cards/${card.id}/edit`}><Button><PencilIcon className="mr-2 h-4 w-4" />Chỉnh sửa</Button></Link></div>
        </header>

        {card.source_changed && <div className="mb-5 flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900"><ExclamationTriangleIcon className="h-6 w-6 shrink-0" /><div><strong>Báo cáo nguồn đã được thay đổi sau khi cấp thẻ.</strong><p className="text-sm">Thẻ vẫn giữ nguyên bản chụp lúc cấp. Hãy đối chiếu báo cáo ADR trước khi quyết định chỉnh sửa.</p></div></div>}

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <Card className="p-5 text-center"><h2 className="font-semibold text-slate-900">Mã QR công khai</h2><img src={`/api/allergy-cards/${card.id}/qr`} alt={`QR ${card.card_code}`} className="mx-auto mt-4 h-52 w-52 rounded-lg border p-2" /><p className="mt-3 break-all text-xs text-slate-500">{card.public_url}</p><div className="mt-4 grid gap-2"><a href={`/api/allergy-cards/${card.id}/qr`} download={`QR-${card.card_code}.png`}><Button variant="outline" fullWidth><QrCodeIcon className="mr-2 h-4 w-4" />Tải QR</Button></a><Button variant="ghost" onClick={() => void rotateToken()}><ArrowPathIcon className="mr-2 h-4 w-4" />Đổi QR</Button></div></Card>
            <Card className="p-5"><h2 className="font-semibold">Thông tin phát hành</h2><dl className="mt-3 space-y-3 text-sm"><Info label="Trạng thái" value={card.status === 'active' ? 'Đang hiệu lực' : card.status === 'expired' ? 'Đã hết hạn' : 'Đã vô hiệu'} /><Info label="Ngày cấp" value={date(card.issued_date)} /><Info label="Ngày hết hạn" value={card.expiry_date ? date(card.expiry_date) : 'Không thời hạn'} /><Info label="Mã báo cáo" value={card.report_code || '—'} /></dl></Card>
          </aside>

          <div className="space-y-5">
            <Card className="p-5 sm:p-6" title="Thông tin bệnh nhân"><dl className="grid gap-4 text-sm sm:grid-cols-2"><Info label="Họ tên" value={card.patient_name} /><Info label="Tuổi / giới tính" value={`${card.patient_age} tuổi · ${card.patient_gender === 'male' ? 'Nam' : card.patient_gender === 'female' ? 'Nữ' : 'Khác'}`} /><Info label="CCCD/Hộ chiếu" value={card.patient_id_number || 'Chưa nhập'} /><Info label="Đơn vị" value={card.hospital_name} /><Info label="Khoa/phòng" value={card.department || 'Chưa nhập'} /><Info label="Bác sĩ xác nhận" value={`${card.doctor_name}${card.doctor_phone ? ` · ${card.doctor_phone}` : ''}`} /></dl></Card>
            <Card className="p-5 sm:p-6" title={`Danh sách dị ứng (${card.allergies?.length || 0})`}><div className="space-y-3">{(card.allergies || []).map((allergy) => <article key={allergy.id} className="rounded-xl border border-red-200 bg-red-50 p-4"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold text-red-950">{allergy.allergen_name}</h3><div className="flex gap-2"><span className="rounded-full bg-white px-2 py-1 text-xs text-red-800">{allergy.certainty_level === 'confirmed' ? 'Đã xác định' : 'Nghi ngờ'}</span>{allergy.severity_level && <span className="rounded-full bg-red-700 px-2 py-1 text-xs text-white">{severity[allergy.severity_level]}</span>}</div></div>{allergy.clinical_manifestation && <p className="mt-2 text-sm"><strong>Biểu hiện:</strong> {allergy.clinical_manifestation}</p>}</article>)}</div></Card>
            {card.notes && <Card className="p-5" title="Ghi chú nội bộ"><p className="whitespace-pre-wrap text-sm text-slate-700">{card.notes}</p></Card>}

            <Card className="p-5 sm:p-6" title={`Đề nghị cập nhật (${updates.length})`} subtitle="Duyệt từng nội dung. Chỉ nội dung được duyệt mới được áp dụng vào thẻ.">
              {updates.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">Chưa có đề nghị cập nhật.</p> : <div className="space-y-5">{updates.map((submission) => <article key={submission.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-semibold">{submission.updated_by_name} · {submission.updated_by_role}</h3><p className="text-xs text-slate-500">{submission.updated_by_organization} · {submission.facility_name} · {date(submission.created_at)}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs">{submission.review_status === 'pending' ? 'Chờ duyệt' : submission.review_status === 'approved' ? 'Đã duyệt' : submission.review_status === 'rejected' ? 'Đã từ chối' : 'Đã duyệt một phần'}</span></div><p className="mt-3 text-sm"><strong>Lý do:</strong> {submission.reason_for_update}</p><div className="mt-3 space-y-3">{submission.items.map((item) => <div key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm"><div className="flex flex-wrap items-start justify-between gap-2"><div><strong>{itemType[item.item_type] || item.item_type}</strong><p className="mt-1">{item.allergen_name || item.note || item.clinical_manifestation || 'Không có mô tả'}</p>{item.review_note && <p className="mt-1 text-xs text-slate-500">Ghi chú duyệt: {item.review_note}</p>}</div>{item.review_status === 'pending' ? <div className="flex gap-2"><Button size="sm" loading={reviewing === item.id} onClick={() => void review(submission.id, item, 'approved')}><CheckCircleIcon className="mr-1 h-4 w-4" />Duyệt</Button><Button size="sm" variant="danger" disabled={reviewing === item.id} onClick={() => void review(submission.id, item, 'rejected')}><XCircleIcon className="mr-1 h-4 w-4" />Từ chối</Button></div> : <span className={`rounded-full px-2 py-1 text-xs ${item.review_status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{item.review_status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}</span>}</div></div>)}</div></article>)}</div>}
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-slate-500">{label}</dt><dd className="mt-1 font-medium text-slate-900">{value}</dd></div> }
