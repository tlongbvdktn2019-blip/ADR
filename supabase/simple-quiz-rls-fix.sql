-- SIMPLE Quiz RLS Fix - No Syntax Errors
-- This script uses basic PostgreSQL syntax to fix the RLS policy issue

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can manage quiz content" ON quiz_questions;
DROP POLICY IF EXISTS "Authenticated users can view questions" ON quiz_questions;
DROP POLICY IF EXISTS "quiz_questions_select_policy" ON quiz_questions;
DROP POLICY IF EXISTS "quiz_questions_admin_policy" ON quiz_questions;

-- Step 2: Create basic policies without complex functions
-- Allow authenticated users to view active questions
CREATE POLICY "view_active_questions" ON quiz_questions
    FOR SELECT 
    TO authenticated
    USING (is_active = true AND review_status = 'approved');

-- Step 3: Create admin policies using direct user check
-- Admin can select all questions
CREATE POLICY "admin_select_questions" ON quiz_questions
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Admin can insert questions
CREATE POLICY "admin_insert_questions" ON quiz_questions
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Admin can update questions
CREATE POLICY "admin_update_questions" ON quiz_questions
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Admin can delete questions
CREATE POLICY "admin_delete_questions" ON quiz_questions
    FOR DELETE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Step 4: Ensure users table allows self-select (needed for admin check)
DROP POLICY IF EXISTS "users_select_own_profile" ON users;
CREATE POLICY "users_select_own_profile" ON users
    FOR SELECT 
    TO authenticated
    USING (id::text = auth.uid()::text);







