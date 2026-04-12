'use client'

import Card from '@/components/ui/Card'
import { DashboardKpis } from '@/lib/dashboard'
import {
  CheckBadgeIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

interface DashboardKpiGridProps {
  kpis: DashboardKpis
}

interface KpiItem {
  key: keyof DashboardKpis
  label: string
  helper: string
  icon: typeof DocumentTextIcon
  color: string
  suffix?: string
}

const KPI_ITEMS: KpiItem[] = [
  {
    key: 'totalReports',
    label: 'Tổng báo cáo',
    helper: 'Theo bộ lọc hiện tại',
    icon: DocumentTextIcon,
    color: 'from-sky-500 to-blue-600',
  },
  {
    key: 'seriousReports',
    label: 'Báo cáo nghiêm trọng',
    helper: 'Ca có mức độ nặng cao',
    icon: ExclamationTriangleIcon,
    color: 'from-rose-500 to-red-600',
  },
  {
    key: 'pendingReports',
    label: 'Chưa duyệt',
    helper: 'Ưu tiên xử lý',
    icon: ClipboardDocumentCheckIcon,
    color: 'from-amber-500 to-orange-500',
  },
  {
    key: 'completenessRate',
    label: 'Tỷ lệ hồ sơ đầy đủ',
    helper: 'Đủ cả 6 phần A-F',
    icon: CheckBadgeIcon,
    color: 'from-emerald-500 to-teal-600',
    suffix: '%',
  },
  {
    key: 'followUpRate',
    label: 'Tỷ lệ báo cáo bổ sung',
    helper: 'Loại báo cáo follow-up',
    icon: ArrowPathIcon,
    color: 'from-violet-500 to-purple-600',
    suffix: '%',
  },
  {
    key: 'preventableRate',
    label: 'Tỷ lệ ADR phòng tránh được',
    helper: 'Dựa trên kết quả phần F',
    icon: ShieldCheckIcon,
    color: 'from-cyan-500 to-sky-600',
    suffix: '%',
  },
]

export default function DashboardKpiGrid({ kpis }: DashboardKpiGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {KPI_ITEMS.map((item) => {
        const Icon = item.icon
        const rawValue = kpis[item.key]
        const displayValue = `${rawValue}${item.suffix || ''}`

        return (
          <Card key={item.key} className="relative overflow-hidden border-0 bg-white/90 shadow-sm ring-1 ring-gray-200">
            <div className={`absolute right-0 top-0 h-24 w-24 -translate-y-6 translate-x-6 rounded-full bg-gradient-to-br ${item.color} opacity-15`} />
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">{item.label}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{displayValue}</p>
                <p className="mt-2 text-xs text-gray-500">{item.helper}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
