'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import MainLayout from '../../../../components/layout/MainLayout'
import LoadingSpinner from '../../../../components/ui/LoadingSpinner'
import Button from '../../../../components/ui/Button'
import { 
  CreateInformationData, 
  InformationType
} from '../../../../types/adr-information'
import { toast } from 'react-hot-toast'
import { ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function CreateADRInformation() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateInformationData>({
    title: '',
    summary: '',
    content: '',
    type: 'news',
    priority: 3,
    tags: [],
    target_audience: ['user'],
    is_pinned: false,
    show_on_homepage: false,
    meta_keywords: '',
    meta_description: '',
    expires_at: ''
  })

  const [currentTag, setCurrentTag] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user || session.user.role !== 'admin') {
      router.replace('/unauthorized')
    }
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  if (!session?.user || session.user.role !== 'admin') {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/adr-information', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags || [],
          expires_at: formData.expires_at || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Tạo tin tức thành công')
        router.push('/admin/adr-information')
      } else {
        throw new Error(data.error || 'Failed to create information')
      }
    } catch (error) {
      console.error('Error creating information:', error)
      toast.error('Không thể tạo tin tức')
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (currentTag.trim() && !formData.tags?.includes(currentTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), currentTag.trim()]
      })
      setCurrentTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || []
    })
  }

  const handleTargetAudienceChange = (audience: string, checked: boolean) => {
    let newTargetAudience = [...(formData.target_audience || [])]
    
    if (checked) {
      if (!newTargetAudience.includes(audience)) {
        newTargetAudience.push(audience)
      }
    } else {
      newTargetAudience = newTargetAudience.filter(a => a !== audience)
    }
    
    setFormData({ ...formData, target_audience: newTargetAudience })
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/adr-information"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-1" />
            Quay lại
          </Link>
          <div className="flex items-center space-x-2">
            <DocumentTextIcon className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Tạo tin tức mới</h1>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h2>
            
            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiêu đề *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tiêu đề tin tức"
              />
            </div>

            {/* Summary */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tóm tắt
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tóm tắt ngắn gọn"
              />
            </div>

            {/* Type and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại tin tức
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as InformationType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="news">Tin tức</option>
                  <option value="guideline">Hướng dẫn</option>
                  <option value="alert">Cảnh báo</option>
                  <option value="announcement">Thông báo</option>
                  <option value="education">Đào tạo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Độ ưu tiên
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Rất cao (1)</option>
                  <option value={2}>Cao (2)</option>
                  <option value={3}>Trung bình (3)</option>
                  <option value={4}>Thấp (4)</option>
                  <option value={5}>Rất thấp (5)</option>
                </select>
              </div>
            </div>

            {/* Content */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nội dung*
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập nội dung chi tiết (có thể sử dụng HTML)"
              />
              <p className="text-sm text-gray-500 mt-1">
                Có thể sử dụng các thẻ HTML cơ bản: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;em&gt;
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags và từ khóa</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập tag"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  variant="outline"
                >
                  Thêm
                </Button>
              </div>
              
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Keywords (SEO)
                </label>
                <input
                  type="text"
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="từ khóa, tách, bằng, dấu phẩy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description (SEO)
                </label>
                <input
                  type="text"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mô tả ngắn cho SEO"
                />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt hiển thị</h2>
            
            {/* Target Audience */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đối tượng mục tiêu
              </label>
              <div className="space-y-2">
                {[
                  { value: 'public', label: 'Công khai' },
                  { value: 'user', label: 'Người dùng đã đăng ký' },
                  { value: 'admin', label: 'Quản trị viên' }
                ].map((audience) => (
                  <label key={audience.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.target_audience?.includes(audience.value) || false}
                      onChange={(e) => handleTargetAudienceChange(audience.value, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{audience.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Display Options */}
            <div className="space-y-3 mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_pinned}
                  onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Ghim tin tức này lên đầu</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.show_on_homepage}
                  onChange={(e) => setFormData({ ...formData, show_on_homepage: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Hiển thị trên trang chủ</span>
              </label>
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày hết hạn (tùy chọn)
              </label>
              <input
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Nếu không chọn, tin tức sẽ không có thời hạn
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link href="/admin/adr-information">
              <Button variant="outline">
                Hủy bỏ
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Đang tạo..</span>
                </>
              ) : (
                <span>Tạo tin tức</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}


