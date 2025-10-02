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
import RichTextEditor from '../../../../../components/ui/RichTextEditor'

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
            toast.error('Kh??ng t??m th???y tin t???c')
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
        toast.error('Kh??ng th??? t???i tin t???c')
        router.replace('/admin/adr-information')
      } finally {
        setLoading(false)
      }
    }

    fetchInformation()
  }, [id, status, router])

  const ensureRequiredFields = (state: FormState) => {
    if (!state.title.trim() || !state.content.trim()) {
      toast.error('Vui l??ng nh???p ti??u ????? v?? n???i dung')
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
    payload.expires_at = state.expires_at.trim() ? state.expires_at : undefined

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

      toast.success('C???p nh???t tin t???c th??nh c??ng')
      router.push('/admin/adr-information')
    } catch (error) {
      console.error('Error updating information:', error)
      toast.error('Kh??ng th??? c???p nh???t tin t???c')
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
            Quay l???i
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ch???nh s???a tin t???c</h1>
            <p className="text-gray-600">C???p nh???t n???i dung, tr???ng th??i v?? thi???t l???p hi???n th??? cho tin t???c ADR</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Th??ng tin c?? b???n</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ti??u ????? *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nh???p ti??u ????? tin t???c"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">T??m t???t</label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nh???p t??m t???t ng???n g???n"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lo???i tin t???c</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as InformationType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="news">Tin t???c</option>
                  <option value="guideline">H?????ng d???n</option>
                  <option value="alert">C???nh b??o</option>
                  <option value="announcement">Th??ng b??o</option>
                  <option value="education">????o t???o</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">????? ??u ti??n</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value, 10) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>R???t cao (1)</option>
                  <option value={2}>Cao (2)</option>
                  <option value={3}>Trung b??nh (3)</option>
                  <option value={4}>Th???p (4)</option>
                  <option value={5}>R???t th???p (5)</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tr???ng th??i</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as InformationStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">B???n nh??p</option>
                <option value="published">???? xu???t b???n</option>
                <option value="archived">???? l??u tr???</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung *</label>
              <RichTextEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                placeholder="Nhập nội dung chi tiết... Sử dụng thanh công cụ để định dạng văn bản"
                height="450px"
              />
              <p className="text-sm text-gray-500 mt-2">
                Sử dụng thanh công cụ phía trên để định dạng văn bản: in đậm, in nghiêng, màu chữ, canh lề, danh sách, v.v.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags v?? t??? kh??a</h2>

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
                  placeholder="Nh???p tag"
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Th??m
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
                        aria-label={`X??a tag ${tag}`}
                      >
                        ??
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
                  placeholder="t??? kh??a, t??ch, b???ng, d???u ph???y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description (SEO)</label>
                <input
                  type="text"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="M?? t??? ng???n cho SEO"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">C??i ?????t hi???n th???</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">?????i t?????ng m???c ti??u</label>
              <div className="space-y-2">
                {[
                  { value: 'public', label: 'C??ng khai' },
                  { value: 'user', label: 'Ng?????i d??ng ???? ????ng k??' },
                  { value: 'admin', label: 'Qu???n tr??? vi??n' },
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
                <span className="ml-2 text-sm text-gray-700">Ghim tin t???c n??y l??n ?????u</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.show_on_homepage}
                  onChange={(e) => setFormData({ ...formData, show_on_homepage: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Hi???n th??? tr??n trang ch???</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ng??y h???t h???n (t??y ch???n)</label>
              <input
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">N???u kh??ng ch???n, tin t???c s??? kh??ng c?? th???i h???n</p>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link href="/admin/adr-information">
              <Button variant="outline">H???y b???</Button>
            </Link>

            {formData.status !== 'published' && (
              <Button
                type="button"
                onClick={handlePublish}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {saving ? '??ang xu???t b???n...' : 'Xu???t b???n ngay'}
              </Button>
            )}

            <Button type="submit" disabled={saving} className="flex items-center space-x-2">
              {saving ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>??ang l??u...</span>
                </>
              ) : (
                <span>L??u thay ?????i</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
