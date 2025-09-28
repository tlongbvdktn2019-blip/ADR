-- 🔐 PRODUCTION RLS SETUP
-- Bật lại RLS với policies chuẩn cho production

-- =====================================
-- STEP 1: Bật lại RLS
-- =====================================
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- =====================================
-- STEP 2: Tạo policies chuẩn production
-- =====================================

-- Drop tất cả policies cũ để tránh conflict
DROP POLICY IF EXISTS "view_active_questions" ON quiz_questions;
DROP POLICY IF EXISTS "admin_select_questions" ON quiz_questions;
DROP POLICY IF EXISTS "admin_insert_questions" ON quiz_questions;
DROP POLICY IF EXISTS "admin_update_questions" ON quiz_questions;
DROP POLICY IF EXISTS "admin_delete_questions" ON quiz_questions;
DROP POLICY IF EXISTS "temp_allow_all" ON quiz_questions;

-- Policy 1: Authenticated users có thể xem questions active
CREATE POLICY "users_view_active_questions" ON quiz_questions
    FOR SELECT 
    TO authenticated
    USING (is_active = true AND review_status = 'approved');

-- Policy 2: Admin có thể làm mọi thứ
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
-- STEP 3: Đảm bảo users table có policy cần thiết
-- =====================================
DROP POLICY IF EXISTS "users_select_own_profile" ON users;
CREATE POLICY "users_view_own_profile" ON users
    FOR SELECT 
    TO authenticated
    USING (id::text = auth.uid()::text);

-- =====================================
-- STEP 4: Test RLS setup
-- =====================================

-- Test 1: Kiểm tra user hiện tại
SELECT 
    'CURRENT USER CHECK' as test,
    auth.uid() as user_id,
    u.email,
    u.role,
    CASE WHEN u.role = 'admin' THEN '✅ ADMIN - Should work' 
         ELSE '❌ NOT ADMIN - May fail' END as expected_result
FROM users u 
WHERE u.id::text = auth.uid()::text;

-- Test 2: Thử select questions (should work for everyone)
SELECT 
    'QUESTIONS VISIBLE' as test,
    COUNT(*) as count,
    '✅ Should see active questions' as status
FROM quiz_questions 
WHERE is_active = true AND review_status = 'approved';

-- Test 3: Kiểm tra policies
SELECT 
    'RLS POLICIES STATUS' as test,
    policyname,
    cmd as operation,
    CASE 
        WHEN policyname LIKE '%admin%' THEN '🔐 Admin only'
        WHEN policyname LIKE '%view%' THEN '👁️ View access'
        ELSE '❓ Other'
    END as description
FROM pg_policies 
WHERE tablename = 'quiz_questions'
ORDER BY policyname;

-- =====================================
-- STEP 5: Success message
-- =====================================
SELECT 
    '🎉 RLS SETUP COMPLETE!' as status,
    'Try creating quiz questions from the admin panel now' as next_step;







