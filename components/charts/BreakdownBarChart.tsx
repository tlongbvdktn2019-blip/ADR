'use client'

import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import Card from '@/components/ui/Card'
import { DashboardBreakdownDatum } from '@/lib/dashboard'

interface BreakdownBarChartProps {
  title: string
  subtitle?: string
  data: DashboardBreakdownDatum[]
  isLoading?: boolean
  emptyText?: string
  color?: string
}

const PALETTE = ['#1d4ed8', '#2563eb', '#0f766e', '#ca8a04', '#dc2626', '#7c3aed', '#ea580c', '#059669']

export default function BreakdownBarChart({
  title,
  subtitle,
  data,
  isLoading = false,
  emptyText = 'Chưa có dữ liệu',
  color,
}: BreakdownBarChartProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 w-1/3 rounded bg-gray-200" />
          <div className="mt-4 h-64 rounded bg-gray-200" />
        </div>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        <div className="flex h-64 items-center justify-center text-sm text-gray-500">{emptyText}</div>
      </Card>
    )
  }

  const chartColor = color || PALETTE[0]
  const normalizedData = [...data]
    .map((item) => ({
      ...item,
      count: Number(item.count || 0),
      percentage: Number(item.percentage || 0),
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 8)

  const total = normalizedData.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>
        <div className="text-sm text-gray-500">Tổng: {total}</div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={normalizedData}
            layout="vertical"
            margin={{ top: 8, right: 24, left: 80, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" allowDecimals={false} stroke="#6b7280" fontSize={12} />
            <YAxis type="category" dataKey="label" width={100} stroke="#6b7280" fontSize={12} />
            <Tooltip
              formatter={(value: number, _name: string, entry: { payload?: DashboardBreakdownDatum }) => [
                `${value} (${entry.payload?.percentage || 0}%)`,
                'Số lượng',
              ]}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]}>
              {normalizedData.map((_, index) => (
                <Cell key={index} fill={color || PALETTE[index % PALETTE.length] || chartColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-2">
        {normalizedData.slice(0, 5).map((item, index) => (
          <div key={item.key} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: color || PALETTE[index % PALETTE.length] || chartColor }}
              />
              <span>{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{item.count}</span>
              <span className="text-gray-500">({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
