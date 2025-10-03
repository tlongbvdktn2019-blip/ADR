// =====================================================
// DASHBOARD CHARTS CONTAINER
// Main component that manages all dashboard charts
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import AgeDistributionChart from './AgeDistributionChart';
import SeverityLevelChart from './SeverityLevelChart';
import MonthlyTrendsChart from './MonthlyTrendsChart';
import DrugDistributionChart from './DrugDistributionChart';
import OutcomeDistributionChart from './OutcomeDistributionChart';
import Top10FacilitiesChart from './Top10FacilitiesChart';
import TopDrugsChart from './TopDrugsChart';
import OccupationAnalysisChart from './OccupationAnalysisChart';
import ReportsByDateChart from './ReportsByDateChart';
import GenderDistributionChart from './GenderDistributionChart';

interface ChartData {
  ageDistribution?: any[];
  severityDistribution?: any[];
  monthlyTrends?: any[];
  drugDistribution?: any[];
  outcomeDistribution?: any[];
  topFacilities?: any[];
  topDrugs?: any[];
  occupationAnalysis?: any[];
  reportsByDate?: any[];
  genderDistribution?: any[];
}

interface DashboardChartsProps {
  layout?: 'grid' | 'stacked';
  showAll?: boolean;
}

export default function DashboardCharts({ 
  layout = 'grid', 
  showAll = true 
}: DashboardChartsProps) {
  const { data: session } = useSession();
  const [chartData, setChartData] = useState<ChartData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      loadChartData();
    }
  }, [session?.user?.id]);

  const loadChartData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/charts');
      
      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu biểu đồ');
      }

      const result = await response.json();
      
      if (result.success) {
        setChartData(result.data);
      } else {
        throw new Error(result.error || 'Có lỗi xảy ra');
      }

    } catch (error) {
      console.error('Load chart data error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải biểu đồ';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const retryLoad = () => {
    loadChartData();
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Không thể tải biểu đồ
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={retryLoad}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (layout === 'stacked') {
    return (
      <div className="space-y-6">
        {showAll && (
          <>
            {/* Xu hướng báo cáo theo tháng - Full width at top */}
            <ReportsByDateChart 
              data={chartData.reportsByDate || []} 
              isLoading={isLoading} 
            />
            
            {/* Top 5 Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Top10FacilitiesChart 
                data={chartData.topFacilities || []} 
                isLoading={isLoading} 
              />
              <TopDrugsChart 
                data={chartData.topDrugs || []} 
                isLoading={isLoading} 
              />
            </div>

            {/* Severity and Gender */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SeverityLevelChart 
                data={chartData.severityDistribution || []} 
                isLoading={isLoading} 
              />
              <GenderDistributionChart 
                data={chartData.genderDistribution || []} 
                isLoading={isLoading} 
              />
            </div>

            {/* Age and Outcome */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AgeDistributionChart 
                data={chartData.ageDistribution || []} 
                isLoading={isLoading} 
              />
              <OutcomeDistributionChart 
                data={chartData.outcomeDistribution || []} 
                isLoading={isLoading} 
              />
            </div>

            {/* Occupation Analysis - Full width */}
            <OccupationAnalysisChart 
              data={chartData.occupationAnalysis || []} 
              isLoading={isLoading} 
            />

            {/* Monthly Trends */}
            <MonthlyTrendsChart 
              data={chartData.monthlyTrends || []} 
              isLoading={isLoading} 
            />
            
            {/* Drug Distribution */}
            <DrugDistributionChart 
              data={chartData.drugDistribution || []} 
              isLoading={isLoading} 
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {showAll && (
        <>
          {/* Xu hướng báo cáo theo tháng - Full Width */}
          <div className="xl:col-span-2">
            <ReportsByDateChart 
              data={chartData.reportsByDate || []} 
              isLoading={isLoading} 
            />
          </div>

          {/* Top 5 cơ sở có nhiều báo cáo nhất */}
          <Top10FacilitiesChart 
            data={chartData.topFacilities || []} 
            isLoading={isLoading} 
          />

          {/* Top 5 thuốc nghi ngờ */}
          <TopDrugsChart 
            data={chartData.topDrugs || []} 
            isLoading={isLoading} 
          />

          {/* Số lượng và tỷ lệ báo cáo mức độ nghiêm trọng */}
          <SeverityLevelChart 
            data={chartData.severityDistribution || []} 
            isLoading={isLoading} 
          />

          {/* Số lượng và tỷ lệ theo Giới tính */}
          <GenderDistributionChart 
            data={chartData.genderDistribution || []} 
            isLoading={isLoading} 
          />

          {/* Độ tuổi được báo cáo */}
          <AgeDistributionChart 
            data={chartData.ageDistribution || []} 
            isLoading={isLoading} 
          />

          {/* Outcome Distribution Chart */}
          <OutcomeDistributionChart 
            data={chartData.outcomeDistribution || []} 
            isLoading={isLoading} 
          />

          {/* Tỷ lệ theo Nghề nghiệp của người báo cáo - Full Width */}
          <div className="xl:col-span-2">
            <OccupationAnalysisChart 
              data={chartData.occupationAnalysis || []} 
              isLoading={isLoading} 
            />
          </div>

          {/* Monthly Trends - Full Width */}
          <div className="xl:col-span-2">
            <MonthlyTrendsChart 
              data={chartData.monthlyTrends || []} 
              isLoading={isLoading} 
            />
          </div>

          {/* Drug Distribution Chart */}
          <DrugDistributionChart 
            data={chartData.drugDistribution || []} 
            isLoading={isLoading} 
          />
        </>
      )}
    </div>
  );
}

// Export individual chart components for selective use
export {
  AgeDistributionChart,
  SeverityLevelChart,
  MonthlyTrendsChart,
  DrugDistributionChart,
  OutcomeDistributionChart,
  Top10FacilitiesChart,
  TopDrugsChart,
  OccupationAnalysisChart,
  ReportsByDateChart,
  GenderDistributionChart
};

