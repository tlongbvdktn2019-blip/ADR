// =====================================================
// MONTHLY TRENDS CHART
// Line chart showing monthly ADR reporting trends
// =====================================================

'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Card from '@/components/ui/Card';

interface MonthlyTrendsData {
  month: string;
  monthKey: string;
  total: number;
  serious: number;
  nonSerious: number;
}

interface MonthlyTrendsChartProps {
  data: MonthlyTrendsData[];
  isLoading?: boolean;
}

export default function MonthlyTrendsChart({ data, isLoading = false }: MonthlyTrendsChartProps) {
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
          Xu hướng báo cáo theo tháng
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-300 rounded shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((pld: any, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: pld.color }}
              ></div>
              <span className="text-sm">
                {pld.dataKey === 'total' && 'Tổng báo cáo: '}
                {pld.dataKey === 'serious' && 'Nghiêm trọng: '}
                {pld.dataKey === 'nonSerious' && 'Không nghiêm trọng: '}
                <span className="font-medium">{pld.value}</span>
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const totalReports = data.reduce((sum, item) => sum + item.total, 0);
  const totalSerious = data.reduce((sum, item) => sum + item.serious, 0);
  const seriousRate = totalReports > 0 ? Math.round((totalSerious / totalReports) * 100) : 0;

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">
          Xu hướng báo cáo theo tháng
        </h3>
        <div className="flex space-x-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{totalReports}</div>
            <div className="text-gray-500">Tổng báo cáo</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{totalSerious}</div>
            <div className="text-gray-500">Nghiêm trọng</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{seriousRate}%</div>
            <div className="text-gray-500">Tỷ lệ nghiêm trọng</div>
          </div>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            <Area
              type="monotone"
              dataKey="nonSerious"
              stackId="1"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.6}
              name="Không nghiêm trọng"
            />
            <Area
              type="monotone"
              dataKey="serious"
              stackId="1"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.8}
              name="Nghiêm trọng"
            />
            
            <Line
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              name="Tổng báo cáo"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Trend Analysis */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm font-medium text-blue-800">Tháng có nhiều báo cáo nhất</div>
          {(() => {
            const maxMonth = data.reduce((prev, current) => 
              (prev.total > current.total) ? prev : current
            );
            return (
              <div className="text-lg font-bold text-blue-600">
                {maxMonth.month}: {maxMonth.total} báo cáo
              </div>
            );
          })()}
        </div>
        
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="text-sm font-medium text-red-800">Tháng có nhiều ca nghiêm trọng nhất</div>
          {(() => {
            const maxSeriousMonth = data.reduce((prev, current) => 
              (prev.serious > current.serious) ? prev : current
            );
            return (
              <div className="text-lg font-bold text-red-600">
                {maxSeriousMonth.month}: {maxSeriousMonth.serious} ca
              </div>
            );
          })()}
        </div>
      </div>
    </Card>
  );
}

