// =====================================================
// OUTCOME DISTRIBUTION CHART
// Doughnut chart showing treatment outcomes after ADR
// =====================================================

'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Card from '@/components/ui/Card';

interface OutcomeDistributionData {
  outcome: string;
  outcomeKey: string;
  count: number;
  percentage: number;
}

interface OutcomeDistributionChartProps {
  data: OutcomeDistributionData[];
  isLoading?: boolean;
}

const OUTCOME_COLORS = {
  'completely_recovered': '#10b981', // green-500
  'recovering': '#3b82f6', // blue-500
  'not_recovered': '#f59e0b', // amber-500
  'recovered_with_sequelae': '#f97316', // orange-500
  'death': '#ef4444', // red-500
  'unknown': '#6b7280' // gray-500
};

export default function OutcomeDistributionChart({ data, isLoading = false }: OutcomeDistributionChartProps) {
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
          Kết quả sau điều trị
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
          <p className="font-medium">{data.outcome}</p>
          <p className="text-blue-600">
            {`Số trường hợp: ${data.count}`}
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
    if (percentage < 8) return null; // Don't show labels for small slices
    
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

  // Calculate recovery rate
  const recoveredCount = data.find(item => item.outcomeKey === 'completely_recovered')?.count || 0;
  const recoveringCount = data.find(item => item.outcomeKey === 'recovering')?.count || 0;
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);
  const recoveryRate = totalCount > 0 ? Math.round(((recoveredCount + recoveringCount) / totalCount) * 100) : 0;

  // Calculate death rate  
  const deathCount = data.find(item => item.outcomeKey === 'death')?.count || 0;
  const deathRate = totalCount > 0 ? Math.round((deathCount / totalCount) * 100) : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Kết quả sau điều trị
        </h3>
        <div className="text-sm text-gray-500">
          Tổng: {totalCount} trường hợp
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
              innerRadius={40}
              fill="#8884d8"
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={OUTCOME_COLORS[entry.outcomeKey as keyof typeof OUTCOME_COLORS] || OUTCOME_COLORS.unknown} 
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

      {/* Key Statistics */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{recoveryRate}%</div>
          <div className="text-sm text-green-800">Tỷ lệ hồi phục</div>
          <div className="text-xs text-gray-600 mt-1">
            {recoveredCount + recoveringCount} / {totalCount} trường hợp
          </div>
        </div>
        
        {deathCount > 0 && (
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{deathRate}%</div>
            <div className="text-sm text-red-800">Tỷ lệ tử vong</div>
            <div className="text-xs text-gray-600 mt-1">
              {deathCount} / {totalCount} trường hợp
            </div>
          </div>
        )}
        
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {data.filter(item => item.outcomeKey !== 'unknown').length}
          </div>
          <div className="text-sm text-blue-800">Có kết quả rõ ràng</div>
          <div className="text-xs text-gray-600 mt-1">
            {Math.round((data.filter(item => item.outcomeKey !== 'unknown').reduce((sum, item) => sum + item.count, 0) / totalCount) * 100)}% trường hợp
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Chi tiết kết quả:</h4>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded mr-2"
                  style={{ 
                    backgroundColor: OUTCOME_COLORS[item.outcomeKey as keyof typeof OUTCOME_COLORS] || OUTCOME_COLORS.unknown 
                  }}
                ></div>
                <span className="text-gray-700">{item.outcome}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{item.count}</span>
                <span className="text-gray-500">({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {deathCount > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-red-800">
              Cảnh báo: Có {deathCount} trường hợp tử vong ({deathRate}%)
            </span>
          </div>
        </div>
      )}
      
      {recoveryRate >= 80 && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-green-800">
              Tích cực: Tỷ lệ hồi phục cao ({recoveryRate}%)
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

