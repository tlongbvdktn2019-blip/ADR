-- =====================================================
-- FIX MISSING USER IN PUBLIC.USERS TABLE
-- =====================================================

-- This script handles the common issue where a user exists in auth.users 
-- but is missing from the public.users table

-- First, let's check what users exist in auth vs public
SELECT 
    'AUTH USERS' as table_type,
    id,
    email,
    raw_user_meta_data->>'name' as name,
    created_at
FROM auth.users
WHERE id = '4cc24d08-4a3b-47b7-b196-12fec35a2cf1'

UNION ALL

SELECT 
    'PUBLIC USERS' as table_type,
    id::text,
    email,
    name,
    created_at::timestamp
FROM public.users
WHERE id = '4cc24d08-4a3b-47b7-b196-12fec35a2cf1';

-- =====================================================
-- CREATE MISSING USER RECORD
-- =====================================================

-- Insert the missing user into public.users table
-- This uses data from auth.users and sets admin role
INSERT INTO public.users (
    id,
    email,
    name,
    role,
    organization,
    phone,
    created_at,
    updated_at
)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'name',
        au.raw_user_meta_data->>'full_name', 
        au.email
    ) as name,
    'admin'::user_role as role,
    COALESCE(
        au.raw_user_meta_data->>'organization',
        'Sở Y tế Thành phố'
    ) as organization,
    au.raw_user_meta_data->>'phone' as phone,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
WHERE au.id = '4cc24d08-4a3b-47b7-b196-12fec35a2cf1'
AND NOT EXISTS (
    SELECT 1 FROM public.users pu 
    WHERE pu.id = au.id
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = 'admin'::user_role,
    organization = EXCLUDED.organization,
    updated_at = NOW();

-- =====================================================
-- VERIFY USER EXISTS AND HAS ADMIN ROLE
-- =====================================================

-- Check the user record after insertion
SELECT 
    id,
    email,
    name,
    role::text as role,
    organization,
    created_at,
    updated_at
FROM public.users 
WHERE id = '4cc24d08-4a3b-47b7-b196-12fec35a2cf1';

-- =====================================================
-- CREATE FUNCTION TO AUTO-SYNC AUTH USERS
-- =====================================================

-- This function ensures any user in auth.users also exists in public.users
CREATE OR REPLACE FUNCTION sync_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        name,
        role,
        organization,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'full_name',
            NEW.email
        ),
        CASE 
            WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::user_role
            ELSE 'user'::user_role
        END,
        NEW.raw_user_meta_data->>'organization',
        NEW.created_at,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-sync when auth user is created/updated
DROP TRIGGER IF EXISTS sync_auth_user_trigger ON auth.users;
CREATE TRIGGER sync_auth_user_trigger
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION sync_auth_user();

-- =====================================================
-- BULK SYNC ALL EXISTING AUTH USERS
-- =====================================================

-- Sync all existing auth users to public.users (in case there are more missing)
INSERT INTO public.users (
    id,
    email,
    name,
    role,
    organization,
    phone,
    created_at,
    updated_at
)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'name',
        au.raw_user_meta_data->>'full_name', 
        au.email
    ) as name,
    CASE 
        WHEN au.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::user_role
        WHEN au.email ILIKE '%admin%' THEN 'admin'::user_role
        WHEN au.email ILIKE '%@soyte%' THEN 'admin'::user_role
        ELSE 'user'::user_role
    END as role,
    COALESCE(
        au.raw_user_meta_data->>'organization',
        'Sở Y tế Thành phố'
    ) as organization,
    au.raw_user_meta_data->>'phone' as phone,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu 
    WHERE pu.id = au.id
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Count users in both tables
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.users) as public_users_count,
    (SELECT COUNT(*) FROM public.users WHERE role::text = 'admin') as admin_users_count;

-- Show all admin users
SELECT 
    id,
    email,
    name,
    role::text,
    organization,
    created_at
FROM public.users 
WHERE role::text = 'admin'
ORDER BY created_at;

-- Test auth.uid() function with the specific user
-- (This would need to be run in a context where the user is authenticated)
SELECT 
    '4cc24d08-4a3b-47b7-b196-12fec35a2cf1'::uuid as target_user_id,
    EXISTS(
        SELECT 1 FROM public.users 
        WHERE id = '4cc24d08-4a3b-47b7-b196-12fec35a2cf1'::uuid
        AND role::text = 'admin'
    ) as user_is_admin;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ User sync completed successfully!';
    RAISE NOTICE '📊 Check the verification queries above for results';
    RAISE NOTICE '🔄 Auto-sync trigger is now active for future users';
    RAISE NOTICE '👤 Target user should now exist with admin role';
END $$;
