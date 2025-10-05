import { createClient } from '@supabase/supabase-js'
import { UserAPIKey, APIKeyInput, APIKeyTestResult, APIKeyValidationResult } from '@/types/user-api-keys'

/**
 * Get Supabase admin client (bypasses RLS)
 */
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Server-side utility for User API Key operations
 * This should ONLY be used in API routes, not in client components
 */
export class UserAPIKeyServer {
  private static readonly ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET || 'default-key-change-in-production'

  /**
   * Encrypt API key
   */
  static encryptAPIKey(apiKey: string): string {
    try {
      return Buffer.from(apiKey).toString('base64')
    } catch (error) {
      console.error('Encryption error:', error)
      throw new Error('Failed to encrypt API key')
    }
  }

  /**
   * Decrypt API key
   */
  static decryptAPIKey(encryptedKey: string): string {
    try {
      return Buffer.from(encryptedKey, 'base64').toString('utf-8')
    } catch (error) {
      console.error('Decryption error:', error)
      throw new Error('Failed to decrypt API key')
    }
  }

  /**
   * Get all API keys for a user
   */
  static async getUserAPIKeys(userId: string): Promise<UserAPIKey[]> {
    const supabase = getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('user_ai_keys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user API keys:', error)
      throw new Error('Failed to fetch API keys')
    }

    return data || []
  }

  /**
   * Add new API key
   */
  static async addAPIKey(userId: string, keyInput: APIKeyInput): Promise<UserAPIKey> {
    const supabase = getSupabaseAdmin()
    
    // Encrypt API key
    const encryptedKey = this.encryptAPIKey(keyInput.api_key)

    console.log('Attempting to add API key for user:', userId)

    const { data, error } = await supabase
      .from('user_ai_keys')
      .insert({
        user_id: userId,
        provider: keyInput.provider,
        api_key_encrypted: encryptedKey,
        api_key_name: keyInput.api_key_name || `${keyInput.provider.toUpperCase()} Key`,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding API key - Full error:', JSON.stringify(error, null, 2))
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      throw new Error(`Failed to add API key: ${error.message}`)
    }

    return data
  }

  /**
   * Update API key
   */
  static async updateAPIKey(userId: string, keyId: string, updates: Partial<APIKeyInput & { is_active: boolean }>): Promise<UserAPIKey> {
    const supabase = getSupabaseAdmin()
    
    const updateData: any = { ...updates }
    
    // If updating the actual key, encrypt it
    if (updates.api_key) {
      updateData.api_key_encrypted = this.encryptAPIKey(updates.api_key)
      delete updateData.api_key
    }

    const { data, error } = await supabase
      .from('user_ai_keys')
      .update(updateData)
      .eq('id', keyId)
      .eq('user_id', userId) // Ensure user owns this key
      .select()
      .single()

    if (error) {
      console.error('Error updating API key:', error)
      throw new Error('Failed to update API key')
    }

    return data
  }

  /**
   * Delete API key
   */
  static async deleteAPIKey(userId: string, keyId: string): Promise<void> {
    const supabase = getSupabaseAdmin()
    
    const { error } = await supabase
      .from('user_ai_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', userId) // Ensure user owns this key

    if (error) {
      console.error('Error deleting API key:', error)
      throw new Error('Failed to delete API key')
    }
  }

  /**
   * Test API key
   */
  static async testAPIKey(userId: string, keyId: string): Promise<APIKeyTestResult> {
    const supabase = getSupabaseAdmin()
    
    // Get the API key
    const { data: keyData, error } = await supabase
      .from('user_ai_keys')
      .select('*')
      .eq('id', keyId)
      .eq('user_id', userId)
      .single()

    if (error || !keyData) {
      throw new Error('API key not found')
    }

    const startTime = Date.now()
    
    try {
      // Decrypt API key
      const apiKey = this.decryptAPIKey(keyData.api_key_encrypted)
      
      // Test the API key with respective provider
      let testResult: APIKeyValidationResult
      
      if (keyData.provider === 'openai') {
        testResult = await this.testOpenAIKey(apiKey)
      } else if (keyData.provider === 'gemini') {
        testResult = await this.testGeminiKey(apiKey)
      } else {
        throw new Error('Unsupported provider')
      }

      const responseTime = Date.now() - startTime

      const result: APIKeyTestResult = {
        success: testResult.isValid,
        error: testResult.error,
        tested_at: new Date().toISOString(),
        model_used: testResult.model,
        response_time_ms: responseTime,
        tokens_used: testResult.usage?.tokens_used
      }

      // Update the key with test results
      await supabase
        .from('user_ai_keys')
        .update({
          is_valid: testResult.isValid,
          last_tested_at: result.tested_at,
          test_result: result
        })
        .eq('id', keyId)

      return result

    } catch (error) {
      const result: APIKeyTestResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        tested_at: new Date().toISOString(),
        response_time_ms: Date.now() - startTime
      }

      // Update the key with failure
      await supabase
        .from('user_ai_keys')
        .update({
          is_valid: false,
          last_tested_at: result.tested_at,
          test_result: result
        })
        .eq('id', keyId)

      return result
    }
  }

  /**
   * Test OpenAI API key
   */
  private static async testOpenAIKey(apiKey: string): Promise<APIKeyValidationResult> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 5
        })
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          isValid: false,
          error: error.error?.message || 'OpenAI API key validation failed'
        }
      }

      const data = await response.json()
      
      return {
        isValid: true,
        provider: 'openai',
        model: data.model,
        usage: {
          tokens_used: data.usage?.total_tokens || 0,
          response_time_ms: 0
        }
      }

    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'OpenAI test failed'
      }
    }
  }

  /**
   * List available Gemini models for an API key
   */
  private static async listGeminiModels(apiKey: string): Promise<string[]> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      // Filter only models that support generateContent
      const models = data.models
        ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        ?.map((m: any) => m.name.replace('models/', '')) || []
      
      return models
    } catch (error) {
      console.error('Error listing Gemini models:', error)
      return []
    }
  }

  /**
   * Test Gemini API key
   */
  private static async testGeminiKey(apiKey: string): Promise<APIKeyValidationResult> {
    try {
      // First, try to list available models
      const availableModels = await this.listGeminiModels(apiKey)
      
      // If we can list models, try to use the first available one
      const modelsToTry = availableModels.length > 0 
        ? availableModels 
        : [
            'gemini-1.5-flash-latest',
            'gemini-1.5-flash',
            'gemini-1.5-pro-latest',
            'gemini-1.5-pro',
            'gemini-pro'
          ]

      let lastError = ''

      for (const modelName of modelsToTry) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: 'Hi' }]
              }],
              generationConfig: {
                maxOutputTokens: 10
              }
            })
          })

          if (response.ok) {
            return {
              isValid: true,
              provider: 'gemini',
              model: modelName,
              usage: {
                tokens_used: 5,
                response_time_ms: 0
              }
            }
          }

          const error = await response.json()
          lastError = error.error?.message || response.statusText
          
          // Check for rate limit specifically during testing
          if (response.status === 429 || lastError.includes('quota') || lastError.includes('exhausted')) {
            return {
              isValid: false,
              error: `⚠️ Đã đạt giới hạn Gemini API (${lastError}). Free tier: 60 requests/phút, 1500/ngày. Vui lòng chờ và thử lại.`
            }
          }
          
          continue

        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown error'
          continue
        }
      }

      // All models failed
      return {
        isValid: false,
        error: availableModels.length > 0 
          ? `Không thể sử dụng các models: ${availableModels.join(', ')}. Lỗi: ${lastError}`
          : `Vui lòng kiểm tra: 1) API key đã được tạo đúng chưa? 2) Đã enable "Generative Language API" trên Google Cloud chưa? Lỗi: ${lastError}`
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Gemini test failed'
      }
    }
  }

  /**
   * Get active API key for provider
   */
  static async getActiveAPIKeyForProvider(userId: string, provider: 'openai' | 'gemini'): Promise<UserAPIKey | null> {
    const supabase = getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('user_ai_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .eq('is_valid', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching active API key:', error)
      return null
    }

    return data || null
  }
}
