'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { 
  ChartBarIcon, 
  LightBulbIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'
import { AssessmentSuggestion, WHOAssessment, NaranjoAssessment } from '@/lib/ai-assessment-service'

interface AIAssessmentResultsProps {
  suggestion: AssessmentSuggestion
  onApplySuggestion: (assessment: 'certain' | 'probable' | 'possible' | 'unlikely' | 'unclassified' | 'unclassifiable') => void
  onClose: () => void
}

export default function AIAssessmentResults({ 
  suggestion, 
  onApplySuggestion, 
  onClose 
}: AIAssessmentResultsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'who' | 'naranjo' | 'details'>('overview')

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getAssessmentColor = (level: string) => {
    switch (level) {
      case 'certain': return 'bg-green-100 text-green-800 border-green-300'
      case 'probable': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'possible': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'unlikely': return 'bg-red-100 text-red-800 border-red-300'
      case 'unclassified': return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'unclassifiable': return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getAssessmentLabel = (level: string) => {
    switch (level) {
      case 'certain': return 'Chắc chắn (Certain)'
      case 'probable': return 'Có khả năng (Probable)' 
      case 'possible': return 'Có thể (Possible)'
      case 'unlikely': return 'Không chắc chắn (Unlikely)'
      case 'unclassified': return 'Chưa phân loại (Unclassified)'
      case 'unclassifiable': return 'Không thể phân loại (Unclassifiable)'
      default: return level
    }
  }

  const tabs = [
    { id: 'overview' as const, label: 'Tổng quan', icon: ChartBarIcon },
    { id: 'who' as const, label: 'WHO', icon: CheckCircleIcon },
    { id: 'naranjo' as const, label: 'Naranjo', icon: BeakerIcon },
    { id: 'details' as const, label: 'Chi tiết', icon: InformationCircleIcon }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <LightBulbIcon className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">Kết quả AI Gợi ý</h3>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getConfidenceColor(suggestion.confidence)}`}>
            Độ tin cậy: {suggestion.confidence}%
          </div>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>

      {/* Main Result Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="text-center space-y-4">
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">AI Đề xuất đánh giá</h4>
            <div className={`inline-flex px-4 py-2 rounded-full text-lg font-semibold border-2 ${getAssessmentColor(suggestion.overallRecommendation)}`}>
              {getAssessmentLabel(suggestion.overallRecommendation)}
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button 
              onClick={() => onApplySuggestion(suggestion.overallRecommendation)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Áp dụng gợi ý này
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setActiveTab('details')}
            >
              Xem chi tiết
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && <OverviewTab suggestion={suggestion} />}
        {activeTab === 'who' && <WHOTab assessment={suggestion.whoSuggestion} />}
        {activeTab === 'naranjo' && <NaranjoTab assessment={suggestion.naranjoSuggestion} />}
        {activeTab === 'details' && <DetailsTab suggestion={suggestion} />}
      </div>
    </div>
  )
}

// Tab Components
function OverviewTab({ suggestion }: { suggestion: AssessmentSuggestion }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Thang WHO-UMC">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Đánh giá:</span>
              <span className={`px-2 py-1 rounded text-sm font-medium ${suggestion.whoSuggestion.suggestedLevel === suggestion.overallRecommendation ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {suggestion.whoSuggestion.suggestedLevel}
              </span>
            </div>
            <p className="text-sm text-gray-700">{suggestion.whoSuggestion.explanation}</p>
          </div>
        </Card>

        <Card title="Thang Naranjo">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Điểm:</span>
              <span className="text-lg font-semibold text-blue-600">
                {suggestion.naranjoSuggestion.totalScore}/10
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Đánh giá:</span>
              <span className={`px-2 py-1 rounded text-sm font-medium ${suggestion.naranjoSuggestion.suggestedLevel === suggestion.overallRecommendation ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {suggestion.naranjoSuggestion.suggestedLevel}
              </span>
            </div>
            <p className="text-sm text-gray-700">{suggestion.naranjoSuggestion.explanation}</p>
          </div>
        </Card>
      </div>

      {/* Warnings */}
      {suggestion.warnings.length > 0 && (
        <Card>
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Lưu ý quan trọng:</h4>
              <ul className="space-y-1">
                {suggestion.warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-yellow-800 bg-yellow-50 px-3 py-2 rounded">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

function WHOTab({ assessment }: { assessment: WHOAssessment }) {
  const criteriaLabels = {
    temporalRelationship: 'Mối liên hệ thời gian hợp lý',
    cannotBeExplainedByOther: 'Không thể giải thích bằng nguyên nhân khác',  
    improvementOnDechallenge: 'Cải thiện khi ngừng thuốc',
    knownReaction: 'Tác dụng phụ đã được biết đến',
    rechallengePositive: 'Tái xuất hiện khi dùng lại thuốc'
  }

  const getStatusIcon = (status: boolean | null) => {
    if (status === true) return '✅'
    if (status === false) return '❌' 
    return '❓'
  }

  const getStatusColor = (status: boolean | null) => {
    if (status === true) return 'text-green-600 bg-green-50'
    if (status === false) return 'text-red-600 bg-red-50'
    return 'text-gray-600 bg-gray-50'
  }

  return (
    <Card title="Phân tích theo thang WHO-UMC">
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Kết luận WHO:</h4>
          <p className="text-blue-800">{assessment.explanation}</p>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-3">Chi tiết tiêu chuẩn đánh giá:</h4>
          <div className="space-y-3">
            {Object.entries(assessment.criteriaAnalysis).map(([key, value]) => (
              <div key={key} className={`flex items-center justify-between p-3 rounded-lg ${getStatusColor(value)}`}>
                <span className="text-sm font-medium">
                  {criteriaLabels[key as keyof typeof criteriaLabels]}
                </span>
                <span className="text-lg">{getStatusIcon(value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

function NaranjoTab({ assessment }: { assessment: NaranjoAssessment }) {
  return (
    <Card title="Phân tích theo thang Naranjo">
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-blue-900">Tổng điểm Naranjo:</h4>
            <span className="text-2xl font-bold text-blue-600">{assessment.totalScore}/10</span>
          </div>
          <p className="text-blue-800">{assessment.explanation}</p>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-3">Chi tiết từng câu hỏi:</h4>
          <div className="space-y-3">
            {assessment.questionScores.map((question, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-gray-900 flex-1">
                    {index + 1}. {question.question}
                  </span>
                  <span className={`ml-3 px-2 py-1 rounded font-semibold ${
                    question.score > 0 ? 'bg-green-100 text-green-800' : 
                    question.score < 0 ? 'bg-red-100 text-red-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {question.score > 0 ? '+' : ''}{question.score}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{question.reasoning}</p>
                <span className={`text-xs px-2 py-1 rounded ${
                  question.answeredBased === 'data' ? 'bg-blue-100 text-blue-800' :
                  question.answeredBased === 'assumption' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {question.answeredBased === 'data' ? 'Từ dữ liệu' : 
                   question.answeredBased === 'assumption' ? 'Giả định' : 'Thiếu thông tin'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

function DetailsTab({ suggestion }: { suggestion: AssessmentSuggestion }) {
  return (
    <div className="space-y-6">
      <Card title="Lý do đánh giá">
        <div className="space-y-3">
          {suggestion.reasoning.map((reason, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-700">{reason}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Thông tin bổ sung">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Phương pháp đánh giá:</span>
            <p className="text-gray-600 mt-1">AI phân tích dựa trên thang WHO-UMC và Naranjo, kết hợp với các tiêu chuẩn y khoa</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Độ tin cậy:</span>
            <p className="text-gray-600 mt-1">
              {suggestion.confidence}% - 
              {suggestion.confidence >= 80 ? ' Cao' : 
               suggestion.confidence >= 60 ? ' Trung bình' : ' Thấp'}
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Lưu ý:</strong> Kết quả AI chỉ mang tính gợi ý. Quyết định cuối cùng cần dựa trên đánh giá của chuyên gia y tế có kinh nghiệm.
          </p>
        </div>
      </Card>
    </div>
  )
}









