-- 🔄 FORCE REFRESH CONNECTIONS
-- Script để refresh cache và connections, có thể giải quyết policy cache issues

-- =====================================
-- STEP 1: Terminate other connections (if needed)
-- =====================================
-- Uncomment nếu cần kill các connections khác
/*
SELECT 'ACTIVE CONNECTIONS' as info;
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    backend_start,
    state
FROM pg_stat_activity 
WHERE datname = current_database()
AND pid != pg_backend_pid();

-- Kill other connections (BE CAREFUL!)
-- SELECT pg_terminate_backend(pid) 
-- FROM pg_stat_activity 
-- WHERE datname = current_database() 
-- AND pid != pg_backend_pid()
-- AND usename != 'postgres';
*/

-- =====================================
-- STEP 2: Refresh system caches
-- =====================================
-- Reload configuration
SELECT pg_reload_conf() as config_reloaded;

-- Clear query plan cache (if available)
-- Note: This might not be available in all PostgreSQL versions
-- SELECT pg_stat_reset() as stats_reset;

-- =====================================
-- STEP 3: Re-analyze tables
-- =====================================
ANALYZE quiz_questions;
ANALYZE users;

SELECT 'TABLES ANALYZED' as status;

-- =====================================
-- STEP 4: Refresh RLS policies
-- =====================================
-- Disable và enable lại RLS để force refresh
ALTER TABLE quiz_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

SELECT 'RLS TOGGLED FOR REFRESH' as status;

-- =====================================
-- STEP 5: Recreate simple policy
-- =====================================
-- Drop all existing policies first
DROP POLICY IF EXISTS "temp_allow_all_authenticated" ON quiz_questions;
DROP POLICY IF EXISTS "admin_all_quiz_access" ON quiz_questions;
DROP POLICY IF EXISTS "users_view_quiz" ON quiz_questions;

-- Create very simple admin policy
CREATE POLICY "simple_admin_policy" ON quiz_questions
    FOR ALL 
    TO authenticated
    USING (
        auth.uid()::text IN (
            SELECT id::text FROM users WHERE role = 'admin'
        )
    )
    WITH CHECK (
        auth.uid()::text IN (
            SELECT id::text FROM users WHERE role = 'admin'
        )
    );

SELECT 'SIMPLE ADMIN POLICY CREATED' as status;

-- =====================================
-- STEP 6: Test new policy immediately
-- =====================================
SELECT 'POLICY TEST' as section;
SELECT 
    auth.uid() as current_user_id,
    COUNT(*) as visible_questions
FROM quiz_questions;

-- Test the policy condition directly
SELECT 
    'POLICY CONDITION TEST' as test,
    auth.uid()::text as auth_id,
    string_agg(id::text, ', ') as admin_ids
FROM users 
WHERE role = 'admin';

-- Test if current user is in admin list
SELECT 
    'USER IN ADMIN LIST' as test,
    CASE 
        WHEN auth.uid()::text IN (SELECT id::text FROM users WHERE role = 'admin')
        THEN '✅ Current user is in admin list'
        ELSE '❌ Current user NOT in admin list'
    END as result;

-- =====================================
-- STEP 7: Alternative - Use function approach
-- =====================================
-- Create a simple function to check admin status
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS(
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
$$;

-- Test function
SELECT 'FUNCTION TEST' as section;
SELECT 
    is_current_user_admin() as is_admin,
    CASE 
        WHEN is_current_user_admin() THEN '✅ Function says user is admin'
        ELSE '❌ Function says user is NOT admin'
    END as function_result;

-- Create policy using function (alternative approach)
DROP POLICY IF EXISTS "simple_admin_policy" ON quiz_questions;

CREATE POLICY "function_based_admin_policy" ON quiz_questions
    FOR ALL 
    TO authenticated
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());

SELECT '🔄 REFRESH COMPLETE' as status,
       'New function-based policy created' as result,
       'Try creating question now' as action;






