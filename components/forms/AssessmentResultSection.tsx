'use client'

import { useState } from 'react'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import SeverityAssessmentModal from './SeverityAssessmentModal'
import PreventabilityAssessmentModal from './PreventabilityAssessmentModal'
import { BeakerIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

interface AssessmentResultSectionProps {
  data: {
    severity_assessment_result?: string
    preventability_assessment_result?: string
  }
  updateData: (updates: { 
    severity_assessment_result?: string
    preventability_assessment_result?: string 
  }) => void
}

export default function AssessmentResultSection({ data, updateData }: AssessmentResultSectionProps) {
  const [showSeverityModal, setShowSeverityModal] = useState(false)
  const [showPreventabilityModal, setShowPreventabilityModal] = useState(false)

  const handleSaveSeverity = (result: string) => {
    updateData({ severity_assessment_result: result })
  }

  const handleSavePreventability = (result: string) => {
    updateData({ preventability_assessment_result: result })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Phần F. Đánh giá
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Đánh giá mức độ nặng và khả năng phòng tránh được của ADR
        </p>
        
        {/* Khuyến khích đánh giá */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-blue-800">
                💡 Khuyến khích thực hiện đánh giá
              </p>
              <p className="mt-1 text-sm text-blue-700">
                Việc đánh giá mức độ nặng và khả năng phòng tránh ADR giúp nâng cao chất lượng báo cáo, 
                hỗ trợ phân tích nguyên nhân và đưa ra biện pháp phòng ngừa hiệu quả. 
                Vui lòng sử dụng các nút bên dưới để thực hiện đánh giá theo tiêu chuẩn.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Severity Assessment */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            <span className="text-red-600">*</span> Kết quả đánh giá mức độ
            <span className="ml-2 text-xs font-normal text-blue-600">(Khuyến khích đánh giá)</span>
          </label>
          <Button
            onClick={() => setShowSeverityModal(true)}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            <BeakerIcon className="w-4 h-4 mr-2" />
            Đánh giá mức độ nặng
          </Button>
        </div>
        
        <Textarea
          value={data.severity_assessment_result || ''}
          onChange={(e) => updateData({ severity_assessment_result: e.target.value })}
          placeholder="⭐ Khuyến khích đánh giá: Kết quả đánh giá mức độ nặng của biến cố bất lợi sẽ hiển thị ở đây sau khi bạn nhấn nút 'Đánh giá mức độ nặng'..."
          rows={4}
          helperText="💡 Đánh giá mức độ giúp xác định mức độ nghiêm trọng của ADR theo 5 cấp độ chuẩn"
        />
      </div>

      {/* Preventability Assessment */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            <span className="text-red-600">*</span> Kết quả đánh giá phòng tránh ADR
            <span className="ml-2 text-xs font-normal text-green-600">(Khuyến khích đánh giá)</span>
          </label>
          <Button
            onClick={() => setShowPreventabilityModal(true)}
            size="sm"
            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            <ShieldCheckIcon className="w-4 h-4 mr-2" />
            Đánh giá phòng tránh ADR
          </Button>
        </div>
        
        <Textarea
          value={data.preventability_assessment_result || ''}
          onChange={(e) => updateData({ preventability_assessment_result: e.target.value })}
          placeholder="⭐ Khuyến khích đánh giá: Kết quả đánh giá khả năng phòng tránh được của ADR sẽ hiển thị ở đây sau khi bạn nhấn nút 'Đánh giá phòng tránh ADR'..."
          rows={6}
          helperText="💡 Đánh giá phòng tránh giúp xác định nguyên nhân và biện pháp phòng ngừa ADR theo phương pháp P của WHO"
        />
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <BeakerIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-900 mb-1">📝 Hướng dẫn đánh giá</h4>
            <div className="text-sm text-amber-800 space-y-2">
              <p>
                <strong>Bước 1:</strong> Nhấn nút "Đánh giá mức độ nặng" → Chọn 1 trong 5 mức độ phù hợp với tình trạng bệnh nhân.
              </p>
              <p>
                <strong>Bước 2:</strong> Nhấn nút "Đánh giá phòng tránh ADR" → Trả lời 20 câu hỏi theo phương pháp P của WHO.
              </p>
              <p className="text-xs italic">
                ⚠️ Lưu ý: Các đánh giá này rất quan trọng cho việc phân tích và phòng ngừa ADR trong tương lai.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SeverityAssessmentModal
        isOpen={showSeverityModal}
        onClose={() => setShowSeverityModal(false)}
        onSave={handleSaveSeverity}
        initialValue={data.severity_assessment_result}
      />

      <PreventabilityAssessmentModal
        isOpen={showPreventabilityModal}
        onClose={() => setShowPreventabilityModal(false)}
        onSave={handleSavePreventability}
        initialValue={data.preventability_assessment_result}
      />
    </div>
  )
}

