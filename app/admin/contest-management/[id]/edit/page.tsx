'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';

export default function EditContestPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rules: '',
    prizes: '',
    number_of_questions: 10,
    time_per_question: 20,
    passing_score: 5,
    start_date: '',
    end_date: '',
    status: 'draft',
    is_public: true
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push('/unauthorized');
      } else {
        loadContest();
      }
    }
  }, [status, session, router, params.id]);

  const loadContest = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/contest/${params.id}`);
      const data = await res.json();
      
      if (data.success && data.data) {
        const contest = data.data;
        setFormData({
          title: contest.title || '',
          description: contest.description || '',
          rules: contest.rules || '',
          prizes: contest.prizes || '',
          number_of_questions: contest.number_of_questions || 10,
          time_per_question: contest.time_per_question || 20,
          passing_score: contest.passing_score || 5,
          start_date: contest.start_date ? contest.start_date.slice(0, 16) : '',
          end_date: contest.end_date ? contest.end_date.slice(0, 16) : '',
          status: contest.status || 'draft',
          is_public: contest.is_public !== false // Default true if undefined
        });
      } else {
        alert('Không tìm thấy cuộc thi');
        router.push('/admin/contest-management');
      }
    } catch (error) {
      console.error('Error loading contest:', error);
      alert('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Vui lòng nhập tên cuộc thi');
      return;
    }

    try {
      setSubmitting(true);

      // Convert datetime-local to ISO string
      const payload = {
        ...formData,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null
      };

      const res = await fetch(`/api/admin/contest/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        alert('Cập nhật cuộc thi thành công!');
        router.push('/admin/contest-management');
      } else {
        alert(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error updating contest:', error);
      alert('Có lỗi xảy ra khi cập nhật');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout requireAuth requireRole="admin">
        <div className="p-8">Đang tải...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout requireAuth requireRole="admin">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/contest-management')}
            className="flex items-center text-blue-600 hover:text-blue-700 font-semibold transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Quay lại Quản lý Cuộc thi
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Sửa cuộc thi</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tên cuộc thi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tên cuộc thi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ví dụ: Cuộc thi kiến thức ADR 2025"
              />
            </div>

            {/* Mô tả */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mô tả
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Mô tả ngắn gọn về cuộc thi"
              />
            </div>

            {/* Thể lệ */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Thể lệ cuộc thi
              </label>
              <textarea
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Các quy định, thể lệ của cuộc thi..."
              />
              <p className="mt-1 text-sm text-gray-500">Hỗ trợ HTML nếu cần</p>
            </div>

            {/* Giải thưởng */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Giải thưởng
              </label>
              <textarea
                value={formData.prizes}
                onChange={(e) => setFormData({ ...formData, prizes: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Mô tả các giải thưởng..."
              />
              <p className="mt-1 text-sm text-gray-500">Hỗ trợ HTML nếu cần</p>
            </div>

            {/* Cấu hình */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số câu hỏi <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={formData.number_of_questions}
                  onChange={(e) => setFormData({ ...formData, number_of_questions: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Thời gian mỗi câu (giây) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  required
                  value={formData.time_per_question}
                  onChange={(e) => setFormData({ ...formData, time_per_question: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-yellow-50 font-bold"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Tổng: {formData.number_of_questions * formData.time_per_question}s ({Math.floor(formData.number_of_questions * formData.time_per_question / 60)}:{((formData.number_of_questions * formData.time_per_question) % 60).toString().padStart(2, '0')})
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Điểm đạt
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.passing_score}
                  onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Ngày giờ */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ngày bắt đầu
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Để trống = bắt đầu ngay</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ngày kết thúc
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Để trống = không giới hạn</p>
              </div>
            </div>

            {/* Trạng thái & Công khai */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="draft">Draft (Nháp)</option>
                  <option value="active">Active (Đang diễn ra)</option>
                  <option value="ended">Ended (Đã kết thúc)</option>
                  <option value="archived">Archived (Lưu trữ)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hiển thị công khai
                </label>
                <div className="flex items-center h-12">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_public}
                      onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">
                      {formData.is_public ? '✅ Công khai' : '❌ Riêng tư'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Cảnh báo */}
            {formData.status === 'active' && !formData.is_public && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Cảnh báo:</strong> Cuộc thi đang ở trạng thái &quot;active&quot; nhưng không công khai. 
                  Người dùng sẽ không thể truy cập. Hãy bật &quot;Hiển thị công khai&quot; nếu bạn muốn mọi người tham gia.
                </p>
              </div>
            )}

            {/* Nút hành động */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => router.push('/admin/contest-management')}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Đang lưu...' : '💾 Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}

