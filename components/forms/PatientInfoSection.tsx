'use client'

import { useEffect } from 'react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { ADRFormData } from '@/app/reports/new/page'

interface PatientInfoSectionProps {
  data: ADRFormData
  updateData: (updates: Partial<ADRFormData>) => void
}

export default function PatientInfoSection({ data, updateData }: PatientInfoSectionProps) {
  // Auto-calculate age from birth date
  useEffect(() => {
    if (data.patient_birth_date) {
      const birthDate = new Date(data.patient_birth_date)
      const today = new Date()
      let calculatedAge = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge = calculatedAge - 1
      }
      
      // Only update if calculated age is different from current age
      if (data.patient_age !== calculatedAge) {
        updateData({ patient_age: calculatedAge })
      }
    }
  }, [data.patient_birth_date])

  const genderOptions = [
    { value: 'male', label: 'Nam' },
    { value: 'female', label: 'Nữ' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Phần A. Thông tin bệnh nhân
        </h3>
        <p className="text-sm text-gray-600">
          Vui lòng điền đầy đủ thông tin về bệnh nhân gặp phản ứng có hại
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input
            label="Họ và tên bệnh nhân"
            value={data.patient_name}
            onChange={(e) => updateData({ patient_name: e.target.value })}
            placeholder="Nhập họ tên đầy đủ"
            required
          />
        </div>

        <Input
          label="Ngày sinh"
          type="date"
          value={data.patient_birth_date}
          onChange={(e) => updateData({ patient_birth_date: e.target.value })}
          required
        />

        <Input
          label="Tuổi"
          type="number"
          value={data.patient_age || ''}
          onChange={(e) => updateData({ patient_age: parseInt(e.target.value) || 0 })}
          min="0"
          max="150"
          helperText="Sẽ được tự động tính từ ngày sinh"
          readOnly
        />

        <Select
          label="Giới tính"
          value={data.patient_gender}
          onChange={(e) => updateData({ patient_gender: e.target.value as 'male' | 'female' })}
          options={genderOptions}
          required
        />

        <Input
          label="Cân nặng (kg)"
          type="number"
          value={data.patient_weight || ''}
          onChange={(e) => updateData({ patient_weight: parseFloat(e.target.value) || 0 })}
          min="0"
          max="500"
          step="0.1"
          placeholder="50.5"
        />
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Lưu ý:</strong> Thông tin bệnh nhân sẽ được bảo mật theo quy định. 
          Chỉ những thông tin cần thiết cho việc đánh giá ADR mới được thu thập.
        </p>
      </div>
    </div>
  )
}


