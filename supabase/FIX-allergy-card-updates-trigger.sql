-- =====================================================
-- FIX TRIGGER AUTO ADD ALLERGIES
-- Sửa trigger để check duplicate trước khi insert
-- =====================================================

-- Drop trigger cũ
DROP TRIGGER IF EXISTS trigger_auto_add_approved_allergies ON update_allergies;

-- Tạo lại function với logic kiểm tra duplicate tốt hơn
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
      -- Kiểm tra xem dị ứng đã tồn tại chưa (theo tên)
      SELECT EXISTS(
        SELECT 1 
        FROM card_allergies 
        WHERE card_id = v_card_id 
        AND LOWER(TRIM(allergen_name)) = LOWER(TRIM(NEW.allergen_name))
      ) INTO v_exists;
      
      -- Chỉ insert nếu chưa tồn tại
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

-- Tạo lại trigger
CREATE TRIGGER trigger_auto_add_approved_allergies
  AFTER INSERT OR UPDATE ON update_allergies
  FOR EACH ROW
  WHEN (NEW.is_approved = TRUE)
  EXECUTE FUNCTION auto_add_approved_allergies();

-- Test: Kiểm tra các dị ứng trong update_allergies đã được approved chưa
SELECT 
  ua.id,
  ua.allergen_name,
  ua.is_approved,
  acu.card_id,
  ac.card_code,
  -- Check xem đã có trong card_allergies chưa
  EXISTS(
    SELECT 1 
    FROM card_allergies ca 
    WHERE ca.card_id = acu.card_id 
    AND LOWER(TRIM(ca.allergen_name)) = LOWER(TRIM(ua.allergen_name))
  ) as already_in_card_allergies
FROM update_allergies ua
JOIN allergy_card_updates acu ON ua.update_id = acu.id
JOIN allergy_cards ac ON acu.card_id = ac.id
WHERE ua.is_approved = TRUE
ORDER BY ua.created_at DESC
LIMIT 20;

-- Fix completed
SELECT 'Trigger fixed! Run the query above to check existing allergies.' as status;

