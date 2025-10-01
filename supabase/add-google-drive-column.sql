-- =====================================================
-- ADD GOOGLE DRIVE URL COLUMN FOR ALLERGY CARDS
-- Thêm cột lưu link Google Drive cho mỗi thẻ dị ứng
-- =====================================================

-- Bước 1: Thêm cột google_drive_url
ALTER TABLE allergy_cards 
ADD COLUMN IF NOT EXISTS google_drive_url TEXT;

-- Bước 2: Thêm comment giải thích
COMMENT ON COLUMN allergy_cards.google_drive_url IS 
'Link Google Drive chứa file thẻ dị ứng PDF/image. QR code sẽ link đến đây.';

-- Bước 3: Tạo index cho tìm kiếm nhanh (tùy chọn)
CREATE INDEX IF NOT EXISTS idx_allergy_cards_drive_url 
ON allergy_cards(google_drive_url) 
WHERE google_drive_url IS NOT NULL;

-- Bước 4: Cập nhật view để hiển thị google_drive_url
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

-- Bước 5: Kiểm tra kết quả
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'allergy_cards' 
  AND column_name = 'google_drive_url';

-- Migration completed
SELECT 'Migration completed successfully!' as status;
