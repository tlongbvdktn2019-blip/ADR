'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import MainLayout from '../../components/layout/MainLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { 
  ADRInformation, 
  InformationType,
  InformationListResponse 
} from '../../types/adr-information'
import { 
  EyeIcon, 
  ClockIcon,
  TagIcon,
  DocumentTextIcon,
  BellIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  AcademicCapIcon,
  StarIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

export default function ADRInformationPage() {
  const { data: session } = useSession()
  
  const [information, setInformation] = useState<ADRInformation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<InformationType | ''>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (session) {
      fetchInformation()
    }
  }, [session, page, selectedType, searchTerm])

  const fetchInformation = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      })
      
      if (selectedType) params.append('type', selectedType)
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/adr-information?${params}`)
      const data: InformationListResponse = await response.json()
      
      if (response.ok) {
        setInformation(data.data)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      } else {
        throw new Error(data.error || 'Failed to fetch information')
      }
    } catch (error) {
      console.error('Error fetching information:', error)
      toast.error('Không thể tải danh sách tin tức')
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: InformationType) => {
    switch (type) {
      case 'news': return <DocumentTextIcon className="w-5 h-5" />
      case 'guideline': return <InformationCircleIcon className="w-5 h-5" />
      case 'alert': return <ExclamationTriangleIcon className="w-5 h-5" />
      case 'announcement': return <BellIcon className="w-5 h-5" />
      case 'education': return <AcademicCapIcon className="w-5 h-5" />
      default: return <DocumentTextIcon className="w-5 h-5" />
    }
  }

  const getTypeColor = (type: InformationType) => {
    switch (type) {
      case 'news': return 'bg-blue-100 text-blue-800'
      case 'guideline': return 'bg-green-100 text-green-800'
      case 'alert': return 'bg-red-100 text-red-800'
      case 'announcement': return 'bg-yellow-100 text-yellow-800'
      case 'education': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: InformationType) => {
    switch (type) {
      case 'news': return 'Tin tức'
      case 'guideline': return 'Hướng dẫn'
      case 'alert': return 'Cảnh báo'
      case 'announcement': return 'Thông báo'
      case 'education': return 'Đào tạo'
      default: return type
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchInformation()
  }

  if (!session) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Vui lòng đăng nhập để xem thông tin ADR</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Thông tin ADR</h1>
          <p className="text-gray-600 mt-2">
            Tin tức, hướng dẫn và thông báo về tác dụng không mong muốn của thuốc
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Tìm kiếm tin tức..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value as InformationType | '')
                    setPage(1)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả loại tin</option>
                  <option value="news">Tin tức</option>
                  <option value="guideline">Hướng dẫn</option>
                  <option value="alert">Cảnh báo</option>
                  <option value="announcement">Thông báo</option>
                  <option value="education">Đào tạo</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : information.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không có tin tức</h3>
            <p className="mt-1 text-sm text-gray-500">
              Chưa có tin tức nào được đăng tải.
            </p>
          </div>
        ) : (
          <>
            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {information.map((item) => (
                <Link
                  key={item.id}
                  href={`/adr-information/${item.id}`}
                  className="block bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-6">
                    {/* Type and Pin */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                        {getTypeIcon(item.type)}
                        <span className="ml-1">{getTypeLabel(item.type)}</span>
                      </span>
                      {item.is_pinned && (
                        <div className="text-yellow-500">
                          <StarIcon className="w-4 h-4 fill-current" />
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {item.title}
                    </h3>

                    {/* Summary */}
                    {item.summary && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                        {item.summary}
                      </p>
                    )}

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600"
                          >
                            <TagIcon className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{item.tags.length - 3} thêm
                          </span>
                        )}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {formatDate(item.published_at || item.created_at)}
                        </div>
                        <div className="flex items-center">
                          <EyeIcon className="w-4 h-4 mr-1" />
                          {item.view_count}
                        </div>
                      </div>
                      <ChevronRightIcon className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          pageNum === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="text-center text-sm text-gray-500">
              Hiển thị {information.length} trong {total} tin tức
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}

