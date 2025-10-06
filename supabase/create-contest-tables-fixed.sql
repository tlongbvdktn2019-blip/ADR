-- =====================================================
-- MODULE: CUỘC THI KIẾN THỨC ADR (ADR KNOWLEDGE CONTEST)
-- VERSION: 1.0.1 - FIXED RLS POLICIES
-- Tạo bảng cho hệ thống cuộc thi không cần đăng nhập
-- =====================================================

-- 1. Bảng Đơn vị (Organizations/Units)
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Bảng Khoa/Phòng (Wards/Sections)
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(department_id, name)
);

-- 3. Bảng Cuộc thi
CREATE TABLE IF NOT EXISTS contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  rules TEXT,
  prizes TEXT,
  logo_url TEXT,
  
  number_of_questions INTEGER DEFAULT 10,
  time_per_question INTEGER DEFAULT 20,
  passing_score INTEGER DEFAULT 5,
  
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  
  status VARCHAR(50) DEFAULT 'draft',
  is_public BOOLEAN DEFAULT true,
  
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Bảng Người tham gia
CREATE TABLE IF NOT EXISTS contest_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
  
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  department_id UUID REFERENCES departments(id),
  unit_id UUID REFERENCES units(id),
  
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Bảng Bài thi đã nộp
CREATE TABLE IF NOT EXISTS contest_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES contest_participants(id) ON DELETE CASCADE,
  
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  time_taken INTEGER,
  
  questions JSONB NOT NULL,
  answers JSONB NOT NULL,
  
  status VARCHAR(50) DEFAULT 'completed',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Bảng Câu trả lời từng câu
CREATE TABLE IF NOT EXISTS contest_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES contest_submissions(id) ON DELETE CASCADE,
  question_id UUID,
  
  selected_answer VARCHAR(10),
  correct_answer VARCHAR(10),
  is_correct BOOLEAN,
  
  time_spent INTEGER,
  answered_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);
CREATE INDEX IF NOT EXISTS idx_units_department ON units(department_id);
CREATE INDEX IF NOT EXISTS idx_units_active ON units(is_active);
CREATE INDEX IF NOT EXISTS idx_contests_status ON contests(status);
CREATE INDEX IF NOT EXISTS idx_contests_dates ON contests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_participants_contest ON contest_participants(contest_id);
CREATE INDEX IF NOT EXISTS idx_participants_department ON contest_participants(department_id);
CREATE INDEX IF NOT EXISTS idx_participants_unit ON contest_participants(unit_id);
CREATE INDEX IF NOT EXISTS idx_submissions_contest ON contest_submissions(contest_id);
CREATE INDEX IF NOT EXISTS idx_submissions_participant ON contest_submissions(participant_id);
CREATE INDEX IF NOT EXISTS idx_submissions_score ON contest_submissions(score DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_time ON contest_submissions(time_taken ASC);
CREATE INDEX IF NOT EXISTS idx_answers_submission ON contest_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON contest_answers(question_id);

-- View Leaderboard
CREATE OR REPLACE VIEW contest_leaderboard AS
SELECT 
  cs.id,
  cs.contest_id,
  cp.full_name,
  cp.email,
  d.name as department_name,
  u.name as unit_name,
  cs.score,
  cs.total_questions,
  cs.correct_answers,
  cs.time_taken,
  cs.submitted_at,
  ROW_NUMBER() OVER (PARTITION BY cs.contest_id ORDER BY cs.score DESC, cs.time_taken ASC) as rank
FROM contest_submissions cs
JOIN contest_participants cp ON cs.participant_id = cp.id
LEFT JOIN departments d ON cp.department_id = d.id
LEFT JOIN units u ON cp.unit_id = u.id
WHERE cs.status = 'completed'
ORDER BY cs.contest_id, rank;

-- Triggers
CREATE OR REPLACE FUNCTION update_contest_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_contest_updated_at();

CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW
  EXECUTE FUNCTION update_contest_updated_at();

CREATE TRIGGER update_contests_updated_at
  BEFORE UPDATE ON contests
  FOR EACH ROW
  EXECUTE FUNCTION update_contest_updated_at();

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON contest_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_contest_updated_at();

-- =====================================================
-- RLS POLICIES - FIXED VERSION
-- =====================================================

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_answers ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid()
    AND role = 'admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;

-- Departments policies
CREATE POLICY "Public can read active departments" ON departments
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Admin can manage departments" ON departments
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Units policies
CREATE POLICY "Public can read active units" ON units
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Admin can manage units" ON units
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Contests policies
CREATE POLICY "Public can read active contests" ON contests
  FOR SELECT USING ((status = 'active' AND is_public = true) OR is_admin());

CREATE POLICY "Admin can manage contests" ON contests
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Participants policies
CREATE POLICY "Anyone can register as participant" ON contest_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read participants" ON contest_participants
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage participants" ON contest_participants
  FOR ALL USING (is_admin());

-- Submissions policies
CREATE POLICY "Anyone can submit" ON contest_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read completed submissions" ON contest_submissions
  FOR SELECT USING (status = 'completed' OR is_admin());

CREATE POLICY "Admin can manage submissions" ON contest_submissions
  FOR ALL USING (is_admin());

-- Answers policies
CREATE POLICY "Anyone can insert answers" ON contest_answers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read answers" ON contest_answers
  FOR SELECT USING (true);

-- =====================================================
-- SAMPLE DATA
-- =====================================================

INSERT INTO departments (name, code, description) VALUES
('Bệnh viện Đa khoa Trung ương', 'BVDKTW', 'Bệnh viện Đa khoa Trung ương'),
('Bệnh viện Nhi Trung ương', 'BVNTW', 'Bệnh viện Nhi Trung ương'),
('Bệnh viện Bạch Mai', 'BVBM', 'Bệnh viện Bạch Mai'),
('Bệnh viện Việt Đức', 'BVVD', 'Bệnh viện Việt Đức'),
('Bệnh viện 108', 'BV108', 'Bệnh viện Trung ương Quân đội 108')
ON CONFLICT (name) DO NOTHING;

INSERT INTO units (department_id, name, code) 
SELECT 
  d.id,
  u.name,
  u.code
FROM departments d
CROSS JOIN (VALUES
  ('Khoa Dược', 'DUOC'),
  ('Khoa Nội', 'NOI'),
  ('Khoa Ngoại', 'NGOAI'),
  ('Khoa Sản', 'SAN'),
  ('Khoa Nhi', 'NHI'),
  ('Khoa Cấp cứu', 'CC'),
  ('Khoa Hồi sức tích cực', 'HSCC')
) u(name, code)
ON CONFLICT (department_id, name) DO NOTHING;

-- Comments
COMMENT ON TABLE departments IS 'Bảng lưu thông tin đơn vị (bệnh viện, trường học...)';
COMMENT ON TABLE units IS 'Bảng lưu thông tin khoa/phòng thuộc đơn vị';
COMMENT ON TABLE contests IS 'Bảng lưu thông tin cuộc thi';
COMMENT ON TABLE contest_participants IS 'Bảng lưu thông tin người tham gia (không cần đăng nhập)';
COMMENT ON TABLE contest_submissions IS 'Bảng lưu bài thi đã nộp';
COMMENT ON TABLE contest_answers IS 'Bảng lưu câu trả lời chi tiết từng câu';
COMMENT ON FUNCTION is_admin() IS 'Check if current user is admin from users table';

-- Done!
SELECT 'Contest tables created successfully with FIXED RLS policies!' as status;































