-- Migration: Add approval status to ADR reports (SAFE VERSION)
-- Date: 2025-10-02
-- Description: Script an toàn - bỏ qua nếu đã tồn tại

-- Tạo enum type (bỏ qua nếu đã có)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
        CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
        RAISE NOTICE 'Created type: approval_status';
    ELSE
        RAISE NOTICE 'Type approval_status already exists - skipping';
    END IF;
END $$;

-- Thêm các cột (bỏ qua nếu đã có)
DO $$ 
BEGIN
    -- Thêm cột approval_status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'adr_reports' AND column_name = 'approval_status'
    ) THEN
        ALTER TABLE adr_reports 
        ADD COLUMN approval_status approval_status DEFAULT 'pending' NOT NULL;
        RAISE NOTICE 'Added column: approval_status';
    ELSE
        RAISE NOTICE 'Column approval_status already exists - skipping';
    END IF;

    -- Thêm cột approved_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'adr_reports' AND column_name = 'approved_by'
    ) THEN
        ALTER TABLE adr_reports 
        ADD COLUMN approved_by UUID REFERENCES users(id);
        RAISE NOTICE 'Added column: approved_by';
    ELSE
        RAISE NOTICE 'Column approved_by already exists - skipping';
    END IF;

    -- Thêm cột approved_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'adr_reports' AND column_name = 'approved_at'
    ) THEN
        ALTER TABLE adr_reports 
        ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added column: approved_at';
    ELSE
        RAISE NOTICE 'Column approved_at already exists - skipping';
    END IF;

    -- Thêm cột approval_note
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'adr_reports' AND column_name = 'approval_note'
    ) THEN
        ALTER TABLE adr_reports 
        ADD COLUMN approval_note TEXT;
        RAISE NOTICE 'Added column: approval_note';
    ELSE
        RAISE NOTICE 'Column approval_note already exists - skipping';
    END IF;
END $$;

-- Tạo index (bỏ qua nếu đã có)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_adr_reports_approval_status'
    ) THEN
        CREATE INDEX idx_adr_reports_approval_status ON adr_reports(approval_status);
        RAISE NOTICE 'Created index: idx_adr_reports_approval_status';
    ELSE
        RAISE NOTICE 'Index idx_adr_reports_approval_status already exists - skipping';
    END IF;
END $$;

-- Cập nhật dữ liệu cũ (nếu có)
DO $$ 
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE adr_reports 
    SET approval_status = 'pending' 
    WHERE approval_status IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    IF updated_count > 0 THEN
        RAISE NOTICE 'Updated % existing reports to pending status', updated_count;
    ELSE
        RAISE NOTICE 'All reports already have approval_status';
    END IF;
END $$;

-- Thêm comments
DO $$ 
BEGIN
    COMMENT ON COLUMN adr_reports.approval_status IS 'Trạng thái duyệt: pending (chưa duyệt), approved (đã duyệt), rejected (từ chối)';
    COMMENT ON COLUMN adr_reports.approved_by IS 'ID của admin đã duyệt báo cáo';
    COMMENT ON COLUMN adr_reports.approved_at IS 'Thời điểm duyệt báo cáo';
    COMMENT ON COLUMN adr_reports.approval_note IS 'Ghi chú của admin khi duyệt/từ chối báo cáo';
    RAISE NOTICE 'Added column comments';
END $$;

-- Kết quả cuối cùng
SELECT 
    'Migration completed successfully!' as message,
    COUNT(*) as total_reports,
    SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending_reports,
    SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved_reports,
    SUM(CASE WHEN approval_status = 'rejected' THEN 1 ELSE 0 END) as rejected_reports
FROM adr_reports;




