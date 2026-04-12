'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ExclamationTriangleIcon, QrCodeIcon } from '@heroicons/react/24/outline'

export default function LegacyAllergyCardPage() {
  const params = useParams()
  const cardCode = String(params.code || '')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-yellow-700" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Liên kết QR cũ đã bị vô hiệu hóa
          </h1>

          <p className="text-gray-600 mb-4">
            Định dạng tra cứu công khai theo mã thẻ không còn được hỗ trợ để tránh lộ thông tin y tế.
          </p>

          {cardCode && (
            <div className="mb-6 inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700">
              Mã cũ: <span className="ml-2 font-mono font-semibold">{cardCode}</span>
            </div>
          )}

          <div className="text-left bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <QrCodeIcon className="w-6 h-6 text-blue-700 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 space-y-2">
                <p>Thẻ cần được cấp lại QR mới theo định danh an toàn hơn.</p>
                <p>Vui lòng liên hệ cơ sở y tế đã phát hành thẻ để cập nhật mã QR.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Link href="/allergy-cards/scan">
              <Button variant="outline">Mở trang quét QR</Button>
            </Link>
            <Link href="/">
              <Button>Về trang chủ</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
