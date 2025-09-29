// Ví dụ sử dụng Admin API để thêm câu hỏi quiz
// Cần đăng nhập với quyền admin trước khi sử dụng

// === 1. THÊM MULTIPLE CHOICE QUESTION ===
async function addMultipleChoiceQuestion() {
  const questionData = {
    category_id: "your-category-id-here", // Lấy từ GET /api/quiz/categories
    question_text: "Theo WHO-UMC, yếu tố nào quan trọng nhất trong việc đánh giá mối liên quan 'Certain'?",
    question_type: "multiple_choice",
    difficulty: "intermediate",
    options: [
      {"key": "A", "text": "Mối liên hệ thời gian"},
      {"key": "B", "text": "Rechallenge positive"}, 
      {"key": "C", "text": "Dechallenge positive"},
      {"key": "D", "text": "Tất cả các yếu tố trên"}
    ],
    correct_answer: "D",
    explanation: "Để đạt mức 'Certain' trong WHO-UMC, cần có TẤT CẢ các yếu tố: mối liên hệ thời gian hợp lý, dechallenge positive (cải thiện khi ngừng thuốc), rechallenge positive (tái xuất hiện khi dùng lại), phản ứng đã được biết đến, và không có nguyên nhân khác.",
    reference_source: "WHO-UMC Causality Assessment Guidelines",
    learning_points: [
      "Certain yêu cầu đầy đủ 5 tiêu chuẩn",
      "Rechallenge positive là yêu cầu bắt buộc", 
      "Mức độ chắc chắn cao nhất trong WHO-UMC"
    ],
    estimated_time_seconds: 90,
    points_value: 15
  };

  try {
    const response = await fetch('/api/admin/quiz/questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questionData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Question added successfully:', result.data);
      return result.data;
    } else {
      console.error('❌ Failed to add question:', result.error);
    }
  } catch (error) {
    console.error('❌ API Error:', error);
  }
}

// === 2. THÊM TRUE/FALSE QUESTION ===
async function addTrueFalseQuestion() {
  const questionData = {
    category_id: "naranjo-category-id-here",
    question_text: "Thang điểm Naranjo có thể cho điểm âm (-1) cho một số câu trả lời.",
    question_type: "true_false", 
    difficulty: "beginner",
    options: [
      {"key": "true", "text": "Đúng"},
      {"key": "false", "text": "Sai"}
    ],
    correct_answer: "true",
    explanation: "Đúng. Trong thang Naranjo, một số câu hỏi có thể cho điểm âm (-1) khi câu trả lời loại trừ khả năng ADR. Ví dụ: 'Phản ứng có xuất hiện trước khi dùng thuốc?' - nếu trả lời 'Có' sẽ được -1 điểm.",
    reference_source: "Naranjo Algorithm Original Paper 1981",
    learning_points: [
      "Naranjo có điểm từ -4 đến +13",
      "Điểm âm loại trừ khả năng ADR",
      "Câu hỏi về timeline rất quan trọng"
    ],
    estimated_time_seconds: 45,
    points_value: 10
  };

  try {
    const response = await fetch('/api/admin/quiz/questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questionData)
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API Error:', error);
  }
}

// === 3. THÊM CASE SCENARIO QUESTION ===
async function addCaseScenarioQuestion() {
  const questionData = {
    category_id: "case-studies-category-id-here",
    question_text: `
CASE STUDY: Bệnh nhân nam 55 tuổi, tiền sử tăng huyết áp. 
Được kê Lisinopril 10mg/ngày. Sau 2 tuần, bệnh nhân xuất hiện ho khan kéo dài, đặc biệt về đêm.
Không sốt, không đờm, X-quang phổi bình thường. 
Ngừng Lisinopril và chuyển sang Losartan, ho khỏi sau 3 ngày.

Theo thang điểm Naranjo, trường hợp này được đánh giá như thế nào?`,
    question_type: "case_scenario",
    difficulty: "advanced",
    options: [
      {"key": "A", "text": "Definite (9-13 điểm) - Chắc chắn là ADR"},
      {"key": "B", "text": "Probable (5-8 điểm) - Có khả năng là ADR"},
      {"key": "C", "text": "Possible (1-4 điểm) - Có thể là ADR"}, 
      {"key": "D", "text": "Doubtful (≤0 điểm) - Nghi ngờ là ADR"}
    ],
    correct_answer: "B",
    explanation: `
Tính điểm Naranjo cho trường hợp này:
1. Phản ứng xuất hiện sau khi dùng thuốc? (+2)
2. Cải thiện khi ngừng thuốc? (+1) 
3. Ho khan là ADR đã biết của ACE-I? (+2)
4. Không có nguyên nhân khác rõ ràng? (+1)
5. Không có rechallenge (0)
6. Không có placebo test (0)
7. Không có nồng độ thuốc trong máu (0)

Tổng: 6 điểm = PROBABLE (5-8 điểm)
    `,
    reference_source: "ACE Inhibitor Induced Cough - Clinical Studies",
    learning_points: [
      "ACE-I gây ho khan ở 10-15% bệnh nhân",
      "Ho thường xuất hiện sau 1-4 tuần dùng thuốc",
      "Chuyển sang ARB (Losartan) là giải pháp tốt",
      "Naranjo Score giúp định lượng mức độ liên quan"
    ],
    estimated_time_seconds: 180,
    points_value: 25
  };

  try {
    const response = await fetch('/api/admin/quiz/questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questionData)
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API Error:', error);
  }
}

// === 4. LẤY DANH SÁCH CATEGORIES TRƯỚC KHI THÊM QUESTION ===
async function getQuizCategories() {
  try {
    const response = await fetch('/api/quiz/categories');
    const result = await response.json();
    
    if (result.success) {
      console.log('📋 Available Categories:');
      result.data.forEach(category => {
        console.log(`- ${category.name} (${category.category_key}): ${category.id}`);
      });
      return result.data;
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
}

// === 5. BATCH ADD MULTIPLE QUESTIONS ===
async function batchAddQuestions() {
  console.log('🚀 Starting batch add questions...');
  
  // Lấy categories trước
  const categories = await getQuizCategories();
  if (!categories || categories.length === 0) {
    console.error('❌ No categories found');
    return;
  }

  // Tạo map category_key -> id
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.category_key] = cat.id;
  });

  // Danh sách câu hỏi cần thêm
  const questionsToAdd = [
    // WHO-UMC Questions
    {
      category_key: 'who_umc',
      question_text: 'Mức độ "Unclassified" khác với "Unclassifiable" như thế nào?',
      question_type: 'multiple_choice',
      difficulty: 'intermediate',
      options: [
        {"key": "A", "text": "Unclassified = chưa đánh giá, Unclassifiable = không đủ thông tin"},
        {"key": "B", "text": "Không có sự khác biệt"},  
        {"key": "C", "text": "Unclassified = không phải ADR, Unclassifiable = có thể là ADR"},
        {"key": "D", "text": "Chỉ khác về thuật ngữ"}
      ],
      correct_answer: 'A',
      explanation: 'Unclassified có nghĩa là báo cáo chưa được đánh giá. Unclassifiable có nghĩa là đã đánh giá nhưng không đủ thông tin để kết luận mối liên quan.',
      points_value: 15
    },
    
    // Drug Knowledge Question  
    {
      category_key: 'drug_knowledge',
      question_text: 'Stevens-Johnson Syndrome (SJS) có liên quan mạnh nhất với thuốc nào?',
      question_type: 'multiple_choice', 
      difficulty: 'advanced',
      options: [
        {"key": "A", "text": "Allopurinol"},
        {"key": "B", "text": "Carbamazepine"},
        {"key": "C", "text": "Lamotrigine"}, 
        {"key": "D", "text": "Tất cả các thuốc trên"}
      ],
      correct_answer: 'D',
      explanation: 'Cả Allopurinol, Carbamazepine, và Lamotrigine đều là những thuốc có nguy cơ cao gây SJS/TEN. Cần screening HLA-B*5801 trước khi dùng Allopurinol ở người châu Á.',
      points_value: 20
    }
  ];

  // Thêm từng câu hỏi
  for (const q of questionsToAdd) {
    const questionData = {
      category_id: categoryMap[q.category_key],
      question_text: q.question_text,
      question_type: q.question_type,
      difficulty: q.difficulty,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      reference_source: 'Clinical Guidelines and Literature',
      learning_points: [`${q.question_type} question`, `${q.difficulty} level`, 'Important for ADR assessment'],
      estimated_time_seconds: q.difficulty === 'beginner' ? 60 : q.difficulty === 'advanced' ? 120 : 90,
      points_value: q.points_value
    };

    try {
      const response = await fetch('/api/admin/quiz/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData)
      });

      const result = await response.json();
      if (result.success) {
        console.log(`✅ Added: ${q.question_text.substring(0, 50)}...`);
      } else {
        console.log(`❌ Failed: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }

    // Delay để tránh spam API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('✅ Batch add completed!');
}

// === USAGE EXAMPLES ===
// Uncomment để sử dụng:

// getQuizCategories();
// addMultipleChoiceQuestion();
// addTrueFalseQuestion(); 
// addCaseScenarioQuestion();
// batchAddQuestions();






















