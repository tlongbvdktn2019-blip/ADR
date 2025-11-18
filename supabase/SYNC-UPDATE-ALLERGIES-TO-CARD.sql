-- =====================================================
-- SCRIPT SYNC DỊ ỨNG TỪ UPDATES VÀO CARD ALLERGIES
-- Đảm bảo tất cả dị ứng được bổ sung hiển thị đầy đủ
-- =====================================================

-- BƯỚC 1: Kiểm tra trigger có tồn tại không
-- ══════════════════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 BƯỚC 1: Kiểm tra trigger';
  RAISE NOTICE '══════════════════════════════════════════════════════';
END $$;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'trigger_auto_add_approved_allergies'
      AND event_object_table = 'update_allergies'
    ) THEN '✅ Trigger auto_add_approved_allergies EXISTS'
    ELSE '❌ Trigger NOT FOUND - Cần tạo lại!'
  END as trigger_status;

-- BƯỚC 2: Tạo lại trigger với logic check duplicate
-- ══════════════════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔧 BƯỚC 2: Tạo/Update trigger với logic mới';
  RAISE NOTICE '══════════════════════════════════════════════════════';
END $$;

-- Drop trigger cũ
DROP TRIGGER IF EXISTS trigger_auto_add_approved_allergies ON update_allergies;

-- Tạo lại function với logic kiểm tra duplicate
CREATE OR REPLACE FUNCTION auto_add_approved_allergies()
RETURNS TRIGGER AS $$
DECLARE
  v_card_id UUID;
  v_exists BOOLEAN;
BEGIN
  -- Nếu dị ứng được approve, tự động thêm vào bảng card_allergies
  IF NEW.is_approved = TRUE THEN
    -- Lấy card_id từ update
    SELECT card_id INTO v_card_id
    FROM allergy_card_updates
    WHERE id = NEW.update_id;
    
    IF v_card_id IS NOT NULL THEN
      -- Kiểm tra xem dị ứng đã tồn tại chưa (theo tên, không phân biệt hoa thường)
      SELECT EXISTS(
        SELECT 1 
        FROM card_allergies 
        WHERE card_id = v_card_id 
        AND LOWER(TRIM(allergen_name)) = LOWER(TRIM(NEW.allergen_name))
      ) INTO v_exists;
      
      -- Chỉ insert nếu CHƯA tồn tại
      IF NOT v_exists THEN
        INSERT INTO card_allergies (
          card_id,
          allergen_name,
          certainty_level,
          clinical_manifestation,
          severity_level,
          reaction_type
        ) VALUES (
          v_card_id,
          NEW.allergen_name,
          NEW.certainty_level,
          NEW.clinical_manifestation,
          NEW.severity_level,
          NEW.reaction_type
        );
        
        RAISE NOTICE 'Added allergy % to card %', NEW.allergen_name, v_card_id;
      ELSE
        RAISE NOTICE 'Allergy % already exists in card %, skipping', NEW.allergen_name, v_card_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger mới
CREATE TRIGGER trigger_auto_add_approved_allergies
  AFTER INSERT OR UPDATE ON update_allergies
  FOR EACH ROW
  WHEN (NEW.is_approved = TRUE)
  EXECUTE FUNCTION auto_add_approved_allergies();

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Trigger đã được tạo/update';
END $$;

-- BƯỚC 3: Kiểm tra dữ liệu hiện tại
-- ══════════════════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📊 BƯỚC 3: Kiểm tra dữ liệu hiện tại';
  RAISE NOTICE '══════════════════════════════════════════════════════';
END $$;

SELECT 
  ac.card_code,
  ac.patient_name,
  COUNT(DISTINCT ca.id) as "Dị ứng trong card",
  COUNT(DISTINCT ua.id) as "Dị ứng trong updates",
  COUNT(DISTINCT ua.id) FILTER (WHERE ua.is_approved = TRUE) as "Updates đã approve",
  COUNT(DISTINCT ua.id) FILTER (
    WHERE ua.is_approved = TRUE 
    AND NOT EXISTS (
      SELECT 1 FROM card_allergies ca2 
      WHERE ca2.card_id = ac.id 
      AND LOWER(TRIM(ca2.allergen_name)) = LOWER(TRIM(ua.allergen_name))
    )
  ) as "⚠️ Chưa sync"
FROM allergy_cards ac
LEFT JOIN card_allergies ca ON ca.card_id = ac.id
LEFT JOIN allergy_card_updates acu ON acu.card_id = ac.id
LEFT JOIN update_allergies ua ON ua.update_id = acu.id
GROUP BY ac.id, ac.card_code, ac.patient_name
HAVING COUNT(DISTINCT acu.id) > 0  -- Chỉ show các thẻ có updates
ORDER BY ac.created_at DESC
LIMIT 10;

-- BƯỚC 4: Liệt kê chi tiết các dị ứng chưa được sync
-- ══════════════════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔴 BƯỚC 4: Chi tiết các dị ứng chưa được sync';
  RAISE NOTICE '══════════════════════════════════════════════════════';
END $$;

SELECT 
  ac.card_code,
  ac.patient_name,
  ua.allergen_name as "Dị ứng chưa sync",
  ua.certainty_level,
  ua.severity_level,
  ua.is_approved,
  ua.created_at,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM card_allergies ca 
      WHERE ca.card_id = ac.id 
      AND LOWER(TRIM(ca.allergen_name)) = LOWER(TRIM(ua.allergen_name))
    ) THEN '✅ Đã có trong card'
    ELSE '❌ CHƯA có trong card'
  END as status
FROM update_allergies ua
JOIN allergy_card_updates acu ON ua.update_id = acu.id
JOIN allergy_cards ac ON acu.card_id = ac.id
WHERE ua.is_approved = TRUE
ORDER BY ua.created_at DESC
LIMIT 20;

-- BƯỚC 5: SYNC DỮ LIỆU CŨ (các dị ứng đã approved nhưng chưa được thêm vào card_allergies)
-- ══════════════════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔄 BƯỚC 5: Sync dữ liệu cũ';
  RAISE NOTICE '══════════════════════════════════════════════════════';
END $$;

-- Insert các dị ứng chưa được sync
INSERT INTO card_allergies (
  card_id,
  allergen_name,
  certainty_level,
  clinical_manifestation,
  severity_level,
  reaction_type,
  created_at
)
SELECT 
  acu.card_id,
  ua.allergen_name,
  ua.certainty_level,
  ua.clinical_manifestation,
  ua.severity_level,
  ua.reaction_type,
  ua.created_at
FROM update_allergies ua
JOIN allergy_card_updates acu ON ua.update_id = acu.id
WHERE ua.is_approved = TRUE
AND NOT EXISTS (
  -- Chỉ insert nếu CHƯA tồn tại (check theo tên, không phân biệt hoa thường)
  SELECT 1 FROM card_allergies ca 
  WHERE ca.card_id = acu.card_id 
  AND LOWER(TRIM(ca.allergen_name)) = LOWER(TRIM(ua.allergen_name))
)
ON CONFLICT DO NOTHING;

-- Lấy số lượng đã sync
SELECT 
  COUNT(*) as "Số dị ứng đã được sync"
FROM update_allergies ua
JOIN allergy_card_updates acu ON ua.update_id = acu.id
WHERE ua.is_approved = TRUE
AND EXISTS (
  SELECT 1 FROM card_allergies ca 
  WHERE ca.card_id = acu.card_id 
  AND LOWER(TRIM(ca.allergen_name)) = LOWER(TRIM(ua.allergen_name))
);

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Sync hoàn tất!';
END $$;

-- BƯỚC 6: Verify - Kiểm tra lại
-- ══════════════════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ BƯỚC 6: Verify - Kiểm tra lại';
  RAISE NOTICE '══════════════════════════════════════════════════════';
END $$;

SELECT 
  ac.card_code,
  ac.patient_name,
  COUNT(DISTINCT ca.id) as "Tổng dị ứng trong card",
  COUNT(DISTINCT ua.id) FILTER (WHERE ua.is_approved = TRUE) as "Updates đã approve",
  CASE 
    WHEN COUNT(DISTINCT ca.id) >= COUNT(DISTINCT ua.id) FILTER (WHERE ua.is_approved = TRUE)
    THEN '✅ ĐẦY ĐỦ'
    ELSE '⚠️ Còn thiếu'
  END as status
FROM allergy_cards ac
LEFT JOIN card_allergies ca ON ca.card_id = ac.id
LEFT JOIN allergy_card_updates acu ON acu.card_id = ac.id
LEFT JOIN update_allergies ua ON ua.update_id = acu.id
GROUP BY ac.id, ac.card_code, ac.patient_name
HAVING COUNT(DISTINCT acu.id) > 0
ORDER BY ac.created_at DESC
LIMIT 10;

-- HƯỚNG DẪN SỬ DỤNG
-- ══════════════════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '💡 HƯỚNG DẪN SỬ DỤNG';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '1. ✅ Trigger đã được tạo/update - Từ giờ mọi update mới sẽ tự động sync';
  RAISE NOTICE '';
  RAISE NOTICE '2. ✅ Dữ liệu cũ đã được sync vào card_allergies';
  RAISE NOTICE '';
  RAISE NOTICE '3. 🔄 Bây giờ khi quét QR code:';
  RAISE NOTICE '   - Phần "Thông tin dị ứng" sẽ hiển thị ĐẦY ĐỦ';
  RAISE NOTICE '   - Bao gồm cả dị ứng từ lúc tạo + dị ứng được bổ sung';
  RAISE NOTICE '';
  RAISE NOTICE '4. 📱 Test ngay:';
  RAISE NOTICE '   - Mở trang public: /allergy-cards/public/[CARD_CODE]';
  RAISE NOTICE '   - Kiểm tra phần "Thông tin dị ứng" có đầy đủ không';
  RAISE NOTICE '   - Kiểm tra phần "Lịch sử bổ sung" có hiển thị không';
  RAISE NOTICE '';
  RAISE NOTICE '5. 🐛 Nếu vẫn chưa hiển thị:';
  RAISE NOTICE '   - Clear cache browser (Ctrl + Shift + Delete)';
  RAISE NOTICE '   - Refresh trang (Ctrl + F5)';
  RAISE NOTICE '   - Kiểm tra console log có lỗi không';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

