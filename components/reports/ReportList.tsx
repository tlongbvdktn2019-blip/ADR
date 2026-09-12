'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import ReportTable from './ReportTable'
import ReportCard from './ReportCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { ADRReport, ReportListResponse, SEVERITY_LABELS } from '@/types/report'
import {
  BulkApprovalResult,
  MAX_BULK_APPROVAL_REPORTS,
  getSelectablePendingReportIds,
} from '@/lib/bulk-report-approval'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TableCellsIcon,
  Squares2X2Icon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

interface ReportListProps {
  initialData?: ReportListResponse
}

export default function ReportList({ initialData }: ReportListProps) {
  const { data: session } = useSession()
  const [reports, setReports] = useState<ADRReport[]>(initialData?.reports || [])
  const [pagination, setPagination] = useState(initialData?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    totalOrganizations: 0,
    organizationsOnPage: 0
  })
  const [loading, setLoading] = useState(!initialData)
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set())
  const [showBulkApprovalDialog, setShowBulkApprovalDialog] = useState(false)
  const [bulkApproving, setBulkApproving] = useState(false)

  const canBulkApprove = session?.user?.role === 'admin'
  const selectionLimitReached = selectedReportIds.size >= MAX_BULK_APPROVAL_REPORTS
  const bulkControlsDisabled = bulkApproving || loading
  const selectableReportIds = getSelectablePendingReportIds(reports)
  const selectedReports = reports.filter((report) => selectedReportIds.has(report.id))
  const confirmationReports = selectedReports.slice(0, 10)

  const fetchReports = async (page = 1, search = searchTerm, severity = severityFilter) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (search) params.append('search', search)
      if (severity) params.append('severity', severity)

      const response = await fetch(`/api/reports?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports')
      }

      const data: ReportListResponse = await response.json()
      setReports(data.reports)
      setPagination(data.pagination)
      setSelectedReportIds(new Set())
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('Không thể tải danh sách báo cáo')
    } finally {
      setLoading(false)
    }
  }

  // Load reports on mount if no initial data
  useEffect(() => {
    if (!initialData) {
      fetchReports()
    }
  }, [initialData])

  const handleSearch = () => {
    fetchReports(1, searchTerm, severityFilter)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchReports(newPage, searchTerm, severityFilter)
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    if (field === 'severity') {
      setSeverityFilter(value)
    }
    // Auto-search when filter changes
    setTimeout(() => {
      fetchReports(1, searchTerm, field === 'severity' ? value : severityFilter)
    }, 100)
  }

  const handleReportSelectionChange = (reportId: string, selected: boolean) => {
    if (!canBulkApprove || bulkControlsDisabled) return

    const report = reports.find((item) => item.id === reportId)
    if (!report || report.approval_status !== 'pending') return

    setSelectedReportIds((current) => {
      const next = new Set(current)

      if (selected) {
        if (next.size >= MAX_BULK_APPROVAL_REPORTS) return current
        next.add(reportId)
      } else {
        next.delete(reportId)
      }

      return next
    })
  }

  const handleSelectAllChange = (selected: boolean) => {
    if (!canBulkApprove || bulkControlsDisabled) return
    setSelectedReportIds(selected ? new Set(selectableReportIds) : new Set())
  }

  const handleBulkApprove = async () => {
    if (!canBulkApprove || bulkControlsDisabled || selectedReportIds.size === 0) return

    const reportIds = Array.from(selectedReportIds)
    setBulkApproving(true)

    try {
      const response = await fetch('/api/reports/bulk-approve', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ report_ids: reportIds }),
      })

      const data = await response.json().catch(() => ({})) as Partial<BulkApprovalResult> & { error?: string }

      if (!response.ok) {
        throw new Error(data.error || 'Không thể duyệt các báo cáo đã chọn')
      }

      const requestedCount = data.requested_count ?? reportIds.length
      const approvedCount = data.approved_count ?? 0
      const skippedCount = data.skipped_count ?? Math.max(0, requestedCount - approvedCount)

      if (approvedCount === requestedCount) {
        toast.success(`Đã duyệt ${approvedCount} báo cáo`)
      } else if (approvedCount === 0) {
        toast('Không có báo cáo nào được duyệt; danh sách có thể đã thay đổi', {
          icon: 'ℹ️',
        })
      } else {
        toast(`Đã duyệt ${approvedCount}/${requestedCount} báo cáo; bỏ qua ${skippedCount} báo cáo`, {
          icon: '⚠️',
        })
      }

      setShowBulkApprovalDialog(false)
      setSelectedReportIds(new Set())
      await fetchReports(pagination.page, searchTerm, severityFilter)
    } catch (error) {
      console.error('Bulk approve error:', error)
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi duyệt báo cáo')
      setShowBulkApprovalDialog(false)
    } finally {
      setBulkApproving(false)
    }
  }

  const severityOptions = [
    { value: '', label: 'Tất cả mức độ' },
    ...Object.entries(SEVERITY_LABELS).map(([value, label]) => ({ value, label }))
  ]

  if (loading && !reports.length) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className={`space-y-4 sm:space-y-6 ${selectedReportIds.size > 0 ? 'pb-24 md:pb-0' : ''}`}>
      {/* Search and Filters */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Input
                placeholder="Tìm kiếm báo cáo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} className="flex-1 sm:flex-none touch-target">
              <MagnifyingGlassIcon className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Tìm kiếm</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="flex-1 sm:flex-none touch-target"
            >
              <FunnelIcon className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Lọc</span>
              <span className="sm:hidden">Bộ lọc</span>
            </Button>
          </div>
        </div>

        {/* View Mode Toggle - Hidden on mobile */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors touch-target ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TableCellsIcon className="w-4 h-4 mr-2" />
              Bảng (Theo đơn vị)
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors touch-target ${
                viewMode === 'cards'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Squares2X2Icon className="w-4 h-4 mr-2" />
              Thẻ
            </button>
          </div>
          <div></div> {/* Spacer */}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <Select
              label="Mức độ nghiêm trọng"
              value={severityFilter}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
              options={severityOptions}
            />
            {/* More filters can be added here */}
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm text-gray-600">
        <span>
          Hiển thị {pagination.organizationsOnPage || 0} đơn vị ({reports.length} báo cáo) • Tổng {pagination.totalOrganizations || 0} đơn vị ({pagination.total} báo cáo)
        </span>
        <span className="text-xs">
          Trang {pagination.page} / {pagination.totalPages}
        </span>
      </div>

      {canBulkApprove && selectedReportIds.size > 0 && (
        <div className="fixed inset-x-3 bottom-3 z-40 rounded-xl border border-primary-200 bg-white p-3 shadow-xl md:static md:inset-auto md:flex md:items-center md:justify-between md:p-4 md:shadow-sm">
          <div>
            <p className="text-sm font-semibold text-gray-900" role="status" aria-live="polite">
              Đã chọn {selectedReportIds.size} báo cáo
            </p>
            {selectionLimitReached && (
              <p className="mt-1 text-xs text-amber-700">
                Chỉ có thể duyệt tối đa {MAX_BULK_APPROVAL_REPORTS} báo cáo mỗi lần
              </p>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2 md:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedReportIds(new Set())}
              disabled={bulkControlsDisabled}
              className="flex-1 md:flex-none"
            >
              <XMarkIcon className="mr-1 h-4 w-4" />
              Bỏ chọn tất cả
            </Button>
            <Button
              size="sm"
              onClick={() => setShowBulkApprovalDialog(true)}
              disabled={bulkControlsDisabled}
              className="flex-1 md:flex-none"
            >
              <CheckCircleIcon className="mr-1 h-4 w-4" />
              Duyệt {selectedReportIds.size} báo cáo
            </Button>
          </div>
        </div>
      )}

      {/* Reports Content */}
      {/* Desktop: Show based on view mode, Mobile: Always cards */}
      <div className="hidden md:block">
        {viewMode === 'table' ? (
          <div className="table-container">
            <ReportTable
              reports={reports}
              loading={loading && reports.length === 0}
              onReportsUpdate={() => fetchReports(pagination.page)}
              selectedReportIds={selectedReportIds}
              onReportSelectionChange={handleReportSelectionChange}
              onSelectAllChange={handleSelectAllChange}
              bulkSelectionDisabled={bulkControlsDisabled}
              selectionLimitReached={selectionLimitReached}
            />
          </div>
        ) : (
          <>
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || severityFilter ? 'Không tìm thấy báo cáo' : 'Chưa có báo cáo nào'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm || severityFilter 
                    ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc'
                    : 'Tạo báo cáo ADR đầu tiên để bắt đầu'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reports.map((report) => (
                  <ReportCard 
                    key={report.id} 
                    report={report} 
                    onReportDeleted={() => fetchReports(pagination.page)}
                    selected={selectedReportIds.has(report.id)}
                    onSelectionChange={handleReportSelectionChange}
                    selectionDisabled={bulkControlsDisabled}
                    selectionLimitReached={selectionLimitReached}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile: Always cards */}
      <div className="md:hidden">
        {reports.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2">
              {searchTerm || severityFilter ? 'Không tìm thấy báo cáo' : 'Chưa có báo cáo nào'}
            </h3>
            <p className="text-sm text-gray-600">
              {searchTerm || severityFilter 
                ? 'Hãy thử thay đổi từ khóa tìm kiếm'
                : 'Tạo báo cáo ADR đầu tiên'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {reports.map((report) => (
              <ReportCard 
                key={report.id} 
                report={report} 
                onReportDeleted={() => fetchReports(pagination.page)}
                selected={selectedReportIds.has(report.id)}
                onSelectionChange={handleReportSelectionChange}
                selectionDisabled={bulkControlsDisabled}
                selectionLimitReached={selectionLimitReached}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="touch-target"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          
          {/* Show fewer pages on mobile */}
          <div className="flex gap-1">
            {Array.from({ length: Math.min(window.innerWidth < 640 ? 3 : 5, pagination.totalPages) }, (_, i) => {
              const pageNum = Math.max(1, pagination.page - (window.innerWidth < 640 ? 1 : 2)) + i
              if (pageNum > pagination.totalPages) return null
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === pagination.page ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="min-w-[2.5rem] touch-target"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="touch-target"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        </div>
      )}

      {loading && reports.length > 0 && (
        <div className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      )}

      <ConfirmDialog
        isOpen={showBulkApprovalDialog}
        onClose={() => setShowBulkApprovalDialog(false)}
        onConfirm={handleBulkApprove}
        title={`Duyệt ${selectedReportIds.size} báo cáo?`}
        message={
          <div className="space-y-3">
            <p>
              Hệ thống chỉ duyệt các báo cáo vẫn còn ở trạng thái Chưa duyệt tại thời điểm xử lý.
            </p>
            <div>
              <p className="font-medium text-gray-700">Mã báo cáo:</p>
              <ul className="mt-1 max-h-40 list-disc space-y-1 overflow-y-auto pl-5">
                {confirmationReports.map((report) => (
                  <li key={report.id}>{report.report_code}</li>
                ))}
              </ul>
              {selectedReports.length > confirmationReports.length && (
                <p className="mt-1 text-xs text-gray-500">
                  Và {selectedReports.length - confirmationReports.length} báo cáo khác
                </p>
              )}
            </div>
          </div>
        }
        confirmText={bulkApproving ? 'Đang duyệt…' : `Duyệt ${selectedReportIds.size} báo cáo`}
        type="info"
        loading={bulkApproving}
        closeOnConfirm={false}
      />
    </div>
  )
}
