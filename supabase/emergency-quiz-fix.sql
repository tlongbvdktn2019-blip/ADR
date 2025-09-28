-- EMERGENCY FIX: Temporarily disable RLS for quiz_questions
-- Use this ONLY for immediate testing/development
-- ⚠️ WARNING: This disables all security for quiz_questions table!

-- Disable RLS temporarily
ALTER TABLE quiz_questions DISABLE ROW LEVEL SECURITY;

-- Check if it worked
SELECT 
    schemaname, 
    tablename, 
    rowsecurity
FROM pg_tables 
WHERE tablename = 'quiz_questions';

-- After testing, you can re-enable RLS with:
-- ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- And then run the proper fix from simple-quiz-rls-fix.sql







