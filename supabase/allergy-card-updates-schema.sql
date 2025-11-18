-- =====================================================
-- ALLERGY CARD UPDATES HISTORY
-- Lưu lịch sử các lần bổ sung thông tin vào thẻ dị ứng
-- =====================================================

-- Bảng lưu lịch sử bổ sung thông tin
CREATE TABLE IF NOT EXISTS allergy_card_updates (
  -- Primary identification
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES allergy_cards(id) ON DELETE CASCADE,
  
  -- Thông tin người bổ sung
  updated_by_name VARCHAR(255) NOT NULL, -- Tên người bổ sung (không cần đăng nhập)
  updated_by_organization VARCHAR(255) NOT NULL, -- Tổ chức/Bệnh viện
  updated_by_role VARCHAR(100), -- Vai trò: Bác sĩ, Y tá, etc.
  updated_by_phone VARCHAR(20), -- Số điện thoại liên hệ
  updated_by_email VARCHAR(255), -- Email liên hệ (optional)
  
  -- Thông tin cơ sở y tế (nơi bổ sung)
  facility_name VARCHAR(255) NOT NULL, -- Tên bệnh viện/cơ sở y tế
  facility_department VARCHAR(255), -- Khoa/phòng
  
  -- Loại cập nhật
  update_type VARCHAR(50) CHECK (update_type IN (
    'new_allergy', -- Thêm dị ứng mới
    'medical_facility', -- Cập nhật thông tin cơ sở y tế
    'additional_info', -- Thông tin bổ sung
    'severity_update' -- Cập nhật mức độ nghiêm trọng
  )),
  
  -- Ghi chú về lần bổ sung
  update_notes TEXT,
  reason_for_update TEXT, -- Lý do bổ sung (khám bệnh, cấp cứu, etc.)
  
  -- Trạng thái xác minh
  is_verified BOOLEAN DEFAULT FALSE, -- Đã xác minh bởi chủ thẻ
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- System fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng lưu các dị ứng được bổ sung trong mỗi update
CREATE TABLE IF NOT EXISTS update_allergies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  update_id UUID NOT NULL REFERENCES allergy_card_updates(id) ON DELETE CASCADE,
  
  -- Thông tin dị ứng bổ sung
  allergen_name VARCHAR(255) NOT NULL,
  certainty_level VARCHAR(20) NOT NULL CHECK (certainty_level IN ('suspected', 'confirmed')),
  clinical_manifestation TEXT,
  severity_level VARCHAR(30) CHECK (severity_level IN (
    'mild', 'moderate', 'severe', 'life_threatening'
  )),
  reaction_type VARCHAR(50),
  
  -- Ngày phát hiện dị ứng
  discovered_date DATE,
  
  -- Đã được thêm vào thẻ chính chưa
  is_approved BOOLEAN DEFAULT TRUE, -- Mặc định approve ngay
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- System fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes cho performance
CREATE INDEX IF NOT EXISTS idx_card_updates_card ON allergy_card_updates(card_id);
CREATE INDEX IF NOT EXISTS idx_card_updates_date ON allergy_card_updates(created_at);
CREATE INDEX IF NOT EXISTS idx_card_updates_organization ON allergy_card_updates(updated_by_organization);
CREATE INDEX IF NOT EXISTS idx_card_updates_facility ON allergy_card_updates(facility_name);
CREATE INDEX IF NOT EXISTS idx_card_updates_type ON allergy_card_updates(update_type);

CREATE INDEX IF NOT EXISTS idx_update_allergies_update ON update_allergies(update_id);
CREATE INDEX IF NOT EXISTS idx_update_allergies_allergen ON update_allergies(allergen_name);
CREATE INDEX IF NOT EXISTS idx_update_allergies_approved ON update_allergies(is_approved);

-- View để xem lịch sử cập nhật với chi tiết
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

-- Function để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_allergy_card_updates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger cho allergy_card_updates
CREATE TRIGGER trigger_update_allergy_card_updates_timestamp
  BEFORE UPDATE ON allergy_card_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_allergy_card_updates_timestamp();

-- Trigger cho update_allergies
CREATE TRIGGER trigger_update_update_allergies_timestamp
  BEFORE UPDATE ON update_allergies
  FOR EACH ROW
  EXECUTE FUNCTION update_allergy_card_updates_timestamp();

-- Function để tự động thêm dị ứng vào bảng chính
CREATE OR REPLACE FUNCTION auto_add_approved_allergies()
RETURNS TRIGGER AS $$
BEGIN
  -- Nếu dị ứng được approve, tự động thêm vào bảng card_allergies
  IF NEW.is_approved = TRUE THEN
    INSERT INTO card_allergies (
      card_id,
      allergen_name,
      certainty_level,
      clinical_manifestation,
      severity_level,
      reaction_type
    )
    SELECT 
      acu.card_id,
      NEW.allergen_name,
      NEW.certainty_level,
      NEW.clinical_manifestation,
      NEW.severity_level,
      NEW.reaction_type
    FROM allergy_card_updates acu
    WHERE acu.id = NEW.update_id
    ON CONFLICT DO NOTHING; -- Tránh duplicate
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger để tự động thêm dị ứng được approve
CREATE TRIGGER trigger_auto_add_approved_allergies
  AFTER INSERT OR UPDATE ON update_allergies
  FOR EACH ROW
  WHEN (NEW.is_approved = TRUE)
  EXECUTE FUNCTION auto_add_approved_allergies();

-- Comments
COMMENT ON TABLE allergy_card_updates IS 'Lưu lịch sử các lần bổ sung thông tin vào thẻ dị ứng';
COMMENT ON TABLE update_allergies IS 'Lưu chi tiết các dị ứng được bổ sung trong mỗi lần cập nhật';
COMMENT ON COLUMN allergy_card_updates.updated_by_name IS 'Tên người bổ sung thông tin (không cần tài khoản)';
COMMENT ON COLUMN allergy_card_updates.is_verified IS 'Đã được chủ thẻ hoặc người có thẩm quyền xác minh';
COMMENT ON COLUMN update_allergies.is_approved IS 'Dị ứng đã được phê duyệt và thêm vào thẻ chính';

-- Migration completed
SELECT 'Allergy card updates schema created successfully!' as status;

