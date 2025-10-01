-- =====================================================
-- FIX: Make QR code columns nullable after removing QR functionality
-- =====================================================

-- Bước 1: Xóa NOT NULL constraint từ cột qr_code_data
ALTER TABLE allergy_cards 
ALTER COLUMN qr_code_data DROP NOT NULL;

-- Bước 2: Xóa NOT NULL constraint từ cột qr_code_url (nếu có)
ALTER TABLE allergy_cards 
ALTER COLUMN qr_code_url DROP NOT NULL;

-- Bước 3: Set NULL cho các giá trị hiện tại (tùy chọn)
-- UPDATE allergy_cards 
-- SET qr_code_data = NULL, 
--     qr_code_url = NULL;

-- Kiểm tra kết quả
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'allergy_cards' 
  AND column_name IN ('qr_code_data', 'qr_code_url')
ORDER BY column_name;

-- Kết quả mong đợi:
-- qr_code_data | jsonb | YES | NULL
-- qr_code_url  | text  | YES | NULL


