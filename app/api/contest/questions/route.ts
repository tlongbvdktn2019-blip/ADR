import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// POST: Lấy câu hỏi ngẫu nhiên cho cuộc thi
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    const { contest_id, participant_id } = body;

    if (!contest_id || !participant_id) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // Lấy thông tin cuộc thi
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select('*')
      .eq('id', contest_id)
      .single();

    if (contestError || !contest) {
      return NextResponse.json(
        { success: false, error: 'Cuộc thi không tồn tại' },
        { status: 404 }
      );
    }

    const numberOfQuestions = contest.number_of_questions || 10;

    // Lấy TẤT CẢ câu hỏi từ contest_questions (không dùng quiz_questions)
    // Lấy tất cả rồi random trong JavaScript vì Supabase không hỗ trợ ORDER BY random()
    const { data: allQuestions, error: questionsError } = await supabase
      .from('contest_questions')
      .select('*')
      .eq('is_active', true);

    if (questionsError) throw questionsError;

    if (!allQuestions || allQuestions.length < numberOfQuestions) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Không đủ câu hỏi. Cần ${numberOfQuestions} câu nhưng chỉ có ${allQuestions?.length || 0} câu trong ngân hàng cuộc thi` 
        },
        { status: 400 }
      );
    }

    // Shuffle array và lấy số lượng cần thiết
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, numberOfQuestions);

    // Format câu hỏi (không trả về đáp án đúng cho client)
    const formattedQuestions = selectedQuestions.map((q, index) => {
      // Convert options từ array [{key:"A", text:"..."}, ...] sang object {A: "...", B: "...", ...}
      const optionsObj: any = {};
      if (Array.isArray(q.options)) {
        q.options.forEach((opt: any) => {
          optionsObj[opt.key] = opt.text;
        });
      }

      return {
        id: q.id,
        order: index + 1,
        question_text: q.question_text,
        options: optionsObj, // Convert sang {A: "text", B: "text", C: "text", D: "text"}
        points_value: q.points_value
      };
    });

    // Chuẩn bị questions để lưu vào submission (giữ format object cho dễ xử lý)
    const questionsForStorage = selectedQuestions.map(q => {
      const optionsObj: any = {};
      if (Array.isArray(q.options)) {
        q.options.forEach((opt: any) => {
          optionsObj[opt.key] = opt.text;
        });
      }
      return {
        ...q,
        options: optionsObj // Lưu dạng object {A: "...", B: "...", ...}
      };
    });

    // Tạo submission với status in_progress
    const { data: submission, error: submissionError } = await supabase
      .from('contest_submissions')
      .insert({
        contest_id,
        participant_id,
        total_questions: numberOfQuestions,
        score: 0,
        correct_answers: 0,
        started_at: new Date().toISOString(),
        submitted_at: new Date().toISOString(), // Sẽ update khi submit
        time_taken: 0,
        questions: questionsForStorage, // Lưu với format object để dễ hiển thị
        answers: {},
        status: 'in_progress'
      })
      .select()
      .single();

    if (submissionError) throw submissionError;

    return NextResponse.json({
      success: true,
      data: {
        submission_id: submission.id,
        questions: formattedQuestions,
        time_per_question: contest.time_per_question,
        total_time: numberOfQuestions * contest.time_per_question
      }
    });
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
