// =====================================================
// TREATMENT DRUG GROUP CHART
// Bar chart showing top 5 treatment drug groups suspected in ADR
// =====================================================

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import Card from '@/components/ui/Card';

interface TreatmentDrugGroupData {
  groupName: string;
  count: number;
  percentage: number;
}

interface TreatmentDrugGroupChartProps {
  data: TreatmentDrugGroupData[];
  isLoading?: boolean;
}

const GROUP_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
];

export default function TreatmentDrugGroupChart({ data, isLoading = false }: TreatmentDrugGroupChartProps) {
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
          Top 5 Nhóm thuốc điều trị nghi ngờ gây ADR
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full"></div>
            <p>Chưa có dữ liệu</p>
            <p className="text-sm text-gray-400 mt-2">Các báo cáo chưa điền thông tin nhóm thuốc điều trị</p>
          </div>
        </div>
      </Card>
    );
  }

  const normalizedData = data.map(item => ({
    ...item,
    count: Number(item.count ?? 0),
    percentage: Number(item.percentage ?? 0),
  }));

  const maxCount = Math.max(...normalizedData.map(item => item.count), 1);
  const totalCount = normalizedData.reduce((sum, item) => sum + item.count, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const current = payload[0].payload as TreatmentDrugGroupData;
      return (
        <div className="bg-white p-4 border border-gray-300 rounded shadow-lg">
          <p className="font-medium text-blue-800 mb-2">{current.groupName}</p>
          <p className="text-blue-600 mb-1">
            Số báo cáo: <span className="font-bold">{current.count}</span>
          </p>
          <p className="text-gray-600">
            Tỷ lệ: <span className="font-semibold">{current.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (width < 20) return null;

    return (
      <text
        x={x + width - 5}
        y={y + 15}
        fill="white"
        textAnchor="end"
        dominantBaseline="middle"
        fontSize="13"
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
          Top 5 Nhóm thuốc điều trị nghi ngờ gây ADR
        </h3>
        <div className="text-sm text-gray-500">
          Tổng: {totalCount} trường hợp
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={normalizedData}
            layout="vertical"
            margin={{
              top: 10,
              right: 30,
              left: 20,
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
              dataKey="groupName"
              stroke="#6b7280"
              fontSize={12}
              width={150}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="count"
              radius={[0, 8, 8, 0]}
            >
              {normalizedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={GROUP_COLORS[index % GROUP_COLORS.length]} />
              ))}
              <LabelList
                dataKey="count"
                content={renderCustomLabel}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Details Section */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Chi tiết:</h4>
        <div className="space-y-2">
          {normalizedData.map((group, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center flex-1">
                <div
                  className="w-4 h-4 rounded mr-3 flex-shrink-0"
                  style={{ backgroundColor: GROUP_COLORS[index % GROUP_COLORS.length] }}
                ></div>
                <span className="font-medium text-gray-900 text-sm">{group.groupName}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-lg font-bold text-blue-600">{group.count}</span>
                <span className="text-sm text-gray-500 min-w-[50px] text-right">({group.percentage}%)</span>
                {index === 0 && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium">
                    Cao nhất
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insight */}
      {normalizedData.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 mt-2 flex-shrink-0"></div>
            <div>
              <div className="text-sm font-medium text-blue-800 mb-1">
                💊 Thông tin phân tích
              </div>
              <div className="text-xs text-blue-700 space-y-1">
                <p>
                  • <strong>{normalizedData[0]?.groupName}</strong> là nhóm thuốc có nhiều báo cáo nghi ngờ gây ADR nhất 
                  ({normalizedData[0]?.count} trường hợp, chiếm {normalizedData[0]?.percentage}%)
                </p>
                <p>
                  • Top 5 nhóm thuốc chiếm {normalizedData.reduce((sum, item) => sum + item.percentage, 0)}% 
                  tổng số báo cáo có thông tin nhóm thuốc
                </p>
                <p>
                  • Cần tăng cường giám sát an toàn thuốc cho các nhóm này
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}





