'use client'

import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { ADRFormData } from '@/app/reports/new/page'

interface ReporterInfoSectionProps {
  data: ADRFormData
  updateData: (updates: Partial<ADRFormData>) => void
}

export default function ReporterInfoSection({ data, updateData }: ReporterInfoSectionProps) {
  const reportTypeOptions = [
    { value: 'initial', label: 'Lần đầu' },
    { value: 'follow_up', label: 'Bổ sung' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Phần E. Thông tin người báo cáo
        </h3>
        <p className="text-sm text-gray-600">
          Thông tin liên hệ và chi tiết về người báo cáo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Họ và tên người báo cáo"
          value={data.reporter_name}
          onChange={(e) => updateData({ reporter_name: e.target.value })}
          placeholder="Họ tên đầy đủ"
          required
        />

        <Input
          label="Nghề nghiệp"
          value={data.reporter_profession}
          onChange={(e) => updateData({ reporter_profession: e.target.value })}
          placeholder="VD: Bác sĩ, Dược sĩ, Điều dưỡng"
          required
        />

        <Input
          label="Số điện thoại"
          value={data.reporter_phone}
          onChange={(e) => updateData({ reporter_phone: e.target.value })}
          placeholder="0123456789"
          type="tel"
        />

        <Input
          label="Email"
          value={data.reporter_email}
          onChange={(e) => updateData({ reporter_email: e.target.value })}
          placeholder="example@hospital.gov.vn"
          type="email"
        />

        <Select
          label="Dạng báo cáo"
          value={data.report_type}
          onChange={(e) => updateData({ report_type: e.target.value as 'initial' | 'follow_up' })}
          options={reportTypeOptions}
          required
          helperText="Chọn 'Lần đầu' nếu đây là báo cáo đầu tiên về trường hợp này"
        />

        <Input
          label="Ngày báo cáo"
          type="date"
          value={data.report_date}
          onChange={(e) => updateData({ report_date: e.target.value })}
          required
          helperText="Mặc định là ngày hiện tại"
        />
      </div>

      {/* Summary Card */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-4">Tóm tắt báo cáo</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Bệnh nhân:</strong> {data.patient_name || 'Chưa nhập'}</p>
            <p><strong>Tuổi/Giới tính:</strong> {data.patient_age || 'N/A'} tuổi, {data.patient_gender === 'male' ? 'Nam' : 'Nữ'}</p>
            <p><strong>Ngày xảy ra ADR:</strong> {data.adr_occurrence_date || 'Chưa nhập'}</p>
          </div>
          <div>
            <p><strong>Số thuốc nghi ngờ:</strong> {data.suspected_drugs?.length || 0}</p>
            <p><strong>Mức độ nghiêm trọng:</strong> {getSeverityLabel(data.severity_level)}</p>
            <p><strong>Đánh giá mối liên quan:</strong> {getCausalityLabel(data.causality_assessment)}</p>
          </div>
        </div>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-800">
              <strong>Sẵn sàng gửi báo cáo:</strong> Vui lòng kiểm tra lại toàn bộ thông tin trước khi gửi. 
              Sau khi gửi, báo cáo sẽ được lưu vào hệ thống và có thể được chỉnh sửa sau này.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper functions for display labels
function getSeverityLabel(severity: string) {
  const labels: { [key: string]: string } = {
    'death': 'Tử vong',
    'life_threatening': 'Đe dọa tính mạng',
    'hospitalization': 'Nhập viện',
    'birth_defect': 'Dị tật thai nhi',
    'permanent_disability': 'Tàn tật vĩnh viễn',
    'not_serious': 'Không nghiêm trọng',
  }
  return labels[severity] || severity
}

function getCausalityLabel(causality: string) {
  const labels: { [key: string]: string } = {
    'certain': 'Chắc chắn',
    'probable': 'Có khả năng',
    'possible': 'Có thể',
    'unlikely': 'Không chắc chắn',
    'unclassified': 'Chưa phân loại',
    'unclassifiable': 'Không thể phân loại',
  }
  return labels[causality] || causality
}


