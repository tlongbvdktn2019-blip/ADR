'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ArrowLeftIcon, ExclamationTriangleIcon, QrCodeIcon } from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import QRScanner from '@/components/ui/QRScanner'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default function QRScannerPage() {
  const router = useRouter()
  const [showCamera, setShowCamera] = useState(false)
  const [manual, setManual] = useState('')

  function process(content: string) {
    const value = content.trim()
    if (/^AC-\d{4}-\d{6}$/.test(value) || value.includes('/allergy-cards/public/')) {
      toast.error('Đây là mã QR cũ. Vui lòng liên hệ đơn vị cấp thẻ để phát hành QR mới.')
      return
    }
    let token = uuid.test(value) ? value : ''
    try {
      const parsed = new URL(value)
      const match = parsed.pathname.match(/^\/allergy-cards\/view\/([0-9a-f-]+)\/?$/i)
      if (match && uuid.test(match[1])) token = match[1]
    } catch { /* Manual value may be a bare token. */ }
    if (!token) { toast.error('Mã QR không hợp lệ'); return }
    router.push(`/allergy-cards/view/${token}`)
  }

  return <main className="min-h-screen bg-slate-50 py-6 sm:py-8"><div className="mx-auto max-w-3xl px-4 sm:px-6"><header className="mb-6 flex items-start gap-3"><button onClick={() => router.back()} className="rounded-lg p-2 text-slate-600 hover:bg-white"><ArrowLeftIcon className="h-5 w-5" /></button><div><h1 className="text-2xl font-bold text-slate-900">Quét QR thẻ dị ứng</h1><p className="mt-1 text-slate-600">Mã QR chuẩn sẽ mở trực tiếp bản tra cứu công khai an toàn.</p></div></header>
    <Card className="p-5 sm:p-6"><div className="flex items-center justify-between"><h2 className="font-semibold">Camera</h2><Button onClick={() => setShowCamera((value) => !value)}><QrCodeIcon className="mr-2 h-5 w-5" />{showCamera ? 'Tắt camera' : 'Bật camera'}</Button></div>{showCamera ? <div className="mt-5"><QRScanner onScan={(value) => { setShowCamera(false); process(value) }} onError={(value) => toast.error(value)} /></div> : <div className="mt-5 grid place-items-center rounded-xl border-2 border-dashed border-slate-300 py-12 text-center"><QrCodeIcon className="h-14 w-14 text-slate-300" /><p className="mt-3 text-sm text-slate-500">Bật camera và đưa mã QR vào giữa khung hình.</p></div>}
      <div className="my-5 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />HOẶC<span className="h-px flex-1 bg-slate-200" /></div><form onSubmit={(event) => { event.preventDefault(); process(manual) }} className="flex flex-col gap-2 sm:flex-row"><input value={manual} onChange={(event) => setManual(event.target.value)} className="flex-1 rounded-lg border-slate-300" placeholder="Dán liên kết hoặc token từ QR" /><Button type="submit" disabled={!manual.trim()}>Mở thẻ</Button></form>
    </Card><div className="mt-5 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><ExclamationTriangleIcon className="h-5 w-5 shrink-0" /><p>Không nhập mã thẻ dạng AC-YYYY-XXXXXX để tra cứu công khai. Chỉ QR token mới bảo vệ thẻ khỏi bị dò tuần tự.</p></div></div></main>
}
