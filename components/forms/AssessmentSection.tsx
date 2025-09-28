'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import AIAssessmentResults from './AIAssessmentResults'
import AIChatbot from '@/components/ai/AIChatbot'
import { ADRFormData } from '@/app/reports/new/page'
import { AssessmentSuggestion } from '@/lib/ai-assessment-service'
import { BeakerIcon, SparklesIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

interface AssessmentSectionProps {
  data: ADRFormData
  updateData: (updates: Partial<ADRFormData>) => void
}

export default function AssessmentSection({ data, updateData }: AssessmentSectionProps) {
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<AssessmentSuggestion | null>(null)
  const [showAiResults, setShowAiResults] = useState(false)
  const [showChatbot, setShowChatbot] = useState(false)

  const causalityOptions = [
    { value: 'certain', label: 'Chắc chắn (Certain)' },
    { value: 'probable', label: 'Có khả năng (Probable)' },
    { value: 'possible', label: 'Có thể (Possible)' },
    { value: 'unlikely', label: 'Không chắc chắn (Unlikely)' },
    { value: 'unclassified', label: 'Chưa phân loại (Unclassified)' },
    { value: 'unclassifiable', label: 'Không thể phân loại (Unclassifiable)' },
  ]

  const scaleOptions = [
    { value: 'who', label: 'Thang WHO-UMC' },
    { value: 'naranjo', label: 'Thang Naranjo' },
  ]

  // AI Suggestion Handler
  const handleAISuggestion = async () => {
    if (!validateFormForAI()) {
      return
    }

    setAiLoading(true)
    try {
      const response = await fetch('/api/ai/assessment-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ formData: data }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra khi gọi AI')
      }

      setAiSuggestion(result.data)
      setShowAiResults(true)
      toast.success('AI đã phân tích thành công!')
      
    } catch (error) {
      console.error('AI Suggestion Error:', error)
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi sử dụng AI gợi ý')
    } finally {
      setAiLoading(false)
    }
  }

  // Validate form has minimum required data for AI analysis
  const validateFormForAI = (): boolean => {
    if (!data.adr_description.trim()) {
      toast.error('Vui lòng mô tả biểu hiện ADR trước khi sử dụng AI gợi ý')
      return false
    }

    if (!data.adr_occurrence_date) {
      toast.error('Vui lòng nhập ngày xuất hiện phản ứng')
      return false
    }

    if (data.suspected_drugs.length === 0 || !data.suspected_drugs[0].drug_name.trim()) {
      toast.error('Vui lòng thêm ít nhất một thuốc nghi ngờ')
      return false
    }

    return true
  }

  // Apply AI suggestion to form
  const handleApplyAISuggestion = (assessment: typeof data.causality_assessment) => {
    updateData({ 
      causality_assessment: assessment,
      // Also suggest appropriate scale based on assessment
      assessment_scale: (aiSuggestion?.naranjoSuggestion?.totalScore || 0) > 0 ? 'naranjo' : 'who'
    })
    
    // Add AI reasoning to medical staff comment if it's empty
    if (!data.medical_staff_comment.trim() && aiSuggestion) {
      const aiComment = `Gợi ý AI: ${aiSuggestion.overallRecommendation}\n\nLý do: ${aiSuggestion.reasoning.join('; ')}\n\n[Vui lòng xem xét và bổ sung đánh giá của chuyên gia]`
      updateData({ medical_staff_comment: aiComment })
    }
    
    toast.success('Đã áp dụng gợi ý AI!')
    setShowAiResults(false)
  }

  // Handle chatbot insights
  const handleChatbotInsight = (insight: string) => {
    const currentComment = data.medical_staff_comment || ''
    const newComment = currentComment ? 
      `${currentComment}\n\n--- AI Consultant ---\n${insight}` : 
      `AI Consultant: ${insight}`
    
    updateData({ medical_staff_comment: newComment })
  }

  // Validate form for chatbot
  const canUseChatbot = () => {
    return data.adr_description.trim() && 
           data.adr_occurrence_date && 
           data.suspected_drugs.length > 0 && 
           data.suspected_drugs[0].drug_name.trim()
  }

  // Show AI Results if available
  if (showAiResults && aiSuggestion) {
    return (
      <AIAssessmentResults 
        suggestion={aiSuggestion}
        onApplySuggestion={handleApplyAISuggestion}
        onClose={() => setShowAiResults(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Phần D. Phần Thẩm định ADR của đơn vị
          </h3>
          <p className="text-sm text-gray-600">
            Đánh giá mối liên quan giữa thuốc và phản ứng có hại
          </p>
        </div>

        {/* AI Features */}
        <div className="flex space-x-3">
          {/* AI Suggestion Button */}
          <Button
            onClick={handleAISuggestion}
            disabled={aiLoading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            {aiLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Đang phân tích...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4 mr-2" />
                AI Gợi ý
              </>
            )}
          </Button>

          {/* AI Chatbot Button */}
          <Button
            onClick={() => setShowChatbot(true)}
            disabled={!canUseChatbot()}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
            title={!canUseChatbot() ? 'Vui lòng điền đầy đủ thông tin ADR trước' : 'Mở AI Consultant'}
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
            AI Consultant
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Đánh giá mối liên quan thuốc và ADR"
          value={data.causality_assessment}
          onChange={(e) => updateData({ causality_assessment: e.target.value as any })}
          options={causalityOptions}
          required
          helperText="Đánh giá khả năng thuốc gây ra phản ứng có hại"
        />

        <Select
          label="Đơn vị thẩm định theo thang nào"
          value={data.assessment_scale}
          onChange={(e) => updateData({ assessment_scale: e.target.value as any })}
          options={scaleOptions}
          required
          helperText="Chọn thang đánh giá được sử dụng"
        />

        <div className="md:col-span-2">
          <Textarea
            label="Bình luận của cán bộ y tế"
            value={data.medical_staff_comment}
            onChange={(e) => updateData({ medical_staff_comment: e.target.value })}
            placeholder="Nhận xét, đánh giá chi tiết về trường hợp ADR này..."
            rows={6}
            helperText="Ghi rõ cơ sở khoa học, kinh nghiệm lâm sàng để đưa ra đánh giá"
          />
        </div>
      </div>

      {/* AI Feature Notice */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
        <div className="flex items-start space-x-3">
          <SparklesIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-purple-900 mb-1">Tính năng AI Gợi ý mới!</h4>
            <p className="text-sm text-purple-800">
              AI sẽ phân tích thông tin ADR theo thang WHO và Naranjo để đưa ra gợi ý đánh giá mối liên quan thuốc-ADR. 
              Vui lòng điền đầy đủ thông tin ở các phần trước để có kết quả chính xác nhất.
            </p>
          </div>
        </div>
      </div>

      {/* Assessment Guide */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-3">Hướng dẫn đánh giá mối liên quan:</h4>
        <div className="space-y-3 text-sm text-blue-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Chắc chắn (Certain):</strong></p>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Có trình tự thời gian hợp lý</li>
                <li>Cải thiện khi ngừng thuốc</li>
                <li>Tái xuất hiện khi dùng lại</li>
                <li>Không thể giải thích bằng bệnh lý khác</li>
              </ul>
            </div>
            <div>
              <p><strong>Có khả năng (Probable):</strong></p>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Có trình tự thời gian hợp lý</li>
                <li>Cải thiện khi ngừng thuốc</li>
                <li>Không thể giải thích hoàn toàn bằng bệnh lý khác</li>
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Có thể (Possible):</strong></p>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Có trình tự thời gian hợp lý</li>
                <li>Có thể giải thích bằng bệnh lý khác</li>
                <li>Thông tin về việc ngừng thuốc không rõ ràng</li>
              </ul>
            </div>
            <div>
              <p><strong>Không chắc chắn (Unlikely):</strong></p>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Trình tự thời gian không hợp lý</li>
                <li>Có thể giải thích tốt hơn bằng bệnh lý khác</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chatbot Modal */}
      <AIChatbot
        isOpen={showChatbot}
        onClose={() => setShowChatbot(false)}
        formData={data}
        onApplyInsight={handleChatbotInsight}
      />
    </div>
  )
}


