import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// POST: Nộp bài thi
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    const { submission_id, answers, time_taken } = body;

    if (!submission_id || !answers) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // Lấy submission để check questions
    const { data: submission, error: submissionError } = await supabase
      .from('contest_submissions')
      .select('*, contest:contests(*)')
      .eq('id', submission_id)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { success: false, error: 'Bài thi không tồn tại' },
        { status: 404 }
      );
    }

    // Tính điểm
    const questions = submission.questions as any[];
    let correctAnswers = 0;
    const detailedAnswers = [];

    for (const question of questions) {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correct_answer;
      
      if (isCorrect) {
        correctAnswers++;
      }

      detailedAnswers.push({
        question_id: question.id,
        selected_answer: userAnswer,
        correct_answer: question.correct_answer,
        is_correct: isCorrect
      });

      // Insert vào contest_answers
      await supabase.from('contest_answers').insert({
        submission_id,
        question_id: question.id,
        selected_answer: userAnswer,
        correct_answer: question.correct_answer,
        is_correct: isCorrect,
        answered_at: new Date().toISOString()
      });
    }

    const score = correctAnswers;
    const totalQuestions = questions.length;

    // Update submission
    const { data: updatedSubmission, error: updateError } = await supabase
      .from('contest_submissions')
      .update({
        score,
        correct_answers: correctAnswers,
        time_taken: time_taken || 0,
        submitted_at: new Date().toISOString(),
        answers: answers,
        status: 'completed'
      })
      .eq('id', submission_id)
      .select('*, participant:contest_participants(*, department:departments(*), unit:units(*))')
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      data: {
        submission: updatedSubmission,
        score,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        percentage: Math.round((correctAnswers / totalQuestions) * 100),
        detailed_answers: detailedAnswers
      },
      message: 'Nộp bài thành công'
    });
  } catch (error: any) {
    console.error('Error submitting contest:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}



