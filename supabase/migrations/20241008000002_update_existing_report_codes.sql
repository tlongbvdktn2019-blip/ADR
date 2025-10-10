-- Migration: Cập nhật các report_code cũ sang format mới (nếu cần)
-- Format cũ: 2025-000011
-- Format mới: {dept_code}-{seq}-{year}

-- LƯU Ý: Script này CHỈ chạy sau khi:
-- 1. Đã có đầy đủ department codes trong bảng departments
-- 2. Admin đã review và đồng ý migrate

-- Script này được comment lại, chỉ uncomment khi muốn migrate data cũ

/*
DO $$
DECLARE
    report_record RECORD;
    dept_code VARCHAR(10);
    seq_num INTEGER;
    year_num VARCHAR(4);
    new_code VARCHAR(50);
BEGIN
    -- Lặp qua các reports có format cũ (bắt đầu bằng năm)
    FOR report_record IN 
        SELECT id, report_code, organization, created_at
        FROM adr_reports
        WHERE report_code ~ '^[0-9]{4}-[0-9]+'
        ORDER BY created_at
    LOOP
        -- Lấy department code từ organization
        SELECT code INTO dept_code
        FROM departments
        WHERE name = report_record.organization
        LIMIT 1;
        
        -- Nếu không tìm thấy department code, skip
        IF dept_code IS NULL THEN
            RAISE NOTICE 'Skipping report % - no department code for organization: %', 
                report_record.id, report_record.organization;
            CONTINUE;
        END IF;
        
        -- Lấy năm từ created_at
        year_num := TO_CHAR(report_record.created_at, 'YYYY');
        
        -- Lấy số thứ tự hiện tại của org này trong năm đó
        SELECT COUNT(*) + 1 INTO seq_num
        FROM adr_reports
        WHERE organization = report_record.organization
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM report_record.created_at)
        AND created_at < report_record.created_at;
        
        -- Tạo mã mới
        new_code := dept_code || '-' || LPAD(seq_num::TEXT, 3, '0') || '-' || year_num;
        
        -- Cập nhật
        UPDATE adr_reports
        SET report_code = new_code
        WHERE id = report_record.id;
        
        RAISE NOTICE 'Updated report % from % to %', 
            report_record.id, report_record.report_code, new_code;
    END LOOP;
END $$;
*/

-- Uncomment dòng dưới sau khi review và test kỹ
-- RAISE NOTICE 'Migration script ready. Uncomment the DO block to execute.';


