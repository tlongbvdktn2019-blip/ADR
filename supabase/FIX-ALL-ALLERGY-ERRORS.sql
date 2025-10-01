-- =====================================================
-- SỬA TẤT CẢ LỖI KHI TẠO THẺ DỊ ỨNG
-- Bao gồm: thêm cột google_drive_url và sửa NOT NULL constraints
-- =====================================================

-- BƯỚC 1: THÊM CỘT GOOGLE_DRIVE_URL (nếu chưa có)
ALTER TABLE allergy_cards 
ADD COLUMN IF NOT EXISTS google_drive_url TEXT;

COMMENT ON COLUMN allergy_cards.google_drive_url IS 
'Link Google Drive chứa file thẻ dị ứng PDF/image. QR code sẽ link đến đây.';

-- BƯỚC 2: XÓA CONSTRAINT NOT NULL TỪ QR_CODE_DATA
ALTER TABLE allergy_cards 
ALTER COLUMN qr_code_data DROP NOT NULL;

-- BƯỚC 3: XÓA CONSTRAINT NOT NULL TỪ QR_CODE_URL (nếu có)
ALTER TABLE allergy_cards 
ALTER COLUMN qr_code_url DROP NOT NULL;

-- BƯỚC 4: CẬP NHẬT VIEW ĐỂ HIỂN THỊ GOOGLE_DRIVE_URL
DROP VIEW IF EXISTS allergy_cards_with_details CASCADE;

CREATE OR REPLACE VIEW allergy_cards_with_details AS
SELECT 
  ac.*,
  -- Aggregated allergies
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', ca.id,
        'allergen_name', ca.allergen_name,
        'certainty_level', ca.certainty_level,
        'clinical_manifestation', ca.clinical_manifestation,
        'severity_level', ca.severity_level,
        'reaction_type', ca.reaction_type
      ) ORDER BY ca.severity_level DESC, ca.created_at
    ) FILTER (WHERE ca.id IS NOT NULL),
    '[]'::jsonb
  ) as allergies,
  -- User info
  u.name as issued_by_name,
  u.email as issued_by_email
FROM allergy_cards ac
LEFT JOIN card_allergies ca ON ac.id = ca.card_id
LEFT JOIN users u ON ac.issued_by_user_id = u.id
GROUP BY ac.id, u.name, u.email;

-- BƯỚC 5: TẠO INDEX CHO GOOGLE_DRIVE_URL (tùy chọn, để tìm kiếm nhanh)
CREATE INDEX IF NOT EXISTS idx_allergy_cards_drive_url 
ON allergy_cards(google_drive_url) 
WHERE google_drive_url IS NOT NULL;

-- BƯỚC 6: KIỂM TRA KẾT QUẢ
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'allergy_cards' 
  AND column_name IN ('qr_code_data', 'qr_code_url', 'google_drive_url')
ORDER BY column_name;

-- KẾT QUẢ MONG ĐỢI:
-- column_name      | data_type | is_nullable | column_default
-- -----------------|-----------|-------------|---------------
-- google_drive_url | text      | YES         | NULL  ✓ ĐÃ THÊM
-- qr_code_data     | text      | YES         | NULL  ✓ ĐÃ SỬA
-- qr_code_url      | text      | YES         | NULL  ✓ ĐÃ SỬA

SELECT '✅ HOÀN TẤT! BẠN CÓ THỂ TẠO THẺ DỊ ỨNG THÀNH CÔNG!' as status;

