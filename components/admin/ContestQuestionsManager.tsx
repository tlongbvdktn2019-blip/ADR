'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface ContestQuestion {
  id: string;
  question_text: string;
  options: Array<{ key: string; text: string }>;
  correct_answer: string;
  explanation?: string;
  points_value: number;
  times_used: number;
  times_answered: number;
  times_correct: number;
  is_active: boolean;
  created_at: string;
}

interface ContestQuestionsManagerProps {
  onClose?: () => void;
}

export default function ContestQuestionsManager({ onClose }: ContestQuestionsManagerProps) {
  const [questions, setQuestions] = useState<ContestQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [page, search]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search
      });

      const res = await fetch(`/api/admin/contest/questions?${params}`);
      const data = await res.json();

      if (data.success) {
        setQuestions(data.data || []);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error(data.error || 'Không thể tải danh sách câu hỏi');
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Lỗi khi tải danh sách câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(questions.map(q => q.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error('Vui lòng chọn ít nhất một câu hỏi để xóa');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.size} câu hỏi đã chọn?\n\nLưu ý: Các câu hỏi đã được sử dụng trong cuộc thi sẽ không ảnh hưởng đến kết quả đã nộp.`)) {
      return;
    }

    try {
      setDeleting(true);
      const res = await fetch('/api/admin/contest/questions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || 'Xóa câu hỏi thành công');
        setSelectedIds(new Set());
        loadQuestions();
      } else {
        toast.error(data.error || 'Không thể xóa câu hỏi');
      }
    } catch (error) {
      console.error('Error deleting questions:', error);
      toast.error('Lỗi khi xóa câu hỏi');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteOne = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/contest/questions/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Xóa câu hỏi thành công');
        loadQuestions();
      } else {
        toast.error(data.error || 'Không thể xóa câu hỏi');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Lỗi khi xóa câu hỏi');
    }
  };

  const getAccuracyRate = (q: ContestQuestion) => {
    if (q.times_answered === 0) return 'N/A';
    return ((q.times_correct / q.times_answered) * 100).toFixed(1) + '%';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Quản lý Câu hỏi Cuộc thi</h2>
            <p className="text-sm text-gray-600 mt-1">
              Tổng số: <span className="font-bold text-blue-600">{total}</span> câu hỏi
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Search & Actions */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm câu hỏi..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0 || deleting}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Xóa đã chọn ({selectedIds.size})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Đang tải...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                {search ? 'Không tìm thấy câu hỏi nào phù hợp' : 'Chưa có câu hỏi nào'}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Sử dụng chức năng Import Excel để thêm câu hỏi
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 text-center border">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === questions.length && questions.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="p-3 text-left border font-semibold text-gray-700">Câu hỏi</th>
                    <th className="p-3 text-center border font-semibold text-gray-700">Đáp án đúng</th>
                    <th className="p-3 text-center border font-semibold text-gray-700">Điểm</th>
                    <th className="p-3 text-center border font-semibold text-gray-700">Thống kê</th>
                    <th className="p-3 text-center border font-semibold text-gray-700">Trạng thái</th>
                    <th className="p-3 text-center border font-semibold text-gray-700">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50 border-b">
                      <td className="p-3 text-center border">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(q.id)}
                          onChange={() => handleSelectOne(q.id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="p-3 border">
                        <div className="max-w-md">
                          <p className="font-medium text-gray-800 mb-2">{q.question_text}</p>
                          <div className="text-sm space-y-1">
                            {q.options.map((opt) => (
                              <div
                                key={opt.key}
                                className={`${
                                  opt.key === q.correct_answer
                                    ? 'text-green-700 font-semibold bg-green-50 px-2 py-1 rounded'
                                    : 'text-gray-600'
                                }`}
                              >
                                <span className="font-bold">{opt.key}.</span> {opt.text}
                              </div>
                            ))}
                          </div>
                          {q.explanation && (
                            <p className="text-xs text-gray-500 mt-2 italic">
                              💡 {q.explanation}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center border">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 font-bold rounded-full">
                          {q.correct_answer}
                        </span>
                      </td>
                      <td className="p-3 text-center border">
                        <span className="font-bold text-blue-600">{q.points_value}</span>
                      </td>
                      <td className="p-3 text-center border">
                        <div className="text-sm">
                          <div>Dùng: <span className="font-semibold text-purple-600">{q.times_used}</span></div>
                          <div>Trả lời: <span className="font-semibold">{q.times_answered}</span></div>
                          <div>Tỷ lệ đúng: <span className="font-semibold text-green-600">{getAccuracyRate(q)}</span></div>
                        </div>
                      </td>
                      <td className="p-3 text-center border">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          q.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {q.is_active ? '✓ Active' : '✗ Inactive'}
                        </span>
                      </td>
                      <td className="p-3 text-center border">
                        <button
                          onClick={() => handleDeleteOne(q.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition"
                          title="Xóa câu hỏi"
                        >
                          🗑️ Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Trang {page} / {totalPages} (Tổng: {total} câu hỏi)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  ← Trước
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Sau →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}




