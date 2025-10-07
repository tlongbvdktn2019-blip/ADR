'use client';

import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import ADRPerformanceForm from '@/components/forms/ADRPerformanceForm';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ADRPerformanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <div>
          <button
            onClick={() => router.push('/adr-performance')}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Quay lại danh sách
          </button>
        </div>

        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Đánh giá hiệu quả hoạt động ADR
          </h1>
          <p className="text-gray-600">
            Thực hiện đánh giá theo các chỉ tiêu giám sát ADR
          </p>
        </div>

        {/* Form */}
        <ADRPerformanceForm 
          assessmentId={assessmentId}
          onSave={() => router.push('/adr-performance')}
        />
      </div>
    </MainLayout>
  );
}


