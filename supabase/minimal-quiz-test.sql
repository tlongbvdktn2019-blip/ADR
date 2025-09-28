-- Minimal Quiz Test Setup
-- Use this if you just want to test the quiz system quickly

-- Create basic tables
CREATE TABLE IF NOT EXISTS quiz_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category_key VARCHAR(50) NOT NULL,
    description TEXT,
    icon_name VARCHAR(100),
    color_scheme VARCHAR(50),
    total_questions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) DEFAULT 'multiple_choice',
    difficulty VARCHAR(20) DEFAULT 'beginner',
    options JSONB NOT NULL,
    correct_answer VARCHAR(10) NOT NULL,
    explanation TEXT,
    points_value INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    review_status VARCHAR(20) DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS quiz_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    category_id UUID,
    session_name VARCHAR(255),
    difficulty_level VARCHAR(20),
    total_questions INTEGER NOT NULL,
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    time_taken_seconds INTEGER,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'in_progress',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID,
    question_id UUID,
    selected_answer VARCHAR(10),
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    time_taken_seconds INTEGER,
    was_skipped BOOLEAN DEFAULT false,
    hint_used BOOLEAN DEFAULT false,
    explanation_viewed BOOLEAN DEFAULT false,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Clear existing data (optional - remove this if you want to keep existing data)
-- DELETE FROM quiz_questions;
-- DELETE FROM quiz_categories;

-- Insert test category
INSERT INTO quiz_categories (name, category_key, description, icon_name, color_scheme, total_questions) 
VALUES ('Test Category', 'test', 'Test questions for quiz system', 'BookOpenIcon', 'blue', 3);

-- Get the category ID
DO $$
DECLARE
    test_category_id UUID;
BEGIN
    SELECT id INTO test_category_id FROM quiz_categories WHERE category_key = 'test';
    
    -- Insert 3 simple test questions
    INSERT INTO quiz_questions (category_id, question_text, difficulty, options, correct_answer, explanation, points_value) VALUES
    (test_category_id, 'ADR là viết tắt của từ nào?', 'beginner', 
     '[{"key": "A", "text": "Adverse Drug Reaction"}, {"key": "B", "text": "Advanced Drug Review"}, {"key": "C", "text": "Automatic Drug Report"}, {"key": "D", "text": "All Drug Records"}]'::jsonb, 
     'A', 'ADR là viết tắt của Adverse Drug Reaction - Phản ứng có hại của thuốc.', 10),
    
    (test_category_id, 'WHO-UMC có mấy mức độ đánh giá?', 'beginner', 
     '[{"key": "A", "text": "4 mức độ"}, {"key": "B", "text": "5 mức độ"}, {"key": "C", "text": "6 mức độ"}, {"key": "D", "text": "7 mức độ"}]'::jsonb, 
     'C', 'WHO-UMC có 6 mức độ đánh giá mối liên quan thuốc-ADR.', 10),
    
    (test_category_id, 'Thang Naranjo có tối đa bao nhiêu điểm?', 'intermediate', 
     '[{"key": "A", "text": "10 điểm"}, {"key": "B", "text": "13 điểm"}, {"key": "C", "text": "15 điểm"}, {"key": "D", "text": "20 điểm"}]'::jsonb, 
     'B', 'Thang Naranjo có điểm số từ -4 đến +13, tối đa là 13 điểm.', 15);
    
    RAISE NOTICE 'Test questions inserted successfully for category ID: %', test_category_id;
END $$;

-- Verify setup
SELECT 'Setup completed!' as status;
SELECT c.name, c.category_key, COUNT(q.id) as question_count
FROM quiz_categories c
LEFT JOIN quiz_questions q ON c.id = q.category_id
GROUP BY c.id, c.name, c.category_key;
