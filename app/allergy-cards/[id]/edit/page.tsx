'use client'

import Link from 'next/link'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, ExclamationTriangleIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { AllergyCard } from '@/types/allergy-card'

function apiMessage(payload: any, fallback: string) { return payload?.error?.message || payload?.message || fallback }

export default function EditAllergyCardPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [card, setCard] = useState<AllergyCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/allergy-cards/${params.id}`, { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(apiMessage(payload, 'Không thể tải thẻ'))
      setCard(payload.card)
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể tải thẻ') }
    finally { setLoading(false) }
  }, [params.id])
  useEffect(() => { void load() }, [load])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true); setError(''); setFieldErrors({})
    const data = new FormData(event.currentTarget)
    try {
      const response = await fetch(`/api/allergy-cards/${params.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id_number: data.get('patient_id_number'), department: data.get('department'),
          doctor_name: data.get('doctor_name'), doctor_phone: data.get('doctor_phone'),
          expiry_date: data.get('expiry_date'), notes: data.get('notes'), status: data.get('status'),
        }),
      })
      const payload = await response.json()
      if (!response.ok) { setFieldErrors(payload?.error?.field_errors || {}); throw new Error(apiMessage(payload, 'Không thể cập nhật thẻ')) }
      router.push(`/allergy-cards/${params.id}`); router.refresh()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể cập nhật thẻ') }
    finally { setSaving(false) }
  }

  if (loading) return <main className="min-h-screen bg-slate-50 grid place-items-center"><LoadingSpinner size="lg" /></main>
  if (!card) return <main className="min-h-screen bg-slate-50 grid place-items-center p-4"><Card className="max-w-md p-8 text-center"><ExclamationTriangleIcon className="mx-auto h-14 w-14 text-red-600" /><h1 className="mt-3 text-xl font-bold">Không thể chỉnh sửa</h1><p className="mt-2 text-slate-600">{error}</p><Link href="/allergy-cards"><Button className="mt-5">Về danh sách</Button></Link></Card></main>

  return <main className="min-h-screen bg-slate-50 py-6 sm:py-8"><div className="mx-auto max-w-3xl px-4 sm:px-6"><header className="mb-6 flex items-start gap-3"><Link href={`/allergy-cards/${card.id}`} className="rounded-lg p-2 text-slate-600 hover:bg-white"><ArrowLeftIcon className="h-5 w-5" /></Link><div><h1 className="text-2xl font-bold text-slate-900">Chỉnh sửa thẻ {card.card_code}</h1><p className="mt-1 text-slate-600">Chỉ thay đổi thông tin riêng của thẻ; dữ liệu nguồn từ báo cáo được khóa.</p></div></header>
    {card.source_changed && <div className="mb-5 flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><ExclamationTriangleIcon className="h-5 w-5 shrink-0" />Báo cáo nguồn đã thay đổi. Hãy đối chiếu trước khi lưu.</div>}
    {error && <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <form onSubmit={save} className="space-y-5"><Card className="p-5 sm:p-6" title="Dữ liệu từ báo cáo (chỉ đọc)"><div className="grid gap-4 text-sm sm:grid-cols-2"><Locked label="Bệnh nhân" value={`${card.patient_name} · ${card.patient_age} tuổi`} /><Locked label="Đơn vị báo cáo" value={card.hospital_name} /><Locked label="Mã báo cáo" value={card.report_code || '—'} /><Locked label="Dị nguyên" value={(card.allergies || []).map((item) => item.allergen_name).join(', ')} /></div></Card>
      <Card className="p-5 sm:p-6" title="Thông tin có thể chỉnh sửa"><div className="grid gap-4 sm:grid-cols-2"><Field name="patient_id_number" label="CCCD/Hộ chiếu" defaultValue={card.patient_id_number} /><Field name="department" label="Khoa/phòng" defaultValue={card.department} />{card.doctor_source === 'manual' ? <><Field name="doctor_name" label="Bác sĩ xác nhận" required defaultValue={card.doctor_name} error={fieldErrors.doctor_name} /><Field name="doctor_phone" label="Điện thoại bác sĩ" type="tel" defaultValue={card.doctor_phone} /></> : <Locked label="Bác sĩ xác nhận từ báo cáo" value={`${card.doctor_name}${card.doctor_phone ? ` · ${card.doctor_phone}` : ''}`} />}<Field name="expiry_date" label="Ngày hết hạn" type="date" defaultValue={card.expiry_date} error={fieldErrors.expiry_date} /><label className="block text-sm font-medium text-slate-700">Trạng thái<select name="status" defaultValue={card.status === 'inactive' ? 'inactive' : 'active'} className="mt-1 w-full rounded-lg border-slate-300"><option value="active">Đang hiệu lực</option><option value="inactive">Vô hiệu</option></select></label><label className="block text-sm font-medium text-slate-700 sm:col-span-2">Ghi chú nội bộ<textarea name="notes" defaultValue={card.notes || ''} rows={4} className="mt-1 w-full rounded-lg border-slate-300" /></label></div></Card>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link href={`/allergy-cards/${card.id}`}><Button type="button" variant="outline" fullWidth>Hủy</Button></Link><Button type="submit" loading={saving}>Lưu thay đổi</Button></div>
    </form></div></main>
}

function Locked({ label, value }: { label: string; value: string }) { return <div><p className="flex items-center gap-1 text-slate-500"><LockClosedIcon className="h-3.5 w-3.5" />{label}</p><p className="mt-1 font-medium text-slate-900">{value || '—'}</p></div> }
function Field({ name, label, type = 'text', required = false, defaultValue, error }: { name: string; label: string; type?: string; required?: boolean; defaultValue?: string; error?: string }) { return <label className="block text-sm font-medium text-slate-700">{label}{required && ' *'}<input name={name} type={type} required={required} defaultValue={defaultValue || ''} className={`mt-1 w-full rounded-lg ${error ? 'border-red-500' : 'border-slate-300'}`} />{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}</label> }
