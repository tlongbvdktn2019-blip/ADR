'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Contest } from '@/types/contest';
import ContestQuestionImport from '@/components/admin/ContestQuestionImport';
import { Toaster } from 'react-hot-toast';
import MainLayout from '@/components/layout/MainLayout';

export default function AdminContestManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push('/unauthorized');
      } else {
        loadContests();
      }
    }
  }, [status, session, router]);

  const loadContests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/contest');
      const data = await res.json();
      if (data.success) {
        setContests(data.data || []);
      }
    } catch (error) {
      console.error('Error loading contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContest = async (formData: any) => {
    try {
      const res = await fetch('/api/admin/contest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        alert('Tạo cuộc thi thành công!');
        setShowCreateModal(false);
        loadContests();
      } else {
        alert(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error creating contest:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/contest/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const data = await res.json();
      if (data.success) {
        alert('Cập nhật trạng thái thành công!');
        loadContests();
      }
    } catch (error) {
      console.error('Error updating contest:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa cuộc thi này?')) return;

    try {
      const res = await fetch(`/api/admin/contest/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.success) {
        alert('Xóa cuộc thi thành công!');
        loadContests();
      }
    } catch (error) {
      console.error('Error deleting contest:', error);
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
      <Toaster position="top-right" />
      <div className="container mx-auto px-4 py-8">
        {/* Nút Quay về */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-700 font-semibold transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Quay về Dashboard
          </button>
        </div>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Quản lý Cuộc thi</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/admin/debug-contest')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition flex items-center gap-2"
            title="Debug cuộc thi không hiện"
          >
            🔍 Debug
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Import Câu hỏi từ Excel
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            + Tạo cuộc thi mới
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {contests.map(contest => (
          <div key={contest.id} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{contest.title}</h2>
                <p className="text-gray-600">{contest.description}</p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                contest.status === 'active' ? 'bg-green-100 text-green-800' :
                contest.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {contest.status}
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-gray-600">Số câu hỏi</div>
                <div className="text-xl font-bold text-blue-600">{contest.number_of_questions}</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm text-gray-600">Thời gian/câu</div>
                <div className="text-xl font-bold text-green-600">{contest.time_per_question}s</div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="text-sm text-gray-600">Bắt đầu</div>
                <div className="text-sm font-semibold text-purple-600">
                  {contest.start_date ? new Date(contest.start_date).toLocaleDateString('vi-VN') : 'N/A'}
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded">
                <div className="text-sm text-gray-600">Kết thúc</div>
                <div className="text-sm font-semibold text-orange-600">
                  {contest.end_date ? new Date(contest.end_date).toLocaleDateString('vi-VN') : 'N/A'}
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => router.push(`/admin/contest-management/${contest.id}`)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
              >
                Chi tiết & Thống kê
              </button>
              
              {contest.status === 'draft' && (
                <button
                  onClick={() => handleUpdateStatus(contest.id, 'active')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition"
                >
                  Kích hoạt
                </button>
              )}
              
              {contest.status === 'active' && (
                <button
                  onClick={() => handleUpdateStatus(contest.id, 'ended')}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition"
                >
                  Kết thúc
                </button>
              )}

              <button
                onClick={() => router.push(`/admin/contest-management/${contest.id}/edit`)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
              >
                Sửa
              </button>

              <button
                onClick={() => handleDelete(contest.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}

        {contests.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Chưa có cuộc thi nào. Hãy tạo cuộc thi đầu tiên!
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateContestModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateContest}
        />
      )}

      {/* Import Questions Modal */}
      {showImportModal && (
        <ContestQuestionImport
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            alert('Import câu hỏi thành công! Các câu hỏi đã được thêm vào ngân hàng câu hỏi CUỘC THI (riêng biệt với Quiz Training).');
          }}
        />
      )}
      </div>
    </MainLayout>
  );
}

function CreateContestModal({ onClose, onCreate }: any) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Tạo cuộc thi mới</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tên cuộc thi *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Số câu hỏi
              </label>
              <input
                type="number"
                min="1"
                value={formData.number_of_questions}
                onChange={(e) => setFormData({ ...formData, number_of_questions: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Thời gian mỗi câu (giây)
              </label>
              <input
                type="number"
                min="1"
                value={formData.time_per_question}
                onChange={(e) => setFormData({ ...formData, time_per_question: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ngày bắt đầu
              </label>
              <input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ngày kết thúc
              </label>
              <input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              Tạo cuộc thi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

