'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import MainLayout from '../../../../../components/layout/MainLayout'
import LoadingSpinner from '../../../../../components/ui/LoadingSpinner'
import Button from '../../../../../components/ui/Button'
import {
  ADRInformation,
  InformationResponse,
  InformationStatus,
  InformationType,
  UpdateInformationData,
} from '../../../../../types/adr-information'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

type FormState = {
  title: string
  summary: string
  content: string
  type: InformationType
  priority: number
  tags: string[]
  target_audience: string[]
  is_pinned: boolean
  show_on_homepage: boolean
  meta_keywords: string
  meta_description: string
  expires_at: string
  status: InformationStatus
}

const defaultFormState: FormState = {
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
  expires_at: '',
  status: 'draft',
}

export default function EditADRInformation() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [information, setInformation] = useState<ADRInformation | null>(null)
  const [formData, setFormData] = useState<FormState>(defaultFormState)
  const [currentTag, setCurrentTag] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user || session.user.role !== 'admin') {
      router.replace('/unauthorized')
    }
  }, [session, status, router])

  useEffect(() => {
    if (!id || status !== 'authenticated') return

    const fetchInformation = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/adr-information/${id}`)
        const data: InformationResponse = await response.json()

        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Không tìm thấy tin tức')
            router.replace('/admin/adr-information')
            return
          }
          throw new Error(data.error || 'Failed to fetch information')
        }

        setInformation(data.data)
        setFormData({
          title: data.data.title,
          summary: data.data.summary || '',
          content: data.data.content,
          type: data.data.type,
          priority: data.data.priority,
          tags: data.data.tags || [],
          target_audience: data.data.target_audience || ['user'],
          is_pinned: data.data.is_pinned,
          show_on_homepage: data.data.show_on_homepage,
          meta_keywords: data.data.meta_keywords || '',
          meta_description: data.data.meta_description || '',
          expires_at: data.data.expires_at ? data.data.expires_at.split('T')[0] : '',
          status: data.data.status,
        })
      } catch (error) {
        console.error('Error fetching ADR information:', error)
        toast.error('Không thể tải tin tức')
        router.replace('/admin/adr-information')
      } finally {
        setLoading(false)
      }
    }

    fetchInformation()
  }, [id, status, router])

  const ensureRequiredFields = (state: FormState) => {
    if (!state.title.trim() || !state.content.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung')
      return false
    }
    return true
  }

  const buildPayload = (state: FormState): UpdateInformationData => {
    const payload: UpdateInformationData = {
      title: state.title.trim(),
      content: state.content,
      type: state.type,
      priority: state.priority,
      tags: state.tags,
      target_audience: state.target_audience,
      is_pinned: state.is_pinned,
      show_on_homepage: state.show_on_homepage,
      status: state.status,
    }

    payload.summary = state.summary.trim() || undefined
    payload.meta_keywords = state.meta_keywords.trim() || undefined
    payload.meta_description = state.meta_description.trim() || undefined
    payload.expires_at = state.expires_at ? state.expires_at : null

    if (state.status === 'published') {
      payload.published_at = information?.published_at || new Date().toISOString()
    }

    return payload
  }

  const submitUpdate = async (override?: Partial<FormState>) => {
    if (!id) return

    const nextState = { ...formData, ...override }
    if (!ensureRequiredFields(nextState)) return

    setSaving(true)
    try {
      const response = await fetch(`/api/adr-information/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(nextState)),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update information')
      }

      toast.success('Cập nhật tin tức thành công')
      router.push('/admin/adr-information')
    } catch (error) {
      console.error('Error updating information:', error)
      toast.error('Không thể cập nhật tin tức')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitUpdate()
  }

  const handlePublish = async () => {
    await submitUpdate({ status: 'published' })
  }

  const addTag = () => {
    const value = currentTag.trim()
    if (!value) return
    if (formData.tags.includes(value)) return
    setFormData((prev) => ({ ...prev, tags: [...prev.tags, value] }))
    setCurrentTag('')
  }

  const removeTag = (tag: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((item) => item !== tag) }))
  }

  const handleTargetAudienceChange = (audience: string, checked: boolean) => {
    setFormData((prev) => {
      const current = prev.target_audience ?? []
      const next = checked ? [...current, audience] : current.filter((item) => item !== audience)
      return { ...prev, target_audience: Array.from(new Set(next)) }
    })
  }

  if (status === 'loading' || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  if (!session?.user || session.user.role !== 'admin' || !information) {
    return null
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/adr-information"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-1" />
            Quay lại
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa tin tức</h1>
            <p className="text-gray-600">Cập nhật nội dung, trạng thái và thiết lập hiển thị cho tin tức ADR</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tiêu đề tin tức"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tóm tắt</label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tóm tắt ngắn gọn"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại tin tức</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Độ ưu tiên</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value, 10) || 1 })}
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

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as InformationStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Bản nháp</option>
                <option value="published">Đã xuất bản</option>
                <option value="archived">Đã lưu trữ</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung *</label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập nội dung chi tiết (có thể sử dụng HTML)"
              />
              <p className="text-sm text-gray-500 mt-1">
                Có thể sử dụng các thẻ HTML cơ bản: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;em&gt;
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags và từ khóa</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập tag"
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Thêm
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                        aria-label={`Xóa tag ${tag}`}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Meta Keywords (SEO)</label>
                <input
                  type="text"
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="từ khóa, tách, bằng, dấu phẩy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description (SEO)</label>
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

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt hiển thị</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Đối tượng mục tiêu</label>
              <div className="space-y-2">
                {[
                  { value: 'public', label: 'Công khai' },
                  { value: 'user', label: 'Người dùng đã đăng ký' },
                  { value: 'admin', label: 'Quản trị viên' },
                ].map((audience) => (
                  <label key={audience.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.target_audience.includes(audience.value)}
                      onChange={(e) => handleTargetAudienceChange(audience.value, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{audience.label}</span>
                  </label>
                ))}
              </div>
            </div>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ngày hết hạn (tùy chọn)</label>
              <input
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Nếu không chọn, tin tức sẽ không có thời hạn</p>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link href="/admin/adr-information">
              <Button variant="outline">Hủy bỏ</Button>
            </Link>

            {formData.status !== 'published' && (
              <Button
                type="button"
                onClick={handlePublish}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {saving ? 'Đang xuất bản...' : 'Xuất bản ngay'}
              </Button>
            )}

            <Button type="submit" disabled={saving} className="flex items-center space-x-2">
              {saving ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Lưu thay đổi</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
