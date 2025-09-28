// =====================================================
// TOP 10 FACILITIES CHART
// Horizontal bar chart showing top 10 facilities with most reports
// =====================================================

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Card from '@/components/ui/Card';

interface FacilityData {
  facilityName: string;
  count: number;
  percentage: number;
}

interface Top10FacilitiesChartProps {
  data: FacilityData[];
  isLoading?: boolean;
}

const FACILITY_COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
];

export default function Top10FacilitiesChart({ data, isLoading = false }: Top10FacilitiesChartProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top 10 cơ sở có nhiều báo cáo nhất
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full"></div>
            <p>Chưa có dữ liệu</p>
          </div>
        </div>
      </Card>
    );
  }

  const sortedData = [...data].sort((a, b) => b.count - a.count).slice(0, 10);
  const normalizedData = sortedData.map(item => ({
    ...item,
    count: Number(item.count ?? 0),
    percentage: Number(item.percentage ?? 0),
  }));
  const maxCount = Math.max(...normalizedData.map(item => item.count), 1);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-300 rounded shadow-lg max-w-xs">
          <p className="font-medium text-wrap">{label}</p>
          <p className="text-red-600">
            {`Số báo cáo: ${payload[0].value}`}
          </p>
          <p className="text-gray-600">
            {`Tỷ lệ: ${payload[0].payload.percentage}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomizedLabel = ({ x, y, width, value }: any) => {
    if (width < 30) return null;

    return (
      <text
        x={x + width - 5}
        y={y + 15}
        fill="white"
        textAnchor="end"
        dominantBaseline="middle"
        fontSize="12"
        fontWeight="bold"
      >
        {value}
      </text>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Top 10 cơ sở có nhiều báo cáo nhất
        </h3>
        <div className="text-sm text-gray-500">
          Tổng: {normalizedData.reduce((sum, item) => sum + item.count, 0)} báo cáo
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={normalizedData}
            layout="vertical"
            margin={{
              top: 20,
              right: 30,
              left: 120,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              stroke="#6b7280"
              fontSize={12}
              domain={[0, maxCount]}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="facilityName"
              stroke="#6b7280"
              fontSize={11}
              width={120}
              tick={{ fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="count"
              radius={[0, 4, 4, 0]}
              label={<CustomizedLabel />}
            >
              {normalizedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={FACILITY_COLORS[index % FACILITY_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Chi tiết top 5:</h4>
        <div className="space-y-2">
          {normalizedData.slice(0, 5).map((facility, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div
                  className="w-4 h-4 rounded mr-3 flex-shrink-0"
                  style={{ backgroundColor: FACILITY_COLORS[index % FACILITY_COLORS.length] }}
                ></div>
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-gray-900 text-sm block truncate" title={facility.facilityName}>
                    {facility.facilityName}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-3 flex-shrink-0">
                <span className="text-lg font-bold text-gray-900">{facility.count}</span>
                <span className="text-sm text-gray-500">({facility.percentage}%)</span>
                <div className="flex items-center">
                  {index === 0 && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-medium">Top 1</span>}
                  {index === 1 && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">Top 2</span>}
                  {index === 2 && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">Top 3</span>}
                  {index === 3 && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium">Top 4</span>}
                  {index === 4 && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">Top 5</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {normalizedData.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <div className="w-2 h-2 bg-red-600 rounded-full mr-2 mt-2 flex-shrink-0"></div>
            <div>
              <div className="text-sm font-medium text-red-800 mb-1">
                Thông tin quan trọng
              </div>
              <div className="text-xs text-red-700">
                • {normalizedData[0]?.facilityName} là cơ sở có nhiều báo cáo ADR nhất ({normalizedData[0]?.count} báo cáo)
                <br />
                • Top 5 cơ sở chiếm {normalizedData.slice(0, 5).reduce((sum, item) => sum + item.percentage, 0)}% tổng số báo cáo
                <br />
                • Cần tăng cường giám sát và hỗ trợ các cơ sở có số báo cáo cao
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
