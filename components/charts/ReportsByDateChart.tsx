// =====================================================
// REPORTS BY MONTH CHART  
// Line/Area chart showing monthly report trends (last 12 months)
// =====================================================

'use client';

import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '@/components/ui/Card';
import { useState } from 'react';

interface ReportsByMonthData {
  date: string; // Monthly display (e.g., "Th1 2025")
  dateKey: string; // Month key (YYYY-MM)
  total: number;
  serious: number;
  nonSerious: number;
}

interface ReportsByDateChartProps {
  data: ReportsByMonthData[];
  isLoading?: boolean;
}

export default function ReportsByDateChart({ data, isLoading = false }: ReportsByDateChartProps) {
  const [viewMode, setViewMode] = useState<'line' | 'area'>('area');

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
          Số lượng báo cáo theo tháng (12 tháng gần nhất)
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

  const totalReports = data.reduce((sum, item) => sum + item.total, 0);
  const totalSeriousReports = data.reduce((sum, item) => sum + item.serious, 0);
  const averageMonthly = totalReports / data.length;
  const maxMonthly = Math.max(...data.map(item => item.total));

  const dailyStats = data.reduce(
    (acc, item) => {
      const [yearStr, monthStr] = item.dateKey?.split('-') ?? [];
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const daysInMonth = Number.isFinite(year) && Number.isFinite(month)
        ? new Date(year, month, 0).getDate()
        : 30;

      acc.totalDays += daysInMonth;

      if (daysInMonth > 0) {
        acc.maxDaily = Math.max(acc.maxDaily, item.total / daysInMonth);
      }

      return acc;
    },
    { totalDays: 0, maxDaily: 0 }
  );

  const averageDaily = dailyStats.totalDays > 0 ? totalReports / dailyStats.totalDays : 0;
  const maxDaily = Math.ceil(dailyStats.maxDaily);

  const lastMonth = data[data.length - 1];
  const previousMonth = data.length > 1 ? data[data.length - 2] : null;
  const monthOverMonthChange = previousMonth ? lastMonth.total - previousMonth.total : 0;
  const monthOverMonthRate = previousMonth
    ? previousMonth.total > 0
      ? (monthOverMonthChange / previousMonth.total) * 100
      : lastMonth.total > 0
        ? 100
        : 0
    : 0;
  const seriousRate = totalReports > 0 ? (totalSeriousReports / totalReports) * 100 : 0;
  const trendSummary = (() => {
    if (!lastMonth) {
      return 'Chưa có dữ liệu xu hướng';
    }

    if (!previousMonth) {
      return `Dữ liệu khởi tạo từ ${lastMonth.date}`;
    }

    if (monthOverMonthChange === 0) {
      return `Tháng gần nhất (${lastMonth.date}) giữ nguyên so với tháng trước`;
    }

    const direction = monthOverMonthChange > 0 ? 'tăng' : 'giảm';
    return `Tháng gần nhất (${lastMonth.date}) ${direction} ${Math.abs(monthOverMonthChange)} báo cáo (${Math.abs(monthOverMonthRate).toFixed(1)}%) so với tháng trước`;
  })();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-300 rounded shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{`Ngày: ${label}`}</p>
          <div className="space-y-1">
            <p className="text-blue-600 text-sm">
              {`Tổng báo cáo: ${data.total}`}
            </p>
            <p className="text-red-600 text-sm">
              {`Nghiêm trọng: ${data.serious}`}
            </p>
            <p className="text-green-600 text-sm">
              {`Không nghiêm trọng: ${data.nonSerious}`}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Số lượng báo cáo theo tháng
          </h3>
          <p className="text-sm text-gray-600">12 tháng gần nhất</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">Tổng báo cáo</div>
            <div className="text-lg font-bold text-blue-600">{totalReports}</div>
          </div>
          <div className="flex bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode('area')}
              className={`px-3 py-1 text-xs rounded ${
                viewMode === 'area'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setViewMode('line')}
              className={`px-3 py-1 text-xs rounded ${
                viewMode === 'line'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Line
            </button>
          </div>
        </div>
      </div>
      
      <div className="h-80">
        {viewMode === 'area' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date"
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
              <Legend />
              <Area
                type="monotone"
                dataKey="nonSerious"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                name="Không nghiêm trọng"
              />
              <Area
                type="monotone"
                dataKey="serious"
                stackId="1"
                stroke="#ef4444"
                fill="#ef4444"
                name="Nghiêm trọng"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date"
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
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="Tổng báo cáo"
              />
              <Line
                type="monotone"
                dataKey="serious"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                name="Nghiêm trọng"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Statistics Summary */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-600">{totalReports}</div>
          <div className="text-xs text-blue-800">Tổng báo cáo</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-lg font-bold text-red-600">{totalSeriousReports}</div>
          <div className="text-xs text-red-800">Nghiêm trọng</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">{averageMonthly.toFixed(1)}</div>
          <div className="text-xs text-green-800">Trung bình/tháng</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-lg font-bold text-orange-600">{maxMonthly}</div>
          <div className="text-xs text-orange-800">Cao nhất/tháng</div>
        </div>
      </div>

      {/* Recent Activity Analysis */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Phân tích hoạt động gần đây:</h4>
        <div className="space-y-2">
          {/* Last 3 months */}
          {(() => {
            const last3Months = data.slice(-3);
            const totalLast3 = last3Months.reduce((sum, item) => sum + item.total, 0);
            const seriousLast3 = last3Months.reduce((sum, item) => sum + item.serious, 0);
            
            return (
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">3 tháng gần nhất</span>
                <div className="flex space-x-4">
                  <span className="text-sm">
                    <span className="font-medium text-blue-600">{totalLast3}</span>
                    <span className="text-gray-500"> tổng</span>
                  </span>
                  <span className="text-sm">
                    <span className="font-medium text-red-600">{seriousLast3}</span>
                    <span className="text-gray-500"> nghiêm trọng</span>
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Peak month */}
          {(() => {
            const peakMonth = data.find(item => item.total === maxMonthly);
            return (
              <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                <span className="text-sm text-orange-800">Tháng có nhiều báo cáo nhất</span>
                <div className="flex space-x-2">
                  <span className="text-sm font-medium text-orange-800">{peakMonth?.date}</span>
                  <span className="text-sm text-orange-600">({peakMonth?.total} báo cáo)</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Trend Analysis */}
      {totalReports > 0 && (
        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-start">
            <div className="w-2 h-2 bg-purple-600 rounded-full mr-2 mt-2"></div>
            <div>
              <div className="text-sm font-medium text-purple-800 mb-1">
                Phân tích xu hướng báo cáo
              </div>
              <div className="text-xs text-purple-700">
                • Tổng {totalReports} báo cáo trong {data.length} tháng (trung bình {averageMonthly.toFixed(1)} báo cáo/tháng)
                <br />
                • Ước tính trung bình {averageDaily.toFixed(1)} báo cáo/ngày (cao nhất {maxDaily} báo cáo/ngày)
                <br />
                • {totalSeriousReports} báo cáo nghiêm trọng ({seriousRate.toFixed(1)}% tổng số báo cáo)
                <br />
                • {trendSummary}
                <br />
                • Cần theo dõi và phân tích xu hướng để cải thiện hệ thống giám sát ADR
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
