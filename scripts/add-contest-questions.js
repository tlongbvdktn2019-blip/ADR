/**
 * Script: Thêm câu hỏi mẫu vào bảng contest_questions
 * 
 * Chạy: node scripts/add-contest-questions.js
 * 
 * Lưu ý: Cần set biến môi trường trước:
 * Windows: set NEXT_PUBLIC_SUPABASE_URL=... && set SUPABASE_SERVICE_ROLE_KEY=... && node scripts/add-contest-questions.js
 * Linux/Mac: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/add-contest-questions.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sampleQuestions = [
  {
    question_text: "ADR là viết tắt của từ gì?",
    options: [
      { key: "A", text: "Adverse Drug Reaction" },
      { key: "B", text: "Advanced Drug Research" },
      { key: "C", text: "Automatic Drug Response" },
      { key: "D", text: "Applied Drug Regulation" }
    ],
    correct_answer: "A",
    category: "Khái niệm cơ bản",
    difficulty: "easy",
    points_value: 10,
    is_active: true
  },
  {
    question_text: "Theo WHO, ADR được định nghĩa là gì?",
    options: [
      { key: "A", text: "Phản ứng có hại và không mong muốn xảy ra với liều thông thường" },
      { key: "B", text: "Tác dụng phụ nhẹ của thuốc" },
      { key: "C", text: "Tương tác thuốc với thức ăn" },
      { key: "D", text: "Phản ứng dị ứng với thuốc" }
    ],
    correct_answer: "A",
    category: "Khái niệm cơ bản",
    difficulty: "medium",
    points_value: 10,
    is_active: true
  },
  {
    question_text: "Yếu tố nào KHÔNG ảnh hưởng đến nguy cơ ADR?",
    options: [
      { key: "A", text: "Tuổi cao" },
      { key: "B", text: "Bệnh lý gan thận" },
      { key: "C", text: "Màu sắc viên thuốc" },
      { key: "D", text: "Đa dược" }
    ],
    correct_answer: "C",
    category: "Yếu tố nguy cơ",
    difficulty: "medium",
    points_value: 10,
    is_active: true
  },
  {
    question_text: "ADR loại A (Augmented) có đặc điểm gì?",
    options: [
      { key: "A", text: "Liên quan đến tác dụng dược lý, có thể dự đoán" },
      { key: "B", text: "Không liên quan tác dụng dược lý, khó dự đoán" },
      { key: "C", text: "Xảy ra sau thời gian dài sử dụng" },
      { key: "D", text: "Chỉ xảy ra ở trẻ em" }
    ],
    correct_answer: "A",
    category: "Phân loại ADR",
    difficulty: "hard",
    points_value: 15,
    is_active: true
  },
  {
    question_text: "Thang điểm Naranjo được dùng để làm gì?",
    options: [
      { key: "A", text: "Đánh giá mức độ nghiêm trọng của ADR" },
      { key: "B", text: "Đánh giá mối liên quan nhân quả giữa thuốc và ADR" },
      { key: "C", text: "Đánh giá hiệu quả điều trị" },
      { key: "D", text: "Đánh giá chất lượng thuốc" }
    ],
    correct_answer: "B",
    category: "Đánh giá ADR",
    difficulty: "medium",
    points_value: 10,
    is_active: true
  },
  {
    question_text: "Khi phát hiện ADR nghiêm trọng, dược sĩ cần làm gì?",
    options: [
      { key: "A", text: "Báo cáo ngay cho bác sĩ và cơ quan quản lý" },
      { key: "B", text: "Tự ý ngừng thuốc" },
      { key: "C", text: "Không cần báo cáo nếu đã biết" },
      { key: "D", text: "Chỉ ghi vào sổ theo dõi" }
    ],
    correct_answer: "A",
    category: "Xử trí ADR",
    difficulty: "easy",
    points_value: 10,
    is_active: true
  },
  {
    question_text: "ADR loại B (Bizarre) có đặc điểm nào sau đây?",
    options: [
      { key: "A", text: "Phụ thuộc liều" },
      { key: "B", text: "Không phụ thuộc liều, khó dự đoán" },
      { key: "C", text: "Thường xảy ra" },
      { key: "D", text: "Luôn nhẹ" }
    ],
    correct_answer: "B",
    category: "Phân loại ADR",
    difficulty: "hard",
    points_value: 15,
    is_active: true
  },
  {
    question_text: "Phản ứng phản vệ (anaphylaxis) thuộc ADR loại nào?",
    options: [
      { key: "A", text: "Loại A" },
      { key: "B", text: "Loại B" },
      { key: "C", text: "Loại C" },
      { key: "D", text: "Loại D" }
    ],
    correct_answer: "B",
    category: "Phân loại ADR",
    difficulty: "medium",
    points_value: 10,
    is_active: true
  },
  {
    question_text: "Tài liệu nào cung cấp thông tin đầy đủ về ADR của thuốc?",
    options: [
      { key: "A", text: "Hướng dẫn sử dụng thuốc (HDSD)" },
      { key: "B", text: "Quảng cáo thuốc" },
      { key: "C", text: "Lời khuyên người bán thuốc" },
      { key: "D", text: "Internet không rõ nguồn" }
    ],
    correct_answer: "A",
    category: "Nguồn thông tin",
    difficulty: "easy",
    points_value: 10,
    is_active: true
  },
  {
    question_text: "Hệ thống báo cáo ADR tại Việt Nam được quản lý bởi cơ quan nào?",
    options: [
      { key: "A", text: "Cục Quản lý Dược - Bộ Y tế" },
      { key: "B", text: "Bộ Công an" },
      { key: "C", text: "Bộ Tài chính" },
      { key: "D", text: "Sở Y tế địa phương" }
    ],
    correct_answer: "A",
    category: "Hệ thống báo cáo",
    difficulty: "medium",
    points_value: 10,
    is_active: true
  },
  {
    question_text: "Người cao tuổi có nguy cơ ADR cao hơn do nguyên nhân nào?",
    options: [
      { key: "A", text: "Chức năng gan thận giảm" },
      { key: "B", text: "Đa bệnh, đa dược" },
      { key: "C", text: "Thay đổi dược động học" },
      { key: "D", text: "Tất cả các yếu tố trên" }
    ],
    correct_answer: "D",
    category: "Yếu tố nguy cơ",
    difficulty: "easy",
    points_value: 10,
    is_active: true
  },
  {
    question_text: "Biểu hiện nào sau đây là ADR nghiêm trọng?",
    options: [
      { key: "A", text: "Buồn ngủ nhẹ" },
      { key: "B", text: "Hội chứng Stevens-Johnson" },
      { key: "C", text: "Khô miệng" },
      { key: "D", text: "Đau đầu nhẹ" }
    ],
    correct_answer: "B",
    category: "ADR nghiêm trọng",
    difficulty: "medium",
    points_value: 10,
    is_active: true
  },
  {
    question_text: "Khi tư vấn cho bệnh nhân về ADR, dược sĩ NÊN?",
    options: [
      { key: "A", text: "Cảnh báo về ADR thường gặp và cách xử trí" },
      { key: "B", text: "Không nói để tránh lo lắng" },
      { key: "C", text: "Chỉ nói về tác dụng tốt" },
      { key: "D", text: "Đợi bệnh nhân hỏi mới trả lời" }
    ],
    correct_answer: "A",
    category: "Tư vấn bệnh nhân",
    difficulty: "easy",
    points_value: 10,
    is_active: true
  },
  {
    question_text: "ADR loại C (Chronic) liên quan đến?",
    options: [
      { key: "A", text: "Sử dụng thuốc trong thời gian ngắn" },
      { key: "B", text: "Sử dụng thuốc kéo dài" },
      { key: "C", text: "Liều đầu tiên" },
      { key: "D", text: "Ngừng thuốc đột ngột" }
    ],
    correct_answer: "B",
    category: "Phân loại ADR",
    difficulty: "hard",
    points_value: 15,
    is_active: true
  },
  {
    question_text: "Mục đích của hệ thống cảnh giới dược là gì?",
    options: [
      { key: "A", text: "Phát hiện, đánh giá và phòng ngừa ADR" },
      { key: "B", text: "Bán thêm thuốc" },
      { key: "C", text: "Kiểm tra chất lượng thuốc" },
      { key: "D", text: "Quản lý giá thuốc" }
    ],
    correct_answer: "A",
    category: "Cảnh giới dược",
    difficulty: "easy",
    points_value: 10,
    is_active: true
  }
];

async function addQuestions() {
  console.log('🚀 Bắt đầu thêm câu hỏi vào contest_questions...\n');

  // Kiểm tra số câu hỏi hiện có
  const { data: existing, error: checkError } = await supabase
    .from('contest_questions')
    .select('id', { count: 'exact' });

  if (checkError) {
    console.error('❌ Lỗi khi kiểm tra câu hỏi:', checkError.message);
    process.exit(1);
  }

  console.log(`📊 Hiện có ${existing?.length || 0} câu hỏi trong contest_questions`);

  // Thêm câu hỏi mới
  const { data, error } = await supabase
    .from('contest_questions')
    .insert(sampleQuestions)
    .select();

  if (error) {
    console.error('❌ Lỗi khi thêm câu hỏi:', error.message);
    process.exit(1);
  }

  console.log(`\n✅ Đã thêm thành công ${data.length} câu hỏi!`);
  console.log(`📊 Tổng cộng hiện có: ${(existing?.length || 0) + data.length} câu hỏi\n`);

  // Hiển thị danh sách câu hỏi đã thêm
  console.log('📝 Danh sách câu hỏi đã thêm:');
  data.forEach((q, index) => {
    console.log(`   ${index + 1}. [${q.difficulty}] ${q.question_text}`);
  });

  console.log('\n🎉 Hoàn tất! Giờ bạn có thể test cuộc thi.');
}

addQuestions();

