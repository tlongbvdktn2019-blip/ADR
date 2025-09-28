-- 🔧 FIX ADMIN QUIZ ISSUE
-- Script để sửa lỗi admin không xem và tạo được câu hỏi

-- =====================================
-- STEP 1: Kiểm tra user hiện tại
-- =====================================
SELECT 'CURRENT USER CHECK' as test_name;
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_email;

-- Kiểm tra user record trong database
SELECT 'USER IN DATABASE' as test_name;
SELECT 
    id,
    email,
    name,
    role,
    organization,
    created_at,
    CASE 
        WHEN id::text = auth.uid()::text THEN '⭐ THIS IS YOU'
        ELSE ''
    END as marker
FROM users 
WHERE id::text = auth.uid()::text;

-- =====================================
-- STEP 2: Kiểm tra RLS status và policies
-- =====================================
SELECT 'RLS STATUS' as test_name;
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS enabled'
        ELSE '❌ RLS disabled'
    END as status
FROM pg_tables 
WHERE tablename IN ('quiz_questions', 'users');

SELECT 'CURRENT POLICIES' as test_name;
SELECT 
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'quiz_questions'
ORDER BY policyname;

-- =====================================
-- STEP 3: Test admin permission check
-- =====================================
SELECT 'ADMIN PERMISSION TEST' as test_name;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        ) THEN '✅ Should work as admin'
        ELSE '❌ Not admin - this is the problem'
    END as admin_check_result;

-- =====================================
-- STEP 4: IMMEDIATE FIX - Tắt RLS tạm thời
-- =====================================
-- Uncomment dòng này nếu cần fix nhanh
-- ALTER TABLE quiz_questions DISABLE ROW LEVEL SECURITY;

-- =====================================
-- STEP 5: PROPER FIX - Recreate policies
-- =====================================

-- Drop tất cả policies cũ
DROP POLICY IF EXISTS "view_active_questions" ON quiz_questions;
DROP POLICY IF EXISTS "admin_select_questions" ON quiz_questions;
DROP POLICY IF EXISTS "admin_insert_questions" ON quiz_questions;
DROP POLICY IF EXISTS "admin_update_questions" ON quiz_questions;
DROP POLICY IF EXISTS "admin_delete_questions" ON quiz_questions;
DROP POLICY IF EXISTS "temp_allow_all" ON quiz_questions;
DROP POLICY IF EXISTS "users_view_active_questions" ON quiz_questions;
DROP POLICY IF EXISTS "admin_full_access_questions" ON quiz_questions;
DROP POLICY IF EXISTS "quiz_questions_select_policy" ON quiz_questions;
DROP POLICY IF EXISTS "quiz_questions_admin_policy" ON quiz_questions;
DROP POLICY IF EXISTS "Admins can manage quiz content" ON quiz_questions;
DROP POLICY IF EXISTS "Authenticated users can view questions" ON quiz_questions;

-- Tạo policies mới đơn giản và rõ ràng
-- Policy 1: Admin có toàn quyền
CREATE POLICY "admin_all_quiz_access" ON quiz_questions
    FOR ALL 
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

-- Policy 2: User thường chỉ xem câu hỏi active
CREATE POLICY "users_view_quiz" ON quiz_questions
    FOR SELECT 
    TO authenticated
    USING (
        is_active = true 
        AND review_status = 'approved'
        AND NOT EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- =====================================
-- STEP 6: Đảm bảo users table có policy
-- =====================================
DROP POLICY IF EXISTS "users_view_own_profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

CREATE POLICY "users_view_profile" ON users
    FOR SELECT 
    TO authenticated
    USING (id::text = auth.uid()::text);

-- =====================================
-- STEP 7: Test sau khi fix
-- =====================================
SELECT 'FINAL TEST RESULTS' as test_name;

-- Test xem câu hỏi
SELECT 
    'QUIZ QUESTIONS VISIBLE' as test,
    COUNT(*) as total_count,
    '✅ Admin should see all questions' as note
FROM quiz_questions;

-- Test policies
SELECT 
    'POLICIES STATUS' as test,
    COUNT(*) as policy_count,
    '✅ Should have 2 policies: admin_all_quiz_access + users_view_quiz' as note
FROM pg_policies 
WHERE tablename = 'quiz_questions';

-- =====================================
-- STEP 8: Nếu vẫn lỗi - Set user thành admin
-- =====================================
-- Nếu user hiện tại không phải admin, uncomment và chạy:
/*
UPDATE users 
SET role = 'admin'
WHERE id::text = auth.uid()::text;

SELECT 'USER ROLE UPDATED' as result, 
       'You are now admin!' as message;
*/

SELECT 'TROUBLESHOOTING COMPLETE!' as status;






