-- =====================================================
-- SỬA TẤT CẢ VẤN ĐỀ VỚI ALLERGY CARDS
-- File này sửa view dựa trên schema thực tế từ data.md
-- =====================================================

-- BƯỚC 1: Xóa view cũ
DROP VIEW IF EXISTS allergy_cards_with_details CASCADE;

-- BƯỚC 2: Tạo lại view với các cột đúng theo schema
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
  -- User info (theo schema: users có cột 'name')
  u.name as issued_by_name,
  u.email as issued_by_email,
  u.organization as issued_by_organization
FROM allergy_cards ac
LEFT JOIN card_allergies ca ON ac.id = ca.card_id
LEFT JOIN users u ON ac.issued_by_user_id = u.id
GROUP BY ac.id, u.name, u.email, u.organization;

-- BƯỚC 3: Verify
SELECT 
  '✅ View created successfully!' as status,
  COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_name = 'allergy_cards_with_details';

-- BƯỚC 4: Test view
SELECT 
  '✅ View test:' as status,
  COUNT(*) as total_records
FROM allergy_cards_with_details;

-- BƯỚC 5: Nếu có dữ liệu, xem mẫu
SELECT 
  '✅ Sample data:' as status,
  id,
  patient_name,
  hospital_name,
  issued_by_name
FROM allergy_cards_with_details
LIMIT 3;


