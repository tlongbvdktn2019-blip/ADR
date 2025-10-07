'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import MainLayout from '@/components/layout/MainLayout';
import { ADRPerformanceAssessment } from '@/types/adr-performance';

export default function ADRPerformancePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<ADRPerformanceAssessment[]>([]);
  const [creating, setCreating] = useState(false);
  
  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/adr-performance');
      if (response.ok) {
        const { data } = await response.json();
        setAssessments(data || []);
      }
    } catch (error) {
      console.error('Error loading assessments:', error);
      alert('Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/adr-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_date: new Date().toISOString().split('T')[0],
          status: 'draft'
        })
      });

      if (response.ok) {
        const { data } = await response.json();
        router.push(`/adr-performance/${data.id}`);
      } else {
        alert('Không thể tạo đánh giá mới');
      }
    } catch (error) {
      console.error('Error creating assessment:', error);
      alert('Lỗi khi tạo đánh giá mới');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/adr-performance/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setAssessments(prev => prev.filter(a => a.id !== id));
      } else {
        const { error } = await response.json();
        alert(error || 'Không thể xóa đánh giá');
      }
    } catch (error) {
      console.error('Error deleting assessment:', error);
      alert('Lỗi khi xóa đánh giá');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">Bản nháp</span>;
      case 'submitted':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Đã nộp</span>;
      case 'final':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Hoàn thành</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Đánh giá hiệu quả hoạt động ADR
        </h1>
        <p className="text-gray-600">
          Đánh giá hiệu quả hoạt động giám sát ADR trong cơ sở khám bệnh, chữa bệnh
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={handleCreateNew}
          disabled={creating}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>{creating ? 'Đang tạo...' : 'Tạo đánh giá mới'}</span>
        </button>
      </div>

      {assessments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có đánh giá nào</h3>
          <p className="mt-1 text-sm text-gray-500">
            Bắt đầu bằng cách tạo đánh giá mới
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn vị
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày đánh giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Điểm số
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tỷ lệ đạt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cập nhật lần cuối
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assessments.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {assessment.users?.organization || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(assessment.assessment_date).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(assessment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {assessment.total_score.toFixed(1)} / {assessment.max_score.toFixed(0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${getPercentageColor(assessment.percentage)}`}>
                        {assessment.percentage.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(assessment.updated_at).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => router.push(`/adr-performance/${assessment.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {assessment.status === 'draft' ? 'Tiếp tục' : 'Xem'}
                        </button>
                        {/* Admin can delete any assessment, users can only delete their own draft */}
                        {(isAdmin || (assessment.status === 'draft' && assessment.user_id === session?.user?.id)) && (
                          <button
                            onClick={() => handleDelete(assessment.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Info */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Hướng dẫn đánh giá</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• <strong>Chỉ tiêu chính (C):</strong> Câu trả lời "Có" được 2 điểm, "Không" được 0 điểm</p>
          <p>• <strong>Chỉ tiêu phụ (P):</strong> Câu trả lời "Có" được 1 điểm, "Không" được 0 điểm</p>
          <p>• Hiệu quả giám sát ADR được thể hiện thông qua tỷ lệ % điểm đạt được của các tiêu chí đánh giá</p>
          <p>• Đánh giá được chia thành 5 nhóm: A (Cơ cấu tổ chức), B (Cơ sở vật chất), C (Biểu mẫu báo cáo), D (Giám sát và nghiên cứu), E (Thông tin và truyền thông)</p>
        </div>
      </div>
      </div>
    </MainLayout>
  );
}

