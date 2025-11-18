-- =====================================================
-- FIX PUBLIC ACCESS FOR ALLERGY CARD UPDATES VIEW
-- Sửa lỗi không hiển thị lịch sử bổ sung khi quét QR
-- =====================================================

-- =====================================================
-- BƯỚC 1: KIỂM TRA HIỆN TRẠNG
-- =====================================================

-- Kiểm tra view có tồn tại không
SELECT 
  'View exists check' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ View exists'
    ELSE '❌ View NOT exists'
  END as status
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name = 'allergy_card_updates_with_details';

-- Kiểm tra permissions hiện tại
SELECT 
  'Current permissions' as check_type,
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name = 'allergy_card_updates_with_details';

-- =====================================================
-- BƯỚC 2: DROP VIEW CŨ (nếu có lỗi)
-- =====================================================

DROP VIEW IF EXISTS allergy_card_updates_with_details CASCADE;

-- =====================================================
-- BƯỚC 3: TẠO LẠI VIEW
-- =====================================================

CREATE OR REPLACE VIEW allergy_card_updates_with_details AS
SELECT 
  acu.*,
  -- Aggregated allergies added in this update
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', ua.id,
        'allergen_name', ua.allergen_name,
        'certainty_level', ua.certainty_level,
        'clinical_manifestation', ua.clinical_manifestation,
        'severity_level', ua.severity_level,
        'reaction_type', ua.reaction_type,
        'discovered_date', ua.discovered_date,
        'is_approved', ua.is_approved,
        'approved_at', ua.approved_at
      ) ORDER BY ua.severity_level DESC NULLS LAST, ua.created_at
    ) FILTER (WHERE ua.id IS NOT NULL),
    '[]'::jsonb
  ) as allergies_added,
  -- Count of allergies
  COUNT(ua.id) FILTER (WHERE ua.id IS NOT NULL) as allergies_count
FROM allergy_card_updates acu
LEFT JOIN update_allergies ua ON acu.id = ua.update_id
GROUP BY acu.id;

-- =====================================================
-- BƯỚC 4: GRANT PERMISSIONS CHO PUBLIC ACCESS
-- =====================================================

-- Revoke all trước (clean slate)
REVOKE ALL ON allergy_card_updates_with_details FROM anon;
REVOKE ALL ON allergy_card_updates_with_details FROM authenticated;

-- Grant SELECT cho anon role (public không cần đăng nhập)
GRANT SELECT ON allergy_card_updates_with_details TO anon;

-- Grant SELECT cho authenticated role (đã đăng nhập)
GRANT SELECT ON allergy_card_updates_with_details TO authenticated;

-- =====================================================
-- BƯỚC 5: ENABLE RLS CHO CÁC BẢNG (nếu chưa có)
-- =====================================================

ALTER TABLE allergy_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergy_card_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_allergies ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- BƯỚC 6: TẠO/UPDATE POLICIES
-- =====================================================

-- DROP policies cũ
DROP POLICY IF EXISTS "Public can view allergy cards" ON allergy_cards;
DROP POLICY IF EXISTS "Public can view card allergies" ON card_allergies;
DROP POLICY IF EXISTS "Public can view allergy card updates" ON allergy_card_updates;
DROP POLICY IF EXISTS "Public can insert allergy card updates" ON allergy_card_updates;
DROP POLICY IF EXISTS "Public can view update allergies" ON update_allergies;
DROP POLICY IF EXISTS "Public can insert update allergies" ON update_allergies;

-- CREATE policies mới

-- Allergy Cards - Public có thể XEM
CREATE POLICY "Public can view allergy cards" ON allergy_cards
  FOR SELECT
  USING (true);

-- Card Allergies - Public có thể XEM
CREATE POLICY "Public can view card allergies" ON card_allergies
  FOR SELECT
  USING (true);

-- Allergy Card Updates - Public có thể XEM
CREATE POLICY "Public can view allergy card updates" ON allergy_card_updates
  FOR SELECT
  USING (true);

-- Allergy Card Updates - Public có thể THÊM
CREATE POLICY "Public can insert allergy card updates" ON allergy_card_updates
  FOR INSERT
  WITH CHECK (true);

-- Update Allergies - Public có thể XEM
CREATE POLICY "Public can view update allergies" ON update_allergies
  FOR SELECT
  USING (true);

-- Update Allergies - Public có thể THÊM
CREATE POLICY "Public can insert update allergies" ON update_allergies
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM allergy_card_updates 
      WHERE id = update_id
    )
  );

-- =====================================================
-- BƯỚC 7: KIỂM TRA KẾT QUẢ
-- =====================================================

-- 1. Kiểm tra view đã tạo
SELECT 
  '1. View created' as step,
  COUNT(*) as count
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name = 'allergy_card_updates_with_details';

-- 2. Kiểm tra permissions
SELECT 
  '2. View permissions' as step,
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name = 'allergy_card_updates_with_details'
ORDER BY grantee;

-- 3. Kiểm tra RLS enabled
SELECT 
  '3. RLS status' as step,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ Enabled'
    ELSE '❌ Disabled'
  END as rls_status
FROM pg_tables
WHERE tablename IN (
  'allergy_cards',
  'card_allergies',
  'allergy_card_updates',
  'update_allergies'
);

-- 4. Kiểm tra policies
SELECT 
  '4. Policies' as step,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN (
  'allergy_cards',
  'card_allergies',
  'allergy_card_updates',
  'update_allergies'
)
ORDER BY tablename, policyname;

-- 5. Test query view
SELECT 
  '5. View query test' as step,
  COUNT(*) as total_updates
FROM allergy_card_updates_with_details;

-- =====================================================
-- ✅ HOÀN TẤT
-- =====================================================

SELECT '✅ PUBLIC ACCESS VIEW FIXED!' as status;
SELECT 'Bây giờ khi quét QR code, lịch sử bổ sung sẽ hiển thị đầy đủ' as message;

-- =====================================================
-- 📝 HƯỚNG DẪN TEST
-- =====================================================
-- 1. Chạy script này trong Supabase SQL Editor
-- 2. Quét QR code thẻ dị ứng bằng điện thoại
-- 3. Kiểm tra section "Lịch sử bổ sung" có hiển thị không
-- 4. Nếu vẫn không hiển thị, kiểm tra:
--    - Console log trong browser (F12)
--    - API response: /api/allergy-cards/public/[code]
--    - Xem có lỗi permission denied không
-- =====================================================

