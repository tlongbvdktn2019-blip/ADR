'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import { DashboardReportPreview } from '@/lib/dashboard'
import { ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

interface DashboardQueueProps {
  reports: DashboardReportPreview[]
}

export default function DashboardQueue({ reports }: DashboardQueueProps) {
  return (
    <Card title="Hàng Chờ Xử Lý" subtitle="Ưu tiên phê duyệt hoặc hoàn thiện các hồ sơ còn thiếu">
      {reports.length === 0 ? (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
          Không có báo cáo nào đang chờ xử lý trong bộ lọc hiện tại.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/reports/${report.id}`}
              className="block rounded-2xl border border-gray-200 bg-gray-50 p-4 transition hover:border-blue-300 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{report.reportCode}</h3>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
                      {report.approvalLabel}
                    </span>
                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
                      {report.severityLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">
                    {report.patientName} • {report.organization}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {report.reporterProfession} • {report.reportTypeLabel}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <ClockIcon className="h-4 w-4" />
                  <span>{new Date(report.reportDate).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {report.queueReasons.map((reason) => (
                    <span
                      key={reason}
                      className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200"
                    >
                      <ExclamationCircleIcon className="h-3.5 w-3.5" />
                      {reason}
                    </span>
                  ))}
                </div>
                <div className="text-xs font-medium text-gray-600">
                  {report.completedSections}/6 phần
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  )
}
