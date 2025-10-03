'use client';

import { useState, useEffect } from 'react';
import { LeaderboardEntry, Department, Unit } from '@/types/contest';

export default function ContestLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [allData, setAllData] = useState<LeaderboardEntry[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    department_id: '',
    unit_id: '',
    limit: 100
  });

  const [contestId, setContestId] = useState('');
  const [showOnlyTop10, setShowOnlyTop10] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, allData, showOnlyTop10]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Lấy contest ID từ API hoặc sessionStorage
      let cId = sessionStorage.getItem('contest_id');
      
      if (!cId) {
        // Lấy contest active
        const contestRes = await fetch('/api/contest/active');
        const contestData = await contestRes.json();
        if (contestData.success && contestData.data) {
          cId = contestData.data.id;
          if (cId) {
            sessionStorage.setItem('contest_id', cId);
          }
        }
      }

      if (!cId) {
        alert('Không tìm thấy cuộc thi');
        return;
      }

      setContestId(cId);

      // Lấy leaderboard
      const leaderboardRes = await fetch(`/api/contest/leaderboard?contest_id=${cId}&limit=1000`);
      const leaderboardData = await leaderboardRes.json();
      
      if (leaderboardData.success) {
        setAllData(leaderboardData.data || []);
        setLeaderboard(leaderboardData.data || []);
      }

      // Lấy departments và units cho filter
      const deptRes = await fetch('/api/contest/departments');
      const deptData = await deptRes.json();
      if (deptData.success) {
        setDepartments(deptData.data || []);
      }

      const unitsRes = await fetch('/api/contest/units');
      const unitsData = await unitsRes.json();
      if (unitsData.success) {
        setUnits(unitsData.data || []);
      }

    } catch (error) {
      console.error('Error loading leaderboard:', error);
      alert('Có lỗi khi tải bảng xếp hạng');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allData];

    // Filter theo search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.full_name.toLowerCase().includes(searchLower) ||
        entry.email?.toLowerCase().includes(searchLower)
      );
    }

    // Filter theo department
    if (filters.department_id) {
      filtered = filtered.filter(entry => {
        const dept = departments.find(d => d.id === filters.department_id);
        return entry.department_name === dept?.name;
      });
    }

    // Filter theo unit
    if (filters.unit_id) {
      const unit = units.find(u => u.id === filters.unit_id);
      filtered = filtered.filter(entry => entry.unit_name === unit?.name);
    }

    // Giới hạn top 10 nếu bật
    if (showOnlyTop10) {
      filtered = filtered.slice(0, 10);
    }

    setLeaderboard(filtered);
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-600';
      case 2:
        return 'from-gray-300 to-gray-500';
      case 3:
        return 'from-orange-400 to-orange-600';
      default:
        return 'from-blue-400 to-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải bảng xếp hạng...</p>
        </div>
      </div>
    );
  }

  const filteredUnits = filters.department_id
    ? units.filter(u => u.department_id === filters.department_id)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600 mb-4">
            🏆 BẢNG XẾP HẠNG 🏆
          </h1>
          <p className="text-xl text-gray-700">
            Top những người tham gia xuất sắc nhất
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Tìm kiếm */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <input
                type="text"
                placeholder="Nhập tên hoặc email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Lọc theo đơn vị */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Đơn vị
              </label>
              <select
                value={filters.department_id}
                onChange={(e) => setFilters({ ...filters, department_id: e.target.value, unit_id: '' })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tất cả</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            {/* Lọc theo khoa/phòng */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Khoa/Phòng
              </label>
              <select
                value={filters.unit_id}
                onChange={(e) => setFilters({ ...filters, unit_id: e.target.value })}
                disabled={!filters.department_id}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Tất cả</option>
                {filteredUnits.map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>

            {/* Toggle Top 10 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Hiển thị
              </label>
              <button
                onClick={() => setShowOnlyTop10(!showOnlyTop10)}
                className={`w-full px-4 py-2 rounded-lg font-semibold transition ${
                  showOnlyTop10
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {showOnlyTop10 ? '⭐ Top 10' : '📋 Tất cả'}
              </button>
            </div>
          </div>

          {leaderboard.length > 0 && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Hiển thị {leaderboard.length} kết quả
            </div>
          )}
        </div>

        {/* Top 3 Podium */}
        {showOnlyTop10 && leaderboard.length >= 3 && (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Rank 2 */}
            <div className="md:order-1 order-2 transform md:translate-y-12">
              <div className="bg-gradient-to-br from-gray-200 to-gray-400 rounded-t-3xl p-6 text-center">
                <div className="text-6xl mb-2">🥈</div>
                <div className="text-2xl font-bold text-white">#2</div>
              </div>
              <div className="bg-white p-6 rounded-b-3xl shadow-xl">
                <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">
                  {leaderboard[1].full_name}
                </h3>
                <p className="text-sm text-gray-600 mb-2 truncate">{leaderboard[1].department_name}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-800">{leaderboard[1].score}</div>
                    <div className="text-xs text-gray-500">điểm</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-600">
                      {Math.floor(leaderboard[1].time_taken / 60)}:{(leaderboard[1].time_taken % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-500">thời gian</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rank 1 */}
            <div className="md:order-2 order-1">
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-t-3xl p-8 text-center transform scale-110">
                <div className="text-8xl mb-2">🏆</div>
                <div className="text-3xl font-bold text-white">#1</div>
              </div>
              <div className="bg-white p-6 rounded-b-3xl shadow-2xl transform scale-110">
                <h3 className="text-2xl font-bold text-gray-800 mb-2 truncate">
                  {leaderboard[0].full_name}
                </h3>
                <p className="text-sm text-gray-600 mb-3 truncate">{leaderboard[0].department_name}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold text-yellow-600">{leaderboard[0].score}</div>
                    <div className="text-xs text-gray-500">điểm</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-semibold text-gray-600">
                      {Math.floor(leaderboard[0].time_taken / 60)}:{(leaderboard[0].time_taken % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-500">thời gian</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rank 3 */}
            <div className="md:order-3 order-3 transform md:translate-y-12">
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-t-3xl p-6 text-center">
                <div className="text-6xl mb-2">🥉</div>
                <div className="text-2xl font-bold text-white">#3</div>
              </div>
              <div className="bg-white p-6 rounded-b-3xl shadow-xl">
                <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">
                  {leaderboard[2].full_name}
                </h3>
                <p className="text-sm text-gray-600 mb-2 truncate">{leaderboard[2].department_name}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-800">{leaderboard[2].score}</div>
                    <div className="text-xs text-gray-500">điểm</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-600">
                      {Math.floor(leaderboard[2].time_taken / 60)}:{(leaderboard[2].time_taken % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-500">thời gian</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-bold">Hạng</th>
                  <th className="px-6 py-4 text-left font-bold">Họ và tên</th>
                  <th className="px-6 py-4 text-left font-bold">Đơn vị</th>
                  <th className="px-6 py-4 text-left font-bold">Khoa/Phòng</th>
                  <th className="px-6 py-4 text-center font-bold">Điểm</th>
                  <th className="px-6 py-4 text-center font-bold">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Chưa có dữ liệu
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((entry, idx) => (
                    <tr
                      key={entry.id}
                      className={`hover:bg-gray-50 transition ${
                        entry.rank <= 3 ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r ${getRankColor(entry.rank)} text-white font-bold text-lg`}>
                          {getRankBadge(entry.rank)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">{entry.full_name}</div>
                        {entry.email && (
                          <div className="text-sm text-gray-500">{entry.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {entry.department_name || '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {entry.unit_name || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{entry.score}</div>
                        <div className="text-xs text-gray-500">/ {entry.total_questions}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-semibold text-gray-800">
                          {Math.floor(entry.time_taken / 60)}:{(entry.time_taken % 60).toString().padStart(2, '0')}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Nút quay lại */}
        <div className="mt-8 text-center">
          <a
            href="/contest"
            className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          >
            ← Quay lại trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}






