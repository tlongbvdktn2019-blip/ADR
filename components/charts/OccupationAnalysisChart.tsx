// =====================================================
// OCCUPATION ANALYSIS CHART
// Pie/Donut chart showing reports distribution by occupation
// =====================================================

'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Card from '@/components/ui/Card';
import { useState } from 'react';

interface OccupationData {
  profession: string;
  count: number;
  percentage: number;
}

interface OccupationAnalysisChartProps {
  data: OccupationData[];
  isLoading?: boolean;
}

const OCCUPATION_COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280',
  '#0ea5e9', '#f97316', '#84cc16', '#8b5cf6', '#f59e0b'
];

const OCCUPATION_LABELS: { [key: string]: string } = {
  'Bác sĩ': 'Bác sĩ',
  'Dược sĩ': 'Dược sĩ', 
  'Điều dưỡng': 'Điều dưỡng',
  'Kỹ thuật viên': 'Kỹ thuật viên',
  'Sinh viên Y': 'Sinh viên Y',
  'Sinh viên Dược': 'Sinh viên Dược',
  'Y tá': 'Y tá',
  'Khác': 'Khác'
};

export default function OccupationAnalysisChart({ data, isLoading = false }: OccupationAnalysisChartProps) {
  const [viewMode, setViewMode] = useState<'pie' | 'bar'>('pie');

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
          Phân tích báo cáo theo nghề nghiệp
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

  // Sort data by count 
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-medium text-gray-900">{data.profession}</p>
          <p className="text-blue-600">
            {`Số báo cáo: ${data.count}`}
          </p>
          <p className="text-gray-600">
            {`Tỷ lệ: ${data.percentage}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Phân tích báo cáo theo nghề nghiệp
        </h3>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500">
            Tổng: {data.reduce((sum, item) => sum + item.count, 0)} báo cáo
          </div>
          <div className="flex bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode('pie')}
              className={`px-3 py-1 text-xs rounded ${
                viewMode === 'pie'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pie
            </button>
            <button
              onClick={() => setViewMode('bar')}
              className={`px-3 py-1 text-xs rounded ${
                viewMode === 'bar'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bar
            </button>
          </div>
        </div>
      </div>
      
      <div className="h-80">
        {viewMode === 'pie' ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sortedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={100}
                innerRadius={40}
                fill="#8884d8"
                dataKey="count"
                stroke="#fff"
                strokeWidth={2}
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={OCCUPATION_COLORS[index % OCCUPATION_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="profession"
                stroke="#6b7280"
                fontSize={11}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count"
                radius={[4, 4, 0, 0]}
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={OCCUPATION_COLORS[index % OCCUPATION_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Occupation Statistics */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Thống kê theo nghề nghiệp:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sortedData.map((occupation, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: OCCUPATION_COLORS[index % OCCUPATION_COLORS.length] }}
                ></div>
                <span className="text-sm text-gray-900 font-medium">{occupation.profession}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-gray-900">{occupation.count}</span>
                <span className="text-xs text-gray-500">({occupation.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Professional Insights */}
      {sortedData.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-2 mt-2"></div>
            <div>
              <div className="text-sm font-medium text-green-800 mb-1">
                Phân tích nghề nghiệp báo cáo ADR
              </div>
              <div className="text-xs text-green-700">
                • {sortedData[0]?.profession} là nhóm nghề nghiệp báo cáo nhiều nhất ({sortedData[0]?.count} báo cáo - {sortedData[0]?.percentage}%)
                <br />
                • Có {sortedData.length} nhóm nghề nghiệp tham gia báo cáo ADR
                <br />
                • Cần tăng cường đào tạo và nhận thức về báo cáo ADR cho các nhóm nghề khác
                <br />
                • Khuyến khích các chuyên gia y tế tích cực tham gia hệ thống giám sát ADR
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}









