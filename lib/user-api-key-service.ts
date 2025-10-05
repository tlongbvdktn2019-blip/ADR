import { UserAPIKey, APIKeyInput, APIKeyTestResult, APIKeyValidationResult } from '@/types/user-api-keys'

export class UserAPIKeyService {
  // Encryption key - should be stored securely in environment
  private static readonly ENCRYPTION_KEY = process.env.NEXT_PUBLIC_API_KEY_ENCRYPTION_KEY || 'default-key-change-in-production'

  /**
   * Simple encryption for API keys (use proper encryption in production)
   */
  private static encryptAPIKey(apiKey: string): string {
    try {
      // In production, use proper encryption like crypto-js or similar
      // This is a simple base64 encoding for demo purposes
      return Buffer.from(apiKey).toString('base64')
    } catch (error) {
      console.error('Encryption error:', error)
      throw new Error('Failed to encrypt API key')
    }
  }

  /**
   * Simple decryption for API keys
   */
  private static decryptAPIKey(encryptedKey: string): string {
    try {
      return Buffer.from(encryptedKey, 'base64').toString('utf-8')
    } catch (error) {
      console.error('Decryption error:', error)
      throw new Error('Failed to decrypt API key')
    }
  }

  /**
   * Get all API keys for current user
   */
  static async getUserAPIKeys(): Promise<UserAPIKey[]> {
    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch API keys')
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Error fetching user API keys:', error)
      throw error
    }
  }

  /**
   * Get active API key for specific provider (used server-side)
   */
  static async getActiveAPIKey(userId: string, provider: 'openai' | 'gemini'): Promise<UserAPIKey | null> {
    // This method is only used server-side in API routes
    // Client-side should use getUserAPIKeys() and filter
    const keys = await this.getUserAPIKeys()
    return keys.find(k => k.provider === provider && k.is_active && k.is_valid) || null
  }

  /**
   * Add new API key for user
   */
  static async addAPIKey(keyInput: APIKeyInput): Promise<UserAPIKey> {
    // Validate API key format
    const validation = this.validateAPIKeyFormat(keyInput.api_key, keyInput.provider)
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid API key format')
    }

    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: keyInput.provider,
          api_key: keyInput.api_key,
          api_key_name: keyInput.api_key_name || `${keyInput.provider.toUpperCase()} Key`
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add API key')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error adding API key:', error)
      throw error
    }
  }

  /**
   * Update API key
   */
  static async updateAPIKey(keyId: string, updates: Partial<APIKeyInput & { is_active: boolean }>): Promise<UserAPIKey> {
    try {
      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update API key')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error updating API key:', error)
      throw error
    }
  }

  /**
   * Delete API key
   */
  static async deleteAPIKey(keyId: string): Promise<void> {
    try {
      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete API key')
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
      throw error
    }
  }

  /**
   * Test API key validity
   */
  static async testAPIKey(keyId: string): Promise<APIKeyTestResult> {
    try {
      const response = await fetch(`/api/user/api-keys/${keyId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to test API key')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error testing API key:', error)
      throw error
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
          response_time_ms: 0 // Will be calculated by caller
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
      const availableModels = await this.listGeminiModels(apiKey)
      
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
          
          // Check for rate limit
          if (response.status === 429 || lastError.includes('quota') || lastError.includes('exhausted')) {
            return {
              isValid: false,
              error: `⚠️ Đã đạt giới hạn Gemini API. Free tier: 60 requests/phút, 1500/ngày. Vui lòng chờ và thử lại.`
            }
          }
          
          continue

        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown error'
          continue
        }
      }

      return {
        isValid: false,
        error: availableModels.length > 0 
          ? `Không thể sử dụng models: ${availableModels.join(', ')}. Lỗi: ${lastError}`
          : `Vui lòng enable "Generative Language API" trên Google AI Studio. Lỗi: ${lastError}`
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Gemini test failed'
      }
    }
  }

  /**
   * Validate API key format
   */
  private static validateAPIKeyFormat(apiKey: string, provider: 'openai' | 'gemini'): { isValid: boolean; error?: string } {
    if (!apiKey || typeof apiKey !== 'string') {
      return { isValid: false, error: 'API key is required' }
    }

    if (provider === 'openai') {
      if (!apiKey.startsWith('sk-')) {
        return { isValid: false, error: 'OpenAI API key must start with "sk-"' }
      }
      if (apiKey.length < 48) {
        return { isValid: false, error: 'OpenAI API key is too short' }
      }
    } else if (provider === 'gemini') {
      if (!apiKey.startsWith('AIzaSy')) {
        return { isValid: false, error: 'Gemini API key must start with "AIzaSy"' }
      }
      if (apiKey.length < 35) {
        return { isValid: false, error: 'Gemini API key is too short' }
      }
    }

    return { isValid: true }
  }

  /**
   * Get decrypted API key for internal use (server-side only)
   */
  static getDecryptedAPIKey(encryptedKey: string): string {
    return this.decryptAPIKey(encryptedKey)
  }

  /**
   * Get provider information for UI
   */
  static getProviderInfo(): Record<string, any> {
    return {
      openai: {
        name: 'OpenAI ChatGPT',
        description: 'Advanced AI with excellent reasoning capabilities',
        website: 'https://platform.openai.com/api-keys',
        pricing: 'Pay per use (~$0.002/1K tokens)',
        free_tier: '$5 free credits for new accounts',
        api_key_format: 'sk-proj-xxxxxxxxxxxxxxxxxx',
        setup_guide: '/docs/openai-setup'
      },
      gemini: {
        name: 'Google Gemini',
        description: 'Fast and efficient AI with good medical knowledge',
        website: 'https://aistudio.google.com/app/apikey',
        pricing: 'Free tier available',
        free_tier: '60 requests/minute, 1500/day',
        api_key_format: 'AIzaSyxxxxxxxxxxxxxxxxxx',
        setup_guide: '/docs/gemini-setup'
      }
    }
  }
}
