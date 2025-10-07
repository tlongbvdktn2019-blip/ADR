'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ADRPerformanceAssessment,
  ADR_PERFORMANCE_INDICATORS,
  CATEGORY_NAMES,
  CategoryType,
  SaveAnswerRequest,
  calculateIndicatorScore,
  AssessmentScoreByCategory
} from '@/types/adr-performance';

interface ADRPerformanceFormProps {
  assessmentId?: string;
  existingAssessment?: ADRPerformanceAssessment;
  onSave?: () => void;
}

export default function ADRPerformanceForm({ 
  assessmentId, 
  existingAssessment,
  onSave 
}: ADRPerformanceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assessment, setAssessment] = useState<ADRPerformanceAssessment | null>(existingAssessment || null);
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [assessmentNotes, setAssessmentNotes] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<CategoryType>>(new Set<CategoryType>(['A']));

  useEffect(() => {
    if (assessmentId && !existingAssessment) {
      loadAssessment();
    } else if (existingAssessment) {
      setAssessment(existingAssessment);
      if (existingAssessment.notes) {
        setAssessmentNotes(existingAssessment.notes);
      }
      if (existingAssessment.answers) {
        const answersMap: Record<string, boolean | null> = {};
        const notesMap: Record<string, string> = {};
        existingAssessment.answers.forEach(answer => {
          answersMap[answer.indicator_code] = answer.answer;
          if (answer.note) {
            notesMap[answer.indicator_code] = answer.note;
          }
        });
        setAnswers(answersMap);
        setNotes(notesMap);
      }
    }
  }, [assessmentId, existingAssessment]);

  const loadAssessment = async () => {
    if (!assessmentId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/adr-performance/${assessmentId}`);
      if (response.ok) {
        const { data } = await response.json();
        setAssessment(data);
        
        if (data.notes) {
          setAssessmentNotes(data.notes);
        }
        
        if (data.answers) {
          const answersMap: Record<string, boolean | null> = {};
          const notesMap: Record<string, string> = {};
          data.answers.forEach((answer: any) => {
            answersMap[answer.indicator_code] = answer.answer;
            if (answer.note) {
              notesMap[answer.indicator_code] = answer.note;
            }
          });
          setAnswers(answersMap);
          setNotes(notesMap);
        }
      }
    } catch (error) {
      console.error('Error loading assessment:', error);
      alert('Không thể tải đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = async (indicatorCode: string, answer: boolean | null) => {
    if (!assessment?.id) return;

    const indicator = ADR_PERFORMANCE_INDICATORS.find(i => i.code === indicatorCode);
    if (!indicator) return;

    // Update local state immediately
    setAnswers(prev => ({ ...prev, [indicatorCode]: answer }));

    // Save to backend
    setSaving(true);
    try {
      const answerData: SaveAnswerRequest = {
        indicator_code: indicator.code,
        indicator_type: indicator.type,
        category: indicator.category,
        question: indicator.question,
        answer: answer,
        note: notes[indicatorCode]
      };

      const response = await fetch(`/api/adr-performance/${assessment.id}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answerData)
      });

      if (response.ok) {
        const { data } = await response.json();
        // Update assessment with new scores
        if (data.assessment) {
          setAssessment(prev => prev ? { ...prev, ...data.assessment } : data.assessment);
        }
      } else {
        alert('Không thể lưu câu trả lời');
        // Revert local state
        setAnswers(prev => ({ ...prev, [indicatorCode]: answers[indicatorCode] }));
      }
    } catch (error) {
      console.error('Error saving answer:', error);
      alert('Lỗi khi lưu câu trả lời');
      // Revert local state
      setAnswers(prev => ({ ...prev, [indicatorCode]: answers[indicatorCode] }));
    } finally {
      setSaving(false);
    }
  };

  const handleNoteChange = async (indicatorCode: string, note: string) => {
    if (!assessment?.id) return;

    setNotes(prev => ({ ...prev, [indicatorCode]: note }));

    // Save note along with current answer
    const indicator = ADR_PERFORMANCE_INDICATORS.find(i => i.code === indicatorCode);
    if (!indicator) return;

    try {
      const answerData: SaveAnswerRequest = {
        indicator_code: indicator.code,
        indicator_type: indicator.type,
        category: indicator.category,
        question: indicator.question,
        answer: answers[indicatorCode] ?? null,
        note: note
      };

      await fetch(`/api/adr-performance/${assessment.id}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answerData)
      });
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleSubmit = async () => {
    if (!assessment?.id) return;

    if (!confirm('Bạn có chắc chắn muốn nộp đánh giá này? Sau khi nộp, bạn sẽ không thể chỉnh sửa.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/adr-performance/${assessment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'submitted',
          notes: assessmentNotes
        })
      });

      if (response.ok) {
        alert('Đã nộp đánh giá thành công!');
        if (onSave) {
          onSave();
        } else {
          router.push('/adr-performance');
        }
      } else {
        alert('Không thể nộp đánh giá');
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert('Lỗi khi nộp đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: CategoryType) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const getCategoryScore = (category: CategoryType): AssessmentScoreByCategory => {
    const indicators = ADR_PERFORMANCE_INDICATORS.filter(i => i.category === category);
    let totalScore = 0;
    let maxScore = 0;
    let answeredCount = 0;

    indicators.forEach(indicator => {
      const answer = answers[indicator.code];
      if (answer !== undefined && answer !== null) {
        answeredCount++;
        totalScore += calculateIndicatorScore(indicator.type, answer);
      }
      maxScore += indicator.type === 'C' ? 2 : 1;
    });

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    return {
      category,
      categoryName: CATEGORY_NAMES[category],
      totalScore,
      maxScore,
      percentage,
      answeredCount,
      totalCount: indicators.length
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center p-8 text-gray-500">
        Không tìm thấy đánh giá
      </div>
    );
  }

  const isReadOnly = assessment.status !== 'draft';

  return (
    <div className="space-y-6">
      {/* Assessment Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đơn vị
            </label>
            <div className="text-gray-900">
              {assessment.users?.organization || 'Chưa có thông tin'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày đánh giá
            </label>
            <div className="text-gray-900">
              {new Date(assessment.assessment_date).toLocaleDateString('vi-VN')}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tổng điểm
            </label>
            <div className="text-2xl font-bold text-blue-600">
              {assessment.total_score.toFixed(1)} / {assessment.max_score.toFixed(0)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tỷ lệ đạt
            </label>
            <div className="text-2xl font-bold text-green-600">
              {assessment.percentage.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ghi chú chung
          </label>
          <textarea
            value={assessmentNotes}
            onChange={(e) => setAssessmentNotes(e.target.value)}
            disabled={isReadOnly}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            rows={3}
            placeholder="Nhập ghi chú chung cho đánh giá..."
          />
        </div>
      </div>

      {/* Categories and Indicators */}
      <div className="space-y-4">
        {(['A', 'B', 'C', 'D', 'E'] as CategoryType[]).map(category => {
          const categoryScore = getCategoryScore(category);
          const isExpanded = expandedCategories.has(category);
          const indicators = ADR_PERFORMANCE_INDICATORS.filter(i => i.category === category);

          return (
            <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold">
                    {category}
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">
                      {CATEGORY_NAMES[category]}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {categoryScore.answeredCount}/{categoryScore.totalCount} câu hỏi • 
                      {' '}{categoryScore.totalScore.toFixed(1)}/{categoryScore.maxScore} điểm • 
                      {' '}{categoryScore.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Category Indicators */}
              {isExpanded && (
                <div className="px-6 pb-6 space-y-4">
                  {indicators.map(indicator => {
                    const answer = answers[indicator.code];
                    const note = notes[indicator.code] || '';
                    const score = calculateIndicatorScore(indicator.type, answer);
                    const maxScore = indicator.type === 'C' ? 2 : 1;

                    return (
                      <div key={indicator.code} className="border-t border-gray-200 pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                {indicator.code}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                indicator.type === 'C' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {indicator.type === 'C' ? 'Chính' : 'Phụ'} ({maxScore} điểm)
                              </span>
                              {answer !== undefined && answer !== null && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                                  {score}/{maxScore} điểm
                                </span>
                              )}
                            </div>
                            <p className="text-gray-900">{indicator.question}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`indicator-${indicator.code}`}
                                checked={answer === true}
                                onChange={() => handleAnswerChange(indicator.code, true)}
                                disabled={isReadOnly}
                                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 disabled:opacity-50"
                              />
                              <span className="ml-2 text-gray-700">Có</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`indicator-${indicator.code}`}
                                checked={answer === false}
                                onChange={() => handleAnswerChange(indicator.code, false)}
                                disabled={isReadOnly}
                                className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500 disabled:opacity-50"
                              />
                              <span className="ml-2 text-gray-700">Không</span>
                            </label>
                          </div>

                          <div className="flex-1">
                            <input
                              type="text"
                              value={note}
                              onChange={(e) => handleNoteChange(indicator.code, e.target.value)}
                              disabled={isReadOnly}
                              placeholder="Ghi chú..."
                              className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      {!isReadOnly && (
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : 'Nộp đánh giá'}
          </button>
        </div>
      )}

      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg">
          Đang lưu...
        </div>
      )}
    </div>
  );
}

