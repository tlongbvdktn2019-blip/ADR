'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  LightBulbIcon,
  ArrowRightIcon,
  TrophyIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { QuizSession, QuizQuestion, QuizAnswer } from '@/types/quiz'

interface QuizGameProps {
  session: QuizSession
  onComplete: (finalScore: number) => void
  onExit: () => void
}

export default function QuizGame({ session, onComplete, onExit }: QuizGameProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [showExplanation, setShowExplanation] = useState(false)
  const [timeLeft, setTimeLeft] = useState(session.time_limit_seconds)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [score, setScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const currentQuestion = session.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === session.questions.length - 1

  // Timer effect
  useEffect(() => {
    if (!timeLeft || timeLeft <= 0 || showExplanation || isComplete) return

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft, showExplanation, isComplete])

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !showExplanation) {
      handleSubmitAnswer(true) // Auto-submit as skipped
    }
  }, [timeLeft])

  // Reset question timer when moving to next question
  useEffect(() => {
    setQuestionStartTime(Date.now())
    setSelectedAnswer('')
    setShowExplanation(false)
  }, [currentQuestionIndex])

  const handleAnswerSelect = (answerKey: string) => {
    if (!showExplanation) {
      setSelectedAnswer(answerKey)
    }
  }

  const handleSubmitAnswer = useCallback(async (wasSkipped = false) => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      const timeTaken = Math.round((Date.now() - questionStartTime) / 1000)
      const answerToSubmit = wasSkipped ? '' : selectedAnswer

      const response = await fetch(`/api/quiz/sessions/${session.id}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedAnswer: answerToSubmit,
          timeTaken,
          wasSkipped,
          hintUsed: false
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit answer')
      }

      const answer = result.data
      setAnswers(prev => [...prev, answer])
      setScore(prev => prev + answer.points_earned)
      setShowExplanation(true)

      // Show feedback
      if (answer.is_correct) {
        toast.success(`Correct! +${answer.points_earned} points`)
      } else if (!wasSkipped) {
        toast.error('Incorrect answer')
      } else {
        toast('Question skipped', { icon: '⏭️' })
      }

    } catch (error) {
      console.error('Submit answer error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit answer')
    } finally {
      setIsSubmitting(false)
    }
  }, [session.id, currentQuestion?.id, selectedAnswer, questionStartTime, isSubmitting])

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      setIsComplete(true)
      onComplete(score)
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handleSkipQuestion = () => {
    handleSubmitAnswer(true)
  }

  const getAnswerButtonClass = (optionKey: string, isCorrect?: boolean) => {
    const baseClass = "w-full p-4 text-left border rounded-lg transition-all duration-200 "
    
    if (!showExplanation) {
      return baseClass + (selectedAnswer === optionKey
        ? "border-blue-500 bg-blue-50 text-blue-700"
        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50")
    }

    // Show results
    if (optionKey === currentQuestion.correct_answer) {
      return baseClass + "border-green-500 bg-green-50 text-green-700"
    } else if (selectedAnswer === optionKey && !isCorrect) {
      return baseClass + "border-red-500 bg-red-50 text-red-700"
    } else {
      return baseClass + "border-gray-200 bg-gray-50 text-gray-500"
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    return ((currentQuestionIndex + (showExplanation ? 1 : 0)) / session.questions.length) * 100
  }

  if (isComplete) {
    return (
      <Card className="max-w-2xl mx-auto text-center">
        <div className="space-y-6">
          <div className="flex justify-center">
            <TrophyIcon className="w-20 h-20 text-yellow-500" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
            <p className="text-gray-600">Congratulations on completing the quiz</p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">{score}</div>
                <div className="text-sm text-gray-600">Total Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {answers.filter(a => a.is_correct).length}
                </div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round((answers.filter(a => a.is_correct).length / answers.length) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatTime(Math.floor(answers.reduce((sum, a) => sum + a.time_taken_seconds, 0)))}
                </div>
                <div className="text-sm text-gray-600">Time</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Button onClick={onExit} variant="outline">
              Back to Quiz Hub
            </Button>
            <Button onClick={() => window.location.reload()} className="bg-blue-600">
              Take Another Quiz
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{session.session_name}</h2>
          <p className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {session.questions.length}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {timeLeft && (
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              timeLeft <= 30 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <ClockIcon className="w-4 h-4" />
              <span className="font-mono">{formatTime(timeLeft)}</span>
            </div>
          )}
          
          <div className="text-right">
            <div className="text-lg font-semibold text-blue-600">{score}</div>
            <div className="text-xs text-gray-500">points</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>

      {/* Question Card */}
      <Card>
        <div className="space-y-6">
          
          {/* Question Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  currentQuestion.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                  currentQuestion.difficulty === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                  currentQuestion.difficulty === 'advanced' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {currentQuestion.difficulty}
                </span>
                <span className="text-sm text-gray-500">
                  {currentQuestion.points_value} points
                </span>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 leading-relaxed">
                {currentQuestion.question_text}
              </h3>
            </div>
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option.key}
                onClick={() => handleAnswerSelect(option.key)}
                disabled={showExplanation || isSubmitting}
                className={getAnswerButtonClass(
                  option.key, 
                  option.key === currentQuestion.correct_answer
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold ${
                    showExplanation && option.key === currentQuestion.correct_answer
                      ? 'border-green-500 bg-green-500 text-white'
                      : showExplanation && selectedAnswer === option.key && option.key !== currentQuestion.correct_answer
                      ? 'border-red-500 bg-red-500 text-white'
                      : selectedAnswer === option.key
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300'
                  }`}>
                    {option.key}
                  </div>
                  <span className="flex-1">{option.text}</span>
                  {showExplanation && option.key === currentQuestion.correct_answer && (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  )}
                  {showExplanation && selectedAnswer === option.key && option.key !== currentQuestion.correct_answer && (
                    <XCircleIcon className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Explanation */}
          {showExplanation && currentQuestion.explanation && (
            <div className="border-t pt-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <LightBulbIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">Explanation:</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                    
                    {currentQuestion.learning_points && currentQuestion.learning_points.length > 0 && (
                      <div className="mt-3">
                        <h5 className="font-medium text-gray-900 mb-1">Key Points:</h5>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {currentQuestion.learning_points.map((point, index) => (
                            <li key={index}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {currentQuestion.reference_source && (
                      <div className="mt-3 text-xs text-gray-500">
                        <strong>Reference:</strong> {currentQuestion.reference_source}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              onClick={onExit}
              variant="outline"
              className="text-gray-600"
            >
              Exit Quiz
            </Button>

            <div className="flex space-x-3">
              {!showExplanation ? (
                <>
                  <Button
                    onClick={handleSkipQuestion}
                    variant="outline"
                    disabled={isSubmitting}
                  >
                    Skip
                  </Button>
                  <Button
                    onClick={() => handleSubmitAnswer()}
                    disabled={!selectedAnswer || isSubmitting}
                    className="bg-blue-600"
                  >
                    {isSubmitting ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        Submit Answer
                        <ArrowRightIcon className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  className="bg-blue-600"
                >
                  {isLastQuestion ? (
                    <>
                      Complete Quiz
                      <TrophyIcon className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Next Question
                      <ArrowRightIcon className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
