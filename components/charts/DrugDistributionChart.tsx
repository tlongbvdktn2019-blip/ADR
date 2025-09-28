// =====================================================
// DRUG DISTRIBUTION CHART
// Horizontal bar chart showing top drugs causing ADR
// =====================================================

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Card from '@/components/ui/Card';

interface DrugDistributionData {
  drugName: string;
  count: number;
  percentage: number;
}

interface DrugDistributionChartProps {
  data: DrugDistributionData[];
  isLoading?: boolean;
}

const DRUG_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
];

export default function DrugDistributionChart({ data, isLoading = false }: DrugDistributionChartProps) {
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
          Top thuốc gây ADR
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

  // Sort data by count and take top 10
  const sortedData = [...data].sort((a, b) => b.count - a.count).slice(0, 10);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-300 rounded shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">
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
    if (width < 30) return null; // Don't show labels on small bars
    
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
          Top 10 thuốc gây ADR
        </h3>
        <div className="text-sm text-gray-500">
          Tổng: {data.reduce((sum, item) => sum + item.count, 0)} trường hợp
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="horizontal"
            margin={{
              top: 20,
              right: 30,
              left: 100,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              type="number"
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              type="category"
              dataKey="drugName"
              stroke="#6b7280"
              fontSize={12}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count"
              radius={[0, 4, 4, 0]}
              label={<CustomizedLabel />}
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={DRUG_COLORS[index % DRUG_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Drugs Summary */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Chi tiết top 5:</h4>
        <div className="space-y-2">
          {sortedData.slice(0, 5).map((drug, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded mr-3"
                  style={{ backgroundColor: DRUG_COLORS[index % DRUG_COLORS.length] }}
                ></div>
                <span className="font-medium text-gray-900">{drug.drugName}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold text-gray-900">{drug.count}</span>
                <span className="text-sm text-gray-500">({drug.percentage}%)</span>
                <div className="flex items-center">
                  {index === 0 && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Top 1</span>}
                  {index === 1 && <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Top 2</span>}
                  {index === 2 && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Top 3</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drug Categories Alert */}
      {sortedData.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 mt-2"></div>
            <div>
              <div className="text-sm font-medium text-blue-800 mb-1">
                Thông tin quan trọng
              </div>
              <div className="text-xs text-blue-700">
                • {sortedData[0]?.drugName} là thuốc gây ADR nhiều nhất ({sortedData[0]?.count} trường hợp)
                <br />
                • Cần đặc biệt chú ý khi kê đơn các thuốc trong top 5
                <br />
                • Theo dõi chặt chẽ bệnh nhân khi sử dụng các thuốc có tỷ lệ ADR cao
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

