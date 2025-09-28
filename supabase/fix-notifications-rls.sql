-- Fix infinite recursion in notifications RLS policies
-- This replaces the complex policies that cause circular dependencies

-- First, drop all existing policies for notifications
DROP POLICY IF EXISTS "Users can view concurrent drugs of their reports" ON concurrent_drugs;
DROP POLICY IF EXISTS "Users can insert concurrent drugs for their reports" ON concurrent_drugs;
DROP POLICY IF EXISTS "Users can update concurrent drugs of their reports" ON concurrent_drugs;
DROP POLICY IF EXISTS "Users can delete concurrent drugs of their reports" ON concurrent_drugs;

-- Drop existing notification policies that cause recursion
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;

-- Create simple, non-recursive policies for notifications
-- These policies use auth.uid() directly without joining the users table

-- Policy 1: Users can only see notifications where they are the recipient
CREATE POLICY "notifications_select_policy" ON notifications
    FOR SELECT USING (recipient_id::text = auth.uid()::text);

-- Policy 2: Users can only update notifications where they are the recipient  
CREATE POLICY "notifications_update_policy" ON notifications
    FOR UPDATE USING (recipient_id::text = auth.uid()::text);

-- Policy 3: Allow inserts (this will be used by triggers and service role)
CREATE POLICY "notifications_insert_policy" ON notifications
    FOR INSERT WITH CHECK (true);

-- Policy 4: Users can delete their own notifications
CREATE POLICY "notifications_delete_policy" ON notifications
    FOR DELETE USING (recipient_id::text = auth.uid()::text);

-- Update the trigger function to be more efficient
CREATE OR REPLACE FUNCTION notify_new_adr_report()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert notifications for admin users using a simple approach
    -- This avoids the recursion by not checking user roles in the policy
    INSERT INTO notifications (
        recipient_id,
        sender_id,
        type,
        title,
        message,
        data
    )
    SELECT 
        u.id as recipient_id,
        NEW.reporter_id as sender_id,
        'new_report' as type,
        'Báo cáo ADR mới' as title,
        'Có báo cáo ADR mới từ ' || NEW.organization || ' - Mã: ' || NEW.report_code as message,
        jsonb_build_object(
            'report_id', NEW.id,
            'report_code', NEW.report_code,
            'patient_name', NEW.patient_name,
            'organization', NEW.organization,
            'severity_level', NEW.severity_level
        ) as data
    FROM users u 
    WHERE u.role = 'admin';
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_notify_new_adr_report ON adr_reports;
CREATE TRIGGER trigger_notify_new_adr_report
    AFTER INSERT ON adr_reports
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_adr_report();

-- Add a simple function to check if current user is admin (for API use)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND role = 'admin'
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Test the fix by inserting a test notification
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get first admin user
    SELECT id INTO admin_user_id 
    FROM users 
    WHERE role = 'admin' 
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Insert test notification
        INSERT INTO notifications (
            recipient_id,
            type,
            title,
            message,
            data
        ) VALUES (
            admin_user_id,
            'system',
            'RLS Fix Test',
            'If you see this, the infinite recursion issue has been fixed!',
            jsonb_build_object('test', true, 'timestamp', NOW())
        );
        
        RAISE NOTICE 'Success: Test notification created for admin user %', admin_user_id;
    ELSE
        RAISE NOTICE 'Warning: No admin users found to test with';
    END IF;
END
$$;
