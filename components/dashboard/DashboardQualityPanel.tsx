'use client'

import Card from '@/components/ui/Card'
import { DashboardKpis, DashboardQualitySignal } from '@/lib/dashboard'

interface DashboardQualityPanelProps {
  qualitySignals: DashboardQualitySignal[]
  kpis: DashboardKpis
}

export default function DashboardQualityPanel({ qualitySignals, kpis }: DashboardQualityPanelProps) {
  return (
    <Card
      title="Tín Hiệu Chất Lượng"
      subtitle="Các chỉ báo nhanh để xem độ dày dữ liệu và mức độ hoạt động trong kỳ"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Báo cáo tháng này</p>
          <p className="mt-2 text-2xl font-bold text-blue-900">{kpis.newReportsThisMonth}</p>
        </div>
        <div className="rounded-xl bg-violet-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Báo cáo hôm nay</p>
          <p className="mt-2 text-2xl font-bold text-violet-900">{kpis.newReportsToday}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {qualitySignals.map((signal) => (
          <div key={signal.key}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-gray-700">{signal.label}</span>
              <span className="font-semibold text-gray-900">
                {signal.count} ({signal.percentage}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${signal.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
