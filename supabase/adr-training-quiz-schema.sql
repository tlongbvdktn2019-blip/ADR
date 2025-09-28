-- ADR Training Quiz System Schema
-- Comprehensive quiz system for ADR knowledge training

-- Create enum types for quiz system
CREATE TYPE quiz_difficulty AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE quiz_category AS ENUM ('who_umc', 'naranjo', 'drug_knowledge', 'case_studies', 'regulations', 'general');
CREATE TYPE quiz_question_type AS ENUM ('multiple_choice', 'true_false', 'case_scenario');
CREATE TYPE achievement_type AS ENUM ('score_based', 'streak_based', 'category_mastery', 'speed_based', 'participation');

-- Quiz Categories Table
CREATE TABLE quiz_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category_key quiz_category NOT NULL,
    description TEXT,
    icon_name VARCHAR(100), -- For UI icons
    color_scheme VARCHAR(50), -- For UI theming
    total_questions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Quiz Questions Table
CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES quiz_categories(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type quiz_question_type DEFAULT 'multiple_choice',
    difficulty quiz_difficulty DEFAULT 'beginner',
    
    -- Answer options (JSON for flexibility)
    options JSONB NOT NULL, -- Array of answer options
    correct_answer VARCHAR(10) NOT NULL, -- 'A', 'B', 'C', 'D' or 'true'/'false'
    
    -- Educational content
    explanation TEXT, -- Detailed explanation of correct answer
    reference_source TEXT, -- WHO guidelines, Naranjo paper, etc.
    learning_points TEXT[], -- Key learning points array
    
    -- Metadata
    estimated_time_seconds INTEGER DEFAULT 60,
    points_value INTEGER DEFAULT 10, -- Base points for correct answer
    times_answered INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    
    -- Content management
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    review_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Quiz Sessions Table (individual quiz attempts)
CREATE TABLE quiz_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES quiz_categories(id),
    
    -- Session configuration
    session_name VARCHAR(255), -- "WHO Assessment Quiz", "Daily Challenge", etc.
    difficulty_level quiz_difficulty,
    total_questions INTEGER NOT NULL,
    time_limit_seconds INTEGER, -- NULL for untimed
    
    -- Session results
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    time_taken_seconds INTEGER,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Session status
    status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, abandoned
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Quiz Answers Table (individual question responses)
CREATE TABLE quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES quiz_questions(id),
    
    -- Answer details
    selected_answer VARCHAR(10), -- User's selected answer
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    time_taken_seconds INTEGER,
    
    -- Additional context
    was_skipped BOOLEAN DEFAULT false,
    hint_used BOOLEAN DEFAULT false,
    explanation_viewed BOOLEAN DEFAULT false,
    
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- User Quiz Statistics Table
CREATE TABLE user_quiz_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Overall statistics
    total_sessions INTEGER DEFAULT 0,
    total_questions_answered INTEGER DEFAULT 0,
    total_correct_answers INTEGER DEFAULT 0,
    total_points_earned INTEGER DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0.00,
    
    -- Category performance
    category_stats JSONB DEFAULT '{}', -- {category: {answered: X, correct: Y, avg_score: Z}}
    
    -- Streaks and achievements
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    
    -- Time-based stats
    total_time_spent_seconds INTEGER DEFAULT 0,
    average_time_per_question DECIMAL(5,2) DEFAULT 0.00,
    
    -- Ranking
    current_rank INTEGER,
    best_rank INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    
    UNIQUE(user_id)
);

-- Leaderboards Table
CREATE TABLE quiz_leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Ranking criteria
    leaderboard_type VARCHAR(50) NOT NULL, -- 'overall', 'monthly', 'weekly', 'category_specific'
    category_id UUID REFERENCES quiz_categories(id), -- NULL for overall rankings
    time_period VARCHAR(20), -- 'all_time', '2024-01', '2024-W01'
    
    -- Score data
    total_score INTEGER NOT NULL,
    questions_answered INTEGER NOT NULL,
    accuracy_percentage DECIMAL(5,2) NOT NULL,
    average_time DECIMAL(5,2),
    
    -- Ranking
    rank_position INTEGER NOT NULL,
    rank_change INTEGER DEFAULT 0, -- Change from previous period
    
    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    
    UNIQUE(user_id, leaderboard_type, category_id, time_period)
);

-- Achievements System Table
CREATE TABLE quiz_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    achievement_key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    achievement_type achievement_type NOT NULL,
    
    -- Achievement criteria (flexible JSON structure)
    criteria JSONB NOT NULL, -- {score: 1000, category: 'who_umc', streak: 10, etc.}
    
    -- Rewards
    points_reward INTEGER DEFAULT 0,
    badge_icon VARCHAR(100),
    badge_color VARCHAR(50),
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    rarity VARCHAR(20) DEFAULT 'common', -- common, rare, epic, legendary
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- User Achievements Table (earned achievements)
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES quiz_achievements(id) ON DELETE CASCADE,
    
    -- Achievement context
    earned_from_session UUID REFERENCES quiz_sessions(id), -- If earned from specific session
    points_earned INTEGER DEFAULT 0,
    
    -- Progress tracking
    progress JSONB, -- For progressive achievements
    is_notified BOOLEAN DEFAULT false, -- Has user been notified?
    
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    
    UNIQUE(user_id, achievement_id)
);

-- Daily Challenges Table
CREATE TABLE quiz_daily_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_date DATE NOT NULL UNIQUE,
    
    -- Challenge configuration
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES quiz_categories(id),
    difficulty quiz_difficulty NOT NULL,
    question_count INTEGER DEFAULT 10,
    time_limit_seconds INTEGER,
    
    -- Rewards
    base_points INTEGER DEFAULT 100,
    bonus_multiplier DECIMAL(3,2) DEFAULT 1.0,
    
    -- Challenge questions (pre-selected)
    selected_questions UUID[] NOT NULL,
    
    -- Participation stats
    participants_count INTEGER DEFAULT 0,
    completions_count INTEGER DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0.00,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- User Challenge Participation
CREATE TABLE user_challenge_participation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES quiz_daily_challenges(id) ON DELETE CASCADE,
    session_id UUID REFERENCES quiz_sessions(id),
    
    -- Results
    score INTEGER NOT NULL,
    completion_time_seconds INTEGER,
    rank_in_challenge INTEGER,
    bonus_points INTEGER DEFAULT 0,
    
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    
    UNIQUE(user_id, challenge_id)
);

-- Create indexes for performance
CREATE INDEX idx_quiz_questions_category ON quiz_questions(category_id);
CREATE INDEX idx_quiz_questions_difficulty ON quiz_questions(difficulty);
CREATE INDEX idx_quiz_questions_active ON quiz_questions(is_active);

CREATE INDEX idx_quiz_sessions_user ON quiz_sessions(user_id);
CREATE INDEX idx_quiz_sessions_category ON quiz_sessions(category_id);
CREATE INDEX idx_quiz_sessions_status ON quiz_sessions(status);
CREATE INDEX idx_quiz_sessions_completed ON quiz_sessions(completed_at);

CREATE INDEX idx_quiz_answers_session ON quiz_answers(session_id);
CREATE INDEX idx_quiz_answers_question ON quiz_answers(question_id);

CREATE INDEX idx_user_quiz_stats_user ON user_quiz_stats(user_id);
CREATE INDEX idx_user_quiz_stats_rank ON user_quiz_stats(current_rank);

CREATE INDEX idx_leaderboards_type ON quiz_leaderboards(leaderboard_type);
CREATE INDEX idx_leaderboards_category ON quiz_leaderboards(category_id);
CREATE INDEX idx_leaderboards_period ON quiz_leaderboards(time_period);
CREATE INDEX idx_leaderboards_rank ON quiz_leaderboards(rank_position);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_earned ON user_achievements(earned_at);

-- Insert sample quiz categories
INSERT INTO quiz_categories (name, category_key, description, icon_name, color_scheme) VALUES
('WHO-UMC Assessment', 'who_umc', 'Câu hỏi về thang đánh giá WHO-UMC cho mối liên quan thuốc-ADR', 'BeakerIcon', 'blue'),
('Naranjo Scale', 'naranjo', 'Câu hỏi về thang điểm Naranjo và ứng dụng', 'CalculatorIcon', 'green'),
('Drug Knowledge', 'drug_knowledge', 'Kiến thức về thuốc, tác dụng phụ, tương tác', 'CubeIcon', 'purple'),
('Case Studies', 'case_studies', 'Phân tích các trường hợp ADR thực tế', 'DocumentTextIcon', 'orange'),
('Regulations', 'regulations', 'Quy định pháp lý về ADR tại Việt Nam', 'ScaleIcon', 'red'),
('General ADR', 'general', 'Kiến thức tổng quan về Pharmacovigilance', 'BookOpenIcon', 'gray');

-- Insert sample achievements
INSERT INTO quiz_achievements (achievement_key, name, description, achievement_type, criteria, points_reward, badge_icon, badge_color, rarity) VALUES
('first_quiz', 'First Steps', 'Hoàn thành quiz đầu tiên của bạn', 'participation', '{"sessions_completed": 1}', 50, 'AcademicCapIcon', 'bronze', 'common'),
('perfect_score', 'Perfect Score', 'Đạt điểm tuyệt đối trong một quiz', 'score_based', '{"perfect_score": true}', 200, 'StarIcon', 'gold', 'rare'),
('speed_demon', 'Speed Demon', 'Hoàn thành quiz trong thời gian kỷ lục', 'speed_based', '{"avg_time_per_question": 10}', 150, 'BoltIcon', 'silver', 'uncommon'),
('streak_master', 'Streak Master', 'Duy trì chuỗi 7 ngày liên tiếp', 'streak_based', '{"daily_streak": 7}', 300, 'FireIcon', 'gold', 'rare'),
('who_expert', 'WHO Expert', 'Làm chủ danh mục WHO-UMC', 'category_mastery', '{"category": "who_umc", "accuracy": 90, "min_questions": 50}', 500, 'TrophyIcon', 'platinum', 'epic'),
('naranjo_master', 'Naranjo Master', 'Thành thạo thang điểm Naranjo', 'category_mastery', '{"category": "naranjo", "accuracy": 85, "min_questions": 30}', 400, 'CrownIcon', 'gold', 'epic'),
('knowledge_seeker', 'Knowledge Seeker', 'Trả lời 1000 câu hỏi', 'participation', '{"total_questions": 1000}', 1000, 'LightBulbIcon', 'diamond', 'legendary');

-- Create functions for updating statistics
CREATE OR REPLACE FUNCTION update_quiz_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update question statistics
    UPDATE quiz_questions 
    SET 
        times_answered = times_answered + 1,
        times_correct = times_correct + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        updated_at = timezone('utc', now())
    WHERE id = NEW.question_id;
    
    -- Update user statistics
    INSERT INTO user_quiz_stats (user_id)
    SELECT (SELECT user_id FROM quiz_sessions WHERE id = NEW.session_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    UPDATE user_quiz_stats 
    SET 
        total_questions_answered = total_questions_answered + 1,
        total_correct_answers = total_correct_answers + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        total_points_earned = total_points_earned + NEW.points_earned,
        updated_at = timezone('utc', now())
    WHERE user_id = (SELECT user_id FROM quiz_sessions WHERE id = NEW.session_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic statistics updates
CREATE TRIGGER trigger_update_quiz_statistics
    AFTER INSERT ON quiz_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_quiz_statistics();

-- Function to update user streaks
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
    user_record RECORD;
    last_activity_date DATE;
    today_date DATE := CURRENT_DATE;
BEGIN
    SELECT * INTO user_record FROM user_quiz_stats WHERE user_id = NEW.user_id;
    
    last_activity_date := user_record.last_activity_date;
    
    IF last_activity_date IS NULL THEN
        -- First activity
        UPDATE user_quiz_stats 
        SET 
            current_streak = 1,
            longest_streak = GREATEST(longest_streak, 1),
            last_activity_date = today_date
        WHERE user_id = NEW.user_id;
    ELSIF last_activity_date = today_date - INTERVAL '1 day' THEN
        -- Consecutive day
        UPDATE user_quiz_stats 
        SET 
            current_streak = current_streak + 1,
            longest_streak = GREATEST(longest_streak, current_streak + 1),
            last_activity_date = today_date
        WHERE user_id = NEW.user_id;
    ELSIF last_activity_date < today_date - INTERVAL '1 day' THEN
        -- Streak broken
        UPDATE user_quiz_stats 
        SET 
            current_streak = 1,
            last_activity_date = today_date
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for streak updates
CREATE TRIGGER trigger_update_user_streak
    AFTER INSERT ON quiz_sessions
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION update_user_streak();

-- RLS Policies
ALTER TABLE quiz_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_participation ENABLE ROW LEVEL SECURITY;

-- Public read access for categories and achievements
CREATE POLICY "Public can view quiz categories" ON quiz_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view quiz achievements" ON quiz_achievements
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view daily challenges" ON quiz_daily_challenges
    FOR SELECT USING (is_active = true);

-- Authenticated users can view active questions
CREATE POLICY "Authenticated users can view questions" ON quiz_questions
    FOR SELECT USING (is_active = true AND review_status = 'approved');

-- Users can manage their own quiz sessions and answers
CREATE POLICY "Users can manage their own sessions" ON quiz_sessions
    FOR ALL USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can manage their own answers" ON quiz_answers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM quiz_sessions 
            WHERE id = quiz_answers.session_id 
            AND user_id::text = auth.uid()::text
        )
    );

-- Users can view their own statistics and achievements
CREATE POLICY "Users can view their own stats" ON user_quiz_stats
    FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can view their own achievements" ON user_achievements
    FOR SELECT USING (user_id::text = auth.uid()::text);

-- Users can view leaderboards but not modify
CREATE POLICY "Users can view leaderboards" ON quiz_leaderboards
    FOR SELECT TO authenticated;

CREATE POLICY "Users can view challenge participation" ON user_challenge_participation
    FOR SELECT TO authenticated;

-- Admin policies for content management
CREATE POLICY "Admins can manage quiz content" ON quiz_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage daily challenges" ON quiz_daily_challenges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text AND role = 'admin'
        )
    );









