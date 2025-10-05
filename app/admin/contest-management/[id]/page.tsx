'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Contest, ContestStatistics } from '@/types/contest';

export default function AdminContestDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contest, setContest] = useState<Contest | null>(null);
  const [statistics, setStatistics] = useState<ContestStatistics | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'submissions'>('stats');

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      loadData();
    }
  }, [status, session, params.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load contest info
      const contestRes = await fetch(`/api/admin/contest/${params.id}`);
      const contestData = await contestRes.json();
      if (contestData.success) {
        setContest(contestData.data);
      }

      // Load statistics
      const statsRes = await fetch(`/api/admin/contest/${params.id}/statistics`);
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStatistics(statsData.data);
      }

      // Load submissions
      const submissionsRes = await fetch(`/api/admin/contest/${params.id}/submissions`);
      const submissionsData = await submissionsRes.json();
      if (submissionsData.success) {
        setSubmissions(submissionsData.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Đang tải...</div>;
  }

  if (!contest || !statistics) {
    return <div className="p-8">Không tìm thấy cuộc thi</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/contest-management')}
          className="text-blue-600 hover:text-blue-700 font-semibold"
        >
          ← Quay lại
        </button>
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-8">{contest.title}</h1>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8 border-b">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-6 py-3 font-semibold transition border-b-2 ${
            activeTab === 'stats'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Thống kê
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-6 py-3 font-semibold transition border-b-2 ${
            activeTab === 'submissions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Danh sách bài thi ({submissions.length})
        </button>
      </div>

      {activeTab === 'stats' ? (
        <div className="space-y-6">
          {/* Tổng quan */}
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-2">Tổng người tham gia</div>
              <div className="text-4xl font-bold text-blue-600">{statistics.total_participants}</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-2">Đã hoàn thành</div>
              <div className="text-4xl font-bold text-green-600">{statistics.total_submissions}</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-2">Điểm trung bình</div>
              <div className="text-4xl font-bold text-purple-600">{statistics.average_score.toFixed(1)}</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-2">Tỷ lệ hoàn thành</div>
              <div className="text-4xl font-bold text-orange-600">{statistics.completion_rate.toFixed(1)}%</div>
            </div>
          </div>

          {/* Top 10 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Top 10 người xuất sắc</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Hạng</th>
                    <th className="px-4 py-2 text-left">Họ tên</th>
                    <th className="px-4 py-2 text-left">Đơn vị</th>
                    <th className="px-4 py-2 text-center">Điểm</th>
                    <th className="px-4 py-2 text-center">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {statistics.top_performers.slice(0, 10).map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-blue-600">{entry.rank}</td>
                      <td className="px-4 py-3">{entry.full_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{entry.department_name}</td>
                      <td className="px-4 py-3 text-center font-bold">{entry.score}</td>
                      <td className="px-4 py-3 text-center">
                        {Math.floor(entry.time_taken / 60)}:{(entry.time_taken % 60).toString().padStart(2, '0')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Phân phối điểm */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Phân phối điểm</h2>
            <div className="grid md:grid-cols-4 gap-4">
              {statistics.score_distribution.map((dist: any) => (
                <div key={dist.range} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{dist.count}</div>
                  <div className="text-sm text-gray-600">Điểm {dist.range}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Thống kê theo đơn vị */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Thống kê theo đơn vị</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Đơn vị</th>
                    <th className="px-4 py-2 text-center">Số người tham gia</th>
                    <th className="px-4 py-2 text-center">Điểm trung bình</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {statistics.department_stats.map((dept: any) => (
                    <tr key={dept.department_name} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{dept.department_name}</td>
                      <td className="px-4 py-3 text-center">{dept.participants}</td>
                      <td className="px-4 py-3 text-center font-bold text-blue-600">
                        {dept.average_score.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Họ tên</th>
                  <th className="px-4 py-3 text-left">Đơn vị</th>
                  <th className="px-4 py-3 text-left">Khoa/Phòng</th>
                  <th className="px-4 py-3 text-center">Điểm</th>
                  <th className="px-4 py-3 text-center">Thời gian</th>
                  <th className="px-4 py-3 text-center">Ngày nộp</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {submissions.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{sub.participant?.full_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{sub.participant?.department?.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{sub.participant?.unit?.name}</td>
                    <td className="px-4 py-3 text-center font-bold text-blue-600">
                      {sub.score}/{sub.total_questions}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {Math.floor(sub.time_taken / 60)}:{(sub.time_taken % 60).toString().padStart(2, '0')}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {new Date(sub.submitted_at).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}



























