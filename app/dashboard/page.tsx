'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import DashboardCharts from '@/components/charts/DashboardCharts'
import DashboardFilters from '@/components/dashboard/DashboardFilters'
import DashboardKpiGrid from '@/components/dashboard/DashboardKpiGrid'
import SectionCompletionMap from '@/components/dashboard/SectionCompletionMap'
import DashboardQueue from '@/components/dashboard/DashboardQueue'
import DashboardDetailTable from '@/components/dashboard/DashboardDetailTable'
import DashboardQualityPanel from '@/components/dashboard/DashboardQualityPanel'
import {
  buildDashboardQueryParams,
  DASHBOARD_APPROVAL_OPTIONS,
  DASHBOARD_REPORT_TYPE_OPTIONS,
  DASHBOARD_SECTION_META,
  DASHBOARD_SEVERITY_OPTIONS,
  DashboardFilterOption,
  DashboardFilters as DashboardFiltersType,
  DashboardSectionKey,
  DashboardStatsResponse,
  DEFAULT_DASHBOARD_FILTERS,
} from '@/lib/dashboard'
import { ArrowRightIcon, DocumentChartBarIcon, DocumentPlusIcon } from '@heroicons/react/24/outline'

interface Department {
  id: string
  name: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [stats, setStats] = useState<DashboardStatsResponse | null>(null)
  const [filters, setFilters] = useState<DashboardFiltersType>(DEFAULT_DASHBOARD_FILTERS)
  const [activeSection, setActiveSection] = useState<DashboardSectionKey>('A')
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(false)
  const [yearOptions, setYearOptions] = useState<DashboardFilterOption[]>([{ value: 'all', label: 'Tất cả năm' }])
  const [organizationOptions, setOrganizationOptions] = useState<DashboardFilterOption[]>([
    { value: 'all', label: 'Tất cả đơn vị' },
  ])
  const [professionOptions, setProfessionOptions] = useState<DashboardFilterOption[]>([
    { value: 'all', label: 'Tất cả nghề nghiệp' },
  ])

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/login')
      return
    }

    const loadOptions = async () => {
      try {
        const [yearsResponse, departmentsResponse, professionsResponse] = await Promise.all([
          fetch('/api/dashboard/available-years'),
          fetch('/api/public/departments'),
          fetch('/api/dashboard/filter-options'),
        ])

        const [yearsResult, departmentsResult, professionsResult] = await Promise.all([
          yearsResponse.json(),
          departmentsResponse.json(),
          professionsResponse.json(),
        ])

        if (yearsResult.success && Array.isArray(yearsResult.years)) {
          setYearOptions([
            { value: 'all', label: 'Tất cả năm' },
            ...yearsResult.years.map((year: number) => ({ value: String(year), label: `Năm ${year}` })),
          ])
        }

        if (departmentsResult.success && Array.isArray(departmentsResult.data)) {
          setOrganizationOptions([
            { value: 'all', label: 'Tất cả đơn vị' },
            ...departmentsResult.data.map((department: Department) => ({
              value: department.name,
              label: department.name,
            })),
          ])
        }

        if (professionsResult.success && Array.isArray(professionsResult.professions)) {
          setProfessionOptions([
            { value: 'all', label: 'Tất cả nghề nghiệp' },
            ...professionsResult.professions.map((profession: string) => ({
              value: profession,
              label: profession,
            })),
          ])
        }
      } catch (error) {
        console.error('Dashboard option load error:', error)
      }
    }

    loadOptions()
  }, [status, session, router])

  useEffect(() => {
    if (!session?.user?.id) return

    const loadStats = async () => {
      try {
        setStatsLoading(true)

        const params = buildDashboardQueryParams(filters)
        const response = await fetch(params.toString() ? `/api/dashboard/stats?${params.toString()}` : '/api/dashboard/stats')
        const result = await response.json()

        if (!response.ok || result.error) {
          throw new Error(result.error || 'Không thể tải dashboard')
        }

        setStats(result as DashboardStatsResponse)
      } catch (error) {
        console.error('Dashboard stats load error:', error)
      } finally {
        setStatsLoading(false)
        setLoading(false)
      }
    }

    loadStats()
  }, [
    session?.user?.id,
    filters.year,
    filters.organization,
    filters.approvalStatus,
    filters.severity,
    filters.reportType,
    filters.profession,
  ])

  if (status === 'loading' || loading || !stats) {
    return (
      <MainLayout>
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  if (!session) {
    return null
  }

  const handleFilterChange = (key: keyof DashboardFiltersType, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const activeFilterChips = [
    { key: 'year', label: yearOptions.find((option) => option.value === filters.year)?.label },
    { key: 'organization', label: organizationOptions.find((option) => option.value === filters.organization)?.label },
    { key: 'approvalStatus', label: DASHBOARD_APPROVAL_OPTIONS.find((option) => option.value === filters.approvalStatus)?.label },
    { key: 'severity', label: DASHBOARD_SEVERITY_OPTIONS.find((option) => option.value === filters.severity)?.label },
    { key: 'reportType', label: DASHBOARD_REPORT_TYPE_OPTIONS.find((option) => option.value === filters.reportType)?.label },
    { key: 'profession', label: professionOptions.find((option) => option.value === filters.profession)?.label },
  ].filter(({ label }) => label && !label.toLowerCase().includes('tất cả'))

  const activeSectionMeta = DASHBOARD_SECTION_META.find((section) => section.key === activeSection) as {
    key: DashboardSectionKey
    shortLabel: string
    title: string
    description: string
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <section className="rounded-[28px] bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-900 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Dashboard ADR</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Trang điều hành báo cáo theo đầy đủ cấu trúc A-F
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                Theo dõi đồng thời KPI, chất lượng dữ liệu, hàng chờ xử lý và các phân tích theo từng phần của mẫu báo cáo ADR.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href="/reports/new"
                className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                <span className="flex items-center gap-2">
                  <DocumentPlusIcon className="h-5 w-5" />
                  Tạo báo cáo mới
                </span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/reports"
                className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <span className="flex items-center gap-2">
                  <DocumentChartBarIcon className="h-5 w-5" />
                  Mở danh sách báo cáo
                </span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {activeFilterChips.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {activeFilterChips.map((chip) => (
                <span key={chip.key} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-cyan-100 ring-1 ring-white/15">
                  {chip.label}
                </span>
              ))}
            </div>
          )}
        </section>

        <div className="sticky top-3 z-20">
          <DashboardFilters
            filters={filters}
            years={yearOptions}
            organizations={organizationOptions}
            professions={professionOptions}
            approvalOptions={DASHBOARD_APPROVAL_OPTIONS}
            severityOptions={DASHBOARD_SEVERITY_OPTIONS}
            reportTypeOptions={DASHBOARD_REPORT_TYPE_OPTIONS}
            onChange={handleFilterChange}
          />
        </div>

        {statsLoading && (
          <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Đang cập nhật dữ liệu dashboard theo bộ lọc mới...
          </div>
        )}

        <DashboardKpiGrid kpis={stats.kpis} />

        <SectionCompletionMap
          sections={stats.sectionSummaries}
          missingFields={stats.missingFields}
          activeSection={activeSection}
          onSelectSection={setActiveSection}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <DashboardQueue reports={stats.pendingQueue} />
          <DashboardQualityPanel qualitySignals={stats.qualitySignals} kpis={stats.kpis} />
        </div>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">{activeSectionMeta.shortLabel}</p>
              <h2 className="text-2xl font-bold text-gray-900">{activeSectionMeta.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{activeSectionMeta.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {DASHBOARD_SECTION_META.map((section) => {
                const summary = stats.sectionSummaries.find((item) => item.key === section.key)
                const isActive = activeSection === section.key

                return (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => setActiveSection(section.key)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {section.key}. {section.title}
                    {summary && <span className={`ml-2 text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>{summary.completionRate}%</span>}
                  </button>
                )
              })}
            </div>
          </div>

          <DashboardCharts filters={filters} section={activeSection} />
        </section>

        <DashboardDetailTable reports={stats.reportPreviews} />
      </div>
    </MainLayout>
  )
}
