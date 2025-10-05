-- =====================================================
-- ORGANIZATION SETTINGS SCHEMA
-- Bảng lưu cấu hình email notification cho từng tổ chức
-- =====================================================

-- Create organization_settings table
CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name VARCHAR(255) UNIQUE NOT NULL,
    notification_email VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organization_settings_name ON organization_settings(organization_name);
CREATE INDEX IF NOT EXISTS idx_organization_settings_active ON organization_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_organization_settings_email ON organization_settings(notification_email);

-- Add comments for documentation
COMMENT ON TABLE organization_settings IS 'Cấu hình email thông báo cho từng tổ chức y tế';
COMMENT ON COLUMN organization_settings.organization_name IS 'Tên tổ chức (unique)';
COMMENT ON COLUMN organization_settings.notification_email IS 'Email nhận thông báo ADR';
COMMENT ON COLUMN organization_settings.contact_person IS 'Người liên hệ';
COMMENT ON COLUMN organization_settings.contact_phone IS 'Số điện thoại liên hệ';
COMMENT ON COLUMN organization_settings.is_active IS 'Trạng thái kích hoạt';

-- Enable Row Level Security
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_settings
-- Policy 1: Admin có thể xem tất cả
DROP POLICY IF EXISTS "Admin can view all organization settings" ON organization_settings;
CREATE POLICY "Admin can view all organization settings"
    ON organization_settings FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Policy 2: User chỉ xem tổ chức của mình
DROP POLICY IF EXISTS "Users can view their organization settings" ON organization_settings;
CREATE POLICY "Users can view their organization settings"
    ON organization_settings FOR SELECT
    TO authenticated
    USING (
        organization_name IN (
            SELECT organization FROM users 
            WHERE users.id::text = auth.uid()::text
        )
    );

-- Policy 3: Admin có thể insert
DROP POLICY IF EXISTS "Admin can insert organization settings" ON organization_settings;
CREATE POLICY "Admin can insert organization settings"
    ON organization_settings FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Policy 4: Admin có thể update
DROP POLICY IF EXISTS "Admin can update organization settings" ON organization_settings;
CREATE POLICY "Admin can update organization settings"
    ON organization_settings FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Policy 5: Admin có thể delete
DROP POLICY IF EXISTS "Admin can delete organization settings" ON organization_settings;
CREATE POLICY "Admin can delete organization settings"
    ON organization_settings FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organization_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_organization_settings_updated_at ON organization_settings;
CREATE TRIGGER trigger_organization_settings_updated_at
    BEFORE UPDATE ON organization_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_organization_settings_updated_at();

-- =====================================================
-- INSERT DEFAULT ORGANIZATION SETTINGS
-- =====================================================

-- Insert default organizations from existing ADR reports
INSERT INTO organization_settings (
    organization_name,
    notification_email,
    contact_person,
    is_active
)
SELECT DISTINCT
    organization,
    'di.pvcenter@gmail.com' as notification_email,
    'Admin' as contact_person,
    TRUE as is_active
FROM adr_reports
WHERE organization IS NOT NULL
ON CONFLICT (organization_name) DO NOTHING;

-- Insert default settings
INSERT INTO organization_settings (
    organization_name,
    notification_email,
    contact_person,
    is_active
) VALUES
    ('Sở Y tế Thành phố', 'di.pvcenter@gmail.com', 'Quản trị viên', TRUE),
    ('Bệnh viện Đa khoa ABC', 'di.pvcenter@gmail.com', 'Phòng Dược', TRUE),
    ('Bệnh viện Đại học Y', 'di.pvcenter@gmail.com', 'Phòng Dược', TRUE),
    ('Bệnh viện Trung ương', 'di.pvcenter@gmail.com', 'Phòng Dược', TRUE)
ON CONFLICT (organization_name) DO NOTHING;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get notification email for organization
CREATE OR REPLACE FUNCTION get_organization_notification_email(org_name VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    result_email VARCHAR;
BEGIN
    SELECT notification_email INTO result_email
    FROM organization_settings
    WHERE organization_name = org_name
    AND is_active = TRUE
    LIMIT 1;
    
    -- Return default email if not found
    IF result_email IS NULL THEN
        RETURN 'di.pvcenter@gmail.com';
    END IF;
    
    RETURN result_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to list all active organizations with emails
CREATE OR REPLACE FUNCTION list_active_organization_emails()
RETURNS TABLE (
    organization VARCHAR,
    email VARCHAR,
    contact_person VARCHAR,
    contact_phone VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        organization_name::VARCHAR,
        notification_email::VARCHAR,
        organization_settings.contact_person::VARCHAR,
        organization_settings.contact_phone::VARCHAR
    FROM organization_settings
    WHERE is_active = TRUE
    ORDER BY organization_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- View all organization settings
SELECT 
    id,
    organization_name,
    notification_email,
    contact_person,
    contact_phone,
    is_active,
    created_at
FROM organization_settings
ORDER BY organization_name;

-- Test helper function
SELECT get_organization_notification_email('Sở Y tế Thành phố');

-- List all active organizations
SELECT * FROM list_active_organization_emails();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Organization Settings Schema created successfully!';
    RAISE NOTICE '📧 Default email: di.pvcenter@gmail.com';
    RAISE NOTICE '🏥 Organizations imported from existing reports';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Update organization emails in admin panel';
    RAISE NOTICE '2. Test auto-email sending';
    RAISE NOTICE '3. Configure SMTP for production';
END $$;







