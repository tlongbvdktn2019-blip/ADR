'use client'

import Card from '@/components/ui/Card'
import { DashboardMissingField, DashboardSectionKey, DashboardSectionSummary } from '@/lib/dashboard'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface SectionCompletionMapProps {
  sections: DashboardSectionSummary[]
  missingFields: DashboardMissingField[]
  activeSection: DashboardSectionKey
  onSelectSection: (section: DashboardSectionKey) => void
}

export default function SectionCompletionMap({
  sections,
  missingFields,
  activeSection,
  onSelectSection,
}: SectionCompletionMapProps) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
      <Card
        title="Bản Đồ Nội Dung Báo Cáo"
        subtitle="Theo dõi mức độ hoàn chỉnh của từng phần A-F trong bộ lọc đang xem"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => {
            const isActive = activeSection === section.key

            return (
              <button
                key={section.key}
                type="button"
                onClick={() => onSelectSection(section.key)}
                className={`rounded-2xl border p-4 text-left transition ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex rounded-full bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white">
                      {section.shortLabel}
                    </span>
                    <h3 className="mt-3 text-lg font-semibold text-gray-900">{section.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{section.description}</p>
                  </div>
                  <div className="rounded-full bg-white p-2 shadow-sm ring-1 ring-gray-200">
                    {section.completionRate >= 70 ? (
                      <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">Tỷ lệ hoàn chỉnh</span>
                    <span className="font-semibold text-gray-900">{section.completionRate}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className={`h-2 rounded-full ${
                        section.completionRate >= 70
                          ? 'bg-emerald-500'
                          : section.completionRate >= 40
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                      }`}
                      style={{ width: `${section.completionRate}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                    <span>Đủ: {section.completeCount}</span>
                    <span>Thiếu: {section.missingCount}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <Card
        title="Điểm Nghẽn Dữ Liệu"
        subtitle="Các trường hay thiếu nhất trong hồ sơ ADR hiện tại"
      >
        <div className="space-y-3">
          {missingFields.length === 0 && (
            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              Không có trường dữ liệu nào bị thiếu trong tập báo cáo đang lọc.
            </div>
          )}

          {missingFields.map((field) => (
            <div key={field.key} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{field.label}</p>
                  <p className="mt-1 text-xs text-gray-500">Ảnh hưởng tới {field.sectionKey}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-rose-600">{field.count}</p>
                  <p className="text-xs text-gray-500">{field.percentage}% hồ sơ</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
