-- Allow reporter_id to be NULL for public reports (không đăng nhập)
-- Chạy script này trong Supabase SQL Editor

ALTER TABLE adr_reports 
ALTER COLUMN reporter_id DROP NOT NULL;

-- Thêm comment để ghi chú
COMMENT ON COLUMN adr_reports.reporter_id IS 'User ID của người tạo báo cáo. NULL nếu báo cáo từ public (không đăng nhập)';

