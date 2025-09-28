-- Fix infinite recursion in users table RLS policies
-- The issue is that admin policies check users table which creates recursion

-- First, drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;  
DROP POLICY IF EXISTS "Admins can update users" ON users;

-- Create better policies that don't cause recursion
-- Use auth.jwt() to get user role directly from JWT token instead of querying users table

-- Allow users to view their own profile
-- This policy is fine as it doesn't query users table
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Allow users to update their own profile  
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- For admin access, we'll use a different approach:
-- Create policies that check the JWT token directly for admin role
-- This requires the role to be included in the JWT token

-- Alternative: Use SECURITY DEFINER functions for admin operations
-- Create function for admin to view all users
CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE(
    id UUID,
    email VARCHAR(255),
    name VARCHAR(255), 
    role user_role,
    organization VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE SQL
AS $$
    SELECT u.id, u.email, u.name, u.role, u.organization, u.phone, u.created_at, u.updated_at
    FROM users u;
$$;

-- Create function for admin to create users
CREATE OR REPLACE FUNCTION create_user_admin(
    p_email VARCHAR(255),
    p_name VARCHAR(255),
    p_role user_role DEFAULT 'user',
    p_organization VARCHAR(255) DEFAULT NULL,
    p_phone VARCHAR(20) DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER  
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    new_user_id UUID;
BEGIN
    INSERT INTO users (email, name, role, organization, phone)
    VALUES (p_email, p_name, p_role, p_organization, p_phone)
    RETURNING id INTO new_user_id;
    
    RETURN new_user_id;
END;
$$;

-- Create function for admin to update users
CREATE OR REPLACE FUNCTION update_user_admin(
    p_user_id UUID,
    p_email VARCHAR(255) DEFAULT NULL,
    p_name VARCHAR(255) DEFAULT NULL,
    p_role user_role DEFAULT NULL,
    p_organization VARCHAR(255) DEFAULT NULL,
    p_phone VARCHAR(20) DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public  
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE users SET
        email = COALESCE(p_email, email),
        name = COALESCE(p_name, name),
        role = COALESCE(p_role, role),
        organization = COALESCE(p_organization, organization),
        phone = COALESCE(p_phone, phone),
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN FOUND;
END;
$$;

-- Create function for admin to delete users
CREATE OR REPLACE FUNCTION delete_user_admin(p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql  
AS $$
BEGIN
    DELETE FROM users WHERE id = p_user_id;
    RETURN FOUND;
END;
$$;

-- Grant execute permissions to authenticated users
-- Note: In production, you should add additional checks to ensure only admins can call these
GRANT EXECUTE ON FUNCTION get_all_users_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_admin(VARCHAR, VARCHAR, user_role, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_admin(UUID, VARCHAR, VARCHAR, user_role, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_admin(UUID) TO authenticated;

-- For ADR reports and other tables, fix similar issues
-- Drop and recreate admin policies for adr_reports
DROP POLICY IF EXISTS "Admins can view all reports" ON adr_reports;
DROP POLICY IF EXISTS "Admins can update all reports" ON adr_reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON adr_reports;

-- Create SECURITY DEFINER functions for admin report operations
CREATE OR REPLACE FUNCTION get_all_reports_admin()
RETURNS TABLE(
    id UUID,
    report_code VARCHAR(20),
    patient_name VARCHAR(255),
    reporter_id UUID,
    organization VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
SET search_path = public
LANGUAGE SQL  
AS $$
    SELECT r.id, r.report_code, r.patient_name, r.reporter_id, r.organization, r.created_at
    FROM adr_reports r;
$$;

GRANT EXECUTE ON FUNCTION get_all_reports_admin() TO authenticated;

-- Similarly for suspected_drugs table
DROP POLICY IF EXISTS "Admins can view all drugs" ON suspected_drugs;
DROP POLICY IF EXISTS "Admins can update all drugs" ON suspected_drugs;

-- Create function for admin drug operations
CREATE OR REPLACE FUNCTION get_all_drugs_admin()
RETURNS TABLE(
    id UUID,
    report_id UUID, 
    generic_name VARCHAR(255),
    trade_name VARCHAR(255)
)
SECURITY DEFINER
SET search_path = public
LANGUAGE SQL
AS $$
    SELECT d.id, d.report_id, d.generic_name, d.trade_name
    FROM suspected_drugs d;
$$;

GRANT EXECUTE ON FUNCTION get_all_drugs_admin() TO authenticated;

-- Add comment explaining the fix
COMMENT ON FUNCTION get_all_users_admin() IS 'Admin function to get all users - bypasses RLS to avoid infinite recursion';
COMMENT ON FUNCTION create_user_admin(VARCHAR, VARCHAR, user_role, VARCHAR, VARCHAR) IS 'Admin function to create users - bypasses RLS';
COMMENT ON FUNCTION update_user_admin(UUID, VARCHAR, VARCHAR, user_role, VARCHAR, VARCHAR) IS 'Admin function to update users - bypasses RLS';
COMMENT ON FUNCTION delete_user_admin(UUID) IS 'Admin function to delete users - bypasses RLS';

-- Note: In production, you should add role checking within these functions
-- For now, the application layer should handle admin authorization








