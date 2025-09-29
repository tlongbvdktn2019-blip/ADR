'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { ADRReport, SEVERITY_LABELS } from '@/types/report'
import {
  EyeIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  UserIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline'

interface ReportTableProps {
  reports: ADRReport[]
  loading?: boolean
}

interface GroupedReports {
  [organization: string]: ADRReport[]
}

export default function ReportTable({ reports, loading = false }: ReportTableProps) {
  const { data: session } = useSession()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Group reports by organization
  const groupedReports: GroupedReports = reports.reduce((groups, report) => {
    const org = report.organization || 'Không xác định'
    if (!groups[org]) {
      groups[org] = []
    }
    groups[org].push(report)
    return groups
  }, {} as GroupedReports)

  // Sort organizations by report count (descending)
  const sortedOrganizations = Object.keys(groupedReports).sort((a, b) => 
    groupedReports[b].length - groupedReports[a].length
  )

  const toggleGroup = (organization: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(organization)) {
      newExpanded.delete(organization)
    } else {
      newExpanded.add(organization)
    }
    setExpandedGroups(newExpanded)
  }

  const expandAll = () => {
    setExpandedGroups(new Set(sortedOrganizations))
  }

  const collapseAll = () => {
    setExpandedGroups(new Set())
  }

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

  const getSeverityColor = (severity: typeof reports[0]['severity_level']) => {
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

  const canEdit = (report: ADRReport) => 
    session?.user?.role === 'admin' || report.reporter_id === session?.user?.id

  const handlePrintReport = (reportId: string) => {
    const printUrl = `/api/reports/${reportId}/print-view`
    window.open(printUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes')
  }

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  if (reports.length === 0) {
    return (
      <Card>
        <div className="p-12 text-center">
          <ShieldExclamationIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Không tìm thấy báo cáo nào
          </h3>
          <p className="text-sm text-gray-500">
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Control Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <BuildingOfficeIcon className="w-4 h-4" />
          <span>{sortedOrganizations.length} đơn vị</span>
          <span>•</span>
          <span>{reports.length} báo cáo</span>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Mở tất cả
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Thu gọn
          </Button>
        </div>
      </div>

      {/* Grouped Reports Table */}
      <Card>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã báo cáo
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bệnh nhân
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mức độ
                  </th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người báo cáo
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedOrganizations.map((organization) => (
                  <React.Fragment key={organization}>
                    {/* Organization Header */}
                    <tr 
                      className="bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors"
                      onClick={() => toggleGroup(organization)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap" colSpan={6}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {expandedGroups.has(organization) ? (
                                <ChevronDownIcon className="w-5 h-5 text-blue-600" />
                              ) : (
                                <ChevronRightIcon className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                            <div>
                              <span className="text-sm font-semibold text-blue-900">
                                {organization}
                              </span>
                              <span className="ml-2 text-xs text-blue-700">
                                ({groupedReports[organization].length} báo cáo)
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-blue-700">
                            Click để {expandedGroups.has(organization) ? 'thu gọn' : 'mở rộng'}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Organization Reports */}
                    {expandedGroups.has(organization) && 
                      groupedReports[organization].map((report, index) => (
                        <tr 
                          key={report.id} 
                          className="hover:bg-gray-50 transition-colors"
                          style={{
                            animationDelay: `${index * 50}ms`
                          }}
                        >
                          {/* Report Code */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-6"> {/* Indent for grouped items */}
                                <div className="text-sm font-medium text-gray-900">
                                  {report.report_code}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(report.report_date)}
                                </div>
                                {/* Show patient on mobile */}
                                <div className="md:hidden text-xs text-gray-600 mt-1">
                                  {report.patient_name}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Patient - Hidden on mobile */}
                          <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {report.patient_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {report.patient_age} tuổi • {report.patient_gender === 'male' ? 'Nam' : 'Nữ'}
                            </div>
                          </td>

                          {/* Severity */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(report.severity_level)}`}>
                              <span className="sm:hidden">
                                {report.severity_level === 'death' || report.severity_level === 'life_threatening' ? (
                                  '🔴'
                                ) : report.severity_level === 'hospitalization' || report.severity_level === 'permanent_disability' ? (
                                  '🟠'
                                ) : (
                                  '🟢'
                                )}
                              </span>
                              <span className="hidden sm:block">
                                {SEVERITY_LABELS[report.severity_level]}
                              </span>
                            </span>
                          </td>

                          {/* Reporter - Hidden on small screens */}
                          <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-600">
                              <UserIcon className="w-4 h-4 mr-1" />
                              <div>
                                <div className="text-sm text-gray-900">{report.reporter_name}</div>
                                <div className="text-xs text-gray-500">{report.reporter_profession}</div>
                              </div>
                            </div>
                          </td>

                          {/* Created Date - Hidden on mobile */}
                          <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-500">
                              <CalendarDaysIcon className="w-4 h-4 mr-1" />
                              <div>
                                <div>{formatDate(report.created_at)}</div>
                                <div className="text-xs">
                                  {formatDateTime(report.created_at).split(' ')[1]}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              {/* View */}
                              <Link href={`/reports/${report.id}`}>
                                <Button variant="outline" size="sm">
                                  <EyeIcon className="w-4 h-4 mr-1" />
                                  <span className="hidden sm:inline">Xem</span>
                                </Button>
                              </Link>

                              {/* Print */}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handlePrintReport(report.id)}
                              >
                                <PrinterIcon className="w-4 h-4 mr-1" />
                                <span className="hidden xl:inline">In</span>
                              </Button>

                              {/* Edit - only if user can edit */}
                              {canEdit(report) && (
                                <Link href={`/reports/${report.id}/edit`}>
                                  <Button variant="outline" size="sm">
                                    <PencilIcon className="w-4 h-4 mr-1" />
                                    <span className="hidden sm:inline">Sửa</span>
                                  </Button>
                                </Link>
                              )}

                              {/* Export PDF */}
                              <Link href={`/api/reports/${report.id}/export-pdf`} target="_blank">
                                <Button variant="outline" size="sm">
                                  <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
                                  <span className="hidden lg:inline">PDF</span>
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}
