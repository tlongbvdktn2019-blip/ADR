-- =====================================================
-- ALLERGY CARDS MANAGEMENT SYSTEM
-- Database Schema for Allergy Card Feature
-- =====================================================

-- Table to store allergy cards information
CREATE TABLE allergy_cards (
  -- Primary identification
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_code VARCHAR(20) UNIQUE NOT NULL, -- Format: AC-YYYY-XXXXXX
  
  -- Link to ADR report (optional - can create card independently)
  report_id UUID REFERENCES adr_reports(id) ON DELETE SET NULL,
  
  -- Patient Information
  patient_name VARCHAR(255) NOT NULL,
  patient_gender VARCHAR(10) CHECK (patient_gender IN ('male', 'female', 'other')),
  patient_age INTEGER,
  patient_id_number VARCHAR(50), -- CMND/CCCD/Passport
  
  -- Medical facility information
  hospital_name VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  doctor_name VARCHAR(255) NOT NULL,
  doctor_phone VARCHAR(20),
  
  -- Card issuance information
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  issued_by_user_id UUID NOT NULL REFERENCES users(id),
  organization VARCHAR(255) NOT NULL,
  
  -- QR Code data
  qr_code_data TEXT NOT NULL, -- JSON string containing allergy info
  qr_code_url TEXT, -- URL to generated QR code image
  
  -- Card status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  expiry_date DATE, -- Optional expiry date
  
  -- Notes
  notes TEXT,
  
  -- System fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store individual allergies for each card
CREATE TABLE card_allergies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES allergy_cards(id) ON DELETE CASCADE,
  
  -- Allergy information
  allergen_name VARCHAR(255) NOT NULL, -- Tên dị nguyên/thuốc
  certainty_level VARCHAR(20) NOT NULL CHECK (certainty_level IN ('suspected', 'confirmed')), -- Nghi ngờ/Chắc chắn
  clinical_manifestation TEXT, -- Biểu hiện lâm sàng
  
  -- Additional details
  severity_level VARCHAR(30) CHECK (severity_level IN (
    'mild', 'moderate', 'severe', 'life_threatening'
  )),
  reaction_type VARCHAR(50), -- Type of allergic reaction
  
  -- System fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_allergy_cards_code ON allergy_cards(card_code);
CREATE INDEX idx_allergy_cards_patient ON allergy_cards(patient_name);
CREATE INDEX idx_allergy_cards_issued_by ON allergy_cards(issued_by_user_id);
CREATE INDEX idx_allergy_cards_hospital ON allergy_cards(hospital_name);
CREATE INDEX idx_allergy_cards_status ON allergy_cards(status);
CREATE INDEX idx_allergy_cards_date ON allergy_cards(issued_date);

CREATE INDEX idx_card_allergies_card ON card_allergies(card_id);
CREATE INDEX idx_card_allergies_allergen ON card_allergies(allergen_name);

-- Full-text search index
CREATE INDEX idx_allergy_cards_search ON allergy_cards 
USING gin(to_tsvector('english', 
  patient_name || ' ' || hospital_name || ' ' || doctor_name
));

-- Auto-generate card code sequence
CREATE SEQUENCE IF NOT EXISTS allergy_card_code_seq START 1;

-- Function to generate card code
CREATE OR REPLACE FUNCTION generate_allergy_card_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.card_code IS NULL OR NEW.card_code = '' THEN
    NEW.card_code := 'AC-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                     LPAD(NEXTVAL('allergy_card_code_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate card code
CREATE TRIGGER set_allergy_card_code 
  BEFORE INSERT ON allergy_cards 
  FOR EACH ROW EXECUTE FUNCTION generate_allergy_card_code();

-- Update timestamp triggers
CREATE TRIGGER update_allergy_cards_updated_at 
  BEFORE UPDATE ON allergy_cards 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_allergies_updated_at 
  BEFORE UPDATE ON card_allergies 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE allergy_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_allergies ENABLE ROW LEVEL SECURITY;

-- Allergy cards policies
-- Admins can see all cards
CREATE POLICY "Admins can view all allergy cards" ON allergy_cards 
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Users can see cards they issued
CREATE POLICY "Users can view own allergy cards" ON allergy_cards 
FOR ALL USING (issued_by_user_id = auth.uid());

-- Card allergies inherit access from parent card
CREATE POLICY "Card allergies follow card access" ON card_allergies 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM allergy_cards ac
    WHERE ac.id = card_allergies.card_id
    AND (
      ac.issued_by_user_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    )
  )
);

-- Functions for statistics
-- Function to get allergy card stats for a user
CREATE OR REPLACE FUNCTION get_user_allergy_card_stats(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_cards', (
      SELECT COUNT(*) FROM allergy_cards WHERE issued_by_user_id = user_id
    ),
    'cards_this_month', (
      SELECT COUNT(*) FROM allergy_cards 
      WHERE issued_by_user_id = user_id 
      AND DATE_TRUNC('month', issued_date) = DATE_TRUNC('month', NOW())
    ),
    'active_cards', (
      SELECT COUNT(*) FROM allergy_cards 
      WHERE issued_by_user_id = user_id AND status = 'active'
    ),
    'expired_cards', (
      SELECT COUNT(*) FROM allergy_cards 
      WHERE issued_by_user_id = user_id AND status = 'expired'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin allergy card stats
CREATE OR REPLACE FUNCTION get_admin_allergy_card_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_cards', (SELECT COUNT(*) FROM allergy_cards),
    'cards_this_month', (
      SELECT COUNT(*) FROM allergy_cards 
      WHERE DATE_TRUNC('month', issued_date) = DATE_TRUNC('month', NOW())
    ),
    'active_cards', (SELECT COUNT(*) FROM allergy_cards WHERE status = 'active'),
    'expired_cards', (SELECT COUNT(*) FROM allergy_cards WHERE status = 'expired'),
    'total_allergies', (SELECT COUNT(*) FROM card_allergies),
    'severe_allergies', (
      SELECT COUNT(*) FROM card_allergies 
      WHERE severity_level IN ('severe', 'life_threatening')
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for easy querying of cards with their allergies
CREATE VIEW allergy_cards_with_details AS
SELECT 
  ac.*,
  json_agg(
    json_build_object(
      'id', ca.id,
      'allergen_name', ca.allergen_name,
      'certainty_level', ca.certainty_level,
      'clinical_manifestation', ca.clinical_manifestation,
      'severity_level', ca.severity_level,
      'reaction_type', ca.reaction_type
    ) ORDER BY ca.allergen_name
  ) FILTER (WHERE ca.id IS NOT NULL) AS allergies
FROM allergy_cards ac
LEFT JOIN card_allergies ca ON ac.id = ca.card_id
GROUP BY ac.id;

-- Insert demo data
INSERT INTO allergy_cards (
  patient_name, patient_gender, patient_age, patient_id_number,
  hospital_name, department, doctor_name, doctor_phone,
  issued_by_user_id, organization,
  qr_code_data, notes
) VALUES (
  'Nguyễn Văn A', 'male', 35, '123456789012',
  'Bệnh viện Đa khoa Trung ương', 'Khoa Nội', 'BS. Trần Thị B', '0123456789',
  (SELECT id FROM users WHERE email = 'user@benhvien.gov.vn' LIMIT 1),
  'Bệnh viện Đa khoa Trung ương',
  '{"patient":"Nguyễn Văn A","allergies":[{"name":"Penicillin","level":"confirmed"}]}',
  'Bệnh nhân có tiền sử dị ứng Penicillin nghiêm trọng'
);

-- Insert corresponding allergies
INSERT INTO card_allergies (
  card_id, allergen_name, certainty_level, clinical_manifestation, severity_level, reaction_type
) VALUES (
  (SELECT id FROM allergy_cards WHERE patient_name = 'Nguyễn Văn A' LIMIT 1),
  'Penicillin', 'confirmed', 'Phát ban toàn thân, khó thở', 'severe', 'anaphylaxis'
);

COMMENT ON TABLE allergy_cards IS 'Bảng lưu trữ thông tin thẻ dị ứng được cấp cho bệnh nhân';
COMMENT ON TABLE card_allergies IS 'Bảng lưu trữ chi tiết các dị ứng của từng thẻ';
COMMENT ON COLUMN allergy_cards.qr_code_data IS 'Dữ liệu JSON chứa thông tin dị ứng được mã hóa trong QR code';
COMMENT ON COLUMN allergy_cards.card_code IS 'Mã thẻ dị ứng định dạng AC-YYYY-XXXXXX';

