'use client'

import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import { ADRFormData } from '@/app/reports/new/page'

interface ADRInfoSectionProps {
  data: ADRFormData
  updateData: (updates: Partial<ADRFormData>) => void
}

export default function ADRInfoSection({ data, updateData }: ADRInfoSectionProps) {
  const severityOptions = [
    { value: 'death', label: 'Tử vong' },
    { value: 'life_threatening', label: 'Đe dọa tính mạng' },
    { value: 'hospitalization', label: 'Nhập viện/Kéo dài thời gian nằm viện' },
    { value: 'birth_defect', label: 'Dị tật thai nhi' },
    { value: 'permanent_disability', label: 'Tàn tật vĩnh viễn/Nặng nề' },
    { value: 'not_serious', label: 'Không nghiêm trọng' },
  ]

  const outcomeOptions = [
    { value: 'death_by_adr', label: 'Tử vong do ADR' },
    { value: 'death_unrelated', label: 'Tử vong không liên quan đến thuốc' },
    { value: 'not_recovered', label: 'Chưa hồi phục' },
    { value: 'recovering', label: 'Đang hồi phục' },
    { value: 'recovered_with_sequelae', label: 'Hồi phục có di chứng' },
    { value: 'recovered_without_sequelae', label: 'Hồi phục không có di chứng' },
    { value: 'unknown', label: 'Không rõ' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Phần B. Thông tin phản ứng có hại (ADR)
        </h3>
        <p className="text-sm text-gray-600">
          Mô tả chi tiết về phản ứng có hại và các thông tin liên quan
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Ngày xuất hiện phản ứng"
          type="date"
          value={data.adr_occurrence_date}
          onChange={(e) => updateData({ adr_occurrence_date: e.target.value })}
          required
        />

        <Input
          label="Phản ứng xuất hiện sau bao lâu"
          value={data.reaction_onset_time}
          onChange={(e) => updateData({ reaction_onset_time: e.target.value })}
          placeholder="Ví dụ: 30 phút, 2 giờ, 3 ngày..."
          helperText="Thời gian từ lúc sử dụng thuốc đến khi xuất hiện phản ứng"
        />

        <div className="md:col-span-2">
          <Textarea
            label="Mô tả biểu hiện ADR"
            value={data.adr_description}
            onChange={(e) => updateData({ adr_description: e.target.value })}
            placeholder="Mô tả chi tiết các biểu hiện, triệu chứng của phản ứng có hại..."
            rows={4}
            required
          />
        </div>

        <div className="md:col-span-2">
          <Textarea
            label="Các xét nghiệm liên quan"
            value={data.related_tests}
            onChange={(e) => updateData({ related_tests: e.target.value })}
            placeholder="Mô tả các xét nghiệm đã thực hiện và kết quả..."
            rows={3}
          />
        </div>

        <div className="md:col-span-2">
          <Textarea
            label="Tiền sử bệnh"
            value={data.medical_history}
            onChange={(e) => updateData({ medical_history: e.target.value })}
            placeholder="Tiền sử bệnh lý, dị ứng, sử dụng thuốc trước đây..."
            rows={3}
          />
        </div>

        <div className="md:col-span-2">
          <Textarea
            label="Cách xử trí phản ứng"
            value={data.treatment_response}
            onChange={(e) => updateData({ treatment_response: e.target.value })}
            placeholder="Các biện pháp xử trí đã áp dụng và kết quả..."
            rows={3}
          />
        </div>

        <Select
          label="Mức độ nghiêm trọng"
          value={data.severity_level}
          onChange={(e) => updateData({ severity_level: e.target.value as any })}
          options={severityOptions}
          required
        />

        <Select
          label="Kết quả sau xử trí"
          value={data.outcome_after_treatment}
          onChange={(e) => updateData({ outcome_after_treatment: e.target.value as any })}
          options={outcomeOptions}
          required
        />
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Quan trọng:</strong> Vui lòng mô tả càng chi tiết càng tốt về phản ứng có hại 
          để hỗ trợ quá trình đánh giá và phân tích nguyên nhân.
        </p>
      </div>
    </div>
  )
}


