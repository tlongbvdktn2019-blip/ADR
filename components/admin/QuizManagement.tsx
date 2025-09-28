'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { 
  PlusIcon, 
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  AcademicCapIcon,
  EyeIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { QuizCategory, QuizQuestion, QuizOption, QuizUtils } from '@/types/quiz'

interface QuizManagementProps {
  onClose: () => void
}

export default function QuizManagement({ onClose }: QuizManagementProps) {
  const [activeTab, setActiveTab] = useState<'questions' | 'categories' | 'analytics'>('questions')
  const [categories, setCategories] = useState<QuizCategory[]>([])
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [categoriesRes, analyticsRes] = await Promise.all([
        fetch('/api/quiz/categories'),
        fetch('/api/admin/quiz/analytics').catch(() => ({ json: () => ({}) }))
      ])

      const [categoriesData, analyticsData] = await Promise.all([
        categoriesRes.json(),
        analyticsRes.json()
      ])

      if (categoriesData.success) {
        setCategories(categoriesData.data)
        if (categoriesData.data.length > 0) {
          setSelectedCategory(categoriesData.data[0].id)
        }
      }

      if ((analyticsData as any)?.success) {
        setAnalytics((analyticsData as any).data)
      }

      // Load questions for first category
      if (categoriesData.data && categoriesData.data.length > 0) {
        loadQuestions(categoriesData.data[0].id)
      }

    } catch (error) {
      console.error('Failed to load quiz management data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadQuestions = async (categoryId: string, difficulty?: string) => {
    try {
      const url = new URL('/api/admin/quiz/questions', window.location.origin)
      url.searchParams.set('categoryId', categoryId)
      if (difficulty) url.searchParams.set('difficulty', difficulty)

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setQuestions(data.data)
      }
    } catch (error) {
      console.error('Failed to load questions:', error)
      toast.error('Failed to load questions')
    }
  }

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
    loadQuestions(categoryId, selectedDifficulty)
  }

  const handleDifficultyChange = (difficulty: string) => {
    setSelectedDifficulty(difficulty)
    if (selectedCategory) {
      loadQuestions(selectedCategory, difficulty)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const response = await fetch(`/api/admin/quiz/questions/${questionId}`, {
        method: 'DELETE'
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        const message = (result && (result.error || result.message))
          || (response.status === 409
            ? 'Không thể xóa câu hỏi đã được sử dụng trong các phiên làm bài'
            : 'Không thể xóa câu hỏi')
        throw new Error(message)
      }

      const successMessage = (result && (result.message || result.success && 'Xóa câu hỏi thành công'))
        || 'Xóa câu hỏi thành công'
      toast.success(successMessage)
      setDeleteConfirm(null)
      loadQuestions(selectedCategory, selectedDifficulty)
    } catch (error) {
      console.error('Delete question error:', error)
      const message = error instanceof Error ? error.message : 'Không thể xóa câu hỏi'
      toast.error(message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const tabs = [
    { id: 'questions' as const, label: 'Questions', icon: AcademicCapIcon },
    { id: 'categories' as const, label: 'Categories', icon: ClockIcon },
    { id: 'analytics' as const, label: 'Analytics', icon: EyeIcon }
  ]

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quiz Management</h2>
          <p className="text-gray-600">Manage quiz questions, categories and analytics</p>
        </div>
        
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
      </div>

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
                    : 'border-transparent text-gray-500 hover:text-gray-700'
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
        {activeTab === 'questions' && (
          <QuestionsTab
            categories={categories}
            questions={questions}
            selectedCategory={selectedCategory}
            selectedDifficulty={selectedDifficulty}
            onCategoryChange={handleCategoryChange}
            onDifficultyChange={handleDifficultyChange}
            onAddQuestion={() => {
              setEditingQuestion(null)
              setShowQuestionForm(true)
            }}
            onEditQuestion={(question) => {
              setEditingQuestion(question)
              setShowQuestionForm(true)
            }}
            onDeleteQuestion={(questionId) => setDeleteConfirm(questionId)}
            onReloadQuestions={() => loadQuestions(selectedCategory, selectedDifficulty)}
          />
        )}
        
        {activeTab === 'categories' && (
          <CategoriesTab categories={categories} onReload={loadData} />
        )}
        
        {activeTab === 'analytics' && analytics && (
          <AnalyticsTab analytics={analytics} />
        )}
      </div>

      {/* Question Form Modal */}
      {showQuestionForm && (
        <QuestionForm
          question={editingQuestion}
          categories={categories}
          onSave={(success) => {
            if (success) {
              setShowQuestionForm(false)
              setEditingQuestion(null)
              loadQuestions(selectedCategory, selectedDifficulty)
            }
          }}
          onClose={() => {
            setShowQuestionForm(false)
            setEditingQuestion(null)
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Question"
          message="Are you sure you want to delete this question? This action cannot be undone."
          onConfirm={() => handleDeleteQuestion(deleteConfirm)}
          onClose={() => setDeleteConfirm(null)}
          type="danger"
        />
      )}
    </div>
  )
}

// Questions Tab Component
function QuestionsTab({ 
  categories, 
  questions, 
  selectedCategory, 
  selectedDifficulty,
  onCategoryChange, 
  onDifficultyChange,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onReloadQuestions
}: {
  categories: QuizCategory[]
  questions: QuizQuestion[]
  selectedCategory: string
  selectedDifficulty: string
  onCategoryChange: (categoryId: string) => void
  onDifficultyChange: (difficulty: string) => void
  onAddQuestion: () => void
  onEditQuestion: (question: QuizQuestion) => void
  onDeleteQuestion: (questionId: string) => void
  onReloadQuestions: () => void
}) {
  const difficulties = ['', 'beginner', 'intermediate', 'advanced', 'expert']

  return (
    <div className="space-y-6">
      
      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select
              label="Category"
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="min-w-[200px]"
              options={categories.map(category => ({
                value: category.id,
                label: category.name
              }))}
            />
            
            <Select
              label="Difficulty"
              value={selectedDifficulty}
              onChange={(e) => onDifficultyChange(e.target.value)}
              className="min-w-[150px]"
              options={[
                { value: '', label: 'All Difficulties' },
                ...difficulties.slice(1).map(diff => ({
                  value: diff,
                  label: diff.charAt(0).toUpperCase() + diff.slice(1)
                }))
              ]}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={onReloadQuestions} variant="outline">
              Refresh
            </Button>
            <Button onClick={onAddQuestion} className="bg-blue-600">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
        </div>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <Card className="text-center py-12">
            <AcademicCapIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No questions found for the selected criteria</p>
            <Button onClick={onAddQuestion} className="mt-4 bg-blue-600">
              Create First Question
            </Button>
          </Card>
        ) : (
          questions.map((question) => (
            <Card key={question.id} className="hover:shadow-md transition-shadow">
              <div className="space-y-4">
                
                {/* Question Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${QuizUtils.getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty}
                      </span>
                      <span className="text-xs text-gray-500">
                        {question.points_value} points
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        (question as any).review_status === 'approved' ? 'bg-green-100 text-green-800' :
                        (question as any).review_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {(question as any).review_status || 'pending'}
                      </span>
                    </div>
                    
                    <h4 className="font-medium text-gray-900 leading-relaxed">
                      {question.question_text}
                    </h4>
                    
                    <div className="text-sm text-gray-600">
                      <span>Type: {question.question_type}</span>
                      <span className="mx-2">•</span>
                      <span>Answered: {question.times_answered} times</span>
                      <span className="mx-2">•</span>
                      <span>Accuracy: {question.times_answered > 0 ? Math.round((question.times_correct / question.times_answered) * 100) : 0}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      onClick={() => onEditQuestion(question)}
                      variant="outline"
                      size="sm"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => onDeleteQuestion(question.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Answer Options Preview */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {question.options.map((option) => (
                      <div key={option.key} className={`p-2 rounded border ${
                        option.key === question.correct_answer
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200'
                      }`}>
                        <strong>{option.key}:</strong> {option.text}
                        {option.key === question.correct_answer && (
                          <CheckCircleIcon className="w-4 h-4 text-green-500 inline ml-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation Preview */}
                {question.explanation && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-1">Explanation:</h5>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      {question.explanation.length > 200 
                        ? question.explanation.substring(0, 200) + '...'
                        : question.explanation
                      }
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

// Categories Tab Component
function CategoriesTab({ categories, onReload }: { categories: QuizCategory[], onReload: () => void }) {
  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quiz Categories</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="p-4 border rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="text-center space-y-3">
                <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center`}
                     style={{ backgroundColor: category.color_scheme + '20', color: category.color_scheme }}>
                  <AcademicCapIcon className="w-6 h-6" />
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">{category.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                </div>
                
                <div className="text-sm">
                  <div className="text-2xl font-bold text-blue-600">{category.total_questions}</div>
                  <div className="text-gray-500">Questions</div>
                </div>
                
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// Analytics Tab Component  
function AnalyticsTab({ analytics }: { analytics: any }) {
  return (
    <div className="space-y-6">
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center">
          <div className="text-3xl font-bold text-blue-600">{analytics.totalQuestions || 0}</div>
          <div className="text-sm text-gray-600">Total Questions</div>
        </Card>
        
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-600">{analytics.totalSessions || 0}</div>
          <div className="text-sm text-gray-600">Quiz Sessions</div>
        </Card>
        
        <Card className="text-center">
          <div className="text-3xl font-bold text-purple-600">{analytics.totalUsers || 0}</div>
          <div className="text-sm text-gray-600">Active Users</div>
        </Card>
        
        <Card className="text-center">
          <div className="text-3xl font-bold text-orange-600">{analytics.averageScore || 0}%</div>
          <div className="text-sm text-gray-600">Avg Score</div>
        </Card>
      </div>

      {/* Top Categories */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Popular Categories</h3>
        
        <div className="space-y-3">
          {(analytics.topCategories || []).map((category: any, index: number) => (
            <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <span className="font-medium">{category.category}</span>
              </div>
              <span className="text-blue-600 font-semibold">{category.sessions} sessions</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// Question Form Component (simplified version)
function QuestionForm({ 
  question, 
  categories, 
  onSave, 
  onClose 
}: {
  question: QuizQuestion | null
  categories: QuizCategory[]
  onSave: (success: boolean) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    category_id: question?.category_id || (categories[0]?.id || ''),
    question_text: question?.question_text || '',
    question_type: question?.question_type || 'multiple_choice' as const,
    difficulty: question?.difficulty || 'beginner' as const,
    options: question?.options || [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
      { key: 'C', text: '' },
      { key: 'D', text: '' }
    ] as QuizOption[],
    correct_answer: question?.correct_answer || '',
    explanation: question?.explanation || '',
    reference_source: question?.reference_source || '',
    learning_points: question?.learning_points || [],
    points_value: question?.points_value || 10,
    estimated_time_seconds: question?.estimated_time_seconds || 60
  })
  const [saving, setSaving] = useState(false)

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = { ...newOptions[index], text }
    setFormData({ ...formData, options: newOptions })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Validate form data before sending
      if (!formData.category_id || !formData.question_text || !formData.difficulty || !formData.correct_answer) {
        toast.error('Please fill in all required fields')
        onSave(false)
        return
      }

      if (!formData.options.some(opt => opt.text.trim())) {
        toast.error('Please add at least one answer option')
        onSave(false)
        return
      }

      if (!formData.options.find(opt => opt.key === formData.correct_answer)?.text.trim()) {
        toast.error('Please select a correct answer and ensure it has text')
        onSave(false)
        return
      }

      const url = question 
        ? `/api/admin/quiz/questions/${question.id}`
        : '/api/admin/quiz/questions'
      
      const method = question ? 'PUT' : 'POST'

      console.log('Sending form data:', formData)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const responseData = await response.json()
      console.log('API response:', responseData)

      if (!response.ok) {
        // Show the actual API error message
        const errorMessage = responseData.error || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }

      toast.success(`Question ${question ? 'updated' : 'created'} successfully`)
      onSave(true)

    } catch (error) {
      console.error('Save question error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save question'
      toast.error(errorMessage)
      onSave(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {question ? 'Edit Question' : 'Add New Question'}
            </h3>
            <Button type="button" onClick={onClose} variant="outline">
              Cancel
            </Button>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              required
              options={categories.map(category => ({
                value: category.id,
                label: category.name
              }))}
            />

            <Select
              label="Difficulty"
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
              required
              options={[
                { value: 'beginner', label: 'Beginner' },
                { value: 'intermediate', label: 'Intermediate' },
                { value: 'advanced', label: 'Advanced' },
                { value: 'expert', label: 'Expert' }
              ]}
            />
          </div>

          {/* Question Text */}
          <Textarea
            label="Question Text"
            value={formData.question_text}
            onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
            required
            rows={3}
          />

          {/* Answer Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer Options
            </label>
            <div className="space-y-3">
              {formData.options.map((option, index) => (
                <div key={option.key} className="flex items-center space-x-3">
                  <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-semibold">
                    {option.key}
                  </span>
                  <Input
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${option.key}`}
                    required
                    className="flex-1"
                  />
                  <input
                    type="radio"
                    name="correct_answer"
                    value={option.key}
                    checked={formData.correct_answer === option.key}
                    onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                    className="text-blue-600"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <Textarea
            label="Explanation"
            value={formData.explanation}
            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            rows={3}
            helperText="Detailed explanation of the correct answer"
          />

          {/* Additional Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Points Value"
              type="number"
              value={formData.points_value}
              onChange={(e) => setFormData({ ...formData, points_value: parseInt(e.target.value) })}
              min="1"
              max="100"
            />
            
            <Input
              label="Estimated Time (seconds)"
              type="number"
              value={formData.estimated_time_seconds}
              onChange={(e) => setFormData({ ...formData, estimated_time_seconds: parseInt(e.target.value) })}
              min="15"
              max="600"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-4 border-t pt-4">
            <Button type="button" onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-blue-600">
              {saving ? (
                <LoadingSpinner size="sm" />
              ) : (
                question ? 'Update Question' : 'Create Question'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
