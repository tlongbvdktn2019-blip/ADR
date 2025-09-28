-- Quick Admin User Check Script
-- Run this in Supabase SQL Editor to diagnose admin user issues

-- =====================================
-- STEP 1: Check current authenticated user
-- =====================================
SELECT 'CURRENT USER INFO' as info;
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_email,
    auth.role() as auth_role;

-- =====================================  
-- STEP 2: Check user record in users table
-- =====================================
SELECT 'USER RECORD IN DATABASE' as info;
SELECT 
    id,
    email, 
    name,
    role,
    organization,
    created_at,
    CASE 
        WHEN id::text = auth.uid()::text THEN '✅ This is you!'
        ELSE '❌ Different user'
    END as is_current_user
FROM users 
WHERE id::text = auth.uid()::text;

-- =====================================
-- STEP 3: List all admin users
-- =====================================
SELECT 'ALL ADMIN USERS' as info;
SELECT 
    id,
    email,
    name, 
    role,
    organization,
    created_at,
    CASE 
        WHEN id::text = auth.uid()::text THEN '⭐ YOU'
        ELSE ''
    END as marker
FROM users 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- =====================================
-- STEP 4: Check if current user can create quiz questions
-- =====================================
SELECT 'PERMISSION CHECK' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        ) THEN '✅ Can create quiz questions'
        ELSE '❌ Cannot create quiz questions - Need admin role'
    END as permission_status;

-- =====================================
-- STEP 5: Fix user role (uncomment if needed)
-- =====================================
-- UPDATE users 
-- SET role = 'admin' 
-- WHERE email = 'YOUR_EMAIL_HERE@domain.com';

-- =====================================
-- STEP 6: Verify RLS policies
-- =====================================
SELECT 'RLS POLICIES FOR QUIZ_QUESTIONS' as info;
SELECT 
    policyname,
    cmd,
    permissive,
    qual as condition
FROM pg_policies 
WHERE tablename = 'quiz_questions'
ORDER BY policyname;







