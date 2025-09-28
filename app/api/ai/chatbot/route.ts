import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { AIChatbotService, ADRChatContext, ChatMessage } from '@/lib/ai-chatbot-service'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Bạn cần đăng nhập để sử dụng AI Chatbot' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      message, 
      context, 
      provider = 'chatgpt',
      chatHistory = [] 
    }: { 
      message: string
      context: ADRChatContext
      provider?: 'chatgpt' | 'gemini'
      chatHistory?: ChatMessage[]
    } = body

    // Validate input
    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Vui lòng nhập câu hỏi' },
        { status: 400 }
      )
    }

    if (!context) {
      return NextResponse.json(
        { error: 'Thiếu context thông tin ADR' },
        { status: 400 }
      )
    }

    // Check rate limit
    const canProceed = await AIChatbotService.checkRateLimit(session.user?.email || '')
    if (!canProceed) {
      return NextResponse.json(
        { error: 'Bạn đã vượt quá giới hạn sử dụng. Vui lòng thử lại sau.' },
        { status: 429 }
      )
    }

    // Validate AI provider config
    const configCheck = AIChatbotService.validateConfig()
    if (!configCheck.isValid) {
      console.error('Missing AI API keys:', configCheck.missingKeys)
      return NextResponse.json(
        { error: 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.' },
        { status: 503 }
      )
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    }

    // Get AI response
    const aiResponse = await AIChatbotService.sendMessage(
      message,
      context,
      provider,
      chatHistory
    )

    // Log interaction for audit
    console.log(`AI Chatbot used by ${session.user?.email}:`, {
      provider,
      messageLength: message.length,
      responseLength: aiResponse.content.length,
      confidence: aiResponse.metadata?.confidence
    })

    return NextResponse.json({
      success: true,
      data: {
        userMessage,
        aiResponse,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('AI Chatbot API Error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tư vấn với AI'
    
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false 
      },
      { status: 500 }
    )
  }
}

// GET endpoint for quick suggestions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const contextString = searchParams.get('context')
    
    if (!contextString) {
      return NextResponse.json(
        { error: 'Missing context parameter' },
        { status: 400 }
      )
    }

    const context: ADRChatContext = JSON.parse(decodeURIComponent(contextString))
    const suggestions = await AIChatbotService.getQuickSuggestions(context)

    return NextResponse.json({
      success: true,
      data: { suggestions }
    })

  } catch (error) {
    console.error('Chatbot Suggestions Error:', error)
    return NextResponse.json(
      { error: 'Không thể tạo gợi ý' },
      { status: 500 }
    )
  }
}



