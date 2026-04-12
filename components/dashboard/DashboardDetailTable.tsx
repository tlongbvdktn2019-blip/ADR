'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import { DashboardReportPreview, DASHBOARD_SECTION_META } from '@/lib/dashboard'

interface DashboardDetailTableProps {
  reports: DashboardReportPreview[]
}

export default function DashboardDetailTable({ reports }: DashboardDetailTableProps) {
  return (
    <Card
      title="Bảng Báo Cáo Chi Tiết"
      subtitle="20 hồ sơ gần nhất theo bộ lọc hiện tại, dùng để đi từ thống kê sang xử lý chi tiết"
    >
      {reports.length === 0 ? (
        <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">Không có dữ liệu để hiển thị.</div>
      ) : (
        <div className="table-container">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Báo cáo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Bệnh nhân</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Đơn vị</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Mức độ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Duyệt</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">A-F</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 align-top">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{report.reportCode}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(report.reportDate).toLocaleDateString('vi-VN')} • {report.reportTypeLabel}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="text-sm text-gray-900">{report.patientName}</p>
                    <p className="mt-1 text-xs text-gray-500">{report.reporterName}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="text-sm text-gray-900">{report.organization}</p>
                    <p className="mt-1 text-xs text-gray-500">{report.reporterProfession}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
                      {report.severityLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                      {report.approvalLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      {DASHBOARD_SECTION_META.map((section) => (
                        <span
                          key={section.key}
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                            report.sectionStatus[section.key]
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                          title={section.title}
                        >
                          {section.key}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <Link
                      href={`/reports/${report.id}`}
                      className="text-sm font-semibold text-blue-600 transition hover:text-blue-800"
                    >
                      Mở báo cáo
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
