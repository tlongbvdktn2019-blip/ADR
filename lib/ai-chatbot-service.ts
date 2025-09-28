import { ADRFormData } from '@/app/reports/new/page'

// Types for AI Chatbot
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    model?: 'chatgpt' | 'gemini'
    confidence?: number
    sources?: string[]
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

NGUYÊN TẮC HOẠT ĐỘNG:
1. Luôn đánh giá theo thang WHO-UMC và Naranjo
2. Cung cấp phân tích khoa học, có căn cứ
3. Nhấn mạnh tầm quan trọng của clinical judgment
4. Đưa ra gợi ý cụ thể, có thể thực hiện được
5. Cảnh báo về limitations và cần expert review

ĐỊNH DẠNG TRẢ LỜI:
- Ngắn gọn, súc tích (< 300 từ)
- Bullet points khi cần thiết
- Trích dẫn tiêu chuẩn WHO/Naranjo khi phù hợp
- Kết thúc với recommended next steps

NGÔN NGỮ: Tiếng Việt, thuật ngữ y học chính xác
PHONG CÁCH: Chuyên nghiệp, thân thiện, hỗ trợ

LƯU Ý QUAN TRỌNG:
- Không thay thế quyết định lâm sàng của bác sĩ
- Luôn khuyến khích tham khảo chuyên gia khi cần
- Tuân thủ nguyên tắc "First, do no harm"
  `

  /**
   * Send message to AI chatbot and get response
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
    }

    // Clinical management
    suggestions.push("Khuyến nghị xử trí lâm sàng cho trường hợp này")
    suggestions.push("Cần theo dõi gì thêm cho bệnh nhân?")

    return suggestions.slice(0, 4) // Limit to 4 suggestions
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
   * Call AI provider (ChatGPT or Gemini)
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
   * OpenAI ChatGPT Integration
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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
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

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không thể tạo phản hồi',
      confidence: 0.8 // Gemini confidence
    }
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
    // Implement audit logging
    console.log('Chat session logged:', {
      sessionId: session.id,
      messageCount: session.messages.length,
      reportId: session.reportId,
      timestamp: new Date().toISOString()
    })
  }
}









