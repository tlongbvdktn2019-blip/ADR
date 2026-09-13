'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface SendEmailButtonProps {
  reportId: string
  reportCode: string
}

const REPORT_PDF_RECIPIENT = 'di.pvcenter@gmail.com'

export default function SendEmailButton({
  reportId,
  reportCode,
}: SendEmailButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (isSending) return

    setIsSending(true)

    try {
      const response = await fetch(`/api/reports/${reportId}/send-email`, {
        method: 'POST',
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error((data as any)?.error || 'Không thể gửi file PDF qua email')
      }

      const recipient = (data as any)?.recipient || REPORT_PDF_RECIPIENT
      setIsDialogOpen(false)
      toast.success(`Báo cáo ${reportCode} đã được gửi đến ${recipient}`, {
        duration: 5000,
      })

      if ((data as any)?.previewURL) {
        console.log('Email preview:', (data as any).previewURL)
      }
    } catch (error) {
      console.error('Report PDF email error:', error)
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra khi gửi email'
      toast.error(message)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsDialogOpen(true)}
        loading={isSending}
      >
        <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
        Gửi PDF
      </Button>

      <ConfirmDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleSend}
        title="Gửi báo cáo PDF"
        message={(
          <span>
            Tạo file PDF cho báo cáo <strong>{reportCode}</strong> và gửi đến{' '}
            <strong>{REPORT_PDF_RECIPIENT}</strong>?
          </span>
        )}
        confirmText="Tạo PDF và gửi"
        cancelText="Hủy"
        type="info"
        loading={isSending}
        closeOnConfirm={false}
      />
    </>
  )
}
