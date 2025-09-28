-- Create notifications table for ADR system
-- This table stores notifications when new reports are created

-- Create notification type enum
CREATE TYPE notification_type AS ENUM ('new_report', 'report_updated', 'system');

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type notification_type NOT NULL DEFAULT 'new_report',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data (report_id, etc.)
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'Bảng thông báo hệ thống ADR';
COMMENT ON COLUMN notifications.recipient_id IS 'ID người nhận thông báo';
COMMENT ON COLUMN notifications.sender_id IS 'ID người tạo báo cáo (có thể null cho system notifications)';
COMMENT ON COLUMN notifications.type IS 'Loại thông báo (new_report, report_updated, system)';
COMMENT ON COLUMN notifications.title IS 'Tiêu đề thông báo';
COMMENT ON COLUMN notifications.message IS 'Nội dung thông báo';
COMMENT ON COLUMN notifications.data IS 'Dữ liệu bổ sung (JSON: report_id, report_code, etc.)';
COMMENT ON COLUMN notifications.read IS 'Đã đọc hay chưa';

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications table
-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (recipient_id::text = auth.uid()::text);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (recipient_id::text = auth.uid()::text);

-- System can insert notifications for anyone (will be done via service role)
CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate it
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Function to create notification for new ADR report
CREATE OR REPLACE FUNCTION notify_new_adr_report()
RETURNS TRIGGER AS $$
DECLARE
    admin_user RECORD;
BEGIN
    -- Create notification for all admin users when a new report is created
    FOR admin_user IN 
        SELECT id, name FROM users WHERE role = 'admin'
    LOOP
        INSERT INTO notifications (
            recipient_id,
            sender_id,
            type,
            title,
            message,
            data
        ) VALUES (
            admin_user.id,
            NEW.reporter_id,
            'new_report',
            'Báo cáo ADR mới',
            'Có báo cáo ADR mới từ ' || NEW.organization || ' - Mã: ' || NEW.report_code,
            jsonb_build_object(
                'report_id', NEW.id,
                'report_code', NEW.report_code,
                'patient_name', NEW.patient_name,
                'organization', NEW.organization,
                'severity_level', NEW.severity_level
            )
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for new ADR reports
DROP TRIGGER IF EXISTS trigger_notify_new_adr_report ON adr_reports;

CREATE TRIGGER trigger_notify_new_adr_report
    AFTER INSERT ON adr_reports
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_adr_report();

-- Insert sample notifications for testing (optional)
-- This will create notifications for existing reports if any exist
INSERT INTO notifications (recipient_id, sender_id, type, title, message, data)
SELECT 
    u.id as recipient_id,
    r.reporter_id as sender_id,
    'new_report' as type,
    'Báo cáo ADR mới' as title,
    'Có báo cáo ADR mới từ ' || r.organization || ' - Mã: ' || r.report_code as message,
    jsonb_build_object(
        'report_id', r.id,
        'report_code', r.report_code,
        'patient_name', r.patient_name,
        'organization', r.organization,
        'severity_level', r.severity_level
    ) as data
FROM adr_reports r
CROSS JOIN users u
WHERE u.role = 'admin'
AND EXISTS (SELECT 1 FROM adr_reports LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM notifications LIMIT 1)
LIMIT 10
ON CONFLICT DO NOTHING;

-- Add success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully created notifications table with triggers';
    RAISE NOTICE 'Notifications will be automatically created when new ADR reports are added';
    RAISE NOTICE 'Sample notifications created for existing reports (if any)';
END
$$;
