'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { ADRReport, SEVERITY_LABELS, APPROVAL_STATUS_LABELS } from '@/types/report'
import { toast } from 'react-hot-toast'
import {
  EyeIcon,
  PencilIcon,
  PrinterIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  UserIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface ReportTableProps {
  reports: ADRReport[]
  loading?: boolean
  onReportsUpdate?: () => void
}

interface GroupedReports {
  [organization: string]: ADRReport[]
}

export default function ReportTable({ reports, loading = false, onReportsUpdate }: ReportTableProps) {
  const { data: session } = useSession()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [approvingReportId, setApprovingReportId] = useState<string | null>(null)
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null)

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

  // All authenticated users can edit all reports
  const canEdit = (report: ADRReport) => true

  const handlePrintReport = (reportId: string) => {
    const printUrl = `/api/reports/${reportId}/print-view`
    window.open(printUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes')
  }

  const handleApproveReport = async (reportId: string, status: 'approved' | 'rejected' | 'pending', reportCode: string) => {
    if (!session?.user || session.user.role !== 'admin') {
      toast.error('Chỉ admin mới có quyền duyệt báo cáo')
      return
    }

    const confirmMessage = status === 'approved' 
      ? `Bạn có chắc chắn muốn DUYỆT báo cáo ${reportCode}?`
      : status === 'rejected'
      ? `Bạn có chắc chắn muốn TỪ CHỐI báo cáo ${reportCode}?`
      : `Bạn có chắc chắn muốn chuyển báo cáo ${reportCode} về trạng thái CHƯA DUYỆT?`

    if (!confirm(confirmMessage)) {
      return
    }

    setApprovingReportId(reportId)

    try {
      const response = await fetch(`/api/reports/${reportId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approval_status: status,
          approval_note: null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Không thể cập nhật trạng thái duyệt')
      }

      toast.success(data.message)
      
      // Refresh reports list
      if (onReportsUpdate) {
        onReportsUpdate()
      }
    } catch (error) {
      console.error('Approve error:', error)
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra')
    } finally {
      setApprovingReportId(null)
    }
  }

  const getApprovalStatusColor = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'approved':
        return 'text-green-700 bg-green-100 border-green-200'
      case 'rejected':
        return 'text-red-700 bg-red-100 border-red-200'
      case 'pending':
      default:
        return 'text-yellow-700 bg-yellow-100 border-yellow-200'
    }
  }

  const getApprovalStatusIcon = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="w-4 h-4 mr-1" />
      case 'rejected':
        return <XCircleIcon className="w-4 h-4 mr-1" />
      case 'pending':
      default:
        return <ClockIcon className="w-4 h-4 mr-1" />
    }
  }

  const handleDeleteReport = async (reportId: string, reportCode: string) => {
    if (!session?.user || session.user.role !== 'admin') {
      toast.error('Chỉ admin mới có quyền xóa báo cáo')
      return
    }

    const confirmMessage = `⚠️ BẠN CÓ CHẮC CHẮN MUỐN XÓA báo cáo ${reportCode}?\n\nHành động này KHÔNG THỂ HOÀN TÁC!`

    if (!confirm(confirmMessage)) {
      return
    }

    // Double confirmation for safety
    const doubleConfirm = confirm(`Xác nhận lần cuối: Xóa báo cáo ${reportCode}?`)
    if (!doubleConfirm) {
      return
    }

    setDeletingReportId(reportId)

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Không thể xóa báo cáo')
      }

      toast.success(data.message)
      
      // Refresh reports list
      if (onReportsUpdate) {
        onReportsUpdate()
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa báo cáo')
    } finally {
      setDeletingReportId(null)
    }
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
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
                      <td className="px-6 py-4 whitespace-nowrap" colSpan={7}>
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

                          {/* Approval Status */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getApprovalStatusColor(report.approval_status)}`}>
                              {getApprovalStatusIcon(report.approval_status)}
                              {APPROVAL_STATUS_LABELS[report.approval_status]}
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

                              {/* Approval Buttons - Admin Only */}
                              {session?.user?.role === 'admin' && (
                                <>
                                  {report.approval_status !== 'approved' && (
                                    <Button 
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleApproveReport(report.id, 'approved', report.report_code)}
                                      disabled={approvingReportId === report.id}
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    >
                                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                                      <span className="hidden xl:inline">Duyệt</span>
                                    </Button>
                                  )}
                                  {report.approval_status !== 'rejected' && (
                                    <Button 
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleApproveReport(report.id, 'rejected', report.report_code)}
                                      disabled={approvingReportId === report.id}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <XCircleIcon className="w-4 h-4 mr-1" />
                                      <span className="hidden xl:inline">Từ chối</span>
                                    </Button>
                                  )}
                                </>
                              )}

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

                              {/* Delete - Admin Only */}
                              {session?.user?.role === 'admin' && (
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteReport(report.id, report.report_code)}
                                  disabled={deletingReportId === report.id}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                                >
                                  <TrashIcon className="w-4 h-4 mr-1" />
                                  <span className="hidden xl:inline">Xóa</span>
                                </Button>
                              )}
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
