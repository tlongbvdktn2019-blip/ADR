-- QUICK FIX: Quiz RLS Policy Error
-- This is a simpler, immediate fix for the quiz questions RLS issue

-- Option 1: Temporarily make quiz_questions more permissive for admins
DROP POLICY IF EXISTS "Admins can manage quiz content" ON quiz_questions;

-- Create a more permissive admin policy that doesn't rely on complex joins
CREATE POLICY "quiz_questions_admin_all_access" ON quiz_questions
    FOR ALL 
    TO authenticated
    USING (
        -- Allow if user ID matches any admin in the database
        auth.uid()::text IN (
            SELECT id::text FROM users WHERE role = 'admin'
        )
    )
    WITH CHECK (
        -- Same check for INSERT/UPDATE
        auth.uid()::text IN (
            SELECT id::text FROM users WHERE role = 'admin'
        )
    );

-- Option 2: If Option 1 still fails, temporarily disable RLS for quiz_questions
-- Uncomment this line ONLY if absolutely necessary for testing:
-- ALTER TABLE quiz_questions DISABLE ROW LEVEL SECURITY;

-- Option 3: Create a bypass function that uses SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_quiz_question_admin(
    p_category_id UUID,
    p_question_text TEXT,
    p_question_type VARCHAR DEFAULT 'multiple_choice',
    p_difficulty VARCHAR DEFAULT 'beginner',
    p_options JSONB,
    p_correct_answer VARCHAR,
    p_explanation TEXT DEFAULT NULL,
    p_reference_source TEXT DEFAULT NULL,
    p_learning_points TEXT[] DEFAULT NULL,
    p_estimated_time_seconds INTEGER DEFAULT 60,
    p_points_value INTEGER DEFAULT 10
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    new_question_id UUID;
    user_role TEXT;
BEGIN
    -- Check if current user is admin
    SELECT role INTO user_role FROM users WHERE id::text = auth.uid()::text;
    
    IF user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admin users can create quiz questions';
    END IF;
    
    -- Insert the question
    INSERT INTO quiz_questions (
        category_id,
        question_text,
        question_type,
        difficulty,
        options,
        correct_answer,
        explanation,
        reference_source,
        learning_points,
        estimated_time_seconds,
        points_value,
        is_active,
        review_status,
        created_by
    ) VALUES (
        p_category_id,
        p_question_text,
        p_question_type,
        p_difficulty,
        p_options,
        p_correct_answer,
        p_explanation,
        p_reference_source,
        p_learning_points,
        p_estimated_time_seconds,
        p_points_value,
        true,
        'approved',
        auth.uid()
    ) RETURNING id INTO new_question_id;
    
    RETURN new_question_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_quiz_question_admin TO authenticated;

-- Similar function for updating questions
CREATE OR REPLACE FUNCTION update_quiz_question_admin(
    p_question_id UUID,
    p_category_id UUID DEFAULT NULL,
    p_question_text TEXT DEFAULT NULL,
    p_question_type VARCHAR DEFAULT NULL,
    p_difficulty VARCHAR DEFAULT NULL,
    p_options JSONB DEFAULT NULL,
    p_correct_answer VARCHAR DEFAULT NULL,
    p_explanation TEXT DEFAULT NULL,
    p_reference_source TEXT DEFAULT NULL,
    p_learning_points TEXT[] DEFAULT NULL,
    p_estimated_time_seconds INTEGER DEFAULT NULL,
    p_points_value INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Check if current user is admin
    SELECT role INTO user_role FROM users WHERE id::text = auth.uid()::text;
    
    IF user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admin users can update quiz questions';
    END IF;
    
    -- Update the question
    UPDATE quiz_questions SET
        category_id = COALESCE(p_category_id, category_id),
        question_text = COALESCE(p_question_text, question_text),
        question_type = COALESCE(p_question_type, question_type),
        difficulty = COALESCE(p_difficulty, difficulty),
        options = COALESCE(p_options, options),
        correct_answer = COALESCE(p_correct_answer, correct_answer),
        explanation = COALESCE(p_explanation, explanation),
        reference_source = COALESCE(p_reference_source, reference_source),
        learning_points = COALESCE(p_learning_points, learning_points),
        estimated_time_seconds = COALESCE(p_estimated_time_seconds, estimated_time_seconds),
        points_value = COALESCE(p_points_value, points_value),
        updated_at = NOW()
    WHERE id = p_question_id;
    
    RETURN FOUND;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_quiz_question_admin TO authenticated;

COMMIT;







