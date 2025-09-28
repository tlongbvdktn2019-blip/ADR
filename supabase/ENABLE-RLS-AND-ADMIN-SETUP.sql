-- 🔐 ENABLE RLS AND ADMIN QUIZ MANAGEMENT
-- Script để bật lại RLS và thiết lập quyền admin tạo câu hỏi

-- =====================================
-- STEP 1: Bật lại RLS trên quiz_questions
-- =====================================
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- =====================================
-- STEP 2: Đảm bảo users table có RLS và policy cần thiết
-- =====================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop và tạo lại policy cho users
DROP POLICY IF EXISTS "users_view_own_profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

CREATE POLICY "users_view_own_profile" ON users
    FOR SELECT 
    TO authenticated
    USING (id::text = auth.uid()::text);

-- =====================================
-- STEP 3: Drop tất cả policies cũ trên quiz_questions
-- =====================================
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

-- =====================================
-- STEP 4: Tạo policies mới cho quiz_questions
-- =====================================

-- Policy 1: Authenticated users có thể xem questions active & approved
CREATE POLICY "users_view_active_questions" ON quiz_questions
    FOR SELECT 
    TO authenticated
    USING (is_active = true AND review_status = 'approved');

-- Policy 2: Admin có toàn quyền với quiz questions
CREATE POLICY "admin_full_access_questions" ON quiz_questions
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

-- =====================================
-- STEP 5: Kiểm tra setup
-- =====================================

-- Test 1: Kiểm tra RLS đã được bật
SELECT 
    'RLS STATUS CHECK' as test_name,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS đã bật'
        ELSE '❌ RLS chưa bật'
    END as status
FROM pg_tables 
WHERE tablename IN ('quiz_questions', 'users')
ORDER BY tablename;

-- Test 2: Kiểm tra user hiện tại
SELECT 
    'CURRENT USER CHECK' as test_name,
    auth.uid() as user_id,
    auth.email() as email,
    u.name,
    u.role,
    CASE 
        WHEN u.role = 'admin' THEN '✅ ADMIN - Có thể tạo câu hỏi' 
        ELSE '❌ USER - Chỉ xem được câu hỏi'
    END as permission_status
FROM users u 
WHERE u.id::text = auth.uid()::text;

-- Test 3: Kiểm tra policies
SELECT 
    'RLS POLICIES CHECK' as test_name,
    policyname,
    cmd as operation,
    CASE 
        WHEN policyname LIKE '%admin%' THEN '🔐 Admin access'
        WHEN policyname LIKE '%view%' OR policyname LIKE '%select%' THEN '👁️ View access'
        ELSE '❓ Other policy'
    END as description
FROM pg_policies 
WHERE tablename = 'quiz_questions'
ORDER BY policyname;

-- Test 4: Đếm câu hỏi có thể xem
SELECT 
    'QUESTIONS VISIBLE COUNT' as test_name,
    COUNT(*) as visible_questions,
    '✅ Số câu hỏi user thường có thể xem' as description
FROM quiz_questions 
WHERE is_active = true AND review_status = 'approved';

-- =====================================
-- STEP 6: Thông báo hoàn thành
-- =====================================
SELECT 
    '🎉 SETUP COMPLETE!' as status,
    'RLS đã được bật lại và policies đã được thiết lập' as message,
    'Admin có thể tạo câu hỏi, User thường chỉ xem câu hỏi approved' as note;

-- =====================================
-- OPTIONAL: Nếu cần tạo admin user mới (uncomment nếu cần)
-- =====================================
/*
-- Tạo admin user (thay YOUR_EMAIL bằng email thực)
INSERT INTO users (email, name, role, organization)
VALUES ('admin@soytetravinh.gov.vn', 'Admin Sở Y Tế', 'admin', 'Sở Y Tế Trà Vinh')
ON CONFLICT (email) 
DO UPDATE SET 
    role = 'admin',
    updated_at = now();
    
-- Hoặc cập nhật user hiện tại thành admin
-- UPDATE users 
-- SET role = 'admin' 
-- WHERE email = 'your-email@domain.com';
*/






