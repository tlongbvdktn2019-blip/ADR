'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DetailedAnswer {
  question_id: string;
  selected_answer: string;
  correct_answer: string;
  is_correct: boolean;
}

interface ResultData {
  submission: any;
  score: number;
  total_questions: number;
  correct_answers: number;
  percentage: number;
  detailed_answers: DetailedAnswer[];
}

export default function ContestResultPage() {
  const router = useRouter();
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResult();
  }, []);

  const loadResult = () => {
    const savedResult = sessionStorage.getItem('contest_result');
    
    if (!savedResult) {
      alert('Không tìm thấy kết quả');
      router.push('/contest');
      return;
    }

    const data = JSON.parse(savedResult);
    setResultData(data);
    setLoading(false);
  };

  const handleShare = (platform: string) => {
    if (!resultData) return;

    const { score, total_questions, percentage } = resultData;
    const text = `Tôi vừa hoàn thành Cuộc thi Kiến thức ADR với ${score}/${total_questions} điểm (${percentage}%)! 🎉`;
    
    const shareUrl = window.location.origin + '/contest/leaderboard';

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(text + '\n' + shareUrl);
        alert('Đã sao chép link chia sẻ!');
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  if (!resultData) {
    return null;
  }

  const { submission, score, total_questions, correct_answers, percentage, detailed_answers } = resultData;
  const participant = submission.participant;
  const timeInMinutes = Math.floor(submission.time_taken / 60);
  const timeInSeconds = submission.time_taken % 60;

  // Lấy questions từ submission
  const questions = submission.questions || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {!showReview ? (
          <>
            {/* Kết quả chính */}
            <div className="text-center mb-12">
              <div className="inline-block animate-bounce mb-6">
                {percentage >= 80 ? (
                  <div className="text-8xl">🏆</div>
                ) : percentage >= 60 ? (
                  <div className="text-8xl">🎉</div>
                ) : (
                  <div className="text-8xl">👏</div>
                )}
              </div>
              
              <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
                Chúc mừng!
              </h1>
              <p className="text-xl text-gray-700">
                Bạn đã hoàn thành cuộc thi
              </p>
            </div>

            {/* Điểm số */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-baseline space-x-3">
                  <span className="text-7xl font-extrabold text-blue-600">{score}</span>
                  <span className="text-4xl text-gray-400">/</span>
                  <span className="text-4xl font-bold text-gray-600">{total_questions}</span>
                </div>
                <div className="mt-4">
                  <div className="inline-block px-6 py-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full">
                    <span className="text-3xl font-bold text-blue-600">{percentage}%</span>
                  </div>
                </div>
              </div>

              {/* Thông tin người tham gia */}
              <div className="border-t border-gray-200 pt-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Họ và tên</div>
                    <div className="text-lg font-semibold text-gray-800">{participant.full_name}</div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Thời gian hoàn thành</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {timeInMinutes}:{timeInSeconds.toString().padStart(2, '0')}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Đơn vị</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {participant.department?.name || 'N/A'}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Khoa/Phòng</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {participant.unit?.name || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Thống kê */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{correct_answers}</div>
                  <div className="text-sm text-gray-600 mt-1">Câu đúng</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">{total_questions - correct_answers}</div>
                  <div className="text-sm text-gray-600 mt-1">Câu sai</div>
                </div>
              </div>
            </div>

            {/* Nút hành động */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => setShowReview(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
              >
                📝 Xem lại đáp án
              </button>

              <button
                onClick={() => router.push('/contest/leaderboard')}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
              >
                🏆 Xem bảng xếp hạng
              </button>
            </div>

            {/* Chia sẻ */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                Chia sẻ kết quả
              </h3>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => handleShare('facebook')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition flex items-center space-x-2"
                >
                  <span>📘</span>
                  <span>Facebook</span>
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-semibold transition flex items-center space-x-2"
                >
                  <span>🐦</span>
                  <span>Twitter</span>
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition flex items-center space-x-2"
                >
                  <span>📋</span>
                  <span>Sao chép</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Xem lại đáp án */}
            <div className="mb-8">
              <button
                onClick={() => setShowReview(false)}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-2"
              >
                <span>←</span>
                <span>Quay lại kết quả</span>
              </button>
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-6">Xem lại đáp án</h2>

            <div className="space-y-6">
              {questions.map((q: any, idx: number) => {
                const answer = detailed_answers.find(a => a.question_id === q.id);
                const isCorrect = answer?.is_correct;

                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
                      isCorrect ? 'border-green-500' : 'border-red-500'
                    }`}
                  >
                    <div className="flex items-start space-x-3 mb-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {q.question_text}
                        </h3>
                      </div>
                      <div>
                        {isCorrect ? (
                          <span className="text-2xl">✅</span>
                        ) : (
                          <span className="text-2xl">❌</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 ml-11">
                      {Object.entries(q.options || {}).map(([key, value]: [string, any]) => {
                        const isUserAnswer = answer?.selected_answer === key;
                        const isCorrectAnswer = q.correct_answer === key;

                        return (
                          <div
                            key={key}
                            className={`p-3 rounded-lg ${
                              isCorrectAnswer
                                ? 'bg-green-100 border border-green-500'
                                : isUserAnswer
                                ? 'bg-red-100 border border-red-500'
                                : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="font-bold text-gray-700">{key}.</span>
                              <span className="text-gray-800">{value}</span>
                              {isCorrectAnswer && (
                                <span className="ml-auto text-green-600 font-semibold">✓ Đúng</span>
                              )}
                              {isUserAnswer && !isCorrectAnswer && (
                                <span className="ml-auto text-red-600 font-semibold">Bạn chọn</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="mt-4 ml-11 p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm font-semibold text-blue-800 mb-1">💡 Giải thích:</div>
                        <div className="text-sm text-gray-700">{q.explanation}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => router.push('/contest/leaderboard')}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
              >
                🏆 Xem bảng xếp hạng
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}









