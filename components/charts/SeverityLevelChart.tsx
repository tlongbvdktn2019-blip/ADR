// =====================================================
// SEVERITY LEVEL CHART
// Pie chart showing severity level distribution
// =====================================================

'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Card from '@/components/ui/Card';

interface SeverityLevelData {
  severity: string;
  severityKey: string;
  count: number;
  percentage: number;
}

interface SeverityLevelChartProps {
  data: SeverityLevelData[];
  isLoading?: boolean;
}

const SEVERITY_COLORS = {
  'death': '#dc2626', // red-600
  'life_threatening': '#ea580c', // orange-600
  'hospitalization': '#d97706', // amber-600
  'prolongation': '#ca8a04', // yellow-600
  'disability': '#65a30d', // lime-600
  'congenital_anomaly': '#16a34a', // green-600
  'other_important': '#059669', // emerald-600
  'not_serious': '#0891b2', // cyan-600
  'unknown': '#6b7280' // gray-500
};

export default function SeverityLevelChart({ data, isLoading = false }: SeverityLevelChartProps) {
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
          Phân bố mức độ nghiêm trọng
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
          <p className="font-medium">{data.severity}</p>
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

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
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
        fontSize="12"
        fontWeight="bold"
      >
        {`${percentage}%`}
      </text>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Phân bố mức độ nghiêm trọng
        </h3>
        <div className="text-sm text-gray-500">
          Tổng: {data.reduce((sum, item) => sum + item.count, 0)} báo cáo
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
                  fill={SEVERITY_COLORS[entry.severityKey as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.unknown} 
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

      {/* Critical Cases Alert */}
      {data.some(item => ['death', 'life_threatening'].includes(item.severityKey)) && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-red-800">
              Có {data.filter(item => ['death', 'life_threatening'].includes(item.severityKey))
                      .reduce((sum, item) => sum + item.count, 0)} trường hợp nghiêm trọng
            </span>
          </div>
        </div>
      )}

      {/* Summary List */}
      <div className="mt-4 space-y-2">
        {data.slice(0, 5).map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded mr-2"
                style={{ 
                  backgroundColor: SEVERITY_COLORS[item.severityKey as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.unknown 
                }}
              ></div>
              <span className="text-gray-700">{item.severity}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{item.count}</span>
              <span className="text-gray-500">({item.percentage}%)</span>
            </div>
          </div>
        ))}
        {data.length > 5 && (
          <div className="text-xs text-gray-500 text-center pt-2">
            ... và {data.length - 5} mức độ khác
          </div>
        )}
      </div>
    </Card>
  );
}

