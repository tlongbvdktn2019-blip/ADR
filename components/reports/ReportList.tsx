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
import { ADRReport, ReportListResponse, SEVERITY_LABELS } from '@/types/report'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TableCellsIcon,
  Squares2X2Icon
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
    totalPages: 0
  })
  const [loading, setLoading] = useState(!initialData)
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

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
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Input
                placeholder="Tìm kiếm theo mã báo cáo, tên bệnh nhân, thuốc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch}>
              <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
              Tìm kiếm
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Lọc
            </Button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
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
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
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
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Hiển thị {reports.length} trong tổng số {pagination.total} báo cáo
          {session?.user?.role !== 'admin' && ' của bạn'}
        </span>
        <span>
          Trang {pagination.page} / {pagination.totalPages}
        </span>
      </div>

      {/* Reports Content */}
      {viewMode === 'table' ? (
        <ReportTable reports={reports} loading={loading && reports.length === 0} />
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
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = Math.max(1, pagination.page - 2) + i
              if (pageNum > pagination.totalPages) return null
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === pagination.page ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="min-w-[2.5rem]"
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
    </div>
  )
}


