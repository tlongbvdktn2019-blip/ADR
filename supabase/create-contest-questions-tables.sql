-- =====================================================
-- NGÂN HÀNG CÂU HỎI CUỘC THI ADR (CONTEST QUESTIONS BANK)
-- Riêng biệt với Quiz Training Questions
-- Cấu trúc đơn giản: Chỉ câu hỏi trắc nghiệm 4 đáp án A, B, C, D
-- KHÔNG phân danh mục, KHÔNG phân độ khó
-- =====================================================

-- Bảng Câu hỏi Cuộc thi (Đơn giản hóa)
CREATE TABLE IF NOT EXISTS contest_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Nội dung câu hỏi
  question_text TEXT NOT NULL,
  
  -- Đáp án (JSON format) - Luôn có 4 đáp án A, B, C, D
  options JSONB NOT NULL, -- [{"key": "A", "text": "..."}, {"key": "B", "text": "..."}, {"key": "C", "text": "..."}, {"key": "D", "text": "..."}]
  correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')), -- Chỉ A, B, C, hoặc D
  
  -- Giải thích (tùy chọn)
  explanation TEXT,
  
  -- Cấu hình
  points_value INTEGER DEFAULT 10,
  
  -- Thống kê sử dụng
  times_used INTEGER DEFAULT 0, -- Số lần câu hỏi được dùng trong cuộc thi
  times_answered INTEGER DEFAULT 0, -- Số lần được trả lời
  times_correct INTEGER DEFAULT 0, -- Số lần trả lời đúng
  
  -- Quản lý
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contest_questions_active ON contest_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_contest_questions_created ON contest_questions(created_at DESC);

-- Triggers
CREATE OR REPLACE FUNCTION update_contest_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists before creating
DROP TRIGGER IF EXISTS trigger_contest_questions_updated_at ON contest_questions;

CREATE TRIGGER trigger_contest_questions_updated_at
  BEFORE UPDATE ON contest_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_contest_updated_at();

-- RLS Policies
ALTER TABLE contest_questions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can read active contest questions" ON contest_questions;
DROP POLICY IF EXISTS "Admin can manage contest questions" ON contest_questions;

-- Public can read active questions
CREATE POLICY "Public can read active contest questions" 
  ON contest_questions FOR SELECT 
  USING (is_active = true);

-- Admin can manage questions
CREATE POLICY "Admin can manage contest questions" 
  ON contest_questions FOR ALL 
  USING (is_admin()) 
  WITH CHECK (is_admin());

-- Comments
COMMENT ON TABLE contest_questions IS 'Ngân hàng câu hỏi đơn giản cho cuộc thi ADR - Chỉ câu hỏi trắc nghiệm 4 đáp án, không phân danh mục, không phân độ khó';
COMMENT ON COLUMN contest_questions.options IS 'Luôn có 4 đáp án A, B, C, D dạng JSON';
COMMENT ON COLUMN contest_questions.correct_answer IS 'Đáp án đúng: A, B, C, hoặc D';
COMMENT ON COLUMN contest_questions.times_used IS 'Số lần câu hỏi được chọn vào cuộc thi';
COMMENT ON COLUMN contest_questions.times_answered IS 'Số lần người dùng trả lời câu hỏi này trong cuộc thi';
COMMENT ON COLUMN contest_questions.times_correct IS 'Số lần trả lời đúng';

-- Verify
SELECT 
  'Contest Questions Table Created Successfully!' as status,
  (SELECT COUNT(*) FROM contest_questions) as questions_count;

