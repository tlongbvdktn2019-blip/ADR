'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import Card from '@/components/ui/Card'
import { 
  CalendarIcon, 
  UserIcon, 
  BuildingOfficeIcon, 
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { ADRReport, SEVERITY_LABELS, GENDER_LABELS } from '@/types/report'
import { useSession } from 'next-auth/react'

interface ReportCardProps {
  report: ADRReport
}

export default function ReportCard({ report }: ReportCardProps) {
  const { data: session } = useSession()
  const canEdit = session?.user?.role === 'admin' || report.reporter_id === session?.user?.id

  const getSeverityColor = (severity: typeof report.severity_level) => {
    switch (severity) {
      case 'death':
      case 'life_threatening':
        return 'text-red-600 bg-red-50'
      case 'hospitalization':
      case 'permanent_disability':
        return 'text-orange-600 bg-orange-50'
      case 'birth_defect':
        return 'text-purple-600 bg-purple-50'
      default:
        return 'text-green-600 bg-green-50'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: vi 
      })
    } catch {
      return dateString
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {report.report_code}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity_level)}`}>
                {SEVERITY_LABELS[report.severity_level]}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {formatDate(report.created_at)}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Link href={`/reports/${report.id}`}>
              <button className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-50">
                <EyeIcon className="w-4 h-4" />
              </button>
            </Link>
            {canEdit && (
              <Link href={`/reports/${report.id}/edit`}>
                <button className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-50">
                  <PencilIcon className="w-4 h-4" />
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Patient Info */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-700">
            <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium">BN:</span>
            <span className="ml-1">{report.patient_name}</span>
            <span className="ml-2">({report.patient_age} tuổi, {GENDER_LABELS[report.patient_gender]})</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-700">
            <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium">Ngày xảy ra ADR:</span>
            <span className="ml-1">
              {new Date(report.adr_occurrence_date).toLocaleDateString('vi-VN')}
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-700">
            <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium">Đơn vị:</span>
            <span className="ml-1">{report.organization}</span>
          </div>
        </div>

        {/* ADR Description Preview */}
        <div>
          <p className="text-sm text-gray-600 line-clamp-2">
            <span className="font-medium">Mô tả ADR:</span> {report.adr_description}
          </p>
        </div>

        {/* Suspected Drugs Count */}
        {report.suspected_drugs && report.suspected_drugs.length > 0 && (
          <div className="flex items-center text-sm text-gray-600">
            <ExclamationTriangleIcon className="w-4 h-4 mr-2 text-amber-500" />
            <span>
              {report.suspected_drugs.length} thuốc nghi ngờ: {' '}
              <span className="font-medium">
                {report.suspected_drugs.map(drug => drug.drug_name).join(', ')}
              </span>
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Người báo cáo: {report.reporter_name}</span>
          <span>{report.report_type === 'initial' ? 'Báo cáo lần đầu' : 'Báo cáo bổ sung'}</span>
        </div>
      </div>
    </Card>
  )
}


