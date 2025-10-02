'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  id: string;
  order: number;
  question_text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  category?: string;
  difficulty?: string;
}

export default function ContestQuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timePerQuestion, setTimePerQuestion] = useState(20);
  const [totalTime, setTotalTime] = useState(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(20);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
  const [submissionId, setSubmissionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [startTime, setStartTime] = useState(0);

  useEffect(() => {
    loadQuestions();
  }, []);

  // Timer cho câu hỏi hiện tại
  useEffect(() => {
    if (loading || submitting) return;

    const timer = setInterval(() => {
      setQuestionTimeLeft(prev => {
        if (prev <= 1) {
          // Hết giờ, tự động next câu
          handleNextQuestion();
          return timePerQuestion;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, loading, submitting, timePerQuestion]);

  // Timer tổng
  useEffect(() => {
    if (loading || submitting) return;

    const timer = setInterval(() => {
      setTotalTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, submitting]);

  const loadQuestions = async () => {
    try {
      setLoading(true);

      const participantId = sessionStorage.getItem('contest_participant_id');
      const contestId = sessionStorage.getItem('contest_id');

      if (!participantId || !contestId) {
        alert('Vui lòng đăng ký tham gia cuộc thi trước');
        router.push('/contest');
        return;
      }

      const response = await fetch('/api/contest/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contest_id: contestId,
          participant_id: participantId
        })
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.error || 'Có lỗi xảy ra');
        router.push('/contest');
        return;
      }

      setQuestions(data.data.questions);
      setSubmissionId(data.data.submission_id);
      setTimePerQuestion(data.data.time_per_question);
      setTotalTime(data.data.total_time);
      setQuestionTimeLeft(data.data.time_per_question);
      setStartTime(Date.now());

      // Load từ localStorage nếu có (auto-save)
      const savedAnswers = localStorage.getItem(`contest_answers_${data.data.submission_id}`);
      const savedIndex = localStorage.getItem(`contest_current_index_${data.data.submission_id}`);
      const savedTime = localStorage.getItem(`contest_time_elapsed_${data.data.submission_id}`);

      if (savedAnswers) {
        setAnswers(JSON.parse(savedAnswers));
      }
      if (savedIndex) {
        setCurrentQuestionIndex(parseInt(savedIndex));
      }
      if (savedTime) {
        setTotalTimeElapsed(parseInt(savedTime));
      }

    } catch (error) {
      console.error('Error loading questions:', error);
      alert('Có lỗi xảy ra khi tải câu hỏi');
      router.push('/contest');
    } finally {
      setLoading(false);
    }
  };

  // Auto-save
  useEffect(() => {
    if (submissionId && !loading) {
      localStorage.setItem(`contest_answers_${submissionId}`, JSON.stringify(answers));
      localStorage.setItem(`contest_current_index_${submissionId}`, currentQuestionIndex.toString());
      localStorage.setItem(`contest_time_elapsed_${submissionId}`, totalTimeElapsed.toString());
    }
  }, [answers, currentQuestionIndex, totalTimeElapsed, submissionId, loading]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = useCallback(() => {
    // Lưu câu trả lời
    if (selectedAnswer && currentQuestion) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: selectedAnswer
      }));
    }

    // Nếu là câu cuối cùng
    if (currentQuestionIndex >= questions.length - 1) {
      handleSubmit();
    } else {
      // Next câu
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionTimeLeft(timePerQuestion);
      
      // Load answer đã lưu nếu có
      const nextQuestion = questions[currentQuestionIndex + 1];
      setSelectedAnswer(answers[nextQuestion.id] || '');
    }
  }, [selectedAnswer, currentQuestionIndex, questions, timePerQuestion, answers]);

  const handleSubmit = async () => {
    const confirmed = confirm('Bạn có chắc chắn muốn nộp bài?');
    if (!confirmed) return;

    try {
      setSubmitting(true);

      // Lưu câu trả lời cuối cùng
      const finalAnswers = { ...answers };
      if (selectedAnswer && currentQuestion) {
        finalAnswers[currentQuestion.id] = selectedAnswer;
      }

      const response = await fetch('/api/contest/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          answers: finalAnswers,
          time_taken: totalTimeElapsed
        })
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.error || 'Có lỗi xảy ra');
        return;
      }

      // Xóa localStorage
      localStorage.removeItem(`contest_answers_${submissionId}`);
      localStorage.removeItem(`contest_current_index_${submissionId}`);
      localStorage.removeItem(`contest_time_elapsed_${submissionId}`);

      // Lưu kết quả và chuyển trang
      sessionStorage.setItem('contest_result', JSON.stringify(data.data));
      router.push('/contest/result');

    } catch (error) {
      console.error('Error submitting:', error);
      alert('Có lỗi xảy ra khi nộp bài');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang chuẩn bị bài thi...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-xl text-gray-600">Không có câu hỏi</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const timePercentage = (questionTimeLeft / timePerQuestion) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header với timer và progress */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">
                Câu {currentQuestionIndex + 1} / {questions.length}
              </span>
              <span className="text-sm font-semibold text-gray-700">
                Tổng thời gian: {Math.floor(totalTimeElapsed / 60)}:{(totalTimeElapsed % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Timer cho câu hiện tại */}
          <div className="flex items-center justify-center">
            <div className={`text-center ${questionTimeLeft <= 5 ? 'animate-pulse' : ''}`}>
              <div className={`text-5xl font-bold ${
                questionTimeLeft <= 5 ? 'text-red-500' : 'text-blue-600'
              }`}>
                {questionTimeLeft}
              </div>
              <div className="text-sm text-gray-600 mt-1">giây</div>
            </div>
          </div>

          {/* Timer bar */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  questionTimeLeft <= 5 ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${timePercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Câu hỏi */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="mb-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                {currentQuestionIndex + 1}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 leading-relaxed">
                  {currentQuestion.question_text}
                </h2>
                {currentQuestion.category && (
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    {currentQuestion.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Đáp án */}
          <div className="space-y-4">
            {Object.entries(currentQuestion.options).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleAnswerSelect(key)}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all transform hover:scale-[1.02] ${
                  selectedAnswer === key
                    ? 'border-blue-600 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold ${
                    selectedAnswer === key
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 text-gray-600'
                  }`}>
                    {key}
                  </div>
                  <div className="flex-1 text-gray-800 text-lg">
                    {value}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Nút điều hướng */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(prev => prev - 1);
                setQuestionTimeLeft(timePerQuestion);
                const prevQuestion = questions[currentQuestionIndex - 1];
                setSelectedAnswer(answers[prevQuestion.id] || '');
              }
            }}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            ← Câu trước
          </button>

          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold text-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 shadow-lg transform hover:scale-105 transition"
            >
              {submitting ? 'Đang nộp bài...' : '✓ NỘP BÀI'}
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              disabled={!selectedAnswer}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 shadow-lg transform hover:scale-105 transition"
            >
              Câu tiếp theo →
            </button>
          )}
        </div>

        {/* Indicator cho tất cả câu hỏi */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tổng quan bài thi</h3>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => {
                  setCurrentQuestionIndex(idx);
                  setQuestionTimeLeft(timePerQuestion);
                  setSelectedAnswer(answers[q.id] || '');
                }}
                className={`aspect-square rounded-lg font-semibold text-sm transition ${
                  idx === currentQuestionIndex
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                    : answers[q.id]
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span>Đang làm</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Đã trả lời</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span>Chưa trả lời</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



