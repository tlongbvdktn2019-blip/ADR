'use client'

import { FunnelIcon } from '@heroicons/react/24/outline'
import type { DashboardFilterOption, DashboardFilters as DashboardFiltersType } from '@/lib/dashboard'

interface DashboardFiltersProps {
  filters: DashboardFiltersType
  years: DashboardFilterOption[]
  organizations: DashboardFilterOption[]
  professions: DashboardFilterOption[]
  approvalOptions: DashboardFilterOption[]
  severityOptions: DashboardFilterOption[]
  reportTypeOptions: DashboardFilterOption[]
  onChange: (key: keyof DashboardFiltersType, value: string) => void
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: DashboardFilterOption[]
  onChange: (value: string) => void
}) {
  return (
    <label className="flex min-w-[150px] flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function DashboardFilters({
  filters,
  years,
  organizations,
  professions,
  approvalOptions,
  severityOptions,
  reportTypeOptions,
  onChange,
}: DashboardFiltersProps) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm backdrop-blur">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-full bg-blue-50 p-2 text-blue-600">
          <FunnelIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Bộ lọc dashboard</h2>
          <p className="text-xs text-gray-500">Tất cả KPI, hàng chờ và tab A-F sẽ cập nhật theo cùng bộ lọc này.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <FilterSelect label="Năm" value={filters.year} options={years} onChange={(value) => onChange('year', value)} />
        <FilterSelect
          label="Đơn vị"
          value={filters.organization}
          options={organizations}
          onChange={(value) => onChange('organization', value)}
        />
        <FilterSelect
          label="Trạng thái duyệt"
          value={filters.approvalStatus}
          options={approvalOptions}
          onChange={(value) => onChange('approvalStatus', value)}
        />
        <FilterSelect
          label="Mức độ nghiêm trọng"
          value={filters.severity}
          options={severityOptions}
          onChange={(value) => onChange('severity', value)}
        />
        <FilterSelect
          label="Loại báo cáo"
          value={filters.reportType}
          options={reportTypeOptions}
          onChange={(value) => onChange('reportType', value)}
        />
        <FilterSelect
          label="Nghề nghiệp"
          value={filters.profession}
          options={professions}
          onChange={(value) => onChange('profession', value)}
        />
      </div>
    </div>
  )
}
