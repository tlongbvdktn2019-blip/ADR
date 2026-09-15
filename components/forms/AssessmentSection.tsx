'use client'

import { useState } from 'react'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import AssessmentGuideModal from './AssessmentGuideModal'
import AIConsultantPanel from './AIConsultantPanel'
import { ADRFormData } from '@/app/reports/new/page'
import { BookOpenIcon, SparklesIcon } from '@heroicons/react/24/outline'

interface AssessmentSectionProps {
  data: ADRFormData
  updateData: (updates: Partial<ADRFormData>) => void
  publicMode?: boolean
}

export default function AssessmentSection({ data, updateData, publicMode = false }: AssessmentSectionProps) {
  const [showConsultant, setShowConsultant] = useState(false)
  const [showGuideModal, setShowGuideModal] = useState(false)

  const causalityOptions = [
    { value: 'certain', label: 'Chắc chắn (Certain)' },
    { value: 'probable', label: 'Có khả năng (Probable)' },
    { value: 'possible', label: 'Có thể (Possible)' },
    { value: 'unlikely', label: 'Không chắc chắn (Unlikely)' },
    { value: 'unclassified', label: 'Chưa phân loại (Unclassified)' },
    { value: 'unclassifiable', label: 'Không thể phân loại (Unclassifiable)' },
  ]

  const scaleOptions = [
    { value: 'who', label: 'Thang WHO-UMC' },
    { value: 'naranjo', label: 'Thang Naranjo' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Phần D. Thẩm định ADR của đơn vị</h3>
          <p className="text-sm text-gray-600">Đánh giá mối liên quan giữa từng thuốc nghi ngờ và phản ứng có hại.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setShowGuideModal(true)} variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50">
            <BookOpenIcon className="mr-2 h-4 w-4" />
            Hướng dẫn đánh giá
          </Button>
          <Button onClick={() => setShowConsultant(true)} className="bg-gradient-to-r from-indigo-700 to-blue-600 text-white hover:from-indigo-800 hover:to-blue-700">
            <SparklesIcon className="mr-2 h-4 w-4" />
            Phân tích với AI Consultant
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Select
          label="Đánh giá mối liên quan thuốc và ADR"
          value={data.causality_assessment}
          onChange={(event) => updateData({ causality_assessment: event.target.value as ADRFormData['causality_assessment'] })}
          options={causalityOptions}
          required
          helperText="Kết luận tổng hợp do cán bộ y tế xác nhận"
        />
        <Select
          label="Đơn vị thẩm định theo thang nào"
          value={data.assessment_scale}
          onChange={(event) => updateData({ assessment_scale: event.target.value as ADRFormData['assessment_scale'] })}
          options={scaleOptions}
          required
          helperText="Chọn thang dùng cho kết luận tổng hợp"
        />
        <div className="md:col-span-2">
          <Textarea
            label="Bình luận của cán bộ y tế"
            value={data.medical_staff_comment}
            onChange={(event) => updateData({ medical_staff_comment: event.target.value })}
            placeholder="Nhận xét, đánh giá chi tiết về trường hợp ADR này..."
            rows={6}
            helperText="Nội dung AI chỉ được đưa vào đây sau khi người dùng xác nhận"
          />
        </div>
      </div>

      <div className="rounded-lg border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 p-4">
        <div className="flex items-start gap-3">
          <SparklesIcon className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
          <div>
            <h4 className="mb-1 font-medium text-indigo-950">AI Consultant với Gemini 2.5 Pro</h4>
            <p className="text-sm text-indigo-900">Phân tích riêng từng thuốc theo WHO-UMC và Naranjo, tìm nguồn tham khảo và chỉ áp dụng sau khi cán bộ y tế xác nhận. Thông tin định danh không được gửi tới Gemini.</p>
          </div>
        </div>
      </div>

      <AIConsultantPanel
        isOpen={showConsultant}
        onClose={() => setShowConsultant(false)}
        formData={data as unknown as Record<string, any>}
        publicMode={publicMode}
        onApply={(updates) => updateData(updates)}
      />
      <AssessmentGuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
    </div>
  )
}
