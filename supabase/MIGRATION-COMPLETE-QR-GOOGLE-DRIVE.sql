-- =====================================================
-- MIGRATION HOÀN CHỈNH: QR CODE VỚI GOOGLE DRIVE
-- Chạy toàn bộ file này trong Supabase SQL Editor
-- =====================================================

-- ============= BƯỚC 1: CẬP NHẬT SCHEMA =============

-- 1.1. Thêm cột google_drive_url
ALTER TABLE allergy_cards 
ADD COLUMN IF NOT EXISTS google_drive_url TEXT;

-- 1.2. Bỏ NOT NULL constraint cho qr_code_data
ALTER TABLE allergy_cards 
ALTER COLUMN qr_code_data DROP NOT NULL;

-- 1.3. Bỏ NOT NULL constraint cho qr_code_url (nếu có)
ALTER TABLE allergy_cards 
ALTER COLUMN qr_code_url DROP NOT NULL;

-- 1.4. Thêm comment giải thích
COMMENT ON COLUMN allergy_cards.google_drive_url IS 
'Link Google Drive chứa file thẻ dị ứng PDF/image. QR code sẽ chứa link này.';

COMMENT ON COLUMN allergy_cards.qr_code_data IS 
'(Deprecated) QR code data - giờ dùng qr_code_url với Google Drive link';

COMMENT ON COLUMN allergy_cards.qr_code_url IS 
'Data URL của QR code image (base64). QR chứa link Google Drive.';

-- 1.5. Tạo index cho tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_allergy_cards_drive_url 
ON allergy_cards(google_drive_url) 
WHERE google_drive_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_allergy_cards_status 
ON allergy_cards(status) 
WHERE status = 'active';

-- ============= BƯỚC 2: CẬP NHẬT VIEW =============

-- 2.1. Xóa view cũ
DROP VIEW IF EXISTS allergy_cards_with_details CASCADE;

-- 2.2. Tạo view mới với google_drive_url
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
      ) ORDER BY 
        CASE ca.severity_level 
          WHEN 'life_threatening' THEN 1
          WHEN 'severe' THEN 2
          WHEN 'moderate' THEN 3
          WHEN 'mild' THEN 4
          ELSE 5
        END,
        ca.created_at
    ) FILTER (WHERE ca.id IS NOT NULL),
    '[]'::jsonb
  ) as allergies,
  -- User info
  u.name as issued_by_name,
  u.email as issued_by_email,
  u.organization as issued_by_organization
FROM allergy_cards ac
LEFT JOIN card_allergies ca ON ac.id = ca.card_id
LEFT JOIN users u ON ac.issued_by_user_id = u.id
GROUP BY ac.id, u.name, u.email, u.organization;

-- Grant permissions
GRANT SELECT ON allergy_cards_with_details TO authenticated;
GRANT SELECT ON allergy_cards_with_details TO anon;

-- ============= BƯỚC 3: CẬP NHẬT DỮ LIỆU CŨ (NẾU CẦN) =============

-- 3.1. Set NULL cho qr_code_data của các thẻ cũ không có Google Drive URL
UPDATE allergy_cards 
SET qr_code_data = NULL 
WHERE google_drive_url IS NULL 
  AND qr_code_data IS NOT NULL;

-- 3.2. Log số lượng thẻ đã cập nhật
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Đã cập nhật % thẻ cũ', updated_count;
END $$;

-- ============= BƯỚC 4: KIỂM TRA KẾT QUẢ =============

-- 4.1. Kiểm tra columns
SELECT 
  'Column Check' as test_name,
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN is_nullable = 'YES' THEN '✅'
    ELSE '❌'
  END as status
FROM information_schema.columns
WHERE table_name = 'allergy_cards' 
  AND column_name IN ('google_drive_url', 'qr_code_data', 'qr_code_url')
ORDER BY column_name;

-- 4.2. Kiểm tra indexes
SELECT 
  'Index Check' as test_name,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'allergy_cards'
  AND indexname LIKE 'idx_allergy_cards_%'
ORDER BY indexname;

-- 4.3. Kiểm tra view
SELECT 
  'View Check' as test_name,
  table_name,
  CASE 
    WHEN table_name = 'allergy_cards_with_details' THEN '✅ View exists'
    ELSE '❌ View not found'
  END as status
FROM information_schema.views
WHERE table_name = 'allergy_cards_with_details';

-- 4.4. Thống kê thẻ hiện tại
SELECT 
  'Card Statistics' as test_name,
  COUNT(*) as total_cards,
  COUNT(google_drive_url) as cards_with_drive_url,
  COUNT(qr_code_url) as cards_with_qr,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_cards
FROM allergy_cards;

-- ============= BƯỚC 5: FINAL MESSAGE =============

SELECT 
  '🎉 MIGRATION HOÀN TẤT!' as status,
  'Hệ thống QR với Google Drive đã sẵn sàng' as message,
  NOW() as completed_at;

-- ============= GHI CHÚ =============
/*
MIGRATION ĐÃ THỰC HIỆN:

✅ 1. Thêm cột google_drive_url vào allergy_cards
✅ 2. Bỏ NOT NULL constraint cho qr_code_data
✅ 3. Bỏ NOT NULL constraint cho qr_code_url  
✅ 4. Thêm comments cho các cột
✅ 5. Tạo indexes cho performance
✅ 6. Cập nhật view allergy_cards_with_details
✅ 7. Grant permissions cho authenticated/anon users
✅ 8. Cập nhật dữ liệu cũ (set NULL)

BƯỚC TIẾP THEO:

1. Test tạo thẻ mới với Google Drive URL
2. Kiểm tra QR code generation
3. Test quét QR
4. Verify view permissions

ROLLBACK (NẾU CẦN):

-- Chỉ chạy nếu cần rollback
-- ALTER TABLE allergy_cards DROP COLUMN google_drive_url;
-- ALTER TABLE allergy_cards ALTER COLUMN qr_code_data SET NOT NULL;
*/
