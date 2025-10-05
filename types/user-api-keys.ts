// User API Keys Management Types
import { ADRChatContext, ChatMessage } from '@/lib/ai-chatbot-service'

export interface UserAPIKey {
  id: string
  user_id: string
  provider: 'openai' | 'gemini'
  api_key_encrypted: string
  api_key_name?: string
  is_active: boolean
  is_valid?: boolean | null
  last_tested_at?: string
  test_result?: APIKeyTestResult
  created_at: string
  updated_at: string
}

export interface APIKeyTestResult {
  success: boolean
  error?: string
  tested_at: string
  model_used?: string
  response_time_ms?: number
  tokens_used?: number
}

export interface APIKeyInput {
  provider: 'openai' | 'gemini'
  api_key: string // Plain text, will be encrypted before storage
  api_key_name?: string
}

export interface UserAIUsage {
  id: string
  user_id: string
  api_key_id: string
  provider: 'openai' | 'gemini'
  tokens_used: number
  request_count: number
  cost_estimate: number
  usage_date: string
  created_at: string
}

export interface AIProviderInfo {
  provider: 'openai' | 'gemini'
  name: string
  description: string
  website: string
  pricing: string
  free_tier: string
  api_key_format: string
  setup_guide: string
}

export interface APIKeyValidationResult {
  isValid: boolean
  error?: string
  provider?: 'openai' | 'gemini'
  model?: string
  usage?: {
    tokens_used: number
    response_time_ms: number
  }
}

// Chat context with user's API keys
export interface UserChatContext extends ADRChatContext {
  userAPIKeys: {
    openai?: UserAPIKey
    gemini?: UserAPIKey
  }
  selectedProvider?: 'openai' | 'gemini'
}

// API request with user's API key
export interface ChatbotRequestWithUserKey {
  message: string
  context: ADRChatContext
  provider: 'openai' | 'gemini'
  userAPIKeyId: string // Reference to user's API key
  chatHistory?: ChatMessage[]
}

