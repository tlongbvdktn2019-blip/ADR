-- 🔍 DIAGNOSE RLS ISSUE
-- Script chi tiết để tìm hiểu tại sao RLS policy vẫn fail

-- =====================================
-- STEP 1: Connection và Authentication info
-- =====================================
SELECT 'CONNECTION INFO' as section;
SELECT 
    current_user as database_user,
    current_database() as database_name,
    version() as postgresql_version,
    now() as current_time;

SELECT 'AUTH INFO' as section;
SELECT 
    auth.uid() as auth_user_id,
    auth.email() as auth_email,
    auth.role() as auth_role,
    auth.jwt() as jwt_token_preview;

-- =====================================
-- STEP 2: User record chi tiết
-- =====================================
SELECT 'USER RECORD DETAILS' as section;
SELECT 
    id,
    email,
    name,
    role,
    organization,
    phone,
    created_at,
    updated_at,
    id::text as id_as_text,
    auth.uid()::text as auth_uid_as_text,
    CASE 
        WHEN id::text = auth.uid()::text THEN '✅ MATCH'
        ELSE '❌ NO MATCH - This might be the issue!'
    END as id_match_check
FROM users 
WHERE email = 'admin@soyte.gov.vn';

-- =====================================
-- STEP 3: RLS và Policies chi tiết
-- =====================================
SELECT 'RLS STATUS DETAILED' as section;
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('quiz_questions', 'users')
ORDER BY tablename;

SELECT 'CURRENT POLICIES DETAILED' as section;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_condition,
    with_check as with_check_condition
FROM pg_policies 
WHERE tablename IN ('quiz_questions', 'users')
ORDER BY tablename, policyname;

-- =====================================
-- STEP 4: Test policy conditions manually
-- =====================================
SELECT 'MANUAL POLICY TEST' as section;

-- Test condition used in policies
SELECT 
    'Policy condition test' as test,
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id::text = auth.uid()::text 
        AND users.role = 'admin'
    ) as admin_check_result,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        ) THEN '✅ Should allow admin access'
        ELSE '❌ Policy condition fails - this is the problem!'
    END as policy_result;

-- Test direct user lookup
SELECT 'DIRECT USER LOOKUP' as section;
SELECT 
    COUNT(*) as matching_users,
    string_agg(email, ', ') as emails,
    string_agg(role::text, ', ') as roles
FROM users 
WHERE users.id::text = auth.uid()::text;

-- =====================================
-- STEP 5: Quiz questions table info
-- =====================================
SELECT 'QUIZ_QUESTIONS TABLE INFO' as section;
SELECT 
    COUNT(*) as total_questions,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_questions,
    COUNT(CASE WHEN review_status = 'approved' THEN 1 END) as approved_questions,
    COUNT(CASE WHEN created_by = auth.uid() THEN 1 END) as questions_by_current_user,
    MIN(created_at) as earliest_question,
    MAX(created_at) as latest_question
FROM quiz_questions;

-- Sample questions
SELECT 'SAMPLE QUESTIONS' as section;
SELECT 
    id,
    question_text,
    difficulty,
    is_active,
    review_status,
    created_by,
    created_at
FROM quiz_questions 
ORDER BY created_at DESC 
LIMIT 3;

-- =====================================
-- STEP 6: Permissions và Grants
-- =====================================
SELECT 'TABLE PERMISSIONS' as section;
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type,
    is_grantable,
    with_hierarchy
FROM information_schema.role_table_grants 
WHERE table_name IN ('quiz_questions', 'users')
ORDER BY table_name, grantee;

-- =====================================
-- STEP 7: Check for conflicting settings
-- =====================================
SELECT 'DATABASE SETTINGS' as section;
SELECT 
    name,
    setting,
    category,
    short_desc
FROM pg_settings 
WHERE name LIKE '%rls%' OR name LIKE '%security%'
ORDER BY name;

SELECT '🔍 DIAGNOSIS COMPLETE' as status,
       'Review results above to identify the issue' as action;






