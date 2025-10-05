import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { AIChatbotService, ADRChatContext, ChatMessage } from '@/lib/ai-chatbot-service'
import { UserAPIKeyServer } from '@/lib/user-api-key-server'
import { getUserIdFromSession } from '@/lib/get-or-create-user'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

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
      provider = 'gemini',
      chatHistory = [] 
    }: { 
      message: string
      context: ADRChatContext
      provider?: 'openai' | 'gemini'
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

    // Get user's API key for selected provider
    const supabase = createServerComponentClient({ cookies })
    const userId = await getUserIdFromSession(session)

    if (!userId) {
      return NextResponse.json(
        { error: 'Không thể xác định người dùng' },
        { status: 500 }
      )
    }

    let userAPIKey
    try {
      userAPIKey = await UserAPIKeyServer.getActiveAPIKeyForProvider(userId, provider)
    } catch (error) {
      console.error('Failed to get user API key:', error)
      return NextResponse.json(
        { error: 'Không thể truy cập API key của bạn' },
        { status: 500 }
      )
    }

    if (!userAPIKey) {
      return NextResponse.json(
        { 
          error: `Bạn chưa cấu hình API key cho ${provider.toUpperCase()}. Vui lòng vào Settings để thêm API key.`,
          needsAPIKey: true,
          provider: provider
        },
        { status: 400 }
      )
    }

    if (!userAPIKey.is_valid) {
      return NextResponse.json(
        { 
          error: `API key ${provider.toUpperCase()} của bạn không hợp lệ. Vui lòng kiểm tra lại trong Settings.`,
          needsAPIKey: true,
          provider: provider
        },
        { status: 400 }
      )
    }

    // Check rate limit (can be more generous since user uses their own key)
    const canProceed = await AIChatbotService.checkRateLimit(session.user?.email || '')
    if (!canProceed) {
      return NextResponse.json(
        { error: 'Bạn đã vượt quá giới hạn sử dụng. Vui lòng thử lại sau.' },
        { status: 429 }
      )
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    }

    // Get AI response using user's API key
    const aiResponse = await AIChatbotService.sendMessageWithUserKey(
      message,
      context,
      provider,
      UserAPIKeyServer.decryptAPIKey(userAPIKey.api_key_encrypted),
      chatHistory
    )

    // Log interaction for audit
    console.log(`AI Chatbot used by ${session.user?.email}:`, {
      provider,
      apiKeyId: userAPIKey.id,
      messageLength: message.length,
      responseLength: aiResponse.content.length,
      confidence: aiResponse.metadata?.confidence
    })

    // Track usage (optional)
    try {
      await trackUserAIUsage(userId, userAPIKey.id, provider, aiResponse.metadata?.tokens_used || 0)
    } catch (error) {
      console.error('Failed to track usage:', error)
      // Don't fail the request if usage tracking fails
    }

    return NextResponse.json({
      success: true,
      data: {
        userMessage,
        aiResponse,
        timestamp: new Date().toISOString(),
        apiKeyUsed: userAPIKey.api_key_name || `${provider.toUpperCase()} Key`
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

// Helper function to track user AI usage
async function trackUserAIUsage(userId: string, apiKeyId: string, provider: 'openai' | 'gemini', tokensUsed: number) {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    // Check if usage record exists for today
    const today = new Date().toISOString().split('T')[0]
    
    const { data: existingUsage, error: fetchError } = await supabase
      .from('user_ai_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('api_key_id', apiKeyId)
      .eq('usage_date', today)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    if (existingUsage) {
      // Update existing record
      await supabase
        .from('user_ai_usage')
        .update({
          tokens_used: existingUsage.tokens_used + tokensUsed,
          request_count: existingUsage.request_count + 1,
          cost_estimate: calculateCostEstimate(provider, existingUsage.tokens_used + tokensUsed)
        })
        .eq('id', existingUsage.id)
    } else {
      // Create new record
      await supabase
        .from('user_ai_usage')
        .insert({
          user_id: userId,
          api_key_id: apiKeyId,
          provider: provider,
          tokens_used: tokensUsed,
          request_count: 1,
          cost_estimate: calculateCostEstimate(provider, tokensUsed),
          usage_date: today
        })
    }
  } catch (error) {
    console.error('Error tracking AI usage:', error)
    // Don't throw - usage tracking is optional
  }
}

// Helper function to estimate costs
function calculateCostEstimate(provider: 'openai' | 'gemini', tokensUsed: number): number {
  if (provider === 'openai') {
    // Rough estimate for GPT-4: $0.03 per 1K tokens
    return (tokensUsed / 1000) * 0.03
  } else if (provider === 'gemini') {
    // Gemini is free up to limits
    return 0
  }
  return 0
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



