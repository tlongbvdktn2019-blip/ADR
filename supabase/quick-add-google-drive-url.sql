-- =====================================================
-- QUICK MIGRATION: Add Google Drive URL Column
-- Copy toàn bộ và chạy trong Supabase SQL Editor
-- =====================================================

-- 1. Thêm cột google_drive_url
ALTER TABLE allergy_cards 
ADD COLUMN IF NOT EXISTS google_drive_url TEXT;

-- 2. Xóa NOT NULL constraint cho QR columns
ALTER TABLE allergy_cards 
ALTER COLUMN qr_code_data DROP NOT NULL;

ALTER TABLE allergy_cards 
ALTER COLUMN qr_code_url DROP NOT NULL;

-- 3. Thêm comment
COMMENT ON COLUMN allergy_cards.google_drive_url IS 
'Link Google Drive chứa file thẻ dị ứng PDF/image. QR code sẽ link đến đây.';

-- 4. Tạo index
CREATE INDEX IF NOT EXISTS idx_allergy_cards_drive_url 
ON allergy_cards(google_drive_url) 
WHERE google_drive_url IS NOT NULL;

-- 5. Cập nhật view
DROP VIEW IF EXISTS allergy_cards_with_details CASCADE;

CREATE OR REPLACE VIEW allergy_cards_with_details AS
SELECT 
  ac.*,
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
  u.name as issued_by_name,
  u.email as issued_by_email
FROM allergy_cards ac
LEFT JOIN card_allergies ca ON ac.id = ca.card_id
LEFT JOIN users u ON ac.issued_by_user_id = u.id
GROUP BY ac.id, u.name, u.email;

-- Kiểm tra kết quả
SELECT 
  'Migration completed successfully!' as status,
  COUNT(*) FILTER (WHERE column_name = 'google_drive_url') as google_drive_url_added,
  COUNT(*) FILTER (WHERE column_name = 'qr_code_data' AND is_nullable = 'YES') as qr_data_nullable,
  COUNT(*) FILTER (WHERE column_name = 'qr_code_url' AND is_nullable = 'YES') as qr_url_nullable
FROM information_schema.columns
WHERE table_name = 'allergy_cards' 
  AND column_name IN ('google_drive_url', 'qr_code_data', 'qr_code_url');
