'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import Button from '@/components/ui/Button'
import {
  EnvelopeIcon,
  BoltIcon,
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

interface SendEmailButtonProps {
  reportId: string
  reportCode: string
  defaultEmail?: string
}

export default function SendEmailButton({
  reportId,
  reportCode,
  defaultEmail = 'di.pvcenter@gmail.com'
}: SendEmailButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const handleAutomaticSend = async () => {
    if (isSending) return

    setIsMenuOpen(false)
    setIsSending(true)

    try {
      const response = await fetch(`/api/reports/${reportId}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: defaultEmail
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error((data as any)?.error || 'Không thể gửi email tự động')
      }

      const recipient = (data as any)?.recipient || defaultEmail

      toast.success(`Báo cáo ${reportCode} đã được gửi tự động đến ${recipient}!`, {
        duration: 5000
      })

      if ((data as any)?.previewURL) {
        console.log('Email preview:', (data as any).previewURL)
        toast.success(`🔍 Xem email tại: ${(data as any).previewURL}`, {
          duration: 10000
        })
      }
    } catch (error) {
      console.error('Automatic email send error:', error)
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra khi gửi email'
      toast.error(message)
    } finally {
      setIsSending(false)
    }
  }

  const handleGoToGmail = () => {
    window.open('https://mail.google.com', '_blank', 'noopener,noreferrer')
    setIsMenuOpen(false)
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsMenuOpen(prev => !prev)}
        loading={isSending}
      >
        <EnvelopeIcon className="w-4 h-4 mr-2" />
        Email
        <ChevronDownIcon className="w-4 h-4 ml-2" />
      </Button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg border border-gray-200 bg-white shadow-lg z-20">
          <div className="py-1">
            <button
              type="button"
              onClick={handleAutomaticSend}
              className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-start"
              disabled={isSending}
            >
              <BoltIcon className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Gửi tự động</div>
                <div className="text-xs text-gray-500">Gửi báo cáo {reportCode} đến {defaultEmail}</div>
              </div>
            </button>
            <button
              type="button"
              onClick={handleGoToGmail}
              className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-start"
            >
              <ArrowTopRightOnSquareIcon className="w-5 h-5 text-gray-600 mr-3 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Đi đến Gmail</div>
                <div className="text-xs text-gray-500">Mở gmail.com để gửi thủ công</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


