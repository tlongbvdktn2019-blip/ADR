-- ⚡ QUICK ADMIN FIX
-- Script fix nhanh cho lỗi admin không xem/tạo được câu hỏi

-- OPTION A: Fix nhanh bằng cách tắt RLS tạm thời
-- (Uncomment nếu cần fix ngay lập tức)
/*
ALTER TABLE quiz_questions DISABLE ROW LEVEL SECURITY;
SELECT '⚡ RLS DISABLED - Admin can now create questions' as status;
*/

-- OPTION B: Fix bằng cách tạo policy đơn giản
-- Drop policies cũ
DROP POLICY IF EXISTS "admin_all_quiz_access" ON quiz_questions;
DROP POLICY IF EXISTS "users_view_quiz" ON quiz_questions;
DROP POLICY IF EXISTS "users_view_active_questions" ON quiz_questions;
DROP POLICY IF EXISTS "admin_full_access_questions" ON quiz_questions;

-- Tạo policy cho phép tất cả authenticated users làm mọi việc (TEMPORARY)
CREATE POLICY "temp_allow_all_authenticated" ON quiz_questions
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

SELECT '✅ TEMPORARY POLICY CREATED - All authenticated users can manage questions' as status;

-- OPTION C: Set current user as admin
-- (Uncomment nếu user hiện tại chưa có role admin)
/*
UPDATE users 
SET role = 'admin'
WHERE id::text = auth.uid()::text;

SELECT '👑 CURRENT USER SET AS ADMIN' as status;
*/

-- Kiểm tra kết quả
SELECT 'CURRENT USER INFO' as test;
SELECT 
    u.email,
    u.name,
    u.role,
    CASE 
        WHEN u.role = 'admin' THEN '✅ Is Admin'
        ELSE '❌ Not Admin'
    END as admin_status
FROM users u 
WHERE u.id::text = auth.uid()::text;

SELECT 'QUIZ QUESTIONS COUNT' as test;
SELECT COUNT(*) as total_questions FROM quiz_questions;

SELECT '🎉 QUICK FIX COMPLETE!' as status,
       'Try creating quiz questions now' as action;






