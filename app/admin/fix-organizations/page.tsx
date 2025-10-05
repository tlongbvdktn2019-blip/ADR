'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface InvalidReport {
  id: string;
  report_code: string;
  organization: string;
  patient_name: string;
  reporter_name: string;
}

export default function FixOrganizationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [validOrgs, setValidOrgs] = useState<string[]>([]);
  const [invalidReports, setInvalidReports] = useState<InvalidReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState<string | null>(null);
  const [selectedOrgs, setSelectedOrgs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      loadData();
    }
  }, [status, session]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/fix-organizations');
      const data = await response.json();

      if (data.success) {
        setValidOrgs(data.data.validOrganizations);
        setInvalidReports(data.data.invalidReports);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Có lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleFix = async (reportId: string) => {
    const newOrg = selectedOrgs[reportId];
    if (!newOrg) {
      alert('Vui lòng chọn đơn vị mới');
      return;
    }

    if (!confirm('Bạn có chắc chắn muốn cập nhật organization cho báo cáo này?')) {
      return;
    }

    setFixing(reportId);

    try {
      const response = await fetch('/api/admin/fix-organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: reportId,
          new_organization: newOrg
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Cập nhật thành công!');
        loadData(); // Reload
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (error) {
      console.error('Error fixing:', error);
      alert('Có lỗi xảy ra');
    } finally {
      setFixing(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🔧 Sửa Organization cho Báo cáo
          </h1>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Danh sách đơn vị hợp lệ ({validOrgs.length}):</strong>
            </p>
            <div className="flex flex-wrap gap-2">
              {validOrgs.map(org => (
                <span key={org} className="bg-blue-100 px-3 py-1 rounded-full text-xs">
                  {org}
                </span>
              ))}
            </div>
          </div>

          {invalidReports.length === 0 ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
              <p className="text-green-800 font-semibold">
                ✅ Tất cả báo cáo đều có organization hợp lệ!
              </p>
            </div>
          ) : (
            <>
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 font-semibold">
                  ⚠️ Tìm thấy {invalidReports.length} báo cáo có organization không hợp lệ
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Mã BC</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Bệnh nhân</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Người báo cáo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Organization hiện tại</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Chọn đơn vị mới</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invalidReports.map(report => (
                      <tr key={report.id}>
                        <td className="px-4 py-3 text-sm">{report.report_code || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">{report.patient_name}</td>
                        <td className="px-4 py-3 text-sm">{report.reporter_name}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="bg-red-100 px-2 py-1 rounded text-xs">
                            {report.organization}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={selectedOrgs[report.id] || ''}
                            onChange={(e) => setSelectedOrgs({
                              ...selectedOrgs,
                              [report.id]: e.target.value
                            })}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="">-- Chọn --</option>
                            {validOrgs.map(org => (
                              <option key={org} value={org}>{org}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleFix(report.id)}
                            disabled={fixing === report.id || !selectedOrgs[report.id]}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                          >
                            {fixing === report.id ? 'Đang sửa...' : 'Sửa'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/admin/debug-reports')}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Quay lại Debug
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



