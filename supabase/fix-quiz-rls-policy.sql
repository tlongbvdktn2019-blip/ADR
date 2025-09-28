-- Fix Quiz RLS Policy Error
-- This script fixes the "new row violates row-level security policy" error
-- for quiz_questions table

-- =====================================
-- STEP 1: Drop existing problematic policies
-- =====================================
DROP POLICY IF EXISTS "Admins can manage quiz content" ON quiz_questions;
DROP POLICY IF EXISTS "Authenticated users can view questions" ON quiz_questions;

-- =====================================
-- STEP 2: Create helper function to check admin role
-- =====================================
-- Use SECURITY DEFINER to avoid recursion issues with users table RLS
CREATE OR REPLACE FUNCTION is_quiz_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user has admin role
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================
-- STEP 3: Create new RLS policies using the helper function
-- =====================================

-- Policy for authenticated users to view active, approved questions
CREATE POLICY "quiz_questions_select_policy" ON quiz_questions
    FOR SELECT 
    TO authenticated
    USING (is_active = true AND review_status = 'approved');

-- Policy for admins to manage all quiz questions
CREATE POLICY "quiz_questions_admin_policy" ON quiz_questions
    FOR ALL 
    TO authenticated
    USING (is_quiz_admin())
    WITH CHECK (is_quiz_admin());

-- Alternative: If the above still doesn't work, create separate policies for each operation
-- Uncomment these if needed:

/*
-- Admin can select all questions
CREATE POLICY "quiz_questions_admin_select" ON quiz_questions
    FOR SELECT 
    TO authenticated
    USING (is_quiz_admin());

-- Admin can insert questions
CREATE POLICY "quiz_questions_admin_insert" ON quiz_questions
    FOR INSERT 
    TO authenticated
    WITH CHECK (is_quiz_admin());

-- Admin can update questions  
CREATE POLICY "quiz_questions_admin_update" ON quiz_questions
    FOR UPDATE 
    TO authenticated
    USING (is_quiz_admin())
    WITH CHECK (is_quiz_admin());

-- Admin can delete questions
CREATE POLICY "quiz_questions_admin_delete" ON quiz_questions
    FOR DELETE 
    TO authenticated
    USING (is_quiz_admin());
*/

-- =====================================
-- STEP 4: Grant permissions to the function
-- =====================================
GRANT EXECUTE ON FUNCTION is_quiz_admin() TO authenticated;

-- =====================================
-- STEP 5: Ensure users table has proper basic policies
-- =====================================
-- Make sure users can read their own profile (needed for admin check)
DROP POLICY IF EXISTS "users_select_own_profile" ON users;
CREATE POLICY "users_select_own_profile" ON users
    FOR SELECT 
    TO authenticated
    USING (id::text = auth.uid()::text);

-- =====================================
-- STEP 6: Test the fix
-- =====================================
-- You can test this by running:
-- SELECT is_quiz_admin(); -- Should return true for admin users

-- Verify RLS is working:
-- SELECT * FROM quiz_questions LIMIT 1; -- Should work for both admin and regular users (for approved questions)

COMMIT;
