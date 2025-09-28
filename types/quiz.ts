// Quiz System Types
// Separated from service to avoid server/client boundary issues

export interface QuizCategory {
  id: string
  name: string
  category_key: 'who_umc' | 'naranjo' | 'drug_knowledge' | 'case_studies' | 'regulations' | 'general'
  description: string
  icon_name: string
  color_scheme: string
  total_questions: number
  is_active: boolean
}

export interface QuizOption {
  key: string // 'A', 'B', 'C', 'D'
  text: string
  is_image?: boolean
  image_url?: string
}

export interface QuizQuestion {
  id: string
  category_id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'case_scenario'
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  options: QuizOption[]
  correct_answer: string
  explanation: string
  reference_source?: string
  learning_points: string[]
  estimated_time_seconds: number
  points_value: number
  times_answered: number
  times_correct: number
}

export interface QuizSession {
  id: string
  user_id: string
  category_id: string
  session_name: string
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  total_questions: number
  time_limit_seconds?: number
  questions_answered: number
  correct_answers: number
  total_score: number
  time_taken_seconds: number
  completion_percentage: number
  status: 'in_progress' | 'completed' | 'abandoned'
  started_at: string
  completed_at?: string
  questions: QuizQuestion[]
}

export interface QuizAnswer {
  id: string
  session_id: string
  question_id: string
  selected_answer: string
  is_correct: boolean
  points_earned: number
  time_taken_seconds: number
  was_skipped: boolean
  hint_used: boolean
  explanation_viewed: boolean
}

export interface CategoryStats {
  answered: number
  correct: number
  avg_score: number
  mastery_level: number // 0-100%
}

export interface UserQuizStats {
  id: string
  user_id: string
  total_sessions: number
  total_questions_answered: number
  total_correct_answers: number
  total_points_earned: number
  average_score: number
  category_stats: Record<string, CategoryStats>
  current_streak: number
  longest_streak: number
  last_activity_date: string
  total_time_spent_seconds: number
  average_time_per_question: number
  current_rank?: number
  best_rank?: number
}

export interface LeaderboardEntry {
  user_id: string
  user_name: string
  user_organization: string
  total_score: number
  questions_answered: number
  accuracy_percentage: number
  average_time: number
  rank_position: number
  rank_change: number
}

export interface Achievement {
  id: string
  achievement_key: string
  name: string
  description: string
  achievement_type: 'score_based' | 'streak_based' | 'category_mastery' | 'speed_based' | 'participation'
  criteria: Record<string, any>
  points_reward: number
  badge_icon: string
  badge_color: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  is_earned?: boolean
  earned_at?: string
}

export interface DailyChallenge {
  id: string
  challenge_date: string
  title: string
  description: string
  category_id: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  question_count: number
  time_limit_seconds?: number
  base_points: number
  bonus_multiplier: number
  selected_questions: string[]
  participants_count: number
  completions_count: number
  average_score: number
  user_completed?: boolean
  user_score?: number
  user_rank?: number
}

// Utility functions for quiz UI (client-safe)
export const QuizUtils = {
  /**
   * Get difficulty color scheme
   */
  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-300'
      case 'intermediate': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'advanced': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'expert': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  },

  /**
   * Get category icon component name
   */
  getCategoryIcon(iconName: string): string {
    return iconName || 'BookOpenIcon'
  },

  /**
   * Calculate accuracy percentage
   */
  calculateAccuracy(correct: number, total: number): number {
    if (total === 0) return 0
    return Math.round((correct / total) * 100)
  },

  /**
   * Format time duration
   */
  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  },

  /**
   * Get achievement rarity color
   */
  getRarityColor(rarity: string): string {
    switch (rarity) {
      case 'common': return 'bg-gray-500'
      case 'uncommon': return 'bg-green-500'
      case 'rare': return 'bg-blue-500'
      case 'epic': return 'bg-purple-500'
      case 'legendary': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  },

  /**
   * Get mastery level description
   */
  getMasteryLevel(percentage: number): string {
    if (percentage >= 95) return 'Master'
    if (percentage >= 85) return 'Expert'
    if (percentage >= 75) return 'Advanced'
    if (percentage >= 60) return 'Intermediate'
    if (percentage >= 40) return 'Beginner'
    return 'Novice'
  }
}









