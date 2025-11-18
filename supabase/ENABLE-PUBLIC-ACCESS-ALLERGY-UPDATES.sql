-- =====================================================
-- ENABLE PUBLIC ACCESS FOR ALLERGY CARD UPDATES
-- Cho phép public access (không cần đăng nhập) để:
-- - Xem thẻ dị ứng khi quét QR
-- - Xem lịch sử bổ sung
-- - Bổ sung thông tin (sau khi verify card_code)
-- =====================================================

-- =====================================================
-- 1. ENABLE RLS cho các bảng (nếu chưa có)
-- =====================================================

ALTER TABLE allergy_card_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_allergies ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. DROP các policies cũ (nếu có) để tránh conflict
-- =====================================================

-- Allergy Card Updates policies
DROP POLICY IF EXISTS "Public can view allergy card updates" ON allergy_card_updates;
DROP POLICY IF EXISTS "Public can insert allergy card updates" ON allergy_card_updates;
DROP POLICY IF EXISTS "Admins can manage allergy card updates" ON allergy_card_updates;

-- Update Allergies policies  
DROP POLICY IF EXISTS "Public can view update allergies" ON update_allergies;
DROP POLICY IF EXISTS "Public can insert update allergies" ON update_allergies;
DROP POLICY IF EXISTS "Admins can manage update allergies" ON update_allergies;

-- Allergy Cards public read policy
DROP POLICY IF EXISTS "Public can view allergy cards" ON allergy_cards;

-- Card Allergies public read policy
DROP POLICY IF EXISTS "Public can view card allergies" ON card_allergies;

-- =====================================================
-- 3. TẠO POLICIES CHO PUBLIC ACCESS
-- =====================================================

-- ================== ALLERGY CARDS ==================
-- Public có thể XEM thẻ dị ứng (cần khi quét QR)
CREATE POLICY "Public can view allergy cards" ON allergy_cards
  FOR SELECT
  USING (true); -- Cho phép xem TẤT CẢ thẻ (public access)

-- ================== CARD ALLERGIES ==================
-- Public có thể XEM dị ứng của thẻ
CREATE POLICY "Public can view card allergies" ON card_allergies
  FOR SELECT
  USING (true);

-- ================== ALLERGY CARD UPDATES ==================
-- Public có thể XEM lịch sử bổ sung
CREATE POLICY "Public can view allergy card updates" ON allergy_card_updates
  FOR SELECT
  USING (true);

-- Public có thể THÊM bản cập nhật mới
-- (Validation card_code sẽ được thực hiện trong API)
CREATE POLICY "Public can insert allergy card updates" ON allergy_card_updates
  FOR INSERT
  WITH CHECK (true);

-- ================== UPDATE ALLERGIES ==================
-- Public có thể XEM dị ứng trong lịch sử bổ sung
CREATE POLICY "Public can view update allergies" ON update_allergies
  FOR SELECT
  USING (true);

-- Public có thể THÊM dị ứng mới
-- (Chỉ khi có bản update hợp lệ)
CREATE POLICY "Public can insert update allergies" ON update_allergies
  FOR INSERT
  WITH CHECK (
    -- Phải có update_id hợp lệ
    EXISTS (
      SELECT 1 
      FROM allergy_card_updates 
      WHERE id = update_id
    )
  );

-- =====================================================
-- 4. COMMENTS để giải thích policies
-- =====================================================

COMMENT ON POLICY "Public can view allergy cards" ON allergy_cards 
  IS 'Public access: Cho phép xem thẻ dị ứng khi quét QR code (không cần đăng nhập)';

COMMENT ON POLICY "Public can view card allergies" ON card_allergies 
  IS 'Public access: Cho phép xem dị ứng của thẻ khi quét QR';

COMMENT ON POLICY "Public can view allergy card updates" ON allergy_card_updates 
  IS 'Public access: Cho phép xem lịch sử bổ sung của thẻ';

COMMENT ON POLICY "Public can insert allergy card updates" ON allergy_card_updates 
  IS 'Public access: Cho phép bổ sung thông tin (sau khi verify card_code trong API)';

COMMENT ON POLICY "Public can view update allergies" ON update_allergies 
  IS 'Public access: Cho phép xem dị ứng được bổ sung';

COMMENT ON POLICY "Public can insert update allergies" ON update_allergies 
  IS 'Public access: Cho phép thêm dị ứng mới khi bổ sung thông tin';

-- =====================================================
-- 5. VIEW cũng cần public access
-- =====================================================

-- Grant SELECT on view cho anon role (public access)
GRANT SELECT ON allergy_card_updates_with_details TO anon;
GRANT SELECT ON allergy_card_updates_with_details TO authenticated;

-- =====================================================
-- 6. KIỂM TRA policies đã tạo
-- =====================================================

-- Liệt kê tất cả policies cho các bảng
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN (
  'allergy_cards',
  'card_allergies', 
  'allergy_card_updates',
  'update_allergies'
)
ORDER BY tablename, policyname;

-- =====================================================
-- ✅ HOÀN TẤT
-- =====================================================

SELECT '✅ Public access enabled for allergy card updates!' as status;
SELECT 'Bây giờ có thể xem và bổ sung thông tin thẻ dị ứng mà KHÔNG CẦN đăng nhập' as message;

-- =====================================================
-- 📝 LƯU Ý
-- =====================================================
-- - Public có thể XEM tất cả thẻ (khi quét QR)
-- - Public có thể BỔ SUNG thông tin (sau khi xác thực card_code)
-- - API sẽ validate card_code trước khi cho phép bổ sung
-- - Tất cả lịch sử bổ sung đều PUBLIC để bệnh viện khác có thể xem
-- - Bảo mật: Chỉ người có mã thẻ mới bổ sung được (validate trong API)
-- =====================================================

