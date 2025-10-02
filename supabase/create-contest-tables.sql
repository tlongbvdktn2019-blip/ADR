-- =====================================================
-- MODULE: CUỘC THI KIẾN THỨC ADR (ADR KNOWLEDGE CONTEST)
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
  rules TEXT, -- Thể lệ cuộc thi
  prizes TEXT, -- Cơ cấu giải thưởng
  logo_url TEXT,
  
  -- Cấu hình cuộc thi
  number_of_questions INTEGER DEFAULT 10,
  time_per_question INTEGER DEFAULT 20, -- giây
  passing_score INTEGER DEFAULT 5, -- Điểm đạt (nếu có)
  
  -- Thời gian diễn ra
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  
  -- Trạng thái
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, ended, archived
  is_public BOOLEAN DEFAULT true,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Bảng Người tham gia cuộc thi (không cần tài khoản)
CREATE TABLE IF NOT EXISTS contest_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
  
  -- Thông tin người tham gia
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  department_id UUID REFERENCES departments(id),
  unit_id UUID REFERENCES units(id),
  
  -- Metadata
  ip_address VARCHAR(50), -- Lưu IP để phát hiện gian lận
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Bảng Bài thi đã nộp
CREATE TABLE IF NOT EXISTS contest_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES contest_participants(id) ON DELETE CASCADE,
  
  -- Kết quả
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  
  -- Thời gian
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  time_taken INTEGER, -- Tổng thời gian làm bài (giây)
  
  -- Dữ liệu chi tiết
  questions JSONB NOT NULL, -- Lưu danh sách câu hỏi được chọn
  answers JSONB NOT NULL, -- Lưu câu trả lời của người dùng
  
  -- Trạng thái
  status VARCHAR(50) DEFAULT 'completed', -- in_progress, completed, abandoned
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Bảng Câu trả lời từng câu (để phân tích chi tiết)
CREATE TABLE IF NOT EXISTS contest_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES contest_submissions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id),
  
  -- Câu trả lời
  selected_answer VARCHAR(10), -- A, B, C, D
  correct_answer VARCHAR(10),
  is_correct BOOLEAN,
  
  -- Thời gian
  time_spent INTEGER, -- Thời gian trả lời câu này (giây)
  answered_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tạo indexes để tối ưu hóa truy vấn
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

-- 8. Tạo view cho Leaderboard
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

-- 9. Function để cập nhật updated_at
CREATE OR REPLACE FUNCTION update_contest_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Tạo triggers
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

-- 11. RLS Policies (Row Level Security)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_answers ENABLE ROW LEVEL SECURITY;

-- Public read cho departments và units
CREATE POLICY "Public can read active departments" ON departments
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read active units" ON units
  FOR SELECT USING (is_active = true);

-- Public read cho active contests
CREATE POLICY "Public can read active contests" ON contests
  FOR SELECT USING (status = 'active' AND is_public = true);

-- Public insert cho participants và submissions (không cần đăng nhập)
CREATE POLICY "Anyone can register as participant" ON contest_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read own participant info" ON contest_participants
  FOR SELECT USING (true);

CREATE POLICY "Anyone can submit contest answers" ON contest_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read contest submissions for leaderboard" ON contest_submissions
  FOR SELECT USING (status = 'completed');

CREATE POLICY "Anyone can insert answers" ON contest_answers
  FOR INSERT WITH CHECK (true);

-- Admin policies (cần đăng nhập với role admin)
CREATE POLICY "Admin can manage departments" ON departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admin can manage units" ON units
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admin can manage contests" ON contests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 12. Insert sample data
INSERT INTO departments (name, code, description) VALUES
('Bệnh viện Đa khoa Trung ương', 'BVDKTW', 'Bệnh viện Đa khoa Trung ương'),
('Bệnh viện Nhi Trung ương', 'BVNTW', 'Bệnh viện Nhi Trung ương'),
('Bệnh viện Bạch Mai', 'BVBM', 'Bệnh viện Bạch Mai'),
('Bệnh viện Việt Đức', 'BVVD', 'Bệnh viện Việt Đức'),
('Bệnh viện 108', 'BV108', 'Bệnh viện Trung ương Quân đội 108')
ON CONFLICT (name) DO NOTHING;

-- Insert sample units
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

-- =====================================================
-- KẾT THÚC MIGRATION
-- =====================================================

COMMENT ON TABLE departments IS 'Bảng lưu thông tin đơn vị (bệnh viện, trường học...)';
COMMENT ON TABLE units IS 'Bảng lưu thông tin khoa/phòng thuộc đơn vị';
COMMENT ON TABLE contests IS 'Bảng lưu thông tin cuộc thi';
COMMENT ON TABLE contest_participants IS 'Bảng lưu thông tin người tham gia (không cần đăng nhập)';
COMMENT ON TABLE contest_submissions IS 'Bảng lưu bài thi đã nộp';
COMMENT ON TABLE contest_answers IS 'Bảng lưu câu trả lời chi tiết từng câu';



