-- Quick check: Kiểm tra database local có cột approval_status chưa
-- Chạy query này trong Supabase SQL Editor hoặc psql

-- 1. Kiểm tra cột approval_status có tồn tại không
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'adr_reports' 
  AND column_name IN ('approval_status', 'approved_by', 'approved_at', 'approval_note')
ORDER BY ordinal_position;

-- Nếu query này trả về 4 dòng → ✅ Migration đã chạy
-- Nếu trả về 0 dòng → ❌ Cần chạy migration

-- 2. Nếu đã có cột, xem dữ liệu mẫu
SELECT 
    id,
    report_code,
    approval_status,
    approved_by,
    approved_at
FROM adr_reports 
LIMIT 3;

-- 3. Đếm báo cáo theo trạng thái
SELECT 
    approval_status,
    COUNT(*) as count
FROM adr_reports 
GROUP BY approval_status;




