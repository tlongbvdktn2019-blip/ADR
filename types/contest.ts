// =====================================================
// TYPES: CUỘC THI KIẾN THỨC ADR
// =====================================================

export interface Department {
  id: string;
  name: string;
  code?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  department_id: string;
  name: string;
  code?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  department?: Department;
}

export interface Contest {
  id: string;
  title: string;
  description?: string;
  rules?: string;
  prizes?: string;
  logo_url?: string;
  
  // Cấu hình
  number_of_questions: number;
  time_per_question: number;
  passing_score?: number;
  
  // Thời gian
  start_date?: string;
  end_date?: string;
  
  // Trạng thái
  status: 'draft' | 'active' | 'ended' | 'archived';
  is_public: boolean;
  
  // Metadata
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ContestParticipant {
  id: string;
  contest_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  department_id?: string;
  unit_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  
  // Relations
  department?: Department;
  unit?: Unit;
}

export interface QuestionAnswer {
  question_id: string;
  question_text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  selected_answer?: 'A' | 'B' | 'C' | 'D';
  correct_answer: 'A' | 'B' | 'C' | 'D';
  is_correct?: boolean;
  explanation?: string;
  time_spent?: number;
}

export interface ContestSubmission {
  id: string;
  contest_id: string;
  participant_id: string;
  
  // Kết quả
  score: number;
  total_questions: number;
  correct_answers: number;
  
  // Thời gian
  started_at: string;
  submitted_at: string;
  time_taken: number;
  
  // Dữ liệu
  questions: QuestionAnswer[];
  answers: Record<string, string>;
  
  // Trạng thái
  status: 'in_progress' | 'completed' | 'abandoned';
  
  created_at: string;
  updated_at: string;
  
  // Relations
  participant?: ContestParticipant;
  contest?: Contest;
}

export interface ContestAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  selected_answer: 'A' | 'B' | 'C' | 'D';
  correct_answer: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
  time_spent?: number;
  answered_at: string;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  contest_id: string;
  full_name: string;
  email?: string;
  department_name?: string;
  unit_name?: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken: number;
  submitted_at: string;
  rank: number;
}

// Form types
export interface ContestRegistrationForm {
  full_name: string;
  email?: string;
  phone?: string;
  department_id: string;
  unit_id: string;
}

export interface ContestAnswerSubmission {
  question_id: string;
  selected_answer: 'A' | 'B' | 'C' | 'D';
  time_spent: number;
}

// Statistics types
export interface ContestStatistics {
  total_participants: number;
  total_submissions: number;
  average_score: number;
  average_time: number;
  completion_rate: number;
  score_distribution: {
    range: string;
    count: number;
  }[];
  top_performers: LeaderboardEntry[];
  department_stats: {
    department_name: string;
    participants: number;
    average_score: number;
  }[];
}

// API Response types
export interface ContestApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}







