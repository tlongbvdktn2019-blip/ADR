import { ADRFormData } from '@/app/reports/new/page'

// Types for AI Chatbot
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    model?: 'chatgpt' | 'gemini' | 'openai'
    confidence?: number
    sources?: string[]
    tokens_used?: number
    needsSetup?: boolean
    setupProvider?: string
  }
}

export interface ChatSession {
  id: string
  reportId?: string
  messages: ChatMessage[]
  context: ADRChatContext
  createdAt: Date
  updatedAt: Date
}

export interface ADRChatContext {
  patientInfo: {
    age?: number
    gender?: string
    weight?: number
    medicalHistory?: string
  }
  adrInfo: {
    description: string
    onsetTime?: string
    severity: string
    outcome?: string
    tests?: string
  }
  drugsInfo: {
    suspectedDrugs: Array<{
      name: string
      dosage?: string
      timing?: string
      dechallenge?: string
      rechallenge?: string
    }>
  }
  currentAssessment?: {
    whoLevel?: string
    naranjoScore?: number
    confidence?: number
  }
}

export interface AIProviderConfig {
  openai: {
    apiKey: string
    model: string
    temperature: number
    maxTokens: number
  }
  gemini: {
    apiKey: string
    model: string
    temperature: number
    maxTokens: number
  }
}

export class AIChatbotService {
  private static readonly SYSTEM_PROMPT = `
Bạn là một chuyên gia Dược lâm sàng và Pharmacovigilance với kinh nghiệm 20+ năm về đánh giá ADR (Phản ứng có hại của thuốc).

VAI TRÒ CỦA BẠN:
1. **Chuyên gia ADR Assessment**: Đánh giá mối liên quan thuốc-ADR theo WHO-UMC và Naranjo
2. **Tư vấn Dược lâm sàng**: Trả lời câu hỏi về dược lý, tác dụng phụ, tương tác thuốc
3. **Hỗ trợ Clinical Decision**: Đưa ra gợi ý xử trí và theo dõi
4. **Giáo dục Y khoa**: Giải thích cơ chế, nguyên nhân, yếu tố nguy cơ

PHẠM VI HỖ TRỢ:
✅ Đánh giá ADR theo WHO-UMC/Naranjo (khi có đủ thông tin case)
✅ Tư vấn về tác dụng không mong muốn của thuốc cụ thể
✅ Phân tích cơ chế gây ADR và yếu tố nguy cơ
✅ Gợi ý xử trí lâm sàng và xét nghiệm bổ sung
✅ Giải thích về dechallenge/rechallenge
✅ Tư vấn về tương tác thuốc liên quan đến ADR
✅ Hướng dẫn phòng ngừa và theo dõi

NGUYÊN TẮC TRẢ LỜI:
1. **Linh hoạt theo ngữ cảnh**: 
   - Nếu được hỏi về case cụ thể → Phân tích theo WHO-UMC/Naranjo
   - Nếu được hỏi về thuốc/ADR tổng quát → Cung cấp kiến thức dược lý
   - Nếu được hỏi về xử trí → Đưa ra clinical recommendations
   
2. **Cung cấp thông tin khoa học, có căn cứ**
3. **Nhấn mạnh clinical judgment của bác sĩ**
4. **Cảnh báo limitations và cần expert review khi cần**

ĐỊNH DẠNG TRẢ LỜI:
- Ngắn gọn, dễ hiểu (thường < 300 từ, có thể dài hơn nếu cần giải thích chi tiết)
- Sử dụng bullet points để dễ đọc
- Trích dẫn guidelines/tiêu chuẩn khi phù hợp
- Kết thúc với takeaway hoặc next steps (nếu phù hợp)

NGÔN NGỮ: Tiếng Việt, thuật ngữ y học chính xác
PHONG CÁCH: Chuyên nghiệp, thân thiện, hữu ích

LƯU Ý QUAN TRỌNG:
⚠️ Thông tin chỉ mang tính tham khảo, không thay thế quyết định lâm sàng
⚠️ Luôn khuyến nghị tham khảo chuyên gia khi cần thiết
⚠️ Tuân thủ nguyên tắc "First, do no harm"
  `

  /**
   * Send message to AI chatbot using user's API key
   */
  static async sendMessageWithUserKey(
    message: string,
    context: ADRChatContext,
    provider: 'openai' | 'gemini' = 'gemini',
    userAPIKey: string,
    chatHistory: ChatMessage[] = []
  ): Promise<ChatMessage> {
    try {
      const contextPrompt = this.buildContextPrompt(context)
      const conversationHistory = this.formatChatHistory(chatHistory)
      
      const response = await this.callAIProviderWithUserKey(
        provider,
        message,
        contextPrompt,
        conversationHistory,
        userAPIKey
      )

      return {
        id: this.generateMessageId(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: {
          model: provider,
          confidence: response.confidence || 0.8,
          sources: response.sources || [],
          tokens_used: response.tokens_used || 0
        }
      }

    } catch (error) {
      console.error(`AI Chatbot Error (${provider}):`, error)
      throw new Error(`Lỗi khi tư vấn với ${provider.toUpperCase()}. Vui lòng thử lại.`)
    }
  }

  /**
   * Send message to AI chatbot and get response (original method for backward compatibility)
   */
  static async sendMessage(
    message: string,
    context: ADRChatContext,
    provider: 'chatgpt' | 'gemini' = 'chatgpt',
    chatHistory: ChatMessage[] = []
  ): Promise<ChatMessage> {
    try {
      const contextPrompt = this.buildContextPrompt(context)
      const conversationHistory = this.formatChatHistory(chatHistory)
      
      const response = await this.callAIProvider(
        provider,
        message,
        contextPrompt,
        conversationHistory
      )

      return {
        id: this.generateMessageId(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: {
          model: provider,
          confidence: response.confidence || 0.8,
          sources: response.sources || []
        }
      }

    } catch (error) {
      console.error(`AI Chatbot Error (${provider}):`, error)
      throw new Error(`Lỗi khi tư vấn với ${provider.toUpperCase()}. Vui lòng thử lại.`)
    }
  }

  /**
   * Generate quick suggestions based on ADR data
   */
  static async getQuickSuggestions(context: ADRChatContext): Promise<string[]> {
    const suggestions = []

    // Assessment-related suggestions
    if (!context.currentAssessment) {
      suggestions.push("Hãy phân tích case này theo thang WHO-UMC")
      suggestions.push("Tính điểm Naranjo cho trường hợp này")
    }

    // Drug-specific pharmacology questions
    if (context.drugsInfo.suspectedDrugs.length > 0) {
      const firstDrug = context.drugsInfo.suspectedDrugs[0].name
      if (firstDrug) {
        suggestions.push(`Tác dụng phụ thường gặp của ${firstDrug} là gì?`)
        suggestions.push(`Cơ chế gây ADR của ${firstDrug}?`)
      }
    }

    // Data quality suggestions
    if (!context.adrInfo.onsetTime) {
      suggestions.push("Tầm quan trọng của thông tin thời gian xuất hiện ADR")
    }

    if (!context.adrInfo.tests) {
      suggestions.push("Xét nghiệm nào nên làm để hỗ trợ đánh giá?")
    }

    // Drug-specific suggestions
    if (context.drugsInfo.suspectedDrugs.length > 1) {
      suggestions.push("Làm thế nào để xác định thuốc nào có khả năng gây ADR nhất?")
      suggestions.push("Có tương tác thuốc nào cần lưu ý?")
    }

    // Clinical management
    suggestions.push("Khuyến nghị xử trí lâm sàng cho trường hợp này")
    suggestions.push("Cần theo dõi gì thêm cho bệnh nhân?")
    
    // Risk factors
    suggestions.push("Yếu tố nguy cơ nào làm tăng khả năng ADR?")

    return suggestions.slice(0, 5) // Limit to 5 suggestions
  }

  /**
   * Build context prompt from ADR data
   */
  private static buildContextPrompt(context: ADRChatContext): string {
    let prompt = "THÔNG TIN CASE ADR:\n\n"

    // Patient info
    prompt += "BỆNH NHÂN:\n"
    if (context.patientInfo.age) prompt += `- Tuổi: ${context.patientInfo.age}\n`
    if (context.patientInfo.gender) prompt += `- Giới tính: ${context.patientInfo.gender}\n`
    if (context.patientInfo.weight) prompt += `- Cân nặng: ${context.patientInfo.weight}kg\n`
    if (context.patientInfo.medicalHistory) {
      prompt += `- Tiền sử: ${context.patientInfo.medicalHistory}\n`
    }

    // ADR info
    prompt += "\nPHẢN ỨNG CÓ HẠI:\n"
    prompt += `- Mô tả: ${context.adrInfo.description}\n`
    if (context.adrInfo.onsetTime) {
      prompt += `- Thời gian xuất hiện: ${context.adrInfo.onsetTime}\n`
    }
    prompt += `- Mức độ nghiêm trọng: ${context.adrInfo.severity}\n`
    if (context.adrInfo.outcome) {
      prompt += `- Kết quả: ${context.adrInfo.outcome}\n`
    }
    if (context.adrInfo.tests) {
      prompt += `- Xét nghiệm: ${context.adrInfo.tests}\n`
    }

    // Drugs info
    prompt += "\nTHUỐC NGHI NGỜ:\n"
    context.drugsInfo.suspectedDrugs.forEach((drug, index) => {
      prompt += `${index + 1}. ${drug.name}\n`
      if (drug.dosage) prompt += `   - Liều dùng: ${drug.dosage}\n`
      if (drug.timing) prompt += `   - Thời gian dùng: ${drug.timing}\n`
      if (drug.dechallenge) prompt += `   - Dechallenge: ${drug.dechallenge}\n`
      if (drug.rechallenge) prompt += `   - Rechallenge: ${drug.rechallenge}\n`
    })

    // Current assessment if available
    if (context.currentAssessment) {
      prompt += "\nĐÁNH GIÁ HIỆN TẠI:\n"
      if (context.currentAssessment.whoLevel) {
        prompt += `- WHO: ${context.currentAssessment.whoLevel}\n`
      }
      if (context.currentAssessment.naranjoScore) {
        prompt += `- Naranjo: ${context.currentAssessment.naranjoScore} điểm\n`
      }
      if (context.currentAssessment.confidence) {
        prompt += `- Độ tin cậy: ${context.currentAssessment.confidence}%\n`
      }
    }

    return prompt
  }

  /**
   * Format chat history for AI context
   */
  private static formatChatHistory(messages: ChatMessage[]): string {
    if (messages.length === 0) return ""

    let history = "\nLỊCH SỬ TRAO ĐỔI:\n"
    
    // Only include last 5 messages to avoid token limit
    const recentMessages = messages.slice(-5)
    
    recentMessages.forEach(msg => {
      if (msg.role === 'user') {
        history += `Người dùng: ${msg.content}\n`
      } else if (msg.role === 'assistant') {
        history += `AI: ${msg.content}\n`
      }
    })

    return history
  }

  /**
   * Call AI provider (ChatGPT or Gemini) with user's API key
   */
  private static async callAIProviderWithUserKey(
    provider: 'openai' | 'gemini',
    message: string,
    contextPrompt: string,
    conversationHistory: string,
    userAPIKey: string
  ): Promise<{ content: string; confidence?: number; sources?: string[]; tokens_used?: number }> {
    
    const fullPrompt = `${this.SYSTEM_PROMPT}\n\n${contextPrompt}\n\n${conversationHistory}\n\nCÂU HỎI: ${message}\n\nTRẢ LỜI:`

    if (provider === 'openai') {
      return await this.callOpenAIWithUserKey(fullPrompt, userAPIKey)
    } else {
      return await this.callGeminiWithUserKey(fullPrompt, userAPIKey)
    }
  }

  /**
   * Call AI provider (ChatGPT or Gemini) - original method
   */
  private static async callAIProvider(
    provider: 'chatgpt' | 'gemini',
    message: string,
    contextPrompt: string,
    conversationHistory: string
  ): Promise<{ content: string; confidence?: number; sources?: string[] }> {
    
    const fullPrompt = `${this.SYSTEM_PROMPT}\n\n${contextPrompt}\n\n${conversationHistory}\n\nCÂU HỎI: ${message}\n\nTRẢ LỜI:`

    if (provider === 'chatgpt') {
      return await this.callOpenAI(fullPrompt)
    } else {
      return await this.callGemini(fullPrompt)
    }
  }

  /**
   * OpenAI ChatGPT Integration with user's API key
   */
  private static async callOpenAIWithUserKey(prompt: string, userAPIKey: string): Promise<{ content: string; confidence?: number; tokens_used?: number }> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userAPIKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for medical advice
        max_tokens: 800,
        top_p: 0.9
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      content: data.choices[0]?.message?.content || 'Không thể tạo phản hồi',
      confidence: 0.85, // ChatGPT generally high confidence
      tokens_used: data.usage?.total_tokens || 0
    }
  }

  /**
   * List available Gemini models
   */
  private static async listAvailableGeminiModels(apiKey: string): Promise<string[]> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
      if (!response.ok) return []
      
      const data = await response.json()
      return data.models
        ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        ?.map((m: any) => m.name.replace('models/', '')) || []
    } catch {
      return []
    }
  }

  /**
   * Google Gemini Integration with user's API key
   */
  private static async callGeminiWithUserKey(prompt: string, userAPIKey: string): Promise<{ content: string; confidence?: number; tokens_used?: number }> {
    // Get available models first
    const availableModels = await this.listAvailableGeminiModels(userAPIKey)
    
    // Fallback to common models if can't list
    const modelsToTry = availableModels.length > 0
      ? availableModels
      : ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
    
    let lastError = ''
    let lastResponse: any = null

    for (const modelName of modelsToTry) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${userAPIKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              topK: 40,
              topP: 0.9,
              maxOutputTokens: 800,
            }
          })
        })

        lastResponse = response

        if (response.ok) {
          const data = await response.json()
          
          // Check if response has valid content
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (content) {
            return {
              content,
              confidence: 0.8,
              tokens_used: 0
            }
          }
        }

        // Try to get error message
        try {
          const error = await response.json()
          lastError = error.error?.message || response.statusText
          
          // Check for rate limit errors
          if (response.status === 429 || lastError.includes('quota') || lastError.includes('exhausted') || lastError.includes('rate limit')) {
            throw new Error('⚠️ BẠN ĐÃ ĐẠT GIỚI HẠN GEMINI API!\n\n' +
              '📊 Giới hạn Free Tier:\n' +
              '• 60 requests/phút\n' +
              '• 1,500 requests/ngày\n\n' +
              '⏰ Vui lòng chờ vài phút rồi thử lại.\n\n' +
              '💡 Mẹo: Sử dụng ChatGPT hoặc chờ giới hạn reset.')
          }
        } catch (parseError) {
          // If it's our custom rate limit error, rethrow it
          if (parseError instanceof Error && parseError.message.includes('GIỚI HẠN')) {
            throw parseError
          }
          lastError = response.statusText || 'Unknown error'
        }
        
        continue

      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error'
        continue
      }
    }

    // Provide helpful error message
    const errorMsg = availableModels.length > 0
      ? `Không thể sử dụng các models: ${availableModels.slice(0, 3).join(', ')}. Lỗi: ${lastError}`
      : `Không tìm thấy model Gemini khả dụng. Vui lòng kiểm tra API key hoặc enable Generative Language API. Lỗi: ${lastError}`
    
    throw new Error(errorMsg)
  }

  /**
   * OpenAI ChatGPT Integration (original method)
   */
  private static async callOpenAI(prompt: string): Promise<{ content: string; confidence?: number }> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for medical advice
        max_tokens: 800,
        top_p: 0.9
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      content: data.choices[0]?.message?.content || 'Không thể tạo phản hồi',
      confidence: 0.85 // ChatGPT generally high confidence
    }
  }

  /**
   * Google Gemini Integration  
   */
  private static async callGemini(prompt: string): Promise<{ content: string; confidence?: number }> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    // Get available models first
    const availableModels = await this.listAvailableGeminiModels(apiKey)
    
    const modelsToTry = availableModels.length > 0
      ? availableModels
      : ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
    
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
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              topK: 40,
              topP: 0.9,
              maxOutputTokens: 800,
            }
          })
        })

        if (response.ok) {
          const data = await response.json()
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (content) {
            return {
              content,
              confidence: 0.8
            }
          }
        }

        try {
          const error = await response.json()
          lastError = error.error?.message || response.statusText
        } catch {
          lastError = response.statusText || 'Unknown error'
        }
        continue

      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error'
        continue
      }
    }

    throw new Error(`Gemini API Error: ${lastError}`)
  }

  /**
   * Build ADR context from form data
   */
  static buildContextFromFormData(formData: ADRFormData): ADRChatContext {
    return {
      patientInfo: {
        age: formData.patient_age,
        gender: formData.patient_gender === 'male' ? 'Nam' : 'Nữ',
        weight: formData.patient_weight,
        medicalHistory: formData.medical_history || undefined
      },
      adrInfo: {
        description: formData.adr_description,
        onsetTime: formData.reaction_onset_time || undefined,
        severity: this.getSeverityLabel(formData.severity_level),
        outcome: this.getOutcomeLabel(formData.outcome_after_treatment),
        tests: formData.related_tests || undefined
      },
      drugsInfo: {
        suspectedDrugs: formData.suspected_drugs.map(drug => ({
          name: drug.drug_name,
          dosage: drug.dosage_and_frequency || undefined,
          timing: drug.start_date ? `Từ ${drug.start_date}${drug.end_date ? ` đến ${drug.end_date}` : ''}` : undefined,
          dechallenge: drug.reaction_improved_after_stopping !== 'no_information' ? 
            this.getDechallengeLabel(drug.reaction_improved_after_stopping) : undefined,
          rechallenge: drug.reaction_reoccurred_after_rechallenge !== 'no_information' ?
            this.getRechallengeLabel(drug.reaction_reoccurred_after_rechallenge) : undefined
        }))
      }
    }
  }

  // Helper methods for label conversion
  private static getSeverityLabel(severity: string): string {
    const labels: Record<string, string> = {
      'death': 'Tử vong',
      'life_threatening': 'Đe dọa tính mạng',
      'hospitalization': 'Nhập viện',
      'birth_defect': 'Dị tật thai nhi',
      'permanent_disability': 'Tàn tật vĩnh viễn',
      'not_serious': 'Không nghiêm trọng'
    }
    return labels[severity] || severity
  }

  private static getOutcomeLabel(outcome: string): string {
    const labels: Record<string, string> = {
      'death_by_adr': 'Tử vong do ADR',
      'death_unrelated': 'Tử vong không liên quan',
      'not_recovered': 'Chưa hồi phục',
      'recovering': 'Đang hồi phục',
      'recovered_with_sequelae': 'Hồi phục có di chứng',
      'recovered_without_sequelae': 'Hồi phục không di chứng',
      'unknown': 'Không rõ'
    }
    return labels[outcome] || outcome
  }

  private static getDechallengeLabel(value: string): string {
    const labels: Record<string, string> = {
      'yes': 'Cải thiện',
      'no': 'Không cải thiện', 
      'not_stopped': 'Không ngừng thuốc'
    }
    return labels[value] || value
  }

  private static getRechallengeLabel(value: string): string {
    const labels: Record<string, string> = {
      'yes': 'Tái xuất hiện',
      'no': 'Không tái xuất hiện',
      'not_rechallenged': 'Không dùng lại'
    }
    return labels[value] || value
  }

  /**
   * Generate unique message ID
   */
  private static generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Validate AI provider configuration
   */
  static validateConfig(): { isValid: boolean; missingKeys: string[] } {
    const missingKeys: string[] = []

    if (!process.env.OPENAI_API_KEY) missingKeys.push('OPENAI_API_KEY')
    if (!process.env.GEMINI_API_KEY) missingKeys.push('GEMINI_API_KEY')

    return {
      isValid: missingKeys.length === 0,
      missingKeys
    }
  }

  /**
   * Rate limiting check (implement as needed)
   */
  static async checkRateLimit(userId: string): Promise<boolean> {
    // Implement rate limiting logic here
    // For now, always allow
    return true
  }

  /**
   * Log chat session for audit
   */
  static async logChatSession(session: ChatSession): Promise<void> {
    void session
  }
}








