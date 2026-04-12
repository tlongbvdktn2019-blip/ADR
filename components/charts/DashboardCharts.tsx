'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import AgeDistributionChart from './AgeDistributionChart'
import SeverityLevelChart from './SeverityLevelChart'
import OutcomeDistributionChart from './OutcomeDistributionChart'
import Top10FacilitiesChart from './Top10FacilitiesChart'
import TopDrugsChart from './TopDrugsChart'
import TreatmentDrugGroupChart from './TreatmentDrugGroupChart'
import OccupationAnalysisChart from './OccupationAnalysisChart'
import ReportsByDateChart from './ReportsByDateChart'
import GenderDistributionChart from './GenderDistributionChart'
import BreakdownBarChart from './BreakdownBarChart'
import {
  buildDashboardQueryParams,
  DashboardChartData,
  DashboardChartsResponse,
  DashboardFilters,
  DashboardSectionKey,
  DEFAULT_DASHBOARD_FILTERS,
} from '@/lib/dashboard'

interface DashboardChartsProps {
  layout?: 'grid' | 'stacked'
  showAll?: boolean
  organization?: string
  year?: string
  filters?: DashboardFilters
  section?: 'overview' | DashboardSectionKey
}

export default function DashboardCharts({
  layout,
  showAll,
  organization = 'all',
  year = 'all',
  filters,
  section = 'overview',
}: DashboardChartsProps) {
  const { data: session } = useSession()
  const [chartData, setChartData] = useState<DashboardChartData>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const normalizedFilters: DashboardFilters = filters || {
    ...DEFAULT_DASHBOARD_FILTERS,
    organization,
    year,
  }

  useEffect(() => {
    if (!session?.user?.id) return

    const loadChartData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const params = buildDashboardQueryParams(normalizedFilters)
        const response = await fetch(params.toString() ? `/api/dashboard/charts?${params.toString()}` : '/api/dashboard/charts')

        if (!response.ok) {
          throw new Error('Không thể tải dữ liệu biểu đồ')
        }

        const result = (await response.json()) as DashboardChartsResponse

        if (!result.success) {
          throw new Error('Không thể tải dữ liệu biểu đồ')
        }

        setChartData(result.data)
      } catch (loadError) {
        console.error('Dashboard chart load error:', loadError)
        const message = loadError instanceof Error ? loadError.message : 'Có lỗi xảy ra khi tải dữ liệu biểu đồ'
        setError(message)
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadChartData()
  }, [
    session?.user?.id,
    normalizedFilters.organization,
    normalizedFilters.year,
    normalizedFilters.approvalStatus,
    normalizedFilters.severity,
    normalizedFilters.reportType,
    normalizedFilters.profession,
  ])

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (section === 'A') {
    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AgeDistributionChart data={chartData.ageDistribution || []} isLoading={isLoading} />
        <GenderDistributionChart data={chartData.genderDistribution || []} isLoading={isLoading} />
      </div>
    )
  }

  if (section === 'B') {
    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="xl:col-span-2">
          <ReportsByDateChart data={chartData.reportsByDate || []} isLoading={isLoading} />
        </div>
        <SeverityLevelChart data={chartData.severityDistribution || []} isLoading={isLoading} />
        <OutcomeDistributionChart data={chartData.outcomeDistribution || []} isLoading={isLoading} />
      </div>
    )
  }

  if (section === 'C') {
    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="xl:col-span-2">
          <TopDrugsChart data={chartData.topDrugs || []} isLoading={isLoading} />
        </div>
        <div className="xl:col-span-2">
          <TreatmentDrugGroupChart data={chartData.treatmentDrugGroups || []} isLoading={isLoading} />
        </div>
        <BreakdownBarChart
          title="Đường dùng thuốc nghi ngờ"
          subtitle="Giúp rà soát bối cảnh sử dụng thuốc trong phần C"
          data={chartData.routeDistribution || []}
          isLoading={isLoading}
          color="#0f766e"
        />
        <BreakdownBarChart
          title="Top hoạt chất nghi ngờ"
          subtitle="Tần suất hoạt chất xuất hiện trong báo cáo ADR"
          data={(chartData.drugDistribution || []).map((item) => ({
            key: item.drugName,
            label: item.drugName,
            count: item.count,
            percentage: item.percentage,
          }))}
          isLoading={isLoading}
          color="#1d4ed8"
        />
      </div>
    )
  }

  if (section === 'D') {
    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <BreakdownBarChart
          title="Đánh giá mối liên quan thuốc - ADR"
          subtitle="Phân bố kết luận thẩm định theo phần D"
          data={chartData.causalityDistribution || []}
          isLoading={isLoading}
          color="#1d4ed8"
        />
        <BreakdownBarChart
          title="Thang đánh giá sử dụng"
          subtitle="WHO-UMC hay Naranjo được dùng nhiều hơn"
          data={chartData.assessmentScaleDistribution || []}
          isLoading={isLoading}
          color="#7c3aed"
        />
      </div>
    )
  }

  if (section === 'E') {
    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="xl:col-span-2">
          <OccupationAnalysisChart data={chartData.occupationAnalysis || []} isLoading={isLoading} />
        </div>
        <Top10FacilitiesChart data={chartData.topFacilities || []} isLoading={isLoading} />
        <BreakdownBarChart
          title="Cấu trúc loại báo cáo"
          subtitle="Tỷ lệ báo cáo lần đầu và báo cáo bổ sung"
          data={chartData.reportTypeDistribution || []}
          isLoading={isLoading}
          color="#ea580c"
        />
      </div>
    )
  }

  if (section === 'F') {
    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <BreakdownBarChart
          title="Đánh giá mức độ nặng"
          subtitle="Phân loại mức độ theo kết quả phần F"
          data={chartData.severityAssessmentDistribution || []}
          isLoading={isLoading}
          color="#dc2626"
        />
        <BreakdownBarChart
          title="Khả năng phòng tránh ADR"
          subtitle="Tổng hợp kết quả đánh giá phòng tránh"
          data={chartData.preventabilityDistribution || []}
          isLoading={isLoading}
          color="#059669"
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="xl:col-span-2">
        <ReportsByDateChart data={chartData.reportsByDate || []} isLoading={isLoading} />
      </div>
      <SeverityLevelChart data={chartData.severityDistribution || []} isLoading={isLoading} />
      <OutcomeDistributionChart data={chartData.outcomeDistribution || []} isLoading={isLoading} />
      <Top10FacilitiesChart data={chartData.topFacilities || []} isLoading={isLoading} />
      <TopDrugsChart data={chartData.topDrugs || []} isLoading={isLoading} />
    </div>
  )
}
