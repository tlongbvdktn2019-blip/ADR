-- 🚨 EMERGENCY: DISABLE RLS COMPLETELY
-- Tắt RLS hoàn toàn cho quiz_questions để admin có thể hoạt động
-- SỬ DỤNG KHI: Quick fix không work và cần giải pháp tức thì

-- =====================================
-- STEP 1: Tắt RLS hoàn toàn
-- =====================================
ALTER TABLE quiz_questions DISABLE ROW LEVEL SECURITY;

SELECT '🚨 RLS COMPLETELY DISABLED FOR quiz_questions' as status,
       'Admin can now create and view all questions' as result;

-- =====================================
-- STEP 2: Kiểm tra RLS status
-- =====================================
SELECT 'RLS STATUS CHECK' as test_name;
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = false THEN '✅ RLS DISABLED - Should work now'
        ELSE '❌ RLS still enabled'
    END as status
FROM pg_tables 
WHERE tablename = 'quiz_questions';

-- =====================================
-- STEP 3: Kiểm tra admin user
-- =====================================
SELECT 'ADMIN USER CHECK' as test_name;
SELECT 
    id,
    email,
    name,
    role,
    organization,
    CASE 
        WHEN role = 'admin' THEN '✅ Is admin'
        ELSE '❌ Not admin'
    END as admin_status,
    CASE 
        WHEN id::text = auth.uid()::text THEN '⭐ THIS IS YOU'
        ELSE ''
    END as current_user_marker
FROM users 
WHERE email = 'admin@soyte.gov.vn' OR id::text = auth.uid()::text;

-- =====================================
-- STEP 4: Test query questions
-- =====================================
SELECT 'QUESTIONS ACCESS TEST' as test_name;
SELECT 
    COUNT(*) as total_questions,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_questions,
    COUNT(CASE WHEN review_status = 'approved' THEN 1 END) as approved_questions,
    '✅ Should see all questions now' as note
FROM quiz_questions;

-- =====================================
-- STEP 5: Clean up old policies (nếu có)
-- =====================================
-- Drop tất cả policies để tránh conflict trong tương lai
DROP POLICY IF EXISTS "admin_all_quiz_access" ON quiz_questions;
DROP POLICY IF EXISTS "users_view_quiz" ON quiz_questions;
DROP POLICY IF EXISTS "temp_allow_all_authenticated" ON quiz_questions;
DROP POLICY IF EXISTS "users_view_active_questions" ON quiz_questions;
DROP POLICY IF EXISTS "admin_full_access_questions" ON quiz_questions;
DROP POLICY IF EXISTS "view_active_questions" ON quiz_questions;
DROP POLICY IF EXISTS "admin_select_questions" ON quiz_questions;
DROP POLICY IF EXISTS "admin_insert_questions" ON quiz_questions;
DROP POLICY IF EXISTS "admin_update_questions" ON quiz_questions;
DROP POLICY IF EXISTS "admin_delete_questions" ON quiz_questions;

SELECT 'OLD POLICIES CLEANED' as status,
       'All conflicting policies removed' as result;

-- =====================================
-- STEP 6: Test insert capability
-- =====================================
-- Uncomment để test insert trực tiếp
/*
INSERT INTO quiz_questions (
    category_id,
    question_text,
    difficulty,
    options,
    correct_answer,
    explanation,
    created_by
) VALUES (
    (SELECT id FROM quiz_categories LIMIT 1),
    'Test question - RLS disabled',
    'beginner',
    '[{"key":"A","text":"Yes, it works"},{"key":"B","text":"No, still broken"}]'::jsonb,
    'A',
    'This test question was created after disabling RLS',
    auth.uid()
);

SELECT 'TEST INSERT SUCCESSFUL' as result,
       'Question created with RLS disabled' as status;
*/

-- =====================================
-- FINAL STATUS
-- =====================================
SELECT '🎉 EMERGENCY FIX COMPLETE!' as status,
       'RLS is now completely disabled for quiz_questions' as result,
       'Admin can create and manage questions freely' as note,
       '⚠️ Remember to re-enable RLS with proper policies later' as warning;






