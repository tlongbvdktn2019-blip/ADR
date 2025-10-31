'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';

export default function DebugContestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contests, setContests] = useState<any[]>([]);
  const [activeContest, setActiveContest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [serverTime, setServerTime] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push('/unauthorized');
      } else {
        loadData();
      }
    }
  }, [status, session, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get server time
      setServerTime(new Date().toISOString());

      // Get all contests
      const res = await fetch('/api/admin/contest');
      const data = await res.json();
      if (data.success) {
        setContests(data.data || []);
      }

      // Get active contest from public API
      const activeRes = await fetch('/api/contest/active');
      const activeData = await activeRes.json();
      if (activeData.success) {
        setActiveContest(activeData.data);
      } else {
        setActiveContest(null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fixContest = async (contestId: string) => {
    if (!confirm('Bạn có chắc muốn sửa cuộc thi này? Sẽ set is_public = true')) return;

    try {
      const res = await fetch(`/api/admin/contest/${contestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: true })
      });

      const data = await res.json();
      if (data.success) {
        alert('Đã cập nhật is_public = true');
        loadData();
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (error) {
      console.error('Error fixing contest:', error);
      alert('Có lỗi xảy ra');
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
            Quay lại
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-8">🔍 Debug Cuộc thi</h1>

        {/* Server Time */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <h3 className="font-bold text-blue-800 mb-2">⏰ Thời gian Server (ISO)</h3>
          <code className="text-sm">{serverTime}</code>
        </div>

        {/* Active Contest from Public API */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🌐 Cuộc thi công khai (từ /api/contest/active)
          </h2>
          {activeContest ? (
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <p className="font-bold text-green-800">✅ Có cuộc thi công khai</p>
              <pre className="text-sm mt-2 bg-white p-3 rounded overflow-x-auto">
                {JSON.stringify(activeContest, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <p className="font-bold text-red-800">❌ KHÔNG có cuộc thi công khai</p>
              <p className="text-sm text-red-600 mt-2">
                Đây là lý do tại sao người dùng thấy &quot;Cuộc thi không tồn tại&quot;
              </p>
            </div>
          )}
        </div>

        {/* All Contests Details */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            📋 Tất cả cuộc thi trong DB
          </h2>
          
          {contests.length === 0 ? (
            <p className="text-gray-600">Không có cuộc thi nào</p>
          ) : (
            <div className="space-y-6">
              {contests.map((contest) => {
                const now = new Date().toISOString();
                const startValid = !contest.start_date || contest.start_date <= now;
                const endValid = !contest.end_date || contest.end_date >= now;
                const isActive = contest.status === 'active';
                const isPublic = contest.is_public === true;
                
                const canBeShown = isActive && isPublic && startValid && endValid;

                return (
                  <div 
                    key={contest.id} 
                    className={`border-2 rounded-lg p-4 ${
                      canBeShown ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold">{contest.title}</h3>
                      <div className="flex gap-2">
                        {canBeShown ? (
                          <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold">
                            ✅ OK
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold">
                            ❌ LỖI
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Thông tin chính:</h4>
                        <table className="w-full text-sm">
                          <tbody>
                            <tr className={isActive ? 'bg-green-100' : 'bg-red-100'}>
                              <td className="px-2 py-1 font-medium">status:</td>
                              <td className="px-2 py-1">
                                <code>{contest.status}</code>
                                {!isActive && <span className="ml-2 text-red-600">❌ Phải là &quot;active&quot;</span>}
                                {isActive && <span className="ml-2 text-green-600">✅</span>}
                              </td>
                            </tr>
                            <tr className={isPublic ? 'bg-green-100' : 'bg-red-100'}>
                              <td className="px-2 py-1 font-medium">is_public:</td>
                              <td className="px-2 py-1">
                                <code>{String(contest.is_public)}</code>
                                {!isPublic && <span className="ml-2 text-red-600">❌ Phải là true</span>}
                                {isPublic && <span className="ml-2 text-green-600">✅</span>}
                              </td>
                            </tr>
                            <tr className="bg-blue-50">
                              <td className="px-2 py-1 font-medium">Số câu hỏi:</td>
                              <td className="px-2 py-1">
                                <code className="font-bold">{contest.number_of_questions}</code> câu
                              </td>
                            </tr>
                            <tr className="bg-yellow-50">
                              <td className="px-2 py-1 font-medium">Thời gian/câu:</td>
                              <td className="px-2 py-1">
                                <code className="font-bold text-lg">{contest.time_per_question}</code> giây
                              </td>
                            </tr>
                            <tr>
                              <td className="px-2 py-1 font-medium">id:</td>
                              <td className="px-2 py-1"><code className="text-xs">{contest.id}</code></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Kiểm tra ngày:</h4>
                        <table className="w-full text-sm">
                          <tbody>
                            <tr>
                              <td className="px-2 py-1 font-medium">Hiện tại:</td>
                              <td className="px-2 py-1">
                                <code className="text-xs">{now}</code>
                              </td>
                            </tr>
                            <tr className={startValid ? 'bg-green-100' : 'bg-red-100'}>
                              <td className="px-2 py-1 font-medium">start_date:</td>
                              <td className="px-2 py-1">
                                <code className="text-xs">{contest.start_date || 'NULL (OK)'}</code>
                                {!startValid && <span className="ml-2 text-red-600">❌ Chưa tới</span>}
                                {startValid && <span className="ml-2 text-green-600">✅</span>}
                              </td>
                            </tr>
                            <tr className={endValid ? 'bg-green-100' : 'bg-red-100'}>
                              <td className="px-2 py-1 font-medium">end_date:</td>
                              <td className="px-2 py-1">
                                <code className="text-xs">{contest.end_date || 'NULL (OK)'}</code>
                                {!endValid && <span className="ml-2 text-red-600">❌ Đã hết hạn</span>}
                                {endValid && <span className="ml-2 text-green-600">✅</span>}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {!canBeShown && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-3">
                        <h4 className="font-bold text-yellow-800 mb-1">⚠️ Lý do không hiện:</h4>
                        <ul className="text-sm text-yellow-700 list-disc list-inside">
                          {!isActive && <li>Status không phải &quot;active&quot; (hiện tại: {contest.status})</li>}
                          {!isPublic && <li>is_public không phải true (hiện tại: {String(contest.is_public)})</li>}
                          {!startValid && <li>Cuộc thi chưa bắt đầu (start_date &gt; now)</li>}
                          {!endValid && <li>Cuộc thi đã kết thúc (end_date &lt; now)</li>}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {!isPublic && (
                        <button
                          onClick={() => fixContest(contest.id)}
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition text-sm"
                        >
                          🔧 Fix: Set is_public = true
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/admin/contest-management/${contest.id}`)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition text-sm"
                      >
                        Xem chi tiết
                      </button>
                    </div>

                    {/* Full JSON for debugging */}
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                        📄 Xem toàn bộ JSON
                      </summary>
                      <pre className="text-xs mt-2 bg-gray-100 p-3 rounded overflow-x-auto">
                        {JSON.stringify(contest, null, 2)}
                      </pre>
                    </details>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
          <h3 className="font-bold text-blue-800 mb-2">💡 Hướng dẫn khắc phục:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
            <li>Kiểm tra cuộc thi có màu đỏ (❌ LỖI)</li>
            <li>Đọc phần &quot;Lý do không hiện&quot;</li>
            <li>Nếu is_public = false, click nút &quot;Fix: Set is_public = true&quot;</li>
            <li>Nếu status không phải active, vào trang quản lý để kích hoạt</li>
            <li>Nếu ngày không hợp lệ, sửa lại start_date hoặc end_date</li>
            <li>Reload lại trang này để kiểm tra</li>
          </ol>
        </div>
      </div>
    </MainLayout>
  );
}

