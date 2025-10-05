'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Report {
  id: string;
  report_code: string;
  organization: string;
  reporter_name: string;
  patient_name: string;
  created_at: string;
}

export default function DebugReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      loadReports();
    }
  }, [status]);

  const loadReports = async () => {
    try {
      const response = await fetch('/api/reports?limit=100');
      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
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

  if (!session) {
    router.push('/auth/login');
    return null;
  }

  // Group by organization
  const grouped = reports.reduce((acc, report) => {
    const org = report.organization || 'Không xác định';
    if (!acc[org]) acc[org] = [];
    acc[org].push(report);
    return acc;
  }, {} as Record<string, Report[]>);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🐛 Debug: Dữ liệu Organization trong Reports
          </h1>
          
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Mục đích:</strong> Kiểm tra giá trị trường <code className="bg-blue-100 px-2 py-1 rounded">organization</code> 
              trong database để xem có đúng với "Nơi báo cáo" ở Phần A không.
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">📊 Tổng quan:</h2>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>Tổng số báo cáo: <strong>{reports.length}</strong></li>
              <li>Số đơn vị (organization): <strong>{Object.keys(grouped).length}</strong></li>
              <li>User role: <strong>{session.user.role}</strong></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-semibold">📋 Chi tiết theo Organization:</h2>
            
            {Object.entries(grouped).map(([org, orgReports]) => (
              <div key={org} className="border-2 border-gray-200 rounded-lg p-4">
                <h3 className="text-md font-semibold text-blue-900 mb-3">
                  🏥 {org} ({orgReports.length} báo cáo)
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mã BC</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Bệnh nhân</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Người báo cáo</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Organization</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Ngày tạo</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orgReports.map(report => (
                        <tr key={report.id}>
                          <td className="px-3 py-2">{report.report_code || 'N/A'}</td>
                          <td className="px-3 py-2">{report.patient_name}</td>
                          <td className="px-3 py-2">{report.reporter_name}</td>
                          <td className="px-3 py-2">
                            <code className="bg-yellow-100 px-2 py-1 rounded text-xs">
                              {report.organization}
                            </code>
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500">
                            {new Date(report.created_at).toLocaleDateString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/reports')}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Quay lại danh sách báo cáo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



