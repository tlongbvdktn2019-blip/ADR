'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function MigrateCodesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (status === 'loading') {
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

  const handleMigrate = async () => {
    if (!confirm('Bạn có chắc chắn muốn tạo mã báo cáo cho các báo cáo cũ?')) {
      return;
    }

    setMigrating(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/migrate-report-codes', {
        method: 'POST'
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        alert(data.message);
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (error) {
      console.error('Migration error:', error);
      alert('Có lỗi xảy ra khi migration');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Migration: Tạo Mã Báo Cáo
          </h1>
          
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Chú ý:</strong> Script này sẽ tự động tạo mã báo cáo cho các báo cáo cũ chưa có mã.
              Mã sẽ được tạo theo định dạng: <code className="bg-yellow-100 px-2 py-1 rounded">CODE-XXX-YEAR</code>
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleMigrate}
              disabled={migrating}
              className="w-full"
            >
              {migrating ? 'Đang xử lý...' : '🔄 Chạy Migration'}
            </Button>

            {result && (
              <div className={`p-4 rounded-lg ${
                result.success ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
              }`}>
                <h3 className={`font-semibold mb-2 ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.success ? '✅ Thành công' : '❌ Lỗi'}
                </h3>
                <p className={result.success ? 'text-green-800' : 'text-red-800'}>
                  {result.message}
                </p>
                
                {result.details && (
                  <div className="mt-3 text-sm">
                    <ul className="space-y-1">
                      <li>📊 Tổng số: {result.details.total}</li>
                      <li>✅ Thành công: {result.details.success}</li>
                      {result.details.error > 0 && (
                        <li>❌ Lỗi: {result.details.error}</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => router.push('/admin/departments')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Quay lại quản lý đơn vị
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

