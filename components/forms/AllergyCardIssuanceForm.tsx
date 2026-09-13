'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { EligibleReportDetail, EligibleReportSummary } from '@/types/allergy-card'

function messageFrom(payload: any, fallback: string) {
  return payload?.error?.message || payload?.message || fallback
}

function formatDate(value?: string) {
  return value ? new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`)) : '—'
}

function isDoctor(profession: string) {
  return profession.trim().toLocaleLowerCase('vi-VN') === 'bác sĩ'
}

export default function AllergyCardIssuanceForm({ initialReportId }: { initialReportId?: string }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [reports, setReports] = useState<EligibleReportSummary[]>([])
  const [selected, setSelected] = useState<EligibleReportDetail | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingReport, setLoadingReport] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [missingDrugs, setMissingDrugs] = useState<Record<string, string>>({})
  const [manualAllergies, setManualAllergies] = useState<string[]>([])

  const loadReports = useCallback(async (search = '') => {
    setLoadingList(true)
    try {
      const response = await fetch(`/api/allergy-cards/eligible-reports?limit=30&search=${encodeURIComponent(search)}`, { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(messageFrom(payload, 'Không thể tải danh sách bệnh nhân'))
      setReports(payload.reports || [])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể tải danh sách bệnh nhân')
    } finally {
      setLoadingList(false)
    }
  }, [])

  const selectReport = useCallback(async (id: string) => {
    setLoadingReport(true)
    setError('')
    setFieldErrors({})
    try {
      const response = await fetch(`/api/allergy-cards/eligible-reports/${id}`, { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(messageFrom(payload, 'Không thể tải báo cáo'))
      setSelected(payload.report)
      setMissingDrugs({})
      setManualAllergies(payload.report.suspected_drugs.length === 0 ? [''] : [])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể tải báo cáo')
    } finally {
      setLoadingReport(false)
    }
  }, [])

  useEffect(() => {
    if (initialReportId) void selectReport(initialReportId)
    void loadReports()
  }, [initialReportId, loadReports, selectReport])

  useEffect(() => {
    const timeout = setTimeout(() => void loadReports(query), 300)
    return () => clearTimeout(timeout)
  }, [query, loadReports])

  const previewAllergens = useMemo(() => {
    if (!selected) return []
    return [
      ...selected.suspected_drugs.map((drug) => drug.drug_name?.trim() || missingDrugs[drug.id]?.trim()).filter(Boolean),
      ...manualAllergies.map((name) => name.trim()).filter(Boolean),
    ] as string[]
  }, [selected, missingDrugs, manualAllergies])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    setSubmitting(true)
    setError('')
    setFieldErrors({})
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/allergy-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: selected.id,
          report_updated_at: selected.updated_at,
          supplements: {
            patient_id_number: form.get('patient_id_number'),
            department: form.get('department'),
            doctor_name: form.get('doctor_name'),
            doctor_phone: form.get('doctor_phone'),
            expiry_date: form.get('expiry_date'),
            notes: form.get('notes'),
            missing_drugs: selected.suspected_drugs
              .filter((drug) => !drug.drug_name?.trim())
              .map((drug) => ({ source_report_drug_id: drug.id, allergen_name: missingDrugs[drug.id] || '' })),
            manual_allergies: manualAllergies.map((allergen_name) => ({ allergen_name })),
          },
        }),
      })
      const payload = await response.json()
      if (!response.ok) {
        setFieldErrors(payload?.error?.field_errors || {})
        throw new Error(messageFrom(payload, 'Không thể cấp thẻ'))
      }
      router.push(`/allergy-cards/${payload.card.id}?created=1`)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể cấp thẻ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-start gap-3">
          <Link href="/allergy-cards" className="mt-1 rounded-lg p-2 text-slate-600 hover:bg-white" aria-label="Quay lại"><ArrowLeftIcon className="h-5 w-5" /></Link>
          <div><h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Cấp thẻ dị ứng mới</h1><p className="mt-1 text-slate-600">Chọn người bệnh đã được báo cáo tại đơn vị và hoàn thiện phần còn thiếu.</p></div>
        </div>

        {error && <div className="mb-5 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><ExclamationCircleIcon className="h-5 w-5 shrink-0" />{error}</div>}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <form onSubmit={submit} className="space-y-6">
            <Card className="p-5 sm:p-6" title="1. Chọn bệnh nhân từ báo cáo ADR" subtitle="Chỉ hiển thị báo cáo chưa được cấp thẻ trong phạm vi đơn vị của bạn.">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg border-slate-300 py-2.5 pl-10" placeholder="Tìm theo tên bệnh nhân hoặc mã báo cáo…" />
              </div>
              <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-slate-200">
                {loadingList ? <div className="grid place-items-center p-8"><LoadingSpinner /></div> : reports.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">Không có báo cáo phù hợp hoặc tất cả đã được cấp thẻ.</div>
                ) : reports.map((report) => (
                  <button key={report.id} type="button" onClick={() => void selectReport(report.id)} className={`flex w-full items-start justify-between gap-3 border-b p-3 text-left last:border-0 hover:bg-blue-50 ${selected?.id === report.id ? 'bg-blue-50 ring-1 ring-inset ring-blue-500' : ''}`}>
                    <span><span className="font-semibold text-slate-900">{report.patient_name}</span><span className="mt-0.5 block text-xs text-slate-500">{report.report_code} · {formatDate(report.report_date)} · {report.patient_age} tuổi</span><span className="mt-1 block text-xs text-slate-600">{report.suspected_drug_names.join(', ') || 'Chưa có tên thuốc'}</span></span>
                    {report.missing_fields.length > 0 ? <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">Cần bổ sung</span> : <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-600" />}
                  </button>
                ))}
              </div>
            </Card>

            {loadingReport && <Card className="grid place-items-center p-12"><LoadingSpinner /></Card>}
            {selected && !loadingReport && (
              <>
                <Card className="p-5 sm:p-6" title="2. Thông tin được lấy từ báo cáo" subtitle="Các trường dưới đây được khóa để đảm bảo thẻ là bản ghi nhất quán với báo cáo nguồn.">
                  <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    <Info label="Họ tên" value={selected.patient_name} />
                    <Info label="Tuổi / giới tính" value={`${selected.patient_age} tuổi · ${selected.patient_gender === 'male' ? 'Nam' : selected.patient_gender === 'female' ? 'Nữ' : 'Khác'}`} />
                    <Info label="Đơn vị báo cáo" value={selected.organization} />
                    <Info label="Mã báo cáo" value={selected.report_code} />
                    <Info label="Biểu hiện ADR" value={selected.adr_description} wide />
                    <Info label="Mức độ / quan hệ nhân quả" value={`${selected.severity_level} · ${selected.causality_assessment}`} wide />
                  </dl>
                  <div className="mt-4 rounded-lg bg-slate-100 p-3 text-xs text-slate-600">Nếu dữ liệu nguồn chưa đúng, hãy cập nhật báo cáo ADR trước rồi quay lại cấp thẻ.</div>
                </Card>

                <Card className="p-5 sm:p-6" title="3. Hoàn thiện thông tin còn thiếu">
                  <div className="space-y-5">
                    {!isDoctor(selected.reporter_profession) ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField name="doctor_name" label="Bác sĩ xác nhận chẩn đoán" required error={fieldErrors.doctor_name} />
                        <FormField name="doctor_phone" label="Điện thoại bác sĩ" type="tel" />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">Bác sĩ xác nhận: <strong>{selected.reporter_name}</strong>{selected.reporter_phone ? ` · ${selected.reporter_phone}` : ''}</div>
                    )}

                    {selected.suspected_drugs.filter((drug) => !drug.drug_name?.trim()).map((drug, index) => (
                      <FormField key={drug.id} name={`missing_drug_${drug.id}`} label={`Tên thuốc/dị nguyên còn thiếu #${index + 1}`} required value={missingDrugs[drug.id] || ''} onChange={(value) => setMissingDrugs((current) => ({ ...current, [drug.id]: value }))} error={fieldErrors[`missing_drug.${drug.id}`]} />
                    ))}

                    {manualAllergies.map((value, index) => (
                      <div key={index} className="flex items-end gap-2">
                        <div className="flex-1"><FormField name={`manual_allergy_${index}`} label={`Dị nguyên bổ sung #${index + 1}`} required={selected.suspected_drugs.length === 0} value={value} onChange={(next) => setManualAllergies((items) => items.map((item, itemIndex) => itemIndex === index ? next : item))} error={index === 0 ? fieldErrors.manual_allergies : undefined} /></div>
                        <button type="button" className="mb-0.5 rounded-lg p-2.5 text-red-600 hover:bg-red-50" onClick={() => setManualAllergies((items) => items.filter((_, itemIndex) => itemIndex !== index))} aria-label="Xóa dị nguyên"><TrashIcon className="h-5 w-5" /></button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => setManualAllergies((items) => [...items, ''])}><PlusIcon className="mr-2 h-4 w-4" />Thêm dị nguyên khác</Button>
                  </div>
                </Card>

                <details className="group rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-slate-900">Thông tin tùy chọn<ChevronDownIcon className="h-5 w-5 transition group-open:rotate-180" /></summary>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <FormField name="patient_id_number" label="Số CCCD/Hộ chiếu" />
                    <FormField name="department" label="Khoa/phòng cấp thẻ" />
                    {isDoctor(selected.reporter_profession) && !selected.reporter_phone && <FormField name="doctor_phone" label="Điện thoại bác sĩ" type="tel" />}
                    <FormField name="expiry_date" label="Ngày hết hạn" type="date" error={fieldErrors.expiry_date} />
                    <label className="sm:col-span-2 block text-sm font-medium text-slate-700">Ghi chú nội bộ<textarea name="notes" rows={3} className="mt-1 w-full rounded-lg border-slate-300" /></label>
                  </div>
                </details>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Link href="/allergy-cards"><Button type="button" variant="outline" fullWidth>Hủy</Button></Link>
                  <Button type="submit" loading={submitting} disabled={previewAllergens.length === 0}>Cấp thẻ và tạo mã QR</Button>
                </div>
              </>
            )}
          </form>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <Card className="p-5" title="Xem trước thẻ">
              {!selected ? <p className="py-10 text-center text-sm text-slate-500">Chọn một bệnh nhân để xem trước.</p> : (
                <div className="space-y-4">
                  <div className="rounded-xl bg-blue-900 p-4 text-white"><p className="text-xs text-blue-200">THẺ DỊ ỨNG</p><p className="mt-1 text-xl font-bold">{selected.patient_name}</p><p className="mt-1 text-xs text-blue-100">{selected.organization}</p></div>
                  <div><p className="text-xs font-semibold uppercase text-slate-500">Thuốc/dị nguyên</p>{previewAllergens.length ? <ul className="mt-2 space-y-2">{previewAllergens.map((name, index) => <li key={`${name}-${index}`} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-semibold text-red-900">{name}</li>)}</ul> : <p className="mt-2 text-sm text-amber-700">Cần bổ sung ít nhất một dị nguyên.</p>}</div>
                  <p className="text-xs text-slate-500">Mã thẻ và QR công khai sẽ được sinh tự động sau khi cấp.</p>
                </div>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </main>
  )
}

function Info({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div className={wide ? 'sm:col-span-2' : ''}><dt className="text-slate-500">{label}</dt><dd className="mt-1 font-medium text-slate-900">{value || '—'}</dd></div>
}

function FormField({ name, label, type = 'text', required = false, error, value, onChange }: { name: string; label: string; type?: string; required?: boolean; error?: string; value?: string; onChange?: (value: string) => void }) {
  return <label className="block text-sm font-medium text-slate-700">{label}{required && ' *'}<input name={name} type={type} required={required} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} className={`mt-1 w-full rounded-lg ${error ? 'border-red-500' : 'border-slate-300'}`} />{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}</label>
}
