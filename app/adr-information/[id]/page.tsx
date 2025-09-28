'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import MainLayout from '../../../components/layout/MainLayout'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'
import Button from '../../../components/ui/Button'
import { 
  ADRInformation, 
  InformationResponse 
} from '../../../types/adr-information'
import { 
  ArrowLeftIcon,
  EyeIcon, 
  ClockIcon,
  TagIcon,
  DocumentTextIcon,
  BellIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  AcademicCapIcon,
  HeartIcon,
  ShareIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { toast } from 'react-hot-toast'

export default function ADRInformationDetail() {
  const { data: session } = useSession()
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  
  const [information, setInformation] = useState<ADRInformation | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [liking, setLiking] = useState(false)

  useEffect(() => {
    if (session && id) {
      fetchInformation()
    }
  }, [session, id])

  const fetchInformation = async () => {
    if (!id) return

    try {
      const response = await fetch(`/api/adr-information/${id}`)
      const data: InformationResponse = await response.json()
      
      if (response.ok) {
        setInformation(data.data)
        setIsLiked(data.isLiked || false)
        setLikesCount(data.data.likes_count)
      } else if (response.status === 404) {
        router.push('/adr-information')
        toast.error('Không tìm thấy tin tức')
      } else {
        throw new Error(data.error || 'Failed to fetch information')
      }
    } catch (error) {
      console.error('Error fetching information:', error)
      toast.error('Không thể tải tin tức')
      router.push('/adr-information')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!session?.user || liking || !id) return

    setLiking(true)
    try {
      const response = await fetch(`/api/adr-information/${id}/like`, {
        method: isLiked ? 'DELETE' : 'POST'
      })

      if (response.ok) {
        setIsLiked(!isLiked)
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1)
        toast.success(isLiked ? 'Đã bỏ thích' : 'Đã thích tin tức')
      } else {
        const data = await response.json()
        if (data.error !== 'Already liked') {
          throw new Error(data.error || 'Failed to like/unlike')
        }
      }
    } catch (error) {
      console.error('Error liking/unliking:', error)
      toast.error('Không thể thực hiện thao tác')
    } finally {
      setLiking(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    const text = information?.title || 'Thông tin ADR'
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: text,
          text: information?.summary || '',
          url: url
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback to copying URL
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Đã sao chép link!')
      } catch (error) {
        toast.error('Không thể sao chép link')
      }
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'news': return <DocumentTextIcon className="w-5 h-5" />
      case 'guideline': return <InformationCircleIcon className="w-5 h-5" />
      case 'alert': return <ExclamationTriangleIcon className="w-5 h-5" />
      case 'announcement': return <BellIcon className="w-5 h-5" />
      case 'education': return <AcademicCapIcon className="w-5 h-5" />
      default: return <DocumentTextIcon className="w-5 h-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'news': return 'bg-blue-100 text-blue-800'
      case 'guideline': return 'bg-green-100 text-green-800'
      case 'alert': return 'bg-red-100 text-red-800'
      case 'announcement': return 'bg-yellow-100 text-yellow-800'
      case 'education': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  if (!information) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy tin tức</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center space-x-4">
          <Link
            href="/adr-information"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-1" />
            Quay lại danh sách
          </Link>
        </div>

        {/* Article Header */}
        <article className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-8">
            {/* Type Badge */}
            <div className="mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(information.type)}`}>
                {getTypeIcon(information.type)}
                <span className="ml-2">{getTypeLabel(information.type)}</span>
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {information.title}
            </h1>

            {/* Summary */}
            {information.summary && (
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                {information.summary}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center">
                <UserIcon className="w-4 h-4 mr-2" />
                <span>Tác giả: {information.author_name}</span>
                {information.author_organization && (
                  <span className="ml-1">({information.author_organization})</span>
                )}
              </div>
              
              <div className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-2" />
                <span>{formatDate(information.published_at || information.created_at)}</span>
              </div>
              
              <div className="flex items-center">
                <EyeIcon className="w-4 h-4 mr-2" />
                <span>{information.view_count} lượt xem</span>
              </div>

              {likesCount > 0 && (
                <div className="flex items-center">
                  <HeartIcon className="w-4 h-4 mr-2" />
                  <span>{likesCount} lượt thích</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4 mb-6">
              <Button
                onClick={handleLike}
                disabled={liking}
                variant={isLiked ? "default" : "outline"}
                className={`flex items-center space-x-2 ${isLiked ? 'text-pink-600 border-pink-600' : ''}`}
              >
                {liking ? (
                  <LoadingSpinner size="sm" />
                ) : isLiked ? (
                  <HeartIconSolid className="w-4 h-4 text-pink-600" />
                ) : (
                  <HeartIcon className="w-4 h-4" />
                )}
                <span>{isLiked ? 'Đã thích' : 'Thích'}</span>
              </Button>

              <Button
                onClick={handleShare}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <ShareIcon className="w-4 h-4" />
                <span>Chia sẻ</span>
              </Button>
            </div>

            {/* Content */}
            <div 
              className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: information.content }}
            />

            {/* Tags */}
            {information.tags && information.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {information.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <TagIcon className="w-4 h-4 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Expiry Warning */}
            {information.expires_at && new Date(information.expires_at) > new Date() && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Thông tin có thời hạn</p>
                    <p className="text-yellow-700 mt-1">
                      Tin tức này sẽ hết hạn vào {formatDate(information.expires_at)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Back to List */}
        <div className="text-center">
          <Link href="/adr-information">
            <Button variant="outline" className="flex items-center space-x-2 mx-auto">
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Quay lại danh sách tin tức</span>
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  )
}

