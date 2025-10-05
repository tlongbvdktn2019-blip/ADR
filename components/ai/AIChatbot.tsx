'use client'

import { useState, useRef, useEffect } from 'react'
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
  ComputerDesktopIcon
} from '@heroicons/react/24/outline'
import { ChatMessage, ADRChatContext, AIChatbotService } from '@/lib/ai-chatbot-service'
import { ADRFormData } from '@/app/reports/new/page'

interface AIChatbotProps {
  isOpen: boolean
  onClose: () => void
  formData: ADRFormData
  onApplyInsight?: (insight: string) => void
}

export default function AIChatbot({ isOpen, onClose, formData, onApplyInsight }: AIChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<'chatgpt' | 'gemini'>('chatgpt')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [context, setContext] = useState<ADRChatContext | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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
      const response = await fetch('/api/ai/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          context,
          provider: selectedProvider === 'chatgpt' ? 'openai' : 'gemini',
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
            content: `❌ ${result.error}\n\n🔑 **Cách khắc phục:**\n1. Nhấn vào "Settings" ở menu\n2. Thêm API key cho ${result.provider.toUpperCase()}\n3. Quay lại đây để chat\n\n💡 **Lưu ý:** API key của bạn sẽ được mã hóa và bảo mật tuyệt đối.`,
            timestamp: new Date(),
            metadata: { model: selectedProvider, confidence: 0, needsSetup: true }
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
              <h3 className="text-lg font-bold text-gray-900">AI Medical Consultant</h3>
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
    </div>
  )
}

// Message Bubble Component
function MessageBubble({ 
  message, 
  onApplyInsight, 
  showApply 
}: { 
  message: ChatMessage
  onApplyInsight: () => void
  showApply: boolean
}) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

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
            : 'bg-white text-gray-800 border-2 border-gray-100 rounded-bl-md'
        }`}>
          <div className="p-4">
            <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
              {message.content}
            </div>
          </div>
          
          {/* AI Metadata */}
          {!isUser && message.metadata && (
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









