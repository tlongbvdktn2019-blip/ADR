-- =====================================================
-- SỬA LỖI: Không thể tạo thẻ dị ứng
-- Nguyên nhân: qr_code_data được định nghĩa là NOT NULL
-- Giải pháp: Cho phép qr_code_data và qr_code_url có thể NULL
-- =====================================================

-- Bước 1: Xóa constraint NOT NULL từ qr_code_data
ALTER TABLE allergy_cards 
ALTER COLUMN qr_code_data DROP NOT NULL;

-- Bước 2: Xóa constraint NOT NULL từ qr_code_url (nếu có)
ALTER TABLE allergy_cards 
ALTER COLUMN qr_code_url DROP NOT NULL;

-- Bước 3: Kiểm tra kết quả
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'allergy_cards' 
  AND column_name IN ('qr_code_data', 'qr_code_url', 'organization')
ORDER BY column_name;

-- KẾT QUẢ MONG ĐỢI:
-- column_name    | data_type | is_nullable | column_default
-- ---------------|-----------|-------------|---------------
-- organization   | varchar   | NO          | NULL
-- qr_code_data   | text      | YES         | NULL  ✓ ĐÃ SỬA
-- qr_code_url    | text      | YES         | NULL  ✓ ĐÃ SỬA

-- SAU KHI CHẠY SCRIPT NÀY, BẠN CÓ THỂ TẠO THẺ DỊ ỨNG THÀNH CÔNG!

