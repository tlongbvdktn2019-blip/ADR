'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { 
  TrophyIcon, 
  FireIcon, 
  BookOpenIcon,
  PlayIcon,
  StarIcon,
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { 
  QuizCategory, 
  UserQuizStats, 
  LeaderboardEntry, 
  DailyChallenge, 
  Achievement,
  QuizUtils
} from '@/types/quiz'

interface QuizHubProps {
  onStartQuiz: (categoryId: string, difficulty: string) => void
  onStartDailyChallenge: (challengeId: string) => void
}

export default function QuizHub({ onStartQuiz, onStartDailyChallenge }: QuizHubProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'categories' | 'leaderboard' | 'achievements' | 'stats'>('categories')
  const [categories, setCategories] = useState<QuizCategory[]>([])
  const [userStats, setUserStats] = useState<UserQuizStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('beginner')

  useEffect(() => {
    if (session) {
      loadQuizData()
    }
  }, [session])

  const loadQuizData = async () => {
    try {
      const [categoriesRes, statsRes, leaderboardRes, challengeRes] = await Promise.all([
        fetch('/api/quiz/categories'),
        fetch('/api/quiz/stats'),
        fetch('/api/quiz/leaderboard?limit=10'),
        fetch('/api/quiz/daily-challenge')
      ])

      const [categoriesData, statsData, leaderboardData, challengeData] = await Promise.all([
        categoriesRes.json(),
        statsRes.json(), 
        leaderboardRes.json(),
        challengeRes.json()
      ])

      if (categoriesData.success) setCategories(categoriesData.data)
      if (statsData.success) {
        setUserStats(statsData.data.stats)
        setAchievements(statsData.data.achievements)
      }
      if (leaderboardData.success) setLeaderboard(leaderboardData.data)
      if (challengeData.success) setDailyChallenge(challengeData.data)

    } catch (error) {
      console.error('Failed to load quiz data:', error)
      toast.error('Failed to load quiz data')
    } finally {
      setLoading(false)
    }
  }

  const handleStartQuiz = () => {
    if (!selectedCategory) {
      toast.error('Please select a category')
      return
    }
    onStartQuiz(selectedCategory, selectedDifficulty)
  }

  const handleStartChallenge = () => {
    if (dailyChallenge && !dailyChallenge.user_completed) {
      onStartDailyChallenge(dailyChallenge.id)
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
    { id: 'categories' as const, label: 'Quiz Categories', icon: BookOpenIcon },
    { id: 'leaderboard' as const, label: 'Leaderboard', icon: TrophyIcon },
    { id: 'achievements' as const, label: 'Achievements', icon: StarIcon },
    { id: 'stats' as const, label: 'My Stats', icon: ChartBarIcon }
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <AcademicCapIcon className="w-8 h-8 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ADR Training Hub</h1>
          <p className="text-gray-600">Master your ADR knowledge through interactive quizzes</p>
        </div>
      </div>

      {/* Daily Challenge Banner */}
      {dailyChallenge && (
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{dailyChallenge.title}</h3>
                <p className="text-sm text-gray-600">{dailyChallenge.description}</p>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                    {dailyChallenge.difficulty}
                  </span>
                  <span className="text-xs text-gray-500">
                    {dailyChallenge.question_count} questions
                  </span>
                  {dailyChallenge.time_limit_seconds && (
                    <span className="text-xs text-gray-500 flex items-center">
                      <ClockIcon className="w-3 h-3 mr-1" />
                      {Math.floor(dailyChallenge.time_limit_seconds / 60)}m
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              {dailyChallenge.user_completed ? (
                <div className="space-y-1">
                  <div className="text-sm text-green-600 font-medium">Completed!</div>
                  {dailyChallenge.user_score && (
                    <div className="text-xs text-gray-500">
                      Score: {dailyChallenge.user_score} (#{dailyChallenge.user_rank})
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  onClick={handleStartChallenge}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <PlayIcon className="w-4 h-4 mr-2" />
                  Start Challenge
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* User Stats Summary */}
      {userStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <TrophyIcon className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{userStats.total_points_earned}</div>
            <div className="text-sm text-gray-600">Total Points</div>
          </Card>
          
          <Card className="text-center">
            <FireIcon className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{userStats.current_streak}</div>
            <div className="text-sm text-gray-600">Current Streak</div>
          </Card>
          
          <Card className="text-center">
            <BookOpenIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{userStats.total_questions_answered}</div>
            <div className="text-sm text-gray-600">Questions Answered</div>
          </Card>
          
          <Card className="text-center">
            <ChartBarIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {QuizUtils.calculateAccuracy(userStats.total_correct_answers, userStats.total_questions_answered)}%
            </div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
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
        {activeTab === 'categories' && (
          <CategoriesTab
            categories={categories}
            selectedCategory={selectedCategory}
            selectedDifficulty={selectedDifficulty}
            onCategorySelect={setSelectedCategory}
            onDifficultySelect={setSelectedDifficulty}
            onStartQuiz={handleStartQuiz}
          />
        )}
        
        {activeTab === 'leaderboard' && (
          <LeaderboardTab leaderboard={leaderboard} currentUserId={session?.user?.id} />
        )}
        
        {activeTab === 'achievements' && (
          <AchievementsTab achievements={achievements} />
        )}
        
        {activeTab === 'stats' && userStats && (
          <StatsTab stats={userStats} />
        )}
      </div>
    </div>
  )
}

// Tab Components
function CategoriesTab({ 
  categories, 
  selectedCategory, 
  selectedDifficulty, 
  onCategorySelect, 
  onDifficultySelect, 
  onStartQuiz 
}: {
  categories: QuizCategory[]
  selectedCategory: string
  selectedDifficulty: string
  onCategorySelect: (id: string) => void
  onDifficultySelect: (difficulty: string) => void
  onStartQuiz: () => void
}) {
  const difficulties = [
    { key: 'beginner', label: 'Beginner', description: 'Basic concepts' },
    { key: 'intermediate', label: 'Intermediate', description: 'Standard knowledge' },
    { key: 'advanced', label: 'Advanced', description: 'Expert level' },
    { key: 'expert', label: 'Expert', description: 'Master level' }
  ]

  return (
    <div className="space-y-6">
      
      {/* Categories Grid */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Choose a Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card
              key={category.id}
              className={`cursor-pointer transition-all ${
                selectedCategory === category.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'hover:border-gray-300'
              }`}
              onClick={() => onCategorySelect(category.id)}
            >
              <div className="text-center space-y-3">
                <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center`}
                     style={{ backgroundColor: category.color_scheme + '20', color: category.color_scheme }}>
                  <BookOpenIcon className="w-6 h-6" />
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">{category.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                </div>
                
                <div className="text-xs text-gray-500">
                  {category.total_questions} questions available
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Difficulty Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Difficulty</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {difficulties.map((diff) => (
            <button
              key={diff.key}
              onClick={() => onDifficultySelect(diff.key)}
              className={`p-3 rounded-lg border text-left ${
                selectedDifficulty === diff.key
                  ? QuizUtils.getDifficultyColor(diff.key) + ' border-current'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">{diff.label}</div>
              <div className="text-xs text-gray-600">{diff.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Start Quiz Button */}
      <div className="text-center">
        <Button
          onClick={onStartQuiz}
          disabled={!selectedCategory}
          className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
        >
          <PlayIcon className="w-5 h-5 mr-2" />
          Start Quiz
        </Button>
      </div>
    </div>
  )
}

function LeaderboardTab({ 
  leaderboard, 
  currentUserId 
}: { 
  leaderboard: LeaderboardEntry[]
  currentUserId?: string 
}) {
  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Top Performers</h3>
          <UserGroupIcon className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.user_id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                entry.user_id === currentUserId ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-orange-600 text-white' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  {index + 1}
                </div>
                
                <div>
                  <div className="font-medium text-gray-900">{entry.user_name}</div>
                  <div className="text-sm text-gray-600">{entry.user_organization}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-gray-900">{entry.total_score}</div>
                <div className="text-xs text-gray-500">{entry.accuracy_percentage}% accuracy</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function AchievementsTab({ achievements }: { achievements: Achievement[] }) {
  const earnedAchievements = achievements.filter(a => a.is_earned)
  const availableAchievements = achievements.filter(a => !a.is_earned)

  return (
    <div className="space-y-6">
      
      {/* Earned Achievements */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Earned Achievements ({earnedAchievements.length})
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {earnedAchievements.map((achievement) => (
            <Card key={achievement.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <div className="text-center space-y-3">
                <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${QuizUtils.getRarityColor(achievement.rarity)}`}>
                  <StarIcon className="w-6 h-6 text-white" />
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">{achievement.name}</h4>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="capitalize">{achievement.rarity}</span>
                  <span>+{achievement.points_reward} pts</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Available Achievements */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Available Achievements ({availableAchievements.length})
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableAchievements.map((achievement) => (
            <Card key={achievement.id} className="opacity-75">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-gray-200">
                  <StarIcon className="w-6 h-6 text-gray-400" />
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700">{achievement.name}</h4>
                  <p className="text-sm text-gray-500">{achievement.description}</p>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="capitalize">{achievement.rarity}</span>
                  <span>+{achievement.points_reward} pts</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatsTab({ stats }: { stats: UserQuizStats }) {
  return (
    <div className="space-y-6">
      
      {/* Overall Stats */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Overall Statistics</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total_sessions}</div>
            <div className="text-sm text-gray-600">Total Sessions</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.total_questions_answered}</div>
            <div className="text-sm text-gray-600">Questions Answered</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {QuizUtils.calculateAccuracy(stats.total_correct_answers, stats.total_questions_answered)}%
            </div>
            <div className="text-sm text-gray-600">Accuracy Rate</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.average_score.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Avg Score</div>
          </div>
        </div>
      </Card>

      {/* Category Performance */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Category Performance</h3>
        
        <div className="space-y-4">
          {Object.entries(stats.category_stats).map(([category, categoryStats]) => (
            <div key={category} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium capitalize">{category.replace('_', ' ')}</span>
                <span className="text-gray-600">
                  {categoryStats.correct}/{categoryStats.answered} correct
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${categoryStats.mastery_level}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>{QuizUtils.getMasteryLevel(categoryStats.mastery_level)} Level</span>
                <span>{categoryStats.mastery_level}% mastery</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Streaks */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Streaks</h3>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <FireIcon className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.current_streak}</div>
            <div className="text-sm text-gray-600">Current Streak</div>
          </div>
          
          <div className="text-center">
            <TrophyIcon className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.longest_streak}</div>
            <div className="text-sm text-gray-600">Best Streak</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
