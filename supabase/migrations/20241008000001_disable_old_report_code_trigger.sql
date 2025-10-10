-- Migration: Vô hiệu hóa trigger tự động tạo report_code cũ
-- Lý do: Application đã tự generate report_code theo format mới {dept_code}-{seq}-{year}
-- Trigger cũ đang ghi đè và tạo conflict

-- Drop trigger cũ
DROP TRIGGER IF EXISTS trigger_generate_report_code ON adr_reports;

-- Drop function cũ
DROP FUNCTION IF EXISTS generate_report_code();

-- QUAN TRỌNG: Từ giờ report_code sẽ được tạo bởi application
-- Format mới: {dept_code}-{sequence}-{year}
-- Ví dụ: 92010-010-2025

-- Giữ lại constraint UNIQUE cho report_code
-- (Constraint này vẫn cần thiết để đảm bảo không trùng mã)


