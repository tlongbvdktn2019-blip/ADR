'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import MainLayout from '@/components/layout/MainLayout'
import QuizHub from '@/components/quiz/QuizHub'
import QuizGame from '@/components/quiz/QuizGame'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { QuizSession } from '@/types/quiz'
import { AcademicCapIcon } from '@heroicons/react/24/outline'

type ViewState = 'hub' | 'quiz' | 'challenge' | 'loading'

export default function ADRTrainingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [viewState, setViewState] = useState<ViewState>('hub')
  const [currentQuizSession, setCurrentQuizSession] = useState<QuizSession | null>(null)

  const handleStartQuiz = async (categoryId: string, difficulty: string) => {
    if (!session?.user) {
      toast.error('Please login to start quiz')
      return
    }

    setViewState('loading')

    try {
      // Create quiz session
      const response = await fetch('/api/quiz/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryId,
          sessionName: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Quiz`,
          difficulty,
          questionCount: 10, // Default question count
          timeLimit: 300 // 5 minutes default
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start quiz')
      }

      setCurrentQuizSession(result.data)
      setViewState('quiz')

    } catch (error) {
      console.error('Start quiz error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start quiz')
      setViewState('hub')
    }
  }

  const handleStartDailyChallenge = async (challengeId: string) => {
    if (!session?.user) {
      toast.error('Please login to start challenge')
      return
    }

    setViewState('loading')

    try {
      // Start daily challenge session via API
      const response = await fetch('/api/quiz/daily-challenge/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start daily challenge')
      }

      setCurrentQuizSession(result.data)
      setViewState('challenge')

    } catch (error) {
      console.error('Start challenge error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start daily challenge')
      setViewState('hub')
    }
  }

  const handleQuizComplete = (finalScore: number) => {
    toast.success(`Quiz completed! Final score: ${finalScore} points`, {
      duration: 4000,
      icon: '🎉'
    })
    
    setViewState('hub')
    setCurrentQuizSession(null)
  }

  const handleExitQuiz = () => {
    setViewState('hub')
    setCurrentQuizSession(null)
  }

  if (!session) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AcademicCapIcon className="w-16 h-16 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900">ADR Training Hub</h1>
          <p className="text-gray-600 text-center max-w-md">
            Please login to access the ADR training quizzes and track your progress.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login to Start Training
          </button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        
        {/* Loading State */}
        {viewState === 'loading' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <LoadingSpinner size="lg" />
            <h2 className="text-xl font-semibold text-gray-900">Preparing your quiz...</h2>
            <p className="text-gray-600">This will just take a moment</p>
          </div>
        )}

        {/* Quiz Hub */}
        {viewState === 'hub' && (
          <QuizHub
            onStartQuiz={handleStartQuiz}
            onStartDailyChallenge={handleStartDailyChallenge}
          />
        )}

        {/* Quiz Game */}
        {(viewState === 'quiz' || viewState === 'challenge') && currentQuizSession && (
          <QuizGame
            session={currentQuizSession}
            onComplete={handleQuizComplete}
            onExit={handleExitQuiz}
          />
        )}
      </div>
    </MainLayout>
  )
}

