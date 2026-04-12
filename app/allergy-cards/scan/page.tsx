'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  QrCodeIcon,
  ArrowLeftIcon,
  DocumentIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import QRScanner from '@/components/ui/QRScanner'

export default function QRScannerPage() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [scannedUrl, setScannedUrl] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(false)

  const redirectToLegacyNotice = (cardCode: string) => {
    toast.dismiss()
    toast.error('QR công khai theo mã thẻ cũ đã bị vô hiệu hóa. Vui lòng dùng QR mới hoặc yêu cầu cấp lại.')
    setTimeout(() => {
      router.push(`/allergy-cards/public/${cardCode}`)
      setIsProcessing(false)
    }, 800)
  }

  const redirectToPublicView = (cardId: string) => {
    toast.dismiss()
    toast.success('Đã quét thẻ dị ứng. Đang chuyển hướng...')
    setTimeout(() => {
      router.push(`/allergy-cards/view/${cardId}`)
      setIsProcessing(false)
    }, 500)
  }

  const handleManualInput = async (qrContent: string) => {
    setIsProcessing(true)

    try {
      const trimmedContent = qrContent.trim()

      if (/^AC-\d{4}-\d{6}$/.test(trimmedContent)) {
        redirectToLegacyNotice(trimmedContent)
        return
      }

      if (trimmedContent.includes('/allergy-cards/public/')) {
        const legacyMatch = trimmedContent.match(/\/allergy-cards\/public\/(AC-\d{4}-\d{6})/)
        if (legacyMatch) {
          redirectToLegacyNotice(legacyMatch[1])
          return
        }
      }

      if (trimmedContent.includes('/allergy-cards/view/')) {
        const match = trimmedContent.match(/\/allergy-cards\/view\/([a-f0-9-]+)/i)
        if (match) {
          redirectToPublicView(match[1])
          return
        }
      }

      if (trimmedContent.includes('drive.google.com')) {
        setScannedUrl(trimmedContent)
        toast.success('Đã quét Google Drive. Đang mở file...')

        setTimeout(() => {
          window.open(trimmedContent, '_blank')
          setIsProcessing(false)
        }, 1000)
        return
      }

      try {
        const data = JSON.parse(trimmedContent)
        if (data.type === 'allergy_card') {
          if (data.id) {
            redirectToPublicView(String(data.id))
            return
          }

          if (data.code) {
            redirectToLegacyNotice(String(data.code))
            return
          }
        }
      } catch {
        // Ignore invalid JSON.
      }

      toast.error('Mã QR không hợp lệ. Vui lòng quét đúng mã QR của thẻ dị ứng.')
      setIsProcessing(false)
    } catch (error) {
      console.error('Error processing QR:', error)
      toast.error('Có lỗi xảy ra khi xử lý mã QR')
      setIsProcessing(false)
    }
  }

  const handleCameraScan = (data: string) => {
    setShowScanner(false)
    handleManualInput(data)
  }

  const handleScanError = (error: string) => {
    console.error('Scanner error:', error)
    toast.error(error)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Quay lại
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <QrCodeIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Quét mã QR thẻ dị ứng
            </h1>
          </div>
          <p className="text-gray-600">
            Quét QR mới để mở bản xem công khai an toàn hoặc mở file Google Drive liên quan.
          </p>
        </div>

        <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <DocumentIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Cách sử dụng
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• QR mới sẽ mở đường dẫn dạng `/allergy-cards/view/&lt;uuid&gt;`.</li>
                <li>• QR cũ hoặc mã thẻ `AC-YYYY-XXXXXX` sẽ hiện thông báo yêu cầu cấp lại.</li>
                <li>• Bạn cũng có thể dán trực tiếp link quét được vào ô bên dưới.</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Quét mã QR bằng camera</h2>
            {!showScanner && (
              <Button
                onClick={() => setShowScanner(true)}
                className="flex items-center gap-2"
              >
                <QrCodeIcon className="w-5 h-5" />
                Bật camera
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {showScanner ? (
              <QRScanner onScan={handleCameraScan} onError={handleScanError} />
            ) : (
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <QrCodeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Nhấn "Bật camera" để bắt đầu quét QR
                </p>
                <p className="text-sm text-gray-500">
                  Hệ thống ưu tiên QR mới theo đường dẫn xem công khai an toàn.
                </p>
              </div>
            )}

            <div className="text-center text-gray-500 text-sm">hoặc</div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhập link hoặc nội dung từ QR
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Dán link QR hoặc nội dung quét được"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onPaste={(e) => {
                    const pastedText = e.clipboardData.getData('text')
                    if (pastedText) {
                      setTimeout(() => handleManualInput(pastedText), 100)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      handleManualInput(e.currentTarget.value)
                    }
                  }}
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>
        </Card>

        {scannedUrl && (
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="flex items-start gap-3">
              <DocumentIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2">
                  Đã quét thành công
                </h3>
                <p className="text-sm text-green-800 mb-3 break-all">
                  Link: {scannedUrl}
                </p>
                <Button
                  onClick={() => window.open(scannedUrl, '_blank')}
                  className="flex items-center gap-2"
                >
                  <DocumentIcon className="w-4 h-4" />
                  Mở file
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6 mt-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">
                Lưu ý quan trọng
              </h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• QR cũ theo mã thẻ đã bị vô hiệu hóa để tránh lộ thông tin y tế.</li>
                <li>• Nếu bạn vẫn đang dùng mã cũ, hãy liên hệ nơi cấp thẻ để cấp lại QR.</li>
                <li>• Đảm bảo có kết nối internet khi mở link công khai hoặc Google Drive.</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
