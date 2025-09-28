import { ADRFormData, SuspectedDrug } from '@/app/reports/new/page'

// Types for AI Assessment
export interface AssessmentSuggestion {
  whoSuggestion: WHOAssessment
  naranjoSuggestion: NaranjoAssessment
  overallRecommendation: 'certain' | 'probable' | 'possible' | 'unlikely' | 'unclassified' | 'unclassifiable'
  confidence: number // 0-100
  reasoning: string[]
  warnings: string[]
}

export interface WHOAssessment {
  suggestedLevel: 'certain' | 'probable' | 'possible' | 'unlikely' | 'unclassified' | 'unclassifiable'
  criteriaAnalysis: {
    temporalRelationship: boolean | null
    cannotBeExplainedByOther: boolean | null
    improvementOnDechallenge: boolean | null
    knownReaction: boolean | null
    rechallengePositive: boolean | null
  }
  explanation: string
}

export interface NaranjoAssessment {
  totalScore: number
  suggestedLevel: 'certain' | 'probable' | 'possible' | 'unlikely'
  questionScores: NaranjoQuestionScore[]
  explanation: string
}

export interface NaranjoQuestionScore {
  question: string
  score: number
  reasoning: string
  answeredBased: 'data' | 'assumption' | 'missing'
}

export class AIAssessmentService {
  
  /**
   * Main function to analyze ADR data and provide suggestions
   */
  static async analyzeCausality(formData: ADRFormData): Promise<AssessmentSuggestion> {
    try {
      // Validate input data
      this.validateInputData(formData)
      
      // Perform WHO assessment
      const whoAssessment = this.performWHOAssessment(formData)
      
      // Perform Naranjo assessment  
      const naranjoAssessment = this.performNaranjoAssessment(formData)
      
      // Generate overall recommendation
      const overallRecommendation = this.generateOverallRecommendation(whoAssessment, naranjoAssessment)
      
      // Calculate confidence level
      const confidence = this.calculateConfidence(formData, whoAssessment, naranjoAssessment)
      
      // Generate reasoning and warnings
      const reasoning = this.generateReasoning(formData, whoAssessment, naranjoAssessment)
      const warnings = this.generateWarnings(formData)
      
      return {
        whoSuggestion: whoAssessment,
        naranjoSuggestion: naranjoAssessment,
        overallRecommendation,
        confidence,
        reasoning,
        warnings
      }
      
    } catch (error) {
      console.error('AI Assessment Error:', error)
      throw new Error('Không thể thực hiện đánh giá AI. Vui lòng thử lại.')
    }
  }
  
  /**
   * WHO Assessment Logic
   */
  private static performWHOAssessment(data: ADRFormData): WHOAssessment {
    const analysis = {
      temporalRelationship: this.analyzeTemporalRelationship(data),
      cannotBeExplainedByOther: this.analyzeAlternativeCauses(data),  
      improvementOnDechallenge: this.analyzeDechallenge(data),
      knownReaction: this.analyzeKnownReaction(data),
      rechallengePositive: this.analyzeRechallenge(data)
    }
    
    let suggestedLevel: WHOAssessment['suggestedLevel']
    let explanation: string
    
    // WHO Criteria Logic
    if (this.allCriteriaPresent(analysis, ['temporalRelationship', 'cannotBeExplainedByOther', 'improvementOnDechallenge', 'knownReaction', 'rechallengePositive'])) {
      suggestedLevel = 'certain'
      explanation = 'Thỏa mãn tất cả tiêu chuẩn của WHO: có mối liên hệ thời gian, không thể giải thích bằng nguyên nhân khác, cải thiện khi ngừng thuốc, là tác dụng phụ đã biết, và tái xuất hiện khi dùng lại.'
    } 
    else if (this.allCriteriaPresent(analysis, ['temporalRelationship', 'improvementOnDechallenge']) && 
             analysis.cannotBeExplainedByOther !== false) {
      suggestedLevel = 'probable'
      explanation = 'Có mối liên hệ thời gian hợp lý và cải thiện khi ngừng thuốc. Nguyên nhân khác không chắc chắn.'
    }
    else if (analysis.temporalRelationship === true && 
             (analysis.cannotBeExplainedByOther === false || analysis.improvementOnDechallenge === null)) {
      suggestedLevel = 'possible'
      explanation = 'Có mối liên hệ thời gian hợp lý nhưng có thể được giải thích bằng nguyên nhân khác hoặc thiếu thông tin về việc ngừng thuốc.'
    }
    else if (analysis.temporalRelationship === false) {
      suggestedLevel = 'unlikely'
      explanation = 'Mối liên hệ thời gian không rõ ràng hoặc có thể được giải thích bằng nguyên nhân khác.'
    }
    else if (this.hasInsufficientData(data)) {
      suggestedLevel = 'unclassifiable'
      explanation = 'Thông tin không đầy đủ để đánh giá mối liên quan.'
    }
    else {
      suggestedLevel = 'unclassified'
      explanation = 'Cần thêm thông tin để đánh giá chính xác.'
    }
    
    return {
      suggestedLevel,
      criteriaAnalysis: analysis,
      explanation
    }
  }
  
  /**
   * Naranjo Assessment Logic  
   */
  private static performNaranjoAssessment(data: ADRFormData): NaranjoAssessment {
    const questionScores: NaranjoQuestionScore[] = [
      this.naranjoQ1_PreviousReports(data),
      this.naranjoQ2_TimeSequence(data), 
      this.naranjoQ3_Dechallenge(data),
      this.naranjoQ4_Rechallenge(data),
      this.naranjoQ5_AlternativeCauses(data),
      this.naranjoQ6_Placebo(data),
      this.naranjoQ7_BloodConcentration(data),
      this.naranjoQ8_DoseResponse(data),
      this.naranjoQ9_PreviousExposure(data),
      this.naranjoQ10_ObjectiveEvidence(data)
    ]
    
    const totalScore = questionScores.reduce((sum, q) => sum + q.score, 0)
    
    let suggestedLevel: NaranjoAssessment['suggestedLevel']
    if (totalScore >= 9) suggestedLevel = 'certain'
    else if (totalScore >= 5) suggestedLevel = 'probable'  
    else if (totalScore >= 1) suggestedLevel = 'possible'
    else suggestedLevel = 'unlikely'
    
    const explanation = `Tổng điểm Naranjo: ${totalScore}/10. ${this.getNaranjoExplanation(suggestedLevel, totalScore)}`
    
    return {
      totalScore,
      suggestedLevel,
      questionScores,
      explanation
    }
  }
  
  // Helper methods for WHO criteria analysis
  private static analyzeTemporalRelationship(data: ADRFormData): boolean | null {
    if (!data.adr_occurrence_date || !data.reaction_onset_time) return null
    
    // Check if reaction onset time indicates reasonable temporal relationship
    const onsetTime = data.reaction_onset_time.toLowerCase()
    
    // Reasonable timeframes for most ADRs
    if (onsetTime.includes('phút') || onsetTime.includes('giờ') || onsetTime.includes('ngày')) {
      return true
    }
    
    // Very long delays might indicate unlikely relationship
    if (onsetTime.includes('tháng') || onsetTime.includes('năm')) {
      return false
    }
    
    return null
  }
  
  private static analyzeAlternativeCauses(data: ADRFormData): boolean | null {
    if (!data.medical_history) return null
    
    const history = data.medical_history.toLowerCase()
    
    // Look for indicators of other potential causes
    const otherCauseIndicators = [
      'bệnh nền', 'bệnh mãn tính', 'nhiễm trùng', 'virus', 'vi khuẩn',
      'dị ứng có sẵn', 'tiền sử dị ứng', 'bệnh tự miễn'
    ]
    
    const hasOtherCauses = otherCauseIndicators.some(indicator => history.includes(indicator))
    
    return !hasOtherCauses // Cannot be explained by other causes if no other causes found
  }
  
  private static analyzeDechallenge(data: ADRFormData): boolean | null {
    // Check suspected drugs for dechallenge information
    const hasDechallengeInfo = data.suspected_drugs.some(drug => 
      drug.reaction_improved_after_stopping === 'yes'
    )
    
    if (hasDechallengeInfo) return true
    
    const hasNegativeDechallenge = data.suspected_drugs.some(drug => 
      drug.reaction_improved_after_stopping === 'no'
    )
    
    if (hasNegativeDechallenge) return false
    
    return null // No clear information
  }
  
  private static analyzeKnownReaction(data: ADRFormData): boolean | null {
    // This would ideally connect to a drug database
    // For now, we'll make basic assumptions based on common reactions
    
    const reaction = data.adr_description.toLowerCase()
    const commonReactions = ['ngứa', 'phát ban', 'nôn', 'buồn nôn', 'đau đầu', 'chóng mặt']
    
    return commonReactions.some(common => reaction.includes(common))
  }
  
  private static analyzeRechallenge(data: ADRFormData): boolean | null {
    const hasPositiveRechallenge = data.suspected_drugs.some(drug => 
      drug.reaction_reoccurred_after_rechallenge === 'yes'
    )
    
    if (hasPositiveRechallenge) return true
    
    const hasNegativeRechallenge = data.suspected_drugs.some(drug => 
      drug.reaction_reoccurred_after_rechallenge === 'no'
    )
    
    if (hasNegativeRechallenge) return false
    
    return null
  }
  
  // Naranjo question implementations
  private static naranjoQ1_PreviousReports(data: ADRFormData): NaranjoQuestionScore {
    // This would ideally check medical literature database
    // For now, basic assumption based on common ADRs
    return {
      question: "Phản ứng có được mô tả trước đó trong y văn không?",
      score: 0, // Conservative scoring without database
      reasoning: "Cần tra cứu y văn để xác định chính xác",
      answeredBased: 'assumption'
    }
  }
  
  private static naranjoQ2_TimeSequence(data: ADRFormData): NaranjoQuestionScore {
    const temporal = this.analyzeTemporalRelationship(data)
    
    if (temporal === true) {
      return {
        question: "Phản ứng có xuất hiện sau khi điều trị bằng thuốc nghi ngờ không?",
        score: 2,
        reasoning: "Có mối liên hệ thời gian hợp lý giữa dùng thuốc và xuất hiện phản ứng",
        answeredBased: 'data'
      }
    } else if (temporal === false) {
      return {
        question: "Phản ứng có xuất hiện sau khi điều trị bằng thuốc nghi ngờ không?",
        score: -1,
        reasoning: "Mối liên hệ thời gian không hợp lý",
        answeredBased: 'data'
      }
    }
    
    return {
      question: "Phản ứng có xuất hiện sau khi điều trị bằng thuốc nghi ngờ không?",
      score: 0,
      reasoning: "Không có đủ thông tin về thời gian",
      answeredBased: 'missing'
    }
  }
  
  private static naranjoQ3_Dechallenge(data: ADRFormData): NaranjoQuestionScore {
    const dechallenge = this.analyzeDechallenge(data)
    
    if (dechallenge === true) {
      return {
        question: "Phản ứng có được cải thiện sau khi ngừng thuốc không?",
        score: 1,
        reasoning: "Phản ứng cải thiện khi ngừng thuốc",
        answeredBased: 'data'
      }
    }
    
    return {
      question: "Phản ứng có được cải thiện sau khi ngừng thuốc không?",
      score: 0,
      reasoning: "Không có thông tin rõ ràng về việc cải thiện khi ngừng thuốc",
      answeredBased: 'missing'
    }
  }
  
  private static naranjoQ4_Rechallenge(data: ADRFormData): NaranjoQuestionScore {
    const rechallenge = this.analyzeRechallenge(data)
    
    if (rechallenge === true) {
      return {
        question: "Phản ứng có tái xuất hiện khi dùng lại thuốc không?",
        score: 2,
        reasoning: "Phản ứng tái xuất hiện khi dùng lại thuốc",
        answeredBased: 'data'
      }
    } else if (rechallenge === false) {
      return {
        question: "Phản ứng có tái xuất hiện khi dùng lại thuốc không?",
        score: -1,
        reasoning: "Không tái xuất hiện khi dùng lại thuốc",
        answeredBased: 'data'
      }
    }
    
    return {
      question: "Phản ứng có tái xuất hiện khi dùng lại thuốc không?",
      score: 0,
      reasoning: "Không có thông tin về việc dùng lại thuốc",
      answeredBased: 'missing'
    }
  }
  
  private static naranjoQ5_AlternativeCauses(data: ADRFormData): NaranjoQuestionScore {
    const hasAlternatives = !this.analyzeAlternativeCauses(data)
    
    if (hasAlternatives) {
      return {
        question: "Có nguyên nhân nào khác có thể gây ra phản ứng không?",
        score: -1,
        reasoning: "Có thể có nguyên nhân khác từ tiền sử bệnh lý",
        answeredBased: 'data'
      }
    } else {
      return {
        question: "Có nguyên nhân nào khác có thể gây ra phản ứng không?",
        score: 2,
        reasoning: "Không có nguyên nhân khác rõ ràng",
        answeredBased: 'data'
      }
    }
  }
  
  // Simplified implementations for remaining Naranjo questions
  private static naranjoQ6_Placebo(data: ADRFormData): NaranjoQuestionScore {
    return {
      question: "Phản ứng có xuất hiện khi dùng giả dược không?",
      score: 0,
      reasoning: "Không có thông tin về việc sử dụng giả dược",
      answeredBased: 'missing'
    }
  }
  
  private static naranjoQ7_BloodConcentration(data: ADRFormData): NaranjoQuestionScore {
    return {
      question: "Nồng độ thuốc trong máu có ở ngưỡng gây độc không?",
      score: 0,
      reasoning: "Không có thông tin về nồng độ thuốc trong máu",
      answeredBased: 'missing'
    }
  }
  
  private static naranjoQ8_DoseResponse(data: ADRFormData): NaranjoQuestionScore {
    return {
      question: "Phản ứng có liên quan đến liều lượng không?",
      score: 0,
      reasoning: "Không có thông tin về mối liên quan liều-phản ứng",
      answeredBased: 'missing'
    }
  }
  
  private static naranjoQ9_PreviousExposure(data: ADRFormData): NaranjoQuestionScore {
    const hasHistory = data.medical_history && 
                      data.medical_history.toLowerCase().includes('tiền sử dị ứng')
    
    if (hasHistory) {
      return {
        question: "Người bệnh có gặp phản ứng tương tự trước đây không?",
        score: 1,
        reasoning: "Có tiền sử dị ứng được ghi nhận",
        answeredBased: 'data'
      }
    }
    
    return {
      question: "Người bệnh có gặp phản ứng tương tự trước đây không?",
      score: 0,
      reasoning: "Không có thông tin về tiền sử phản ứng tương tự",
      answeredBased: 'missing'
    }
  }
  
  private static naranjoQ10_ObjectiveEvidence(data: ADRFormData): NaranjoQuestionScore {
    const hasTests = data.related_tests && data.related_tests.trim().length > 0
    
    if (hasTests) {
      return {
        question: "Có bằng chứng khách quan như xét nghiệm bất thường không?",
        score: 1,
        reasoning: "Có thông tin về các xét nghiệm liên quan",
        answeredBased: 'data'
      }
    }
    
    return {
      question: "Có bằng chứng khách quan như xét nghiệm bất thường không?",
      score: 0,
      reasoning: "Không có thông tin về xét nghiệm khách quan",
      answeredBased: 'missing'
    }
  }
  
  // Helper methods
  private static allCriteriaPresent(analysis: any, criteria: string[]): boolean {
    return criteria.every(criterion => analysis[criterion] === true)
  }
  
  private static hasInsufficientData(data: ADRFormData): boolean {
    const requiredFields = [
      data.adr_occurrence_date,
      data.adr_description,
      data.suspected_drugs.length > 0
    ]
    
    return !requiredFields.every(field => field)
  }
  
  private static generateOverallRecommendation(
    who: WHOAssessment, 
    naranjo: NaranjoAssessment
  ): AssessmentSuggestion['overallRecommendation'] {
    // Weight WHO assessment slightly higher than Naranjo
    const whoWeight = 0.6
    const naranjoWeight = 0.4
    
    const levels = ['unlikely', 'possible', 'probable', 'certain']
    const whoIndex = levels.indexOf(who.suggestedLevel)
    const naranjoIndex = levels.indexOf(naranjo.suggestedLevel)
    
    if (whoIndex === -1 || naranjoIndex === -1) {
      return who.suggestedLevel
    }
    
    const weightedAverage = (whoIndex * whoWeight) + (naranjoIndex * naranjoWeight)
    const finalIndex = Math.round(weightedAverage)
    
    return levels[finalIndex] as AssessmentSuggestion['overallRecommendation']
  }
  
  private static calculateConfidence(
    data: ADRFormData, 
    who: WHOAssessment, 
    naranjo: NaranjoAssessment
  ): number {
    let confidence = 50 // Base confidence
    
    // Increase confidence based on available data
    if (data.reaction_onset_time) confidence += 10
    if (data.related_tests) confidence += 10
    if (data.medical_history) confidence += 5
    if (data.treatment_response) confidence += 5
    
    // Adjust based on data quality from drug information
    const drugDataQuality = this.assessDrugDataQuality(data.suspected_drugs)
    confidence += drugDataQuality
    
    // Consistency between WHO and Naranjo increases confidence
    if (who.suggestedLevel === naranjo.suggestedLevel) {
      confidence += 15
    }
    
    return Math.min(confidence, 95) // Cap at 95%
  }
  
  private static assessDrugDataQuality(drugs: SuspectedDrug[]): number {
    if (drugs.length === 0) return -20
    
    let quality = 0
    drugs.forEach(drug => {
      if (drug.start_date) quality += 3
      if (drug.end_date) quality += 3
      if (drug.dosage_and_frequency) quality += 2
      if (drug.reaction_improved_after_stopping !== 'no_information') quality += 5
      if (drug.reaction_reoccurred_after_rechallenge !== 'no_information') quality += 5
    })
    
    return Math.min(quality, 20)
  }
  
  private static generateReasoning(
    data: ADRFormData,
    who: WHOAssessment, 
    naranjo: NaranjoAssessment
  ): string[] {
    const reasoning = []
    
    reasoning.push(`Thang WHO đánh giá: ${who.explanation}`)
    reasoning.push(`Thang Naranjo đánh giá: ${naranjo.explanation}`)
    
    // Add specific reasoning based on data
    if (data.reaction_onset_time) {
      reasoning.push(`Thời gian xuất hiện phản ứng: ${data.reaction_onset_time}`)
    }
    
    if (data.severity_level !== 'not_serious') {
      reasoning.push(`Mức độ nghiêm trọng (${data.severity_level}) cần được cân nhắc trong đánh giá`)
    }
    
    return reasoning
  }
  
  private static generateWarnings(data: ADRFormData): string[] {
    const warnings = []
    
    if (!data.reaction_onset_time) {
      warnings.push('Thiếu thông tin về thời gian xuất hiện phản ứng - quan trọng cho đánh giá')
    }
    
    if (!data.related_tests) {
      warnings.push('Không có thông tin xét nghiệm - có thể ảnh hưởng đến độ chính xác đánh giá')
    }
    
    if (data.suspected_drugs.some(drug => 
      drug.reaction_improved_after_stopping === 'no_information' && 
      drug.reaction_reoccurred_after_rechallenge === 'no_information'
    )) {
      warnings.push('Thiếu thông tin về dechallenge/rechallenge - quan trọng cho đánh giá chính xác')
    }
    
    if (data.severity_level === 'death') {
      warnings.push('Trường hợp tử vong cần đánh giá đặc biệt cẩn thận bởi chuyên gia')
    }
    
    return warnings
  }
  
  private static getNaranjoExplanation(level: string, score: number): string {
    switch (level) {
      case 'certain':
        return `Điểm số ${score} cho thấy mối liên quan chắc chắn giữa thuốc và ADR.`
      case 'probable': 
        return `Điểm số ${score} cho thấy có khả năng cao có mối liên quan giữa thuốc và ADR.`
      case 'possible':
        return `Điểm số ${score} cho thấy có thể có mối liên quan giữa thuốc và ADR.`
      case 'unlikely':
        return `Điểm số ${score} cho thấy khả năng thấp có mối liên quan giữa thuốc và ADR.`
      default:
        return 'Không thể đánh giá được mối liên quan.'
    }
  }
  
  private static validateInputData(data: ADRFormData): void {
    if (!data.adr_description) {
      throw new Error('Thiếu mô tả phản ứng có hại')
    }
    
    if (data.suspected_drugs.length === 0) {
      throw new Error('Cần có ít nhất một thuốc nghi ngờ')
    }
    
    if (!data.adr_occurrence_date) {
      throw new Error('Thiếu ngày xảy ra phản ứng')
    }
  }
}









