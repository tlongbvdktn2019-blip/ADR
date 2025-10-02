-- Migration: Add approval status to ADR reports
-- Date: 2025-10-02
-- Description: Thêm trường approval_status để admin duyệt báo cáo

-- Tạo enum type cho trạng thái duyệt
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Thêm cột approval_status vào bảng adr_reports
ALTER TABLE adr_reports 
ADD COLUMN approval_status approval_status DEFAULT 'pending' NOT NULL,
ADD COLUMN approved_by UUID REFERENCES users(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN approval_note TEXT;

-- Tạo index cho approval_status để tăng hiệu suất truy vấn
CREATE INDEX idx_adr_reports_approval_status ON adr_reports(approval_status);

-- Cập nhật tất cả báo cáo hiện tại thành trạng thái 'pending'
UPDATE adr_reports SET approval_status = 'pending' WHERE approval_status IS NULL;

-- Comment để mô tả các cột mới
COMMENT ON COLUMN adr_reports.approval_status IS 'Trạng thái duyệt: pending (chưa duyệt), approved (đã duyệt), rejected (từ chối)';
COMMENT ON COLUMN adr_reports.approved_by IS 'ID của admin đã duyệt báo cáo';
COMMENT ON COLUMN adr_reports.approved_at IS 'Thời điểm duyệt báo cáo';
COMMENT ON COLUMN adr_reports.approval_note IS 'Ghi chú của admin khi duyệt/từ chối báo cáo';




