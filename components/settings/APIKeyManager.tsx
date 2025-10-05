'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { 
  KeyIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { UserAPIKey, APIKeyInput } from '@/types/user-api-keys'
import { UserAPIKeyService } from '@/lib/user-api-key-service'

export default function APIKeyManager() {
  const { data: session } = useSession()
  const [apiKeys, setApiKeys] = useState<UserAPIKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [testingKey, setTestingKey] = useState<string | null>(null)

  // Load user's API keys
  useEffect(() => {
    if (session?.user?.email) {
      loadAPIKeys()
    }
  }, [session])

  const loadAPIKeys = async () => {
    try {
      setLoading(true)
      const keys = await UserAPIKeyService.getUserAPIKeys()
      setApiKeys(keys)
    } catch (error) {
      console.error('Failed to load API keys:', error)
      toast.error('Không thể tải danh sách API keys')
    } finally {
      setLoading(false)
    }
  }

  const handleAddKey = async (keyData: APIKeyInput) => {
    try {
      await UserAPIKeyService.addAPIKey(keyData)
      toast.success('Đã thêm API key thành công!')
      setShowAddForm(false)
      loadAPIKeys()
    } catch (error) {
      console.error('Failed to add API key:', error)
      toast.error(error instanceof Error ? error.message : 'Không thể thêm API key')
    }
  }

  const handleTestKey = async (keyId: string) => {
    try {
      setTestingKey(keyId)
      const result = await UserAPIKeyService.testAPIKey(keyId)
      
      if (result.success) {
        toast.success('API key hoạt động tốt!')
      } else {
        toast.error(`API key không hợp lệ: ${result.error}`)
      }
      
      loadAPIKeys() // Refresh to show updated test results
    } catch (error) {
      console.error('Failed to test API key:', error)
      toast.error('Không thể test API key')
    } finally {
      setTestingKey(null)
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Bạn có chắc muốn xóa API key này?')) return

    try {
      await UserAPIKeyService.deleteAPIKey(keyId)
      toast.success('Đã xóa API key!')
      loadAPIKeys()
    } catch (error) {
      console.error('Failed to delete API key:', error)
      toast.error('Không thể xóa API key')
    }
  }

  const handleToggleActive = async (keyId: string, isActive: boolean) => {
    try {
      await UserAPIKeyService.updateAPIKey(keyId, { is_active: !isActive })
      toast.success(`Đã ${!isActive ? 'kích hoạt' : 'vô hiệu hóa'} API key!`)
      loadAPIKeys()
    } catch (error) {
      console.error('Failed to toggle API key:', error)
      toast.error('Không thể cập nhật API key')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <KeyIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Quản lý API Keys</h2>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Thêm API Key
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Tại sao cần API key riêng?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Không chia sẻ quota với người khác</li>
                <li>Tự quản lý chi phí sử dụng</li>
                <li>Bảo mật cao hơn</li>
                <li>Chọn AI provider phù hợp (ChatGPT hoặc Gemini)</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Add API Key Form */}
      {showAddForm && (
        <AddAPIKeyForm
          onSubmit={handleAddKey}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.length === 0 ? (
          <Card className="text-center py-8">
            <KeyIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có API key nào</h3>
            <p className="text-gray-600 mb-4">
              Thêm API key để sử dụng AI Chatbot
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Thêm API Key đầu tiên
            </Button>
          </Card>
        ) : (
          apiKeys.map((key) => (
            <APIKeyCard
              key={key.id}
              apiKey={key}
              onTest={() => handleTestKey(key.id)}
              onDelete={() => handleDeleteKey(key.id)}
              onToggleActive={() => handleToggleActive(key.id, key.is_active)}
              isTesting={testingKey === key.id}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Add API Key Form Component
function AddAPIKeyForm({ 
  onSubmit, 
  onCancel 
}: { 
  onSubmit: (data: APIKeyInput) => void
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState<APIKeyInput>({
    provider: 'gemini',
    api_key: '',
    api_key_name: ''
  })
  const [showKey, setShowKey] = useState(false)

  const providers = UserAPIKeyService.getProviderInfo()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.api_key.trim()) {
      toast.error('Vui lòng nhập API key')
      return
    }

    onSubmit(formData)
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Thêm API Key mới</h3>

        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chọn AI Provider
          </label>
          <Select
            value={formData.provider}
            onChange={(value) => setFormData(prev => ({ ...prev, provider: value as any }))}
            options={[
              { value: 'gemini', label: '🔷 Google Gemini (Miễn phí)' },
              { value: 'openai', label: '🤖 OpenAI ChatGPT (Có phí)' }
            ]}
          />
          
          {/* Provider Info */}
          <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
            <div className="space-y-1">
              <p><strong>Website:</strong> <a href={providers[formData.provider].website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{providers[formData.provider].website}</a></p>
              <p><strong>Định dạng:</strong> <code className="bg-gray-200 px-1 rounded">{providers[formData.provider].api_key_format}</code></p>
              <p><strong>Giá:</strong> {providers[formData.provider].pricing}</p>
              <p><strong>Free tier:</strong> {providers[formData.provider].free_tier}</p>
            </div>
          </div>
        </div>

        {/* API Key Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tên gợi nhớ (tùy chọn)
          </label>
          <Input
            type="text"
            value={formData.api_key_name || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, api_key_name: e.target.value }))}
            placeholder={`${formData.provider.toUpperCase()} Key - ${new Date().toLocaleDateString()}`}
          />
        </div>

        {/* API Key Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key *
          </label>
          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              value={formData.api_key}
              onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
              placeholder={`Paste your ${formData.provider.toUpperCase()} API key here...`}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showKey ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Thêm API Key
          </Button>
        </div>
      </form>
    </Card>
  )
}

// API Key Card Component
function APIKeyCard({ 
  apiKey, 
  onTest, 
  onDelete, 
  onToggleActive,
  isTesting 
}: { 
  apiKey: UserAPIKey
  onTest: () => void
  onDelete: () => void
  onToggleActive: () => void
  isTesting: boolean
}) {
  const getStatusIcon = () => {
    if (isTesting) return <LoadingSpinner size="sm" />
    if (apiKey.is_valid === true) return <CheckCircleIcon className="w-5 h-5 text-green-600" />
    if (apiKey.is_valid === false) return <XCircleIcon className="w-5 h-5 text-red-600" />
    return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
  }

  const getStatusText = () => {
    if (isTesting) return 'Đang kiểm tra...'
    if (apiKey.is_valid === true) return 'Hoạt động tốt'
    if (apiKey.is_valid === false) return 'Không hợp lệ'
    return 'Chưa kiểm tra'
  }

  const getProviderColor = () => {
    return apiKey.provider === 'openai' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
  }

  return (
    <Card className={`${!apiKey.is_active ? 'opacity-60' : ''}`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          
          {/* Left: Key Info */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <KeyIcon className="w-6 h-6 text-gray-400" />
            </div>
            
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-gray-900">
                  {apiKey.api_key_name || `${apiKey.provider.toUpperCase()} Key`}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getProviderColor()}`}>
                  {apiKey.provider === 'openai' ? 'ChatGPT' : 'Gemini'}
                </span>
                {!apiKey.is_active && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                    Không hoạt động
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  {getStatusIcon()}
                  <span>{getStatusText()}</span>
                </div>
                
                {apiKey.last_tested_at && (
                  <span>
                    Test lần cuối: {new Date(apiKey.last_tested_at).toLocaleDateString('vi-VN')}
                  </span>
                )}
              </div>
              
              {apiKey.test_result?.error && (
                <p className="text-xs text-red-600 mt-1">
                  Lỗi: {apiKey.test_result.error}
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={onTest}
              variant="outline"
              disabled={isTesting}
              className="text-xs"
            >
              {isTesting ? <LoadingSpinner size="sm" /> : <Cog6ToothIcon className="w-4 h-4" />}
              {isTesting ? 'Testing...' : 'Test'}
            </Button>
            
            <Button
              onClick={onToggleActive}
              variant="outline"
              className={`text-xs ${apiKey.is_active ? 'text-yellow-600' : 'text-green-600'}`}
            >
              {apiKey.is_active ? 'Tắt' : 'Bật'}
            </Button>
            
            <Button
              onClick={onDelete}
              variant="outline"
              className="text-xs text-red-600 hover:bg-red-50"
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
