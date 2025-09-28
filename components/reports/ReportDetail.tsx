'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { 
  ArrowLeftIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import SendEmailButton from './SendEmailButton'
import { 
  ADRReport, 
  SEVERITY_LABELS, 
  OUTCOME_LABELS, 
  CAUSALITY_LABELS,
  GENDER_LABELS,
  REPORT_TYPE_LABELS,
  DRUG_REACTION_LABELS
} from '@/types/report'

interface ReportDetailProps {
  report: ADRReport
}

export default function ReportDetail({ report }: ReportDetailProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('overview')
  const [exportingPDF, setExportingPDF] = useState(false)
  
  const canEdit = session?.user?.role === 'admin' || report.reporter_id === session?.user?.id
  const canSendEmail = session?.user?.role === 'admin' || report.reporter_id === session?.user?.id

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi })
    } catch {
      return dateString
    }
  }

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi })
    } catch {
      return dateString
    }
  }

  const getSeverityColor = (severity: typeof report.severity_level) => {
    switch (severity) {
      case 'death':
      case 'life_threatening':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'hospitalization':
      case 'permanent_disability':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'birth_defect':
        return 'text-purple-600 bg-purple-50 border-purple-200'
      default:
        return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const handleExportPDF = async (reportId: string) => {
    setExportingPDF(true)
    
    try {
      const response = await fetch(`/api/reports/${reportId}/export-pdf`, {
        method: 'GET'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Không thể xuất PDF')
      }

      // Get the PDF blob
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `ADR_Report_${report.report_code}.pdf`
      
      // Trigger download
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Xuất PDF thành công!')

    } catch (error) {
      console.error('PDF export error:', error)
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi xuất PDF')
    } finally {
      setExportingPDF(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: UserIcon },
    { id: 'patient', label: 'Bệnh nhân', icon: UserIcon },
    { id: 'adr', label: 'Thông tin ADR', icon: ExclamationTriangleIcon },
    { id: 'drugs', label: 'Thuốc nghi ngờ', icon: ExclamationTriangleIcon },
    { id: 'assessment', label: 'Thẩm định', icon: DocumentArrowDownIcon },
    { id: 'reporter', label: 'Người báo cáo', icon: EnvelopeIcon },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/reports">
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">{report.report_code}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(report.severity_level)}`}>
                {SEVERITY_LABELS[report.severity_level]}
              </span>
            </div>
            <p className="text-gray-600 mt-1">
              Báo cáo ADR cho bệnh nhân {report.patient_name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {canSendEmail && (
            <SendEmailButton 
              reportId={report.id}
              reportCode={report.report_code}
            />
          )}
          {canEdit && (
            <Link href={`/reports/${report.id}/edit`}>
              <Button variant="outline">
                <PencilIcon className="w-4 h-4 mr-2" />
                Chỉnh sửa
              </Button>
            </Link>
          )}
          <Button 
            onClick={() => handleExportPDF(report.id)}
            disabled={exportingPDF}
          >
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            {exportingPDF ? 'Đang xuất...' : 'Xuất PDF'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <OverviewTab 
            report={report} 
            formatDate={formatDate} 
            formatDateTime={formatDateTime}
            getSeverityColor={getSeverityColor}
          />
        )}
        
        {activeTab === 'patient' && (
          <PatientTab report={report} formatDate={formatDate} />
        )}
        
        {activeTab === 'adr' && (
          <ADRTab report={report} formatDate={formatDate} getSeverityColor={getSeverityColor} />
        )}
        
        {activeTab === 'drugs' && (
          <DrugsTab report={report} formatDate={formatDate} />
        )}
        
        {activeTab === 'assessment' && (
          <AssessmentTab report={report} />
        )}
        
        {activeTab === 'reporter' && (
          <ReporterTab report={report} formatDate={formatDate} />
        )}
      </div>
    </div>
  )
}

// Tab Components
function OverviewTab({ report, formatDate, formatDateTime, getSeverityColor }: { 
  report: ADRReport, 
  formatDate: (date: string) => string,
  formatDateTime: (date: string) => string,
  getSeverityColor: (severity: typeof report.severity_level) => string
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="Thông tin cơ bản">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Mã báo cáo</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">{report.report_code}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Loại báo cáo</dt>
              <dd className="mt-1 text-sm text-gray-900">{REPORT_TYPE_LABELS[report.report_type]}</dd>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Ngày tạo</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDateTime(report.created_at)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Ngày báo cáo</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(report.report_date)}</dd>
            </div>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Đơn vị</dt>
            <dd className="mt-1 text-sm text-gray-900">{report.organization}</dd>
          </div>
        </div>
      </Card>

      <Card title="Bệnh nhân">
        <div className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Họ và tên</dt>
            <dd className="mt-1 text-sm text-gray-900 font-semibold">{report.patient_name}</dd>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Tuổi</dt>
              <dd className="mt-1 text-sm text-gray-900">{report.patient_age} tuổi</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Giới tính</dt>
              <dd className="mt-1 text-sm text-gray-900">{GENDER_LABELS[report.patient_gender]}</dd>
            </div>
          </div>

          {report.patient_weight && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Cân nặng</dt>
              <dd className="mt-1 text-sm text-gray-900">{report.patient_weight} kg</dd>
            </div>
          )}
        </div>
      </Card>

      <Card title="Phản ứng có hại" className="lg:col-span-2">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Ngày xảy ra</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(report.adr_occurrence_date)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Mức độ nghiêm trọng</dt>
              <dd className="mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(report.severity_level)}`}>
                  {SEVERITY_LABELS[report.severity_level]}
                </span>
              </dd>
            </div>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Mô tả biểu hiện</dt>
            <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{report.adr_description}</dd>
          </div>

          {report.suspected_drugs && report.suspected_drugs.length > 0 && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Thuốc nghi ngờ ({report.suspected_drugs.length})</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {report.suspected_drugs.map(drug => drug.drug_name).join(', ')}
              </dd>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function PatientTab({ report, formatDate }: { report: ADRReport, formatDate: (date: string) => string }) {
  return (
    <Card title="Phần A. Thông tin bệnh nhân">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Họ và tên</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900">{report.patient_name}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500">Ngày sinh</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(report.patient_birth_date)}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500">Tuổi</dt>
            <dd className="mt-1 text-sm text-gray-900">{report.patient_age} tuổi</dd>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Giới tính</dt>
            <dd className="mt-1 text-sm text-gray-900">{GENDER_LABELS[report.patient_gender]}</dd>
          </div>
          
          {report.patient_weight && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Cân nặng</dt>
              <dd className="mt-1 text-sm text-gray-900">{report.patient_weight} kg</dd>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function ADRTab({ report, formatDate, getSeverityColor }: { 
  report: ADRReport, 
  formatDate: (date: string) => string,
  getSeverityColor: (severity: typeof report.severity_level) => string
}) {
  return (
    <div className="space-y-6">
      <Card title="Phần B. Thông tin phản ứng có hại (ADR)">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Ngày xuất hiện phản ứng</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(report.adr_occurrence_date)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phản ứng xuất hiện sau bao lâu</dt>
              <dd className="mt-1 text-sm text-gray-900">{report.reaction_onset_time || 'Không có thông tin'}</dd>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Mức độ nghiêm trọng</dt>
              <dd className="mt-1">
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getSeverityColor(report.severity_level)}`}>
                  {SEVERITY_LABELS[report.severity_level]}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Kết quả sau xử trí</dt>
              <dd className="mt-1 text-sm text-gray-900">{OUTCOME_LABELS[report.outcome_after_treatment]}</dd>
            </div>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Mô tả biểu hiện ADR</dt>
            <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
              {report.adr_description}
            </dd>
          </div>

          {report.related_tests && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Các xét nghiệm liên quan</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{report.related_tests}</dd>
            </div>
          )}

          {report.medical_history && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Tiền sử bệnh</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{report.medical_history}</dd>
            </div>
          )}

          {report.treatment_response && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Cách xử trí phản ứng</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{report.treatment_response}</dd>
            </div>
          )}

          <div>
            <dt className="text-sm font-medium text-gray-500">Kết quả sau xử trí</dt>
            <dd className="mt-1 text-sm text-gray-900">{OUTCOME_LABELS[report.outcome_after_treatment]}</dd>
          </div>
        </div>
      </Card>
    </div>
  )
}

function DrugsTab({ report, formatDate }: { report: ADRReport, formatDate: (date: string) => string }) {
  if (!report.suspected_drugs || report.suspected_drugs.length === 0) {
    return (
      <Card>
        <div className="text-center py-6">
          <p className="text-gray-500">Không có thuốc nghi ngờ nào được báo cáo.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Phần C. Thuốc nghi ngờ gây ADR ({report.suspected_drugs.length})
        </h2>
      </div>

      {report.suspected_drugs.map((drug, index) => (
        <Card key={drug.id} title={`Thuốc #${index + 1}`}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Tên thuốc (tên gốc)</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">{drug.drug_name}</dd>
              </div>
              {drug.commercial_name && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tên thương mại</dt>
                  <dd className="mt-1 text-sm text-gray-900">{drug.commercial_name}</dd>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {drug.dosage_form && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Dạng bào chế, hàm lượng</dt>
                  <dd className="mt-1 text-sm text-gray-900">{drug.dosage_form}</dd>
                </div>
              )}
              {drug.manufacturer && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nhà sản xuất</dt>
                  <dd className="mt-1 text-sm text-gray-900">{drug.manufacturer}</dd>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {drug.start_date && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ngày bắt đầu</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(drug.start_date)}</dd>
                </div>
              )}
              {drug.end_date && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ngày kết thúc</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(drug.end_date)}</dd>
                </div>
              )}
            </div>

            {drug.indication && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Lý do dùng thuốc</dt>
                <dd className="mt-1 text-sm text-gray-900">{drug.indication}</dd>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Sau khi ngừng/giảm liều, phản ứng có cải thiện không?</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {DRUG_REACTION_LABELS[drug.reaction_improved_after_stopping]}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Tái sử dụng thuốc có xuất hiện lại phản ứng không?</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {DRUG_REACTION_LABELS[drug.reaction_reoccurred_after_rechallenge]}
                </dd>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function AssessmentTab({ report }: { report: ADRReport }) {
  return (
    <Card title="Phần D. Thẩm định ADR của đơn vị">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <dt className="text-sm font-medium text-gray-500">Đánh giá mối liên quan thuốc và ADR</dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900">
              {CAUSALITY_LABELS[report.causality_assessment]}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Thang đánh giá</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {report.assessment_scale === 'who' ? 'Thang WHO-UMC' : 'Thang Naranjo'}
            </dd>
          </div>
        </div>

        {report.medical_staff_comment && (
          <div>
            <dt className="text-sm font-medium text-gray-500">Bình luận của cán bộ y tế</dt>
            <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
              {report.medical_staff_comment}
            </dd>
          </div>
        )}
      </div>
    </Card>
  )
}

function ReporterTab({ report, formatDate }: { report: ADRReport, formatDate: (date: string) => string }) {
  return (
    <Card title="Phần E. Thông tin người báo cáo">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <dt className="text-sm font-medium text-gray-500">Họ và tên</dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900">{report.reporter_name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Nghề nghiệp</dt>
            <dd className="mt-1 text-sm text-gray-900">{report.reporter_profession}</dd>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {report.reporter_phone && (
            <div className="flex items-center">
              <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
              <div>
                <dt className="text-sm font-medium text-gray-500">Điện thoại</dt>
                <dd className="text-sm text-gray-900">{report.reporter_phone}</dd>
              </div>
            </div>
          )}
          {report.reporter_email && (
            <div className="flex items-center">
              <EnvelopeIcon className="w-4 h-4 text-gray-400 mr-2" />
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm text-gray-900">{report.reporter_email}</dd>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <dt className="text-sm font-medium text-gray-500">Loại báo cáo</dt>
            <dd className="mt-1 text-sm text-gray-900">{REPORT_TYPE_LABELS[report.report_type]}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Ngày báo cáo</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(report.report_date)}</dd>
          </div>
        </div>

        <div className="flex items-center">
          <BuildingOfficeIcon className="w-4 h-4 text-gray-400 mr-2" />
          <div>
            <dt className="text-sm font-medium text-gray-500">Đơn vị</dt>
            <dd className="text-sm text-gray-900">{report.organization}</dd>
          </div>
        </div>
      </div>
    </Card>
  )
}
