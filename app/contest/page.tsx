'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Contest, Department, Unit } from '@/types/contest';
import { sanitizeRichText } from '@/lib/html-sanitizer'

export default function ContestLandingPage() {
  const router = useRouter();
  const [contest, setContest] = useState<Contest | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department_id: '',
    unit_id: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.department_id) {
      const filtered = units.filter(u => u.department_id === formData.department_id);
      setFilteredUnits(filtered);
      setFormData(prev => ({ ...prev, unit_id: '' }));
    } else {
      setFilteredUnits([]);
    }
  }, [formData.department_id, units]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Lấy cuộc thi active
      const contestRes = await fetch('/api/contest/active');
      const contestData = await contestRes.json();

      if (!contestData.success || !contestData.data) {
        alert('Hiện tại không có cuộc thi nào đang diễn ra');
        return;
      }

      setContest(contestData.data);

      // Lấy departments
      const deptRes = await fetch('/api/contest/departments');
      const deptData = await deptRes.json();
      if (deptData.success) {
        setDepartments(deptData.data || []);
      }

      // Lấy units
      const unitsRes = await fetch('/api/contest/units');
      const unitsData = await unitsRes.json();
      if (unitsData.success) {
        setUnits(unitsData.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Có lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Vui lòng nhập họ và tên';
    }

    if (!formData.department_id) {
      newErrors.department_id = 'Vui lòng chọn đơn vị';
    }

    if (!formData.unit_id) {
      newErrors.unit_id = 'Vui lòng chọn khoa/phòng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!contest) return;

    try {
      setSubmitting(true);

      const response = await fetch('/api/contest/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contest_id: contest.id,
          ...formData
        })
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.error || 'Có lỗi xảy ra');
        return;
      }

      // Lưu participant_id vào sessionStorage
      sessionStorage.setItem('contest_participant_id', data.data.id);
      sessionStorage.setItem('contest_id', contest.id);

      // Chuyển đến trang làm bài
      router.push('/contest/quiz');
    } catch (error) {
      console.error('Error registering:', error);
      alert('Có lỗi xảy ra khi đăng ký');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Hiện tại chưa có cuộc thi nào đang diễn ra
          </h2>
          <p className="text-gray-600">Vui lòng quay lại sau!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Nút quay về trang chủ */}
        <div className="mb-6">
          <a
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold transition"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay về trang chủ
          </a>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
            {contest.title || 'KIẾN THỨC ADR'}
          </h1>
          {contest.description && (
            <p className="text-xl text-gray-700 mb-6">{contest.description}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Thông tin cuộc thi */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-blue-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-3xl mr-3">📋</span>
              Thể lệ cuộc thi
            </h2>
            {contest.rules ? (
              <div className="prose text-gray-600" dangerouslySetInnerHTML={{ __html: sanitizeRichText(contest.rules) }} />
            ) : (
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Số câu hỏi: <strong>{contest.number_of_questions} câu</strong>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Thời gian mỗi câu: <strong>{contest.time_per_question} giây</strong>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Tổng thời gian: <strong>{contest.number_of_questions * contest.time_per_question} giây</strong>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Trả lời đúng càng nhiều, càng nhanh thì xếp hạng càng cao
                </li>
              </ul>
            )}
          </div>

          {/* Giải thưởng */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-yellow-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-3xl mr-3">🏆</span>
              Giải thưởng
            </h2>
            {contest.prizes ? (
              <div className="prose text-gray-600" dangerouslySetInnerHTML={{ __html: sanitizeRichText(contest.prizes) }} />
            ) : (
              <div className="space-y-3 text-gray-600">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-lg">1</div>
                  <span>Giải Nhất: Chứng nhận + Phần thưởng</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-gray-300 to-gray-500 rounded-full flex items-center justify-center text-white font-bold text-lg">2</div>
                  <span>Giải Nhì: Chứng nhận + Phần thưởng</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">3</div>
                  <span>Giải Ba: Chứng nhận + Phần thưởng</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form đăng ký */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Đăng ký tham gia
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Họ và tên */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Họ và Tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.full_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nhập họ và tên của bạn"
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-500">{errors.full_name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email (tùy chọn)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="example@email.com"
              />
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Số điện thoại (tùy chọn)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="0123456789"
              />
            </div>

            {/* Đơn vị */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Đơn vị <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.department_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">-- Chọn đơn vị --</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              {errors.department_id && (
                <p className="mt-1 text-sm text-red-500">{errors.department_id}</p>
              )}
            </div>

            {/* Khoa/Phòng */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Khoa/Phòng <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.unit_id}
                onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                disabled={!formData.department_id}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.unit_id ? 'border-red-500' : 'border-gray-300'
                } ${!formData.department_id ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">-- Chọn khoa/phòng --</option>
                {filteredUnits.map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
              {errors.unit_id && (
                <p className="mt-1 text-sm text-red-500">{errors.unit_id}</p>
              )}
            </div>

            {/* Nút submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang xử lý...
                </span>
              ) : (
                '🚀 BẮT ĐẦU LÀM BÀI'
              )}
            </button>
          </form>
        </div>

        {/* Xem bảng xếp hạng */}
        <div className="mt-8 text-center">
          <a
            href="/contest/leaderboard"
            className="inline-block bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition"
          >
            📊 Xem Bảng Xếp Hạng
          </a>
        </div>
      </div>
    </div>
  );
}































