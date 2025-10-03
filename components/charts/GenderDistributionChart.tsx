// =====================================================
// GENDER DISTRIBUTION CHART
// Pie chart showing gender distribution
// =====================================================

'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Card from '@/components/ui/Card';

interface GenderData {
  gender: string;
  genderKey: string;
  count: number;
  percentage: number;
}

interface GenderDistributionChartProps {
  data: GenderData[];
  isLoading?: boolean;
}

const GENDER_COLORS = {
  'male': '#3b82f6', // blue-500
  'female': '#ec4899', // pink-500
  'other': '#8b5cf6', // purple-500
  'unknown': '#6b7280' // gray-500
};

const GENDER_LABELS = {
  'male': 'Nam',
  'female': 'Nữ',
  'other': 'Khác',
  'unknown': 'Chưa xác định'
};

export default function GenderDistributionChart({ data, isLoading = false }: GenderDistributionChartProps) {
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
          Phân bố theo giới tính
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-300 rounded shadow-lg">
          <p className="font-medium">{data.gender}</p>
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

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage, index }: any) => {
    if (percentage < 5) return null; // Don't show labels for small slices
    
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
        fontSize="14"
        fontWeight="bold"
      >
        {`${percentage}%`}
      </text>
    );
  };

  const totalCount = data.reduce((sum, item) => sum + item.count, 0);
  const maleData = data.find(item => item.genderKey === 'male');
  const femaleData = data.find(item => item.genderKey === 'female');

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Phân bố theo giới tính
        </h3>
        <div className="text-sm text-gray-500">
          Tổng: {totalCount} báo cáo
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={GENDER_COLORS[entry.genderKey as keyof typeof GENDER_COLORS] || GENDER_COLORS.unknown} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Gender Statistics */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {data.map((item, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ 
                    backgroundColor: GENDER_COLORS[item.genderKey as keyof typeof GENDER_COLORS] || GENDER_COLORS.unknown 
                  }}
                ></div>
                <span className="text-sm font-medium text-gray-700">{item.gender}</span>
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-gray-900">{item.count}</span>
              <span className="text-sm text-gray-500">({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>

      {/* Gender Ratio Analysis */}
      {maleData && femaleData && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 mt-2 flex-shrink-0"></div>
            <div>
              <div className="text-sm font-medium text-blue-800 mb-1">
                Phân tích tỷ lệ giới tính
              </div>
              <div className="text-xs text-blue-700">
                • Tỷ lệ Nam/Nữ: {maleData.count > 0 && femaleData.count > 0 
                  ? `${(maleData.count / femaleData.count).toFixed(2)} : 1`
                  : 'N/A'}
                <br />
                • {maleData.count > femaleData.count 
                  ? `Nam giới có xu hướng báo cáo nhiều hơn (${Math.abs(maleData.percentage - femaleData.percentage).toFixed(1)}%)`
                  : maleData.count < femaleData.count
                  ? `Nữ giới có xu hướng báo cáo nhiều hơn (${Math.abs(femaleData.percentage - maleData.percentage).toFixed(1)}%)`
                  : 'Tỷ lệ cân bằng giữa Nam và Nữ'}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

