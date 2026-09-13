'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeftIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function AddAllergyCardInformationPage({ params }: { params: { id: string } }) {
  const [publicUrl, setPublicUrl] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    fetch(`/api/allergy-cards/${params.id}`, { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload?.error?.message || 'Không thể tải thẻ')
        setPublicUrl(payload.card.public_url || '')
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Không thể tải thẻ'))
  }, [params.id])

  return <main className="min-h-screen bg-slate-50 grid place-items-center p-4"><Card className="w-full max-w-lg p-8 text-center"><InformationCircleIcon className="mx-auto h-12 w-12 text-blue-700" /><h1 className="mt-4 text-xl font-bold">Gửi đề nghị bổ sung qua trang công khai</h1><p className="mt-2 text-sm text-slate-600">Quy trình mới yêu cầu xác minh chống spam và đưa từng nội dung vào hàng chờ duyệt.</p>{error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="mt-6 flex justify-center gap-2"><Link href={`/allergy-cards/${params.id}`}><Button variant="outline"><ArrowLeftIcon className="mr-2 h-4 w-4" />Về chi tiết</Button></Link>{publicUrl ? <a href={publicUrl}><Button>Mở biểu mẫu công khai</Button></a> : !error ? <LoadingSpinner /> : null}</div></Card></main>
}
