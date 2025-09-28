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
          provider: selectedProvider,
          chatHistory: messages
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra')
      }

      setMessages(prev => [...prev, result.data.aiResponse])
      
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Medical Consultant</h3>
              <p className="text-sm text-gray-600">
                Powered by {selectedProvider === 'chatgpt' ? 'ChatGPT' : 'Gemini'}
                {isTyping && <span className="ml-2 text-blue-600">🤖 đang gõ...</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Provider Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSelectedProvider('chatgpt')}
                className={`px-3 py-1 text-sm rounded font-medium transition-colors ${
                  selectedProvider === 'chatgpt' 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                ChatGPT
              </button>
              <button
                onClick={() => setSelectedProvider('gemini')}
                className={`px-3 py-1 text-sm rounded font-medium transition-colors ${
                  selectedProvider === 'gemini' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Gemini
              </button>
            </div>

            <Button variant="outline" onClick={clearChat} className="text-xs">
              Xóa chat
            </Button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex">
          
          {/* Messages */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <MessageBubble 
                  key={message.id} 
                  message={message}
                  onApplyInsight={() => handleApplyInsight(message)}
                  showApply={message.role === 'assistant' && !!onApplyInsight}
                />
              ))}
              {isTyping && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm">AI đang suy nghĩ...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex space-x-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Hỏi AI về case ADR này..."
                  rows={2}
                  className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="self-end bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <PaperAirplaneIcon className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar - Quick Suggestions */}
          <div className="w-80 border-l bg-gray-50 p-4 overflow-y-auto">
            <div className="space-y-4">
              
              {/* Quick Suggestions */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <LightBulbIcon className="w-4 h-4 text-yellow-600" />
                  <h4 className="font-medium text-gray-900">Gợi ý câu hỏi</h4>
                </div>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => useSuggestion(suggestion)}
                      className="w-full text-left p-2 text-sm bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Common Questions */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <SparklesIcon className="w-4 h-4 text-purple-600" />
                  <h4 className="font-medium text-gray-900">Câu hỏi phổ biến</h4>
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
                      className="w-full text-left p-2 text-sm text-gray-700 hover:bg-white hover:shadow-sm rounded transition-colors"
                    >
                      • {question}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Info */}
              <div className="bg-white p-3 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-2">Về AI Consultant</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• Dựa trên WHO-UMC & Naranjo</p>
                  <p>• Trained on medical literature</p>
                  <p>• Chỉ mang tính tham khảo</p>
                  <p>• Cần expert review cuối cùng</p>
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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isUser ? 'order-2' : 'order-1'}`}>
        
        {/* Message Content */}
        <div className={`p-3 rounded-2xl ${
          isUser 
            ? 'bg-blue-600 text-white rounded-br-sm' 
            : isSystem 
            ? 'bg-gray-100 text-gray-800 rounded-bl-sm'
            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
        }`}>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </div>
          
          {/* AI Metadata */}
          {!isUser && message.metadata && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <ComputerDesktopIcon className="w-3 h-3" />
                <span>{message.metadata.model?.toUpperCase()}</span>
                {message.metadata.confidence && (
                  <span>• {Math.round(message.metadata.confidence * 100)}% confidence</span>
                )}
              </div>
              
              {showApply && (
                <Button
                  onClick={onApplyInsight}
                  variant="outline"
                  className="text-xs px-2 py-1 h-auto"
                >
                  Áp dụng
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`flex items-center space-x-1 mt-1 text-xs text-gray-400 ${
          isUser ? 'justify-end' : 'justify-start'
        }`}>
          <ClockIcon className="w-3 h-3" />
          <span>{new Date(message.timestamp).toLocaleTimeString('vi-VN')}</span>
        </div>
      </div>

      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser 
          ? 'bg-blue-600 text-white ml-2 order-3' 
          : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white mr-2'
      }`}>
        {isUser ? <UserIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
      </div>
    </div>
  )
}









