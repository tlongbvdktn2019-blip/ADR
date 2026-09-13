'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  PrinterIcon,
  QrCodeIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { AllergyCard, AllergyCardListResponse } from '@/types/allergy-card'

type Stats = { total: number; active: number; expired: number; expiring_soon: number; pending_updates: number }

function apiMessage(payload: any, fallback: string) { return payload?.error?.message || payload?.message || fallback }
function date(value?: string) { return value ? new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`)) : '—' }

export default function AllergyCardsPage() {
  const [cards, setCards] = useState<AllergyCard[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [severity, setSeverity] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<AllergyCardListResponse['pagination'] | null>(null)
  const [deleting, setDeleting] = useState<AllergyCard | null>(null)
  const [deleteCode, setDeleteCode] = useState('')
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' })
      if (query.trim()) params.set('search', query.trim())
      if (status) params.set('status', status)
      if (severity) params.set('severity_level', severity)
      const [cardsResponse, statsResponse] = await Promise.all([
        fetch(`/api/allergy-cards?${params}`, { cache: 'no-store' }),
        fetch('/api/allergy-cards/stats', { cache: 'no-store' }),
      ])
      const cardPayload = await cardsResponse.json()
      if (!cardsResponse.ok) throw new Error(apiMessage(cardPayload, 'Không thể tải danh sách thẻ'))
      setCards(cardPayload.cards || [])
      setPagination(cardPayload.pagination)
      if (statsResponse.ok) setStats(await statsResponse.json())
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Không thể tải danh sách thẻ')
    } finally { setLoading(false) }
  }, [page, query, severity, status])

  useEffect(() => { const timeout = setTimeout(() => void load(), 250); return () => clearTimeout(timeout) }, [load])

  async function confirmDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      const response = await fetch(`/api/allergy-cards/${deleting.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_code: deleteCode, reason: deleteReason }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(apiMessage(payload, 'Không thể xóa thẻ'))
      toast.success('Đã xóa thẻ. Báo cáo nguồn có thể được cấp lại thẻ mới.')
      setDeleting(null); setDeleteCode(''); setDeleteReason('')
      await load()
    } catch (caught) { toast.error(caught instanceof Error ? caught.message : 'Không thể xóa thẻ') }
    finally { setDeleteBusy(false) }
  }

  return (
    <main className="min-h-screen bg-slate-50 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><ClipboardDocumentListIcon className="mt-1 h-8 w-8 text-blue-700" /><div><h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Quản lý thẻ dị ứng</h1><p className="mt-1 text-slate-600">Cấp, tra cứu, in và xử lý đề nghị cập nhật trong đơn vị.</p></div></div>
          <div className="flex flex-wrap gap-2"><Link href="/dashboard"><Button variant="outline"><ArrowLeftIcon className="mr-2 h-4 w-4" />Bảng điều khiển</Button></Link><Link href="/allergy-cards/scan"><Button variant="outline"><QrCodeIcon className="mr-2 h-4 w-4" />Quét QR</Button></Link><Link href="/allergy-cards/new"><Button><PlusIcon className="mr-2 h-4 w-4" />Cấp thẻ mới</Button></Link></div>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="Thống kê">
          {[
            ['Tổng số thẻ', stats?.total ?? '—', 'text-slate-900'], ['Đang hiệu lực', stats?.active ?? '—', 'text-emerald-700'],
            ['Đã hết hạn', stats?.expired ?? '—', 'text-red-700'], ['Sắp hết hạn', stats?.expiring_soon ?? '—', 'text-amber-700'],
            ['Đề nghị chờ duyệt', stats?.pending_updates ?? '—', 'text-blue-700'],
          ].map(([label, value, color]) => <Card key={label as string} className="p-4"><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p></Card>)}
        </section>

        <Card className="mb-6 p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_190px_210px_auto]">
            <label className="relative"><span className="sr-only">Tìm kiếm</span><MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} className="w-full rounded-lg border-slate-300 py-2 pl-10" placeholder="Tên bệnh nhân, mã thẻ, mã báo cáo, dị nguyên…" /></label>
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className="rounded-lg border-slate-300"><option value="">Mọi trạng thái</option><option value="active">Đang hiệu lực</option><option value="inactive">Đã vô hiệu</option><option value="expired">Đã hết hạn</option></select>
            <select value={severity} onChange={(event) => { setSeverity(event.target.value); setPage(1) }} className="rounded-lg border-slate-300"><option value="">Mọi mức độ</option><option value="mild">Nhẹ</option><option value="moderate">Trung bình</option><option value="severe">Nghiêm trọng</option><option value="life_threatening">Đe dọa tính mạng</option></select>
            <Button variant="outline" onClick={() => void load()} aria-label="Tải lại"><ArrowPathIcon className="h-5 w-5" /></Button>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          {loading ? <div className="grid place-items-center py-20"><LoadingSpinner size="lg" /></div> : cards.length === 0 ? (
            <div className="py-16 text-center"><ClipboardDocumentListIcon className="mx-auto h-14 w-14 text-slate-300" /><h2 className="mt-3 font-semibold text-slate-900">Chưa có thẻ phù hợp</h2><p className="mt-1 text-sm text-slate-500">Hãy thay đổi bộ lọc hoặc cấp thẻ từ một báo cáo ADR.</p><Link href="/allergy-cards/new"><Button className="mt-4">Cấp thẻ mới</Button></Link></div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-sm"><thead className="bg-slate-100 text-left text-xs uppercase text-slate-600"><tr><th className="px-4 py-3">Mã thẻ / báo cáo</th><th className="px-4 py-3">Bệnh nhân</th><th className="px-4 py-3">Dị nguyên</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Ngày cấp</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{cards.map((card) => (
              <tr key={card.id} className="hover:bg-slate-50"><td className="px-4 py-4"><Link href={`/allergy-cards/${card.id}`} className="font-mono font-semibold text-blue-700 hover:underline">{card.card_code}</Link><p className="mt-1 text-xs text-slate-500">{card.report_code || 'Không có mã báo cáo'}</p>{card.source_changed && <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Báo cáo nguồn đã đổi</span>}{Boolean(card.pending_updates_count) && <span className="ml-1 mt-1 inline-block rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">{card.pending_updates_count} đề nghị chờ duyệt</span>}</td><td className="px-4 py-4"><strong>{card.patient_name}</strong><p className="text-xs text-slate-500">{card.patient_age} tuổi · {card.organization}</p></td><td className="max-w-xs px-4 py-4"><div className="flex flex-wrap gap-1">{(card.allergies || []).slice(0, 3).map((item) => <span key={item.id} className="rounded-full bg-red-50 px-2 py-1 text-xs text-red-800">{item.allergen_name}</span>)}{(card.allergies?.length || 0) > 3 && <span className="text-xs text-slate-500">+{(card.allergies?.length || 0) - 3}</span>}</div></td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${card.status === 'active' ? 'bg-emerald-100 text-emerald-800' : card.status === 'expired' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'}`}>{card.status === 'active' ? 'Đang hiệu lực' : card.status === 'expired' ? 'Hết hạn' : 'Vô hiệu'}</span></td><td className="px-4 py-4">{date(card.issued_date)}</td><td className="px-4 py-4"><div className="flex justify-end gap-1"><Link href={`/allergy-cards/${card.id}`}><button className="rounded p-2 text-blue-700 hover:bg-blue-50" aria-label="Xem"><EyeIcon className="h-5 w-5" /></button></Link><Link href={`/allergy-cards/${card.id}/edit`}><button className="rounded p-2 text-slate-700 hover:bg-slate-100" aria-label="Sửa"><PencilIcon className="h-5 w-5" /></button></Link><button onClick={() => window.open(`/api/allergy-cards/${card.id}/print-view`, '_blank')} className="rounded p-2 text-slate-700 hover:bg-slate-100" aria-label="In"><PrinterIcon className="h-5 w-5" /></button><a href={`/api/allergy-cards/${card.id}/qr`} download={`QR-${card.card_code}.png`} className="rounded p-2 text-slate-700 hover:bg-slate-100" aria-label="Tải QR"><QrCodeIcon className="h-5 w-5" /></a><button onClick={() => { setDeleting(card); setDeleteCode(''); setDeleteReason('') }} className="rounded p-2 text-red-700 hover:bg-red-50" aria-label="Xóa"><TrashIcon className="h-5 w-5" /></button></div></td></tr>
            ))}</tbody></table></div>
          )}
          {pagination && pagination.totalPages > 1 && <div className="flex items-center justify-between border-t px-4 py-3 text-sm"><span>Trang {pagination.page}/{pagination.totalPages} · {pagination.total} thẻ</span><div className="flex gap-2"><Button variant="outline" disabled={!pagination.hasPrev} onClick={() => setPage((value) => value - 1)}>Trước</Button><Button variant="outline" disabled={!pagination.hasNext} onClick={() => setPage((value) => value + 1)}>Sau</Button></div></div>}
        </Card>
      </div>

      {deleting && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-title"><div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"><h2 id="delete-title" className="text-lg font-bold text-red-800">Xóa vĩnh viễn thẻ {deleting.card_code}?</h2><p className="mt-2 text-sm text-slate-600">Thẻ và QR sẽ ngừng hoạt động. Nhật ký kiểm toán vẫn được giữ; báo cáo nguồn có thể được cấp lại.</p><label className="mt-4 block text-sm font-medium">Nhập chính xác mã thẻ<input value={deleteCode} onChange={(event) => setDeleteCode(event.target.value)} className="mt-1 w-full rounded-lg border-slate-300 font-mono" placeholder={deleting.card_code} /></label><label className="mt-4 block text-sm font-medium">Lý do xóa (ít nhất 5 ký tự)<textarea value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border-slate-300" /></label><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setDeleting(null)} disabled={deleteBusy}>Hủy</Button><Button variant="danger" loading={deleteBusy} disabled={deleteCode.trim().toUpperCase() !== deleting.card_code.toUpperCase() || deleteReason.trim().length < 5} onClick={() => void confirmDelete()}>Xóa vĩnh viễn</Button></div></div></div>}
    </main>
  )
}
