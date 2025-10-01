-- =====================================================
-- QUICK FIX: Sửa lỗi column u.full_name does not exist
-- Chạy file này nếu gặp lỗi khi tạo view
-- =====================================================

-- Drop view cũ (nếu có)
DROP VIEW IF EXISTS allergy_cards_with_details CASCADE;

-- Tạo lại view với tên cột đúng (u.name thay vì u.full_name)
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
  -- User info (sử dụng u.name thay vì u.full_name)
  u.name as issued_by_name,
  u.email as issued_by_email,
  u.organization as issued_by_organization
FROM allergy_cards ac
LEFT JOIN card_allergies ca ON ac.id = ca.card_id
LEFT JOIN users u ON ac.issued_by_user_id = u.id
GROUP BY ac.id, u.name, u.email, u.organization;

-- Note: GRANT statements có thể cần chạy riêng bởi admin
-- Nếu gặp lỗi authorization, hãy chạy file FIX-VIEW-COLUMN-NAME-NO-GRANTS.sql
-- Hoặc chạy các lệnh GRANT này riêng trong Supabase Dashboard với quyền admin

-- GRANT SELECT ON allergy_cards_with_details TO authenticated;
-- GRANT SELECT ON allergy_cards_with_details TO anon;

-- Verify view tạo thành công
SELECT 
  '✅ View created successfully!' as status,
  COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_name = 'allergy_cards_with_details';

-- Test query view
SELECT 
  'View test' as test_name,
  COUNT(*) as total_records
FROM allergy_cards_with_details;
