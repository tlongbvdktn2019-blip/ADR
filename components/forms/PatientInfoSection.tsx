'use client'

import { useEffect, useState } from 'react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { ADRFormData } from '@/app/reports/new/page'

interface PatientInfoSectionProps {
  data: ADRFormData
  updateData: (updates: Partial<ADRFormData>) => void
}

interface Department {
  id: string
  name: string
  code: string
}

export default function PatientInfoSection({ data, updateData }: PatientInfoSectionProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(true)
  const [generatingCode, setGeneratingCode] = useState(false)

  // Load danh sách departments
  useEffect(() => {
    loadDepartments()
  }, [])

  // Auto-generate report code khi chọn department
  useEffect(() => {
    if (data.organization && !data.report_code) {
      generateReportCode()
    }
  }, [data.organization])

  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true)
      // Dùng API public để không cần authentication
      const response = await fetch('/api/public/departments')
      const result = await response.json()
      
      if (result.success) {
        setDepartments(result.data || [])
      }
    } catch (error) {
      console.error('Error loading departments:', error)
    } finally {
      setLoadingDepartments(false)
    }
  }

  const generateReportCode = async () => {
    try {
      setGeneratingCode(true)
      
      // Tìm department_id từ organization name
      const department = departments.find(d => d.name === data.organization)
      if (!department) return

      // Dùng API public để không cần authentication
      const response = await fetch('/api/public/generate-report-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department_id: department.id })
      })

      const result = await response.json()
      
      if (result.success) {
        updateData({ report_code: result.data.report_code })
      }
    } catch (error) {
      console.error('Error generating report code:', error)
    } finally {
      setGeneratingCode(false)
    }
  }

  const handleOrganizationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateData({ 
      organization: e.target.value,
      report_code: '' // Reset code để trigger auto-generate
    })
  }
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

  const departmentOptions = departments.map(dept => ({
    value: dept.name,
    label: dept.name
  }))

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

      {/* Thông tin báo cáo */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nơi báo cáo <span className="text-red-500">*</span>
            </label>
            <select
              value={data.organization}
              onChange={handleOrganizationChange}
              required
              disabled={loadingDepartments}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">-- Chọn nơi báo cáo --</option>
              {departmentOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Mã số báo cáo của đơn vị"
            value={data.report_code}
            readOnly
            placeholder={generatingCode ? "Đang tạo mã..." : "Tự động tạo"}
            helperText="Mã sẽ được tự động tạo khi chọn nơi báo cáo"
            className="bg-gray-50"
          />
        </div>
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


