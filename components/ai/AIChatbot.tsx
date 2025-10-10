'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Card from '@/components/ui/Card'
import { 
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  SparklesIcon,
  LightBulbIcon,
  ClockIcon,
  UserIcon,
  ComputerDesktopIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { ChatMessage, ADRChatContext, AIChatbotService } from '@/lib/ai-chatbot-service'
import { ADRFormData } from '@/app/reports/new/page'
import { UserAPIKeyService } from '@/lib/user-api-key-service'

interface AIChatbotProps {
  isOpen: boolean
  onClose: () => void
  formData: ADRFormData
  onApplyInsight?: (insight: string) => void
}

export default function AIChatbot({ isOpen, onClose, formData, onApplyInsight }: AIChatbotProps) {
  const { data: session, status } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<'chatgpt' | 'gemini'>('chatgpt')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [context, setContext] = useState<ADRChatContext | null>(null)
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false)
  const [hasAPIKey, setHasAPIKey] = useState<{ openai: boolean; gemini: boolean }>({ openai: false, gemini: false })
  const [guestAPIKeys, setGuestAPIKeys] = useState<{ openai: string | null; gemini: string | null }>({ openai: null, gemini: null })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load guest API keys from localStorage on mount
  useEffect(() => {
    if (isOpen && !session?.user?.id) {
      loadGuestAPIKeys()
    }
  }, [isOpen, session?.user?.id])

  // Check API keys on mount (for logged-in users)
  useEffect(() => {
    if (isOpen && session?.user?.id) {
      checkAPIKeys()
    } else if (isOpen) {
      // For guests, just check localStorage
      loadGuestAPIKeys()
    }
  }, [isOpen, session?.user?.id])

  // Initialize context and welcome message
  useEffect(() => {
    if (isOpen && !context) {
      const adrContext = AIChatbotService.buildContextFromFormData(formData)
      setContext(adrContext)
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant', 
        content: `🤖 Xin chào! Tôi là AI Consultant chuyên về ADR assessment.\n\nTôi đã phân tích thông tin case của bạn. Bạn có thể hỏi tôi về:\n• Đánh giá mối liên quan thuốc-ADR\n• Phân tích theo thang WHO/Naranjo\n• Gợi ý xử trí lâm sàng\n• Xét nghiệm cần bổ sung\n\nHãy đặt câu hỏi bất kỳ!`,
        timestamp: new Date(),
        metadata: { model: selectedProvider, confidence: 1 }
      }
      
      setMessages([welcomeMessage])
      loadSuggestions(adrContext)
    }
  }, [isOpen, formData])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load guest API keys from localStorage
  const loadGuestAPIKeys = () => {
    try {
      const openaiKey = localStorage.getItem('guest_openai_key')
      const geminiKey = localStorage.getItem('guest_gemini_key')
      
      setGuestAPIKeys({
        openai: openaiKey,
        gemini: geminiKey
      })
      
      setHasAPIKey({
        openai: !!openaiKey,
        gemini: !!geminiKey
      })
    } catch (error) {
      console.error('Failed to load guest API keys:', error)
    }
  }

  // Save guest API key to localStorage
  const saveGuestAPIKey = (provider: 'openai' | 'gemini', apiKey: string) => {
    try {
      localStorage.setItem(`guest_${provider}_key`, apiKey)
      setGuestAPIKeys(prev => ({
        ...prev,
        [provider]: apiKey
      }))
      setHasAPIKey(prev => ({
        ...prev,
        [provider]: true
      }))
    } catch (error) {
      console.error('Failed to save guest API key:', error)
      throw new Error('Không thể lưu API key vào trình duyệt')
    }
  }

  // Check API keys (for logged-in users)
  const checkAPIKeys = async () => {
    if (!session?.user?.id) {
      console.log('No session, checking guest keys instead')
      loadGuestAPIKeys()
      return
    }

    try {
      const keys = await UserAPIKeyService.getUserAPIKeys()
      setHasAPIKey({
        openai: keys.some(k => k.provider === 'openai' && k.is_active && k.is_valid),
        gemini: keys.some(k => k.provider === 'gemini' && k.is_active && k.is_valid)
      })
    } catch (error) {
      console.error('Failed to check API keys:', error)
      // Don't show error to user, just log it
    }
  }

  // Load quick suggestions
  const loadSuggestions = async (ctx: ADRChatContext) => {
    try {
      const quickSuggestions = await AIChatbotService.getQuickSuggestions(ctx)
      setSuggestions(quickSuggestions)
    } catch (error) {
      console.error('Failed to load suggestions:', error)
    }
  }

  // Send message to AI
  const sendMessage = async (messageText: string = input) => {
    if (!messageText.trim() || !context || isLoading) return

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      const provider = selectedProvider === 'chatgpt' ? 'openai' : 'gemini'
      const isGuest = !session?.user?.id
      
      // Check if guest has API key
      if (isGuest) {
        const guestKey = provider === 'openai' ? guestAPIKeys.openai : guestAPIKeys.gemini
        
        if (!guestKey) {
          const errorMessage: ChatMessage = {
            id: `error_${Date.now()}`,
            role: 'assistant',
            content: `❌ Chưa có API key cho ${provider.toUpperCase()}\n\n🔑 **Cách khắc phục:**\nBạn cần thêm API key để sử dụng AI chatbot.`,
            timestamp: new Date(),
            metadata: { model: selectedProvider, confidence: 0, needsSetup: true, setupProvider: provider }
          }
          setMessages(prev => [...prev, errorMessage])
          setIsLoading(false)
          setIsTyping(false)
          return
        }

        // Guest mode: call AI directly from client
        const aiResponse = await AIChatbotService.sendMessageWithUserKey(
          messageText,
          context,
          provider,
          guestKey,
          messages
        )

        setMessages(prev => [...prev, aiResponse])
        
      } else {
        // Logged-in mode: use server API
        const response = await fetch('/api/ai/chatbot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageText,
            context,
            provider,
            chatHistory: messages
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          // Check if error is due to missing API key
          if (result.needsAPIKey) {
            const errorMessage: ChatMessage = {
              id: `error_${Date.now()}`,
              role: 'assistant',
              content: `❌ ${result.error}\n\n🔑 **Cách khắc phục:**\nBạn cần thêm API key cho ${result.provider.toUpperCase()} để sử dụng AI chatbot.`,
              timestamp: new Date(),
              metadata: { model: selectedProvider, confidence: 0, needsSetup: true, setupProvider: result.provider }
            }
            setMessages(prev => [...prev, errorMessage])
            return
          }
          
          throw new Error(result.error || 'Có lỗi xảy ra')
        }

        // Add successful response with API key info
        const responseWithInfo: ChatMessage = {
          ...result.data.aiResponse,
          content: result.data.aiResponse.content + `\n\n*🔑 Sử dụng: ${result.data.apiKeyUsed}*`
        }

        setMessages(prev => [...prev, responseWithInfo])
      }
      
    } catch (error) {
      console.error('Chat Error:', error)
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi chat với AI')
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: '❌ Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại sau.',
        timestamp: new Date(),
        metadata: { model: selectedProvider, confidence: 0 }
      }
      setMessages(prev => [...prev, errorMessage])
      
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Use suggestion
  const useSuggestion = (suggestion: string) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }

  // Apply insight to form
  const handleApplyInsight = (message: ChatMessage) => {
    if (onApplyInsight) {
      onApplyInsight(message.content)
      toast.success('Đã áp dụng insight từ AI vào form!')
    }
  }

  // Clear chat
  const clearChat = () => {
    setMessages(messages.filter(m => m.id === 'welcome'))
    setInput('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <ChatBubbleLeftRightIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                AI Medical Consultant
                {!session?.user?.id && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    👤 Guest Mode
                  </span>
                )}
                {(selectedProvider === 'chatgpt' ? hasAPIKey.openai : hasAPIKey.gemini) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <CheckCircleIcon className="w-3 h-3" />
                    API Ready
                  </span>
                )}
                {!(selectedProvider === 'chatgpt' ? hasAPIKey.openai : hasAPIKey.gemini) && (
                  <button
                    onClick={() => setShowAPIKeyModal(true)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-full text-xs font-medium transition-colors"
                  >
                    <KeyIcon className="w-3 h-3" />
                    Setup Key
                  </button>
                )}
              </h3>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-white rounded-full text-xs font-medium">
                  {selectedProvider === 'chatgpt' ? '🤖 ChatGPT' : '✨ Gemini'}
                </span>
                {isTyping && (
                  <span className="text-blue-600 animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="ml-1">đang gõ</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Provider Toggle */}
            <div className="flex bg-white rounded-xl p-1 shadow-sm border">
              <button
                onClick={() => setSelectedProvider('chatgpt')}
                className={`px-4 py-2 text-sm rounded-lg font-semibold transition-all duration-200 ${
                  selectedProvider === 'chatgpt' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                ChatGPT
              </button>
              <button
                onClick={() => setSelectedProvider('gemini')}
                className={`px-4 py-2 text-sm rounded-lg font-semibold transition-all duration-200 ${
                  selectedProvider === 'gemini' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Gemini
              </button>
            </div>

            <button
              onClick={clearChat}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Xóa chat
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
              title="Đóng"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Chat Area - Scrollable */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          
          {/* Messages Column */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Messages - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
              {messages.map((message) => (
                <MessageBubble 
                  key={message.id} 
                  message={message}
                  onApplyInsight={() => handleApplyInsight(message)}
                  showApply={message.role === 'assistant' && !!onApplyInsight}
                  onSetupAPIKey={(provider) => {
                    setSelectedProvider(provider === 'gemini' ? 'gemini' : 'chatgpt')
                    setShowAPIKeyModal(true)
                  }}
                />
              ))}
              {isTyping && (
                <div className="flex items-center space-x-3 text-gray-500 pl-4">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm font-medium">AI đang suy nghĩ...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Fixed */}
            <div className="flex-shrink-0 border-t bg-white px-6 py-4">
              <div className="flex gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Đặt câu hỏi về case ADR này... (Enter để gửi, Shift+Enter để xuống dòng)"
                  rows={3}
                  className="flex-1 resize-none border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="self-end px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Đang gửi</span>
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-5 h-5" />
                      <span>Gửi</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar - Scrollable */}
          <div className="w-80 border-l bg-gradient-to-b from-gray-50 to-white flex-shrink-0 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Guest Mode Notice */}
              {!session?.user?.id && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-blue-600" />
                    Guest Mode
                  </h4>
                  <p className="text-xs text-gray-700 mb-3">
                    Bạn đang dùng chế độ Guest. API key sẽ lưu tạm trong trình duyệt.
                  </p>
                  <p className="text-xs text-blue-800 font-medium">
                    💡 Đăng nhập để lưu key vĩnh viễn và sync trên nhiều thiết bị!
                  </p>
                </div>
              )}
              
              {/* Quick Suggestions */}
              {suggestions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <LightBulbIcon className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-semibold text-gray-900">Gợi ý câu hỏi</h4>
                  </div>
                  <div className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => useSuggestion(suggestion)}
                        className="w-full text-left p-3 text-sm bg-white border-2 border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all shadow-sm hover:shadow"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Common Questions */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <SparklesIcon className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">Câu hỏi phổ biến</h4>
                </div>
                <div className="space-y-2">
                  {[
                    "Phân tích case này theo WHO-UMC",
                    "Tính điểm Naranjo chi tiết",
                    "Khuyến nghị xử trí lâm sàng",
                    "Cần làm thêm xét nghiệm gì?",
                    "Risk factors cần lưu ý",
                    "Follow-up plan cho bệnh nhân"
                  ].map((question, index) => (
                    <button
                      key={index}
                      onClick={() => useSuggestion(question)}
                      className="w-full text-left p-3 text-sm text-gray-700 bg-white hover:bg-purple-50 hover:text-purple-900 rounded-lg transition-all border border-transparent hover:border-purple-200"
                    >
                      • {question}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Info */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 text-purple-600" />
                  Về AI Consultant
                </h4>
                <div className="text-xs text-gray-700 space-y-2">
                  <p className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Dựa trên WHO-UMC & Naranjo</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Trained on medical literature</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-yellow-600">⚠</span>
                    <span>Chỉ mang tính tham khảo</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-yellow-600">⚠</span>
                    <span>Cần expert review cuối cùng</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Key Setup Modal */}
      {showAPIKeyModal && (
        <APIKeySetupModal
          provider={selectedProvider === 'chatgpt' ? 'openai' : 'gemini'}
          isGuest={!session?.user?.id}
          onClose={() => setShowAPIKeyModal(false)}
          onSuccess={(apiKey) => {
            if (!session?.user?.id) {
              // Guest mode: save to localStorage
              saveGuestAPIKey(selectedProvider === 'chatgpt' ? 'openai' : 'gemini', apiKey)
            }
            setShowAPIKeyModal(false)
            checkAPIKeys()
            toast.success('API key đã được lưu thành công!')
          }}
        />
      )}
    </div>
  )
}

// Message Bubble Component
function MessageBubble({ 
  message, 
  onApplyInsight, 
  showApply,
  onSetupAPIKey 
}: { 
  message: ChatMessage
  onApplyInsight: () => void
  showApply: boolean
  onSetupAPIKey?: (provider: string) => void
}) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  const needsSetup = message.metadata?.needsSetup

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
      
      {/* Avatar */}
      {!isUser && (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg">
          <SparklesIcon className="w-5 h-5" />
        </div>
      )}

      {/* Message Content */}
      <div className={`max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div className={`rounded-2xl shadow-md ${
          isUser 
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md' 
            : isSystem 
            ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 rounded-bl-md'
            : needsSetup
            ? 'bg-gradient-to-r from-red-50 to-orange-50 text-gray-800 border-2 border-red-200 rounded-bl-md'
            : 'bg-white text-gray-800 border-2 border-gray-100 rounded-bl-md'
        }`}>
          <div className="p-4">
            <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
              {message.content}
            </div>
            
            {/* Setup API Key Button */}
            {needsSetup && onSetupAPIKey && (
              <div className="mt-4">
                <button
                  onClick={() => onSetupAPIKey(message.metadata?.setupProvider || 'openai')}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <KeyIcon className="w-5 h-5" />
                  Setup API Key Ngay
                </button>
              </div>
            )}
          </div>
          
          {/* AI Metadata */}
          {!isUser && message.metadata && !needsSetup && (
            <div className="flex items-center justify-between px-4 pb-3 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <ComputerDesktopIcon className="w-4 h-4" />
                <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                  {message.metadata.model?.toUpperCase()}
                </span>
                {message.metadata.confidence && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                    {Math.round(message.metadata.confidence * 100)}% tin cậy
                  </span>
                )}
              </div>
              
              {showApply && (
                <button
                  onClick={onApplyInsight}
                  className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all shadow-sm hover:shadow"
                >
                  ✨ Áp dụng
                </button>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`flex items-center gap-1.5 mt-1.5 text-xs text-gray-400 ${
          isUser ? 'justify-end' : 'justify-start'
        }`}>
          <ClockIcon className="w-3.5 h-3.5" />
          <span className="font-medium">{new Date(message.timestamp).toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}</span>
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg">
          <UserIcon className="w-5 h-5" />
        </div>
      )}
    </div>
  )
}

// API Key Setup Modal Component
function APIKeySetupModal({ 
  provider,
  isGuest,
  onClose, 
  onSuccess 
}: { 
  provider: 'openai' | 'gemini'
  isGuest: boolean
  onClose: () => void
  onSuccess: (apiKey: string) => void
}) {
  const { data: session } = useSession()
  const [apiKey, setApiKey] = useState('')
  const [keyName, setKeyName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const providerInfo = {
    openai: {
      name: 'OpenAI ChatGPT',
      icon: '🤖',
      placeholder: 'sk-proj-...',
      description: 'Nhập API key từ OpenAI Platform',
      website: 'https://platform.openai.com/api-keys',
      instructions: [
        'Truy cập OpenAI Platform',
        'Đăng nhập hoặc tạo tài khoản',
        'Vào mục "API Keys"',
        'Tạo key mới và copy vào đây'
      ]
    },
    gemini: {
      name: 'Google Gemini',
      icon: '✨',
      placeholder: 'AIzaSy...',
      description: 'Nhập API key từ Google AI Studio',
      website: 'https://aistudio.google.com/app/apikey',
      instructions: [
        'Truy cập Google AI Studio',
        'Đăng nhập với Google account',
        'Nhấn "Get API Key"',
        'Copy key và paste vào đây'
      ]
    }
  }

  const info = providerInfo[provider]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!apiKey.trim()) {
      setError('Vui lòng nhập API key')
      return
    }

    setIsSubmitting(true)

    try {
      if (isGuest) {
        // Guest mode: just validate format and return
        const validation = UserAPIKeyService.getProviderInfo()[provider]
        if (provider === 'openai' && !apiKey.startsWith('sk-')) {
          throw new Error('OpenAI API key phải bắt đầu bằng "sk-"')
        }
        if (provider === 'gemini' && !apiKey.startsWith('AIzaSy')) {
          throw new Error('Gemini API key phải bắt đầu bằng "AIzaSy"')
        }
        
        // Return the key to be saved in localStorage
        onSuccess(apiKey.trim())
      } else {
        // Logged-in mode: save to database
        if (!session?.user?.id) {
          throw new Error('Session không hợp lệ. Vui lòng đăng nhập lại.')
        }
        
        await UserAPIKeyService.addAPIKey({
          provider,
          api_key: apiKey.trim(),
          api_key_name: keyName.trim() || `${info.name} Key`
        })

        onSuccess(apiKey.trim())
      }
    } catch (err) {
      console.error('Error adding API key:', err)
      const errorMessage = err instanceof Error ? err.message : 'Không thể thêm API key'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[99999] p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl backdrop-blur">
                {info.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold">Setup {info.name}</h3>
                <p className="text-sm text-blue-100">{info.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <LightBulbIcon className="w-5 h-5 text-blue-600" />
              Hướng dẫn lấy API Key:
            </h4>
            <ol className="space-y-1 text-sm text-gray-700 ml-7">
              {info.instructions.map((instruction, idx) => (
                <li key={idx} className="list-decimal">{instruction}</li>
              ))}
            </ol>
            <a
              href={info.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Mở {info.name} →
            </a>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={info.placeholder}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* Key Name Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tên Key (tùy chọn)
            </label>
            <input
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder={`Ví dụ: ${info.name} Personal Key`}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={isSubmitting}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              ❌ {error}
            </div>
          )}

          {/* Security Note */}
          {isGuest ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
              <p className="text-sm text-blue-800">
                💾 <strong>Guest Mode:</strong> API key sẽ được lưu trong trình duyệt của bạn (localStorage). 
                Key sẽ bị mất nếu bạn xóa cookies hoặc đổi trình duyệt.
              </p>
              <p className="text-sm text-blue-800">
                ✨ <strong>Khuyến nghị:</strong> Đăng nhập để lưu key vĩnh viễn và đồng bộ trên nhiều thiết bị.
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-800">
                🔒 <strong>Bảo mật:</strong> API key của bạn sẽ được mã hóa và lưu trữ an toàn trong database. 
                Chỉ bạn mới có thể sử dụng key này.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-semibold transition-all"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!apiKey.trim() || isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <KeyIcon className="w-5 h-5" />
                  <span>Lưu API Key</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}









