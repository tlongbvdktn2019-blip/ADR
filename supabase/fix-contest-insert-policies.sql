-- =====================================================
-- FIX INSERT POLICIES - CONTEST MODULE
-- Sửa lỗi: new row violates row-level security policy
-- =====================================================

-- Bước 1: Drop các policies cũ
DROP POLICY IF EXISTS "Admin can manage departments" ON departments;
DROP POLICY IF EXISTS "Admin can manage units" ON units;
DROP POLICY IF EXISTS "Admin can manage contests" ON contests;
DROP POLICY IF EXISTS "Public can read active departments" ON departments;
DROP POLICY IF EXISTS "Public can read active units" ON units;
DROP POLICY IF EXISTS "Public can read active contests" ON contests;
DROP POLICY IF EXISTS "Public read active departments v2" ON departments;
DROP POLICY IF EXISTS "Public read active units v2" ON units;
DROP POLICY IF EXISTS "Public read active contests v2" ON contests;

-- Bước 2: Recreate function is_admin với debug
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role::TEXT INTO user_role
  FROM public.users 
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN user_role = 'admin';
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bước 3: Tạo policies mới với SEPARATE INSERT/UPDATE/DELETE

-- DEPARTMENTS
-- Allow public to read active departments
CREATE POLICY "departments_select_policy" ON departments
  FOR SELECT
  USING (is_active = true OR is_admin());

-- Allow admin to insert
CREATE POLICY "departments_insert_policy" ON departments
  FOR INSERT
  WITH CHECK (is_admin());

-- Allow admin to update
CREATE POLICY "departments_update_policy" ON departments
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Allow admin to delete
CREATE POLICY "departments_delete_policy" ON departments
  FOR DELETE
  USING (is_admin());

-- UNITS
-- Allow public to read active units
CREATE POLICY "units_select_policy" ON units
  FOR SELECT
  USING (is_active = true OR is_admin());

-- Allow admin to insert
CREATE POLICY "units_insert_policy" ON units
  FOR INSERT
  WITH CHECK (is_admin());

-- Allow admin to update
CREATE POLICY "units_update_policy" ON units
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Allow admin to delete
CREATE POLICY "units_delete_policy" ON units
  FOR DELETE
  USING (is_admin());

-- CONTESTS
-- Allow public to read active contests
CREATE POLICY "contests_select_policy" ON contests
  FOR SELECT
  USING ((status = 'active' AND is_public = true) OR is_admin());

-- Allow admin to insert
CREATE POLICY "contests_insert_policy" ON contests
  FOR INSERT
  WITH CHECK (is_admin());

-- Allow admin to update
CREATE POLICY "contests_update_policy" ON contests
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Allow admin to delete
CREATE POLICY "contests_delete_policy" ON contests
  FOR DELETE
  USING (is_admin());

-- Bước 4: Grant permissions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;
GRANT EXECUTE ON FUNCTION is_admin() TO service_role;

-- Bước 5: Verify function hoạt động
DO $$
DECLARE
  admin_check BOOLEAN;
BEGIN
  SELECT is_admin() INTO admin_check;
  RAISE NOTICE 'is_admin() returns: %', admin_check;
END $$;

-- Comments
COMMENT ON FUNCTION is_admin() IS 'Check if current user is admin from public.users table';
COMMENT ON POLICY "departments_select_policy" ON departments IS 'Allow public read active, admin read all';
COMMENT ON POLICY "departments_insert_policy" ON departments IS 'Only admin can insert';
COMMENT ON POLICY "units_select_policy" ON units IS 'Allow public read active, admin read all';
COMMENT ON POLICY "units_insert_policy" ON units IS 'Only admin can insert';

-- Done
SELECT 
  'Fixed! Now try to insert a department or unit.' as status,
  is_admin() as you_are_admin;



