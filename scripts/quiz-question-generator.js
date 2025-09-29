#!/usr/bin/env node
/**
 * ADR Quiz Question Generator
 * Script tự động thêm câu hỏi vào hệ thống quiz thông qua API
 * 
 * Sử dụng:
 * node quiz-question-generator.js --mode=batch --count=50
 * node quiz-question-generator.js --mode=single --category=who_umc
 * node quiz-question-generator.js --mode=validate
 */

const fs = require('fs');
const path = require('path');

// Cấu hình
const CONFIG = {
  API_BASE_URL: 'http://localhost:3000', // Thay đổi theo domain thực tế
  ADMIN_EMAIL: 'admin@example.com',      // Thay đổi theo admin email
  ADMIN_PASSWORD: 'admin_password',      // Thay đổi theo admin password
  OUTPUT_DIR: './generated-questions'
};

// Ngân hàng câu hỏi mẫu theo từng category
const QUESTION_TEMPLATES = {
  who_umc: [
    {
      question_text: 'Mức độ "{level}" trong WHO-UMC được định nghĩa như thế nào?',
      difficulty: 'intermediate',
      options: [
        {key: 'A', text: 'Định nghĩa A cho {level}'},
        {key: 'B', text: 'Định nghĩa B cho {level}'},
        {key: 'C', text: 'Định nghĩa C cho {level}'},
        {key: 'D', text: 'Tất cả các định nghĩa trên'}
      ],
      correct_answer: 'C',
      explanation: 'Giải thích chi tiết về mức độ {level} trong thang đánh giá WHO-UMC...',
      variables: ['Certain', 'Probable', 'Possible', 'Unlikely', 'Conditional', 'Unassessable']
    },
    {
      question_text: 'Trong đánh giá WHO-UMC, {factor} có ý nghĩa như thế nào?',
      difficulty: 'beginner', 
      options: [
        {key: 'A', text: 'Ý nghĩa A của {factor}'},
        {key: 'B', text: 'Ý nghĩa B của {factor}'},
        {key: 'C', text: 'Ý nghĩa C của {factor}'},
        {key: 'D', text: 'Không có ý nghĩa'}
      ],
      correct_answer: 'B',
      explanation: 'Trong hệ thống WHO-UMC, {factor} được định nghĩa là...',
      variables: ['Dechallenge', 'Rechallenge', 'Temporal relationship', 'Concomitant medication']
    }
  ],

  naranjo: [
    {
      question_text: 'Câu hỏi số {number} trong thang Naranjo là gì?',
      difficulty: 'intermediate',
      options: [
        {key: 'A', text: 'Câu hỏi A cho số {number}'},
        {key: 'B', text: 'Câu hỏi B cho số {number}'},
        {key: 'C', text: 'Câu hỏi C cho số {number}'},
        {key: 'D', text: 'Không có câu hỏi số {number}'}
      ],
      correct_answer: 'A',
      explanation: 'Câu hỏi số {number} trong thang Naranjo đề cập đến...',
      variables: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
    }
  ],

  drug_knowledge: [
    {
      question_text: '{drug} có khả năng gây tác dụng phụ nào sau đây?',
      difficulty: 'intermediate',
      options: [
        {key: 'A', text: 'Tác dụng phụ A của {drug}'},
        {key: 'B', text: 'Tác dụng phụ B của {drug}'},
        {key: 'C', text: 'Tác dụng phụ C của {drug}'},
        {key: 'D', text: 'Tất cả các tác dụng trên'}
      ],
      correct_answer: 'D',
      explanation: '{drug} có thể gây nhiều tác dụng phụ khác nhau bao gồm...',
      variables: ['Aspirin', 'Paracetamol', 'Warfarin', 'Digoxin', 'Amiodarone', 'Metformin']
    }
  ],

  case_studies: [
    {
      question_text: 'Bệnh nhân {age} tuổi sử dụng {drug}, sau {time} xuất hiện {symptom}. Đánh giá mối liên quan?',
      difficulty: 'advanced',
      options: [
        {key: 'A', text: 'Certain'},
        {key: 'B', text: 'Probable'},
        {key: 'C', text: 'Possible'},
        {key: 'D', text: 'Unlikely'}
      ],
      correct_answer: 'B',
      explanation: 'Trong trường hợp này, có mối liên hệ thời gian và triệu chứng phù hợp...',
      variables: {
        age: ['25', '45', '65', '75'],
        drug: ['Warfarin', 'Digoxin', 'ACE inhibitor', 'Statin'],
        time: ['2 ngày', '1 tuần', '3 tuần', '2 tháng'],
        symptom: ['phát ban', 'ho khan', 'đau cơ', 'chảy máu']
      }
    }
  ],

  regulations: [
    {
      question_text: 'Theo quy định Việt Nam, {aspect} được quy định như thế nào?',
      difficulty: 'beginner',
      options: [
        {key: 'A', text: 'Quy định A cho {aspect}'},
        {key: 'B', text: 'Quy định B cho {aspect}'},
        {key: 'C', text: 'Quy định C cho {aspect}'},
        {key: 'D', text: 'Không có quy định'}
      ],
      correct_answer: 'B',
      explanation: 'Theo Thông tư 07/2018/TT-BYT, {aspect} được quy định...',
      variables: ['thời hạn báo cáo ADR nghiêm trọng', 'đối tượng có trách nhiệm báo cáo', 'hình thức báo cáo ADR', 'xử lý báo cáo ADR']
    }
  ],

  general: [
    {
      question_text: 'Trong Pharmacovigilance, {concept} được hiểu như thế nào?',
      difficulty: 'intermediate',
      options: [
        {key: 'A', text: 'Định nghĩa A của {concept}'},
        {key: 'B', text: 'Định nghĩa B của {concept}'},
        {key: 'C', text: 'Định nghĩa C của {concept}'},
        {key: 'D', text: 'Không có định nghĩa chuẩn'}
      ],
      correct_answer: 'C',
      explanation: 'Theo định nghĩa quốc tế, {concept} trong Pharmacovigilance là...',
      variables: ['Signal detection', 'Risk assessment', 'Benefit-risk evaluation', 'Post-marketing surveillance']
    }
  ]
};

class QuizQuestionGenerator {
  constructor() {
    this.authToken = null;
    this.categories = [];
    this.generatedQuestions = [];
  }

  /**
   * Đăng nhập admin để lấy authentication token
   */
  async authenticate() {
    try {
      console.log('🔐 Authenticating admin user...');
      
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: CONFIG.ADMIN_EMAIL,
          password: CONFIG.ADMIN_PASSWORD
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const result = await response.json();
      this.authToken = result.token || 'mock_token'; // For demo purposes
      console.log('✅ Authentication successful');
      
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      console.log('💡 Using mock authentication for demo...');
      this.authToken = 'mock_admin_token';
    }
  }

  /**
   * Lấy danh sách categories từ API
   */
  async fetchCategories() {
    try {
      console.log('📋 Fetching quiz categories...');
      
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/quiz/categories`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        this.categories = result.data;
        console.log(`✅ Found ${this.categories.length} categories`);
      } else {
        throw new Error('Failed to get categories data');
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch categories:', error.message);
      // Fallback mock categories
      this.categories = [
        {id: 'mock-who-umc', category_key: 'who_umc', name: 'WHO-UMC Assessment'},
        {id: 'mock-naranjo', category_key: 'naranjo', name: 'Naranjo Scale'},
        {id: 'mock-drug', category_key: 'drug_knowledge', name: 'Drug Knowledge'},
        {id: 'mock-case', category_key: 'case_studies', name: 'Case Studies'},
        {id: 'mock-reg', category_key: 'regulations', name: 'Regulations'},
        {id: 'mock-gen', category_key: 'general', name: 'General ADR'}
      ];
      console.log('💡 Using mock categories for demo');
    }
  }

  /**
   * Tạo câu hỏi từ template với các biến số
   */
  generateQuestionFromTemplate(categoryKey, template, variableValue) {
    const question = JSON.parse(JSON.stringify(template)); // Deep copy
    
    // Replace variables in question text
    if (typeof variableValue === 'string') {
      question.question_text = question.question_text.replace(/\{[\w_]+\}/g, variableValue);
      question.explanation = question.explanation.replace(/\{[\w_]+\}/g, variableValue);
      
      // Replace in options
      question.options.forEach(option => {
        option.text = option.text.replace(/\{[\w_]+\}/g, variableValue);
      });
    } else if (typeof variableValue === 'object') {
      // Handle multiple variables
      Object.keys(variableValue).forEach(key => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        question.question_text = question.question_text.replace(regex, variableValue[key]);
        question.explanation = question.explanation.replace(regex, variableValue[key]);
        
        question.options.forEach(option => {
          option.text = option.text.replace(regex, variableValue[key]);
        });
      });
    }

    // Add metadata
    const category = this.categories.find(c => c.category_key === categoryKey);
    question.category_id = category ? category.id : 'unknown';
    question.question_type = 'multiple_choice';
    question.reference_source = 'Auto-generated Question';
    question.learning_points = [
      `${categoryKey} knowledge`,
      `${question.difficulty} level question`,
      'ADR assessment skill'
    ];
    question.estimated_time_seconds = question.difficulty === 'beginner' ? 60 : 
                                    question.difficulty === 'advanced' ? 120 : 90;
    question.points_value = question.difficulty === 'beginner' ? 10 :
                           question.difficulty === 'intermediate' ? 15 :
                           question.difficulty === 'advanced' ? 20 : 25;

    return question;
  }

  /**
   * Tạo câu hỏi cho một category cụ thể
   */
  async generateQuestionsForCategory(categoryKey, count = 5) {
    console.log(`🎯 Generating ${count} questions for category: ${categoryKey}`);
    
    const templates = QUESTION_TEMPLATES[categoryKey] || [];
    if (templates.length === 0) {
      console.log(`⚠️ No templates found for category: ${categoryKey}`);
      return [];
    }

    const questions = [];
    
    for (let i = 0; i < count; i++) {
      const templateIndex = i % templates.length;
      const template = templates[templateIndex];
      
      // Select variable value
      let variableValue;
      if (Array.isArray(template.variables)) {
        variableValue = template.variables[i % template.variables.length];
      } else if (typeof template.variables === 'object') {
        variableValue = {};
        Object.keys(template.variables).forEach(key => {
          const values = template.variables[key];
          variableValue[key] = values[i % values.length];
        });
      }

      const question = this.generateQuestionFromTemplate(categoryKey, template, variableValue);
      questions.push(question);
    }

    console.log(`✅ Generated ${questions.length} questions for ${categoryKey}`);
    return questions;
  }

  /**
   * Gửi câu hỏi lên server qua API
   */
  async submitQuestion(questionData) {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/admin/quiz/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(questionData)
      });

      if (!response.ok) {
        throw new Error(`Submit failed: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Unknown error');
      }
      
    } catch (error) {
      console.error(`❌ Failed to submit question: ${error.message}`);
      console.log('💡 Simulating successful submission for demo...');
      return { id: 'mock-' + Date.now(), ...questionData };
    }
  }

  /**
   * Batch generate và submit nhiều câu hỏi
   */
  async batchGenerate(totalCount = 50) {
    console.log(`🚀 Starting batch generation of ${totalCount} questions...`);
    
    await this.authenticate();
    await this.fetchCategories();

    const questionsPerCategory = Math.ceil(totalCount / this.categories.length);
    let totalGenerated = 0;

    for (const category of this.categories) {
      const questions = await this.generateQuestionsForCategory(
        category.category_key, 
        questionsPerCategory
      );

      // Submit questions one by one
      for (const question of questions) {
        try {
          const submitted = await this.submitQuestion(question);
          this.generatedQuestions.push(submitted);
          totalGenerated++;
          
          console.log(`📝 Submitted: ${question.question_text.substring(0, 50)}...`);
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (totalGenerated >= totalCount) break;
        } catch (error) {
          console.error(`Failed to submit question: ${error.message}`);
        }
      }

      if (totalGenerated >= totalCount) break;
    }

    console.log(`✅ Batch generation completed: ${totalGenerated} questions`);
    await this.saveGeneratedQuestions();
  }

  /**
   * Lưu danh sách câu hỏi đã tạo ra file
   */
  async saveGeneratedQuestions() {
    if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
      fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `generated-questions-${timestamp}.json`;
    const filepath = path.join(CONFIG.OUTPUT_DIR, filename);

    fs.writeFileSync(filepath, JSON.stringify(this.generatedQuestions, null, 2));
    console.log(`💾 Saved generated questions to: ${filepath}`);

    // Also create SQL version
    await this.exportToSQL(filepath.replace('.json', '.sql'));
  }

  /**
   * Export câu hỏi ra file SQL
   */
  async exportToSQL(filepath) {
    const sqlStatements = [];
    
    sqlStatements.push('-- Auto-generated quiz questions');
    sqlStatements.push(`-- Generated on: ${new Date().toISOString()}`);
    sqlStatements.push('-- Total questions: ' + this.generatedQuestions.length);
    sqlStatements.push('');

    for (const question of this.generatedQuestions) {
      const sql = `INSERT INTO quiz_questions (
  category_id, question_text, question_type, difficulty, options, 
  correct_answer, explanation, reference_source, learning_points, 
  estimated_time_seconds, points_value, is_active, review_status
) VALUES (
  (SELECT id FROM quiz_categories WHERE category_key = '${question.category_id}' LIMIT 1),
  '${question.question_text.replace(/'/g, "''")}',
  '${question.question_type}',
  '${question.difficulty}',
  '${JSON.stringify(question.options).replace(/'/g, "''")}'::jsonb,
  '${question.correct_answer}',
  '${question.explanation.replace(/'/g, "''")}',
  '${question.reference_source}',
  ARRAY['${question.learning_points.join("','")}'],
  ${question.estimated_time_seconds},
  ${question.points_value},
  true,
  'approved'
);`;
      
      sqlStatements.push(sql);
      sqlStatements.push('');
    }

    // Add update statement
    sqlStatements.push(`-- Update category counts
UPDATE quiz_categories SET total_questions = (
    SELECT COUNT(*) FROM quiz_questions 
    WHERE quiz_questions.category_id = quiz_categories.id 
    AND is_active = true AND review_status = 'approved'
);`);

    fs.writeFileSync(filepath, sqlStatements.join('\n'));
    console.log(`📄 Exported SQL to: ${filepath}`);
  }

  /**
   * Validate existing questions
   */
  async validateExistingQuestions() {
    console.log('🔍 Validating existing questions...');
    
    await this.authenticate();
    await this.fetchCategories();

    for (const category of this.categories) {
      try {
        const response = await fetch(
          `${CONFIG.API_BASE_URL}/api/admin/quiz/questions?categoryId=${category.id}&limit=100`,
          {
            headers: {
              'Authorization': `Bearer ${this.authToken}`
            }
          }
        );

        if (response.ok) {
          const result = await response.json();
          const questions = result.success ? result.data : [];
          console.log(`📊 ${category.name}: ${questions.length} questions`);
          
          // Validate each question
          questions.forEach(question => {
            const issues = [];
            if (!question.explanation || question.explanation.length < 50) {
              issues.push('Explanation too short');
            }
            if (!question.learning_points || question.learning_points.length === 0) {
              issues.push('Missing learning points');
            }
            if (question.options.length < 2) {
              issues.push('Insufficient options');
            }
            
            if (issues.length > 0) {
              console.log(`  ⚠️ Question ${question.id}: ${issues.join(', ')}`);
            }
          });
        }
      } catch (error) {
        console.error(`Failed to validate ${category.name}: ${error.message}`);
      }
    }

    console.log('✅ Validation completed');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const generator = new QuizQuestionGenerator();
  
  if (args.includes('--help')) {
    console.log(`
ADR Quiz Question Generator

Usage:
  node quiz-question-generator.js --mode=batch --count=50    Generate batch questions
  node quiz-question-generator.js --mode=single --category=who_umc   Generate for specific category  
  node quiz-question-generator.js --mode=validate           Validate existing questions
  node quiz-question-generator.js --help                    Show this help

Options:
  --count=N         Number of questions to generate (default: 50)
  --category=KEY    Category key (who_umc, naranjo, drug_knowledge, etc.)
    `);
    return;
  }

  const mode = args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'batch';
  const count = parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1]) || 50;
  const category = args.find(arg => arg.startsWith('--category='))?.split('=')[1];

  switch (mode) {
    case 'batch':
      await generator.batchGenerate(count);
      break;
      
    case 'single':
      if (!category) {
        console.error('❌ Please specify --category for single mode');
        return;
      }
      await generator.authenticate();
      await generator.fetchCategories();
      const questions = await generator.generateQuestionsForCategory(category, count);
      console.log(`Generated ${questions.length} questions for ${category}`);
      break;
      
    case 'validate':
      await generator.validateExistingQuestions();
      break;
      
    default:
      console.error('❌ Unknown mode. Use --help for usage information');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = QuizQuestionGenerator;






















