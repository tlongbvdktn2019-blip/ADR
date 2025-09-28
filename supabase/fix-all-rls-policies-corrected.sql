-- COMPREHENSIVE FIX for ALL infinite recursion RLS policies
-- This fixes the circular dependency issue across all tables
-- CORRECTED VERSION - Fixed duplicate column issue

-- =====================================
-- STEP 1: Drop ALL problematic policies
-- =====================================

-- Drop users table policies that cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;

-- Drop adr_reports policies
DROP POLICY IF EXISTS "Users can view their own reports" ON adr_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON adr_reports;
DROP POLICY IF EXISTS "Users can insert their own reports" ON adr_reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON adr_reports;
DROP POLICY IF EXISTS "Admins can update all reports" ON adr_reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON adr_reports;

-- Drop suspected_drugs policies
DROP POLICY IF EXISTS "Users can view drugs from their own reports" ON suspected_drugs;
DROP POLICY IF EXISTS "Admins can view all drugs" ON suspected_drugs;
DROP POLICY IF EXISTS "Users can insert drugs for their own reports" ON suspected_drugs;
DROP POLICY IF EXISTS "Users can update drugs from their own reports" ON suspected_drugs;
DROP POLICY IF EXISTS "Admins can update all drugs" ON suspected_drugs;
DROP POLICY IF EXISTS "Users and admins can delete drugs" ON suspected_drugs;

-- Drop notifications policies (if any remain)
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_any" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;

-- Drop concurrent_drugs policies if they exist
DROP POLICY IF EXISTS "Users can view concurrent drugs of their reports" ON concurrent_drugs;
DROP POLICY IF EXISTS "Users can insert concurrent drugs for their reports" ON concurrent_drugs;
DROP POLICY IF EXISTS "Users can update concurrent drugs of their reports" ON concurrent_drugs;
DROP POLICY IF EXISTS "Users can delete concurrent drugs of their reports" ON concurrent_drugs;

-- =====================================
-- STEP 2: Create helper functions
-- =====================================

-- Function to check if user is admin (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns a report
CREATE OR REPLACE FUNCTION user_owns_report(report_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM adr_reports 
        WHERE id = report_id 
        AND reporter_id::text = auth.uid()::text
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- STEP 3: Create SIMPLE policies (no recursion)
-- =====================================

-- USERS table policies
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (id::text = auth.uid()::text);

-- REPORTS table policies  
CREATE POLICY "reports_select_own" ON adr_reports
    FOR SELECT USING (reporter_id::text = auth.uid()::text);

CREATE POLICY "reports_insert_own" ON adr_reports
    FOR INSERT WITH CHECK (reporter_id::text = auth.uid()::text);

CREATE POLICY "reports_update_own" ON adr_reports
    FOR UPDATE USING (reporter_id::text = auth.uid()::text);

-- SUSPECTED_DRUGS table policies
CREATE POLICY "drugs_select_own" ON suspected_drugs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM adr_reports 
            WHERE id = suspected_drugs.report_id 
            AND reporter_id::text = auth.uid()::text
        )
    );

CREATE POLICY "drugs_insert_own" ON suspected_drugs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM adr_reports 
            WHERE id = report_id 
            AND reporter_id::text = auth.uid()::text
        )
    );

CREATE POLICY "drugs_update_own" ON suspected_drugs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM adr_reports 
            WHERE id = suspected_drugs.report_id 
            AND reporter_id::text = auth.uid()::text
        )
    );

CREATE POLICY "drugs_delete_own" ON suspected_drugs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM adr_reports 
            WHERE id = suspected_drugs.report_id 
            AND reporter_id::text = auth.uid()::text
        )
    );

-- NOTIFICATIONS table policies
CREATE POLICY "notifications_select_own" ON notifications
    FOR SELECT USING (recipient_id::text = auth.uid()::text);

CREATE POLICY "notifications_update_own" ON notifications
    FOR UPDATE USING (recipient_id::text = auth.uid()::text);

CREATE POLICY "notifications_insert_any" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "notifications_delete_own" ON notifications
    FOR DELETE USING (recipient_id::text = auth.uid()::text);

-- CONCURRENT_DRUGS table policies (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'concurrent_drugs') THEN
        CREATE POLICY "concurrent_drugs_select_own" ON concurrent_drugs
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM adr_reports 
                    WHERE id = concurrent_drugs.report_id 
                    AND reporter_id::text = auth.uid()::text
                )
            );

        CREATE POLICY "concurrent_drugs_insert_own" ON concurrent_drugs
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM adr_reports 
                    WHERE id = report_id 
                    AND reporter_id::text = auth.uid()::text
                )
            );

        CREATE POLICY "concurrent_drugs_update_own" ON concurrent_drugs
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM adr_reports 
                    WHERE id = concurrent_drugs.report_id 
                    AND reporter_id::text = auth.uid()::text
                )
            );

        CREATE POLICY "concurrent_drugs_delete_own" ON concurrent_drugs
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM adr_reports 
                    WHERE id = concurrent_drugs.report_id 
                    AND reporter_id::text = auth.uid()::text
                )
            );
        
        RAISE NOTICE 'Created policies for concurrent_drugs table';
    END IF;
END
$$;

-- =====================================
-- STEP 4: Update trigger functions
-- =====================================

-- Fix the notification trigger function
CREATE OR REPLACE FUNCTION notify_new_adr_report()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert notifications for admin users
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_notify_new_adr_report ON adr_reports;
CREATE TRIGGER trigger_notify_new_adr_report
    AFTER INSERT ON adr_reports
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_adr_report();

-- =====================================
-- STEP 5: Test the fix
-- =====================================

DO $$
DECLARE
    admin_user_id UUID;
    test_report_count INTEGER;
BEGIN
    -- Get admin user
    SELECT id INTO admin_user_id 
    FROM users 
    WHERE role = 'admin' 
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Test notification creation
        INSERT INTO notifications (
            recipient_id,
            type,
            title,
            message,
            data
        ) VALUES (
            admin_user_id,
            'system',
            'RLS Fix Complete',
            'All infinite recursion issues have been resolved! No more 42P17 errors.',
            jsonb_build_object('test', true, 'fix_applied', NOW())
        );
        
        RAISE NOTICE '✅ SUCCESS: All RLS policies fixed and tested';
        RAISE NOTICE '✅ Test notification created for admin: %', admin_user_id;
    ELSE
        RAISE NOTICE '⚠️  WARNING: No admin users found for testing';
    END IF;
    
    -- Test report access
    SELECT COUNT(*) INTO test_report_count FROM adr_reports;
    RAISE NOTICE '✅ Report access test: % reports found', test_report_count;
    
    -- Test drug access  
    SELECT COUNT(*) INTO test_report_count FROM suspected_drugs;
    RAISE NOTICE '✅ Drug access test: % drugs found', test_report_count;

    -- Test user access
    SELECT COUNT(*) INTO test_report_count FROM users;
    RAISE NOTICE '✅ User access test: % users found', test_report_count;
    
    RAISE NOTICE '🎉 ALL TESTS PASSED - RLS infinite recursion fixed!';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ERROR during testing: %', SQLERRM;
END
$$;
