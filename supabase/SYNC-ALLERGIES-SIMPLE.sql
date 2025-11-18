-- =====================================================
-- SCRIPT SYNC DỊ ỨNG - PHIÊN BẢN ĐƠN GIẢN
-- Chỉ sync dữ liệu, không có logs chi tiết
-- Chạy nhanh hơn, phù hợp cho production
-- =====================================================

-- 1. Tạo/Update trigger tự động sync
-- ══════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS trigger_auto_add_approved_allergies ON update_allergies;

CREATE OR REPLACE FUNCTION auto_add_approved_allergies()
RETURNS TRIGGER AS $$
DECLARE
  v_card_id UUID;
  v_exists BOOLEAN;
BEGIN
  IF NEW.is_approved = TRUE THEN
    SELECT card_id INTO v_card_id
    FROM allergy_card_updates
    WHERE id = NEW.update_id;
    
    IF v_card_id IS NOT NULL THEN
      SELECT EXISTS(
        SELECT 1 
        FROM card_allergies 
        WHERE card_id = v_card_id 
        AND LOWER(TRIM(allergen_name)) = LOWER(TRIM(NEW.allergen_name))
      ) INTO v_exists;
      
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
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_add_approved_allergies
  AFTER INSERT OR UPDATE ON update_allergies
  FOR EACH ROW
  WHEN (NEW.is_approved = TRUE)
  EXECUTE FUNCTION auto_add_approved_allergies();

-- 2. Sync dữ liệu cũ (các dị ứng đã approved nhưng chưa được thêm vào card_allergies)
-- ══════════════════════════════════════════════════════
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
  SELECT 1 FROM card_allergies ca 
  WHERE ca.card_id = acu.card_id 
  AND LOWER(TRIM(ca.allergen_name)) = LOWER(TRIM(ua.allergen_name))
)
ON CONFLICT DO NOTHING;

-- 3. Hiển thị kết quả
-- ══════════════════════════════════════════════════════
SELECT 
  '✅ HOÀN TẤT!' as status,
  COUNT(*) as "Số dị ứng đã được sync"
FROM update_allergies ua
JOIN allergy_card_updates acu ON ua.update_id = acu.id
WHERE ua.is_approved = TRUE
AND EXISTS (
  SELECT 1 FROM card_allergies ca 
  WHERE ca.card_id = acu.card_id 
  AND LOWER(TRIM(ca.allergen_name)) = LOWER(TRIM(ua.allergen_name))
);

-- 4. Verify - Top 5 thẻ mới nhất
-- ══════════════════════════════════════════════════════
SELECT 
  ac.card_code,
  ac.patient_name,
  COUNT(DISTINCT ca.id) as total_allergies,
  '✅' as status
FROM allergy_cards ac
LEFT JOIN card_allergies ca ON ca.card_id = ac.id
LEFT JOIN allergy_card_updates acu ON acu.card_id = ac.id
GROUP BY ac.id, ac.card_code, ac.patient_name
HAVING COUNT(DISTINCT acu.id) > 0
ORDER BY ac.created_at DESC
LIMIT 5;

