import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createAdminClient } from '@/lib/supabase'
import {
  DashboardChartData,
  DashboardChartsResponse,
  DashboardDrugRow,
  DashboardFilters,
  DashboardReportRow,
  getCausalityLabel,
  getOutcomeLabel,
  getPreventabilityLabel,
  getSeverityAssessmentLabel,
  getSeverityLabel,
  parseDashboardFilters,
  parsePreventabilityCategory,
  parseSeverityAssessmentCategory,
  SERIOUS_SEVERITY_KEYS,
} from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

const REPORT_SELECT = [
  'id',
  'report_date',
  'created_at',
  'patient_age',
  'patient_gender',
  'severity_level',
  'outcome_after_treatment',
  'organization',
  'reporter_profession',
  'report_type',
  'causality_assessment',
  'assessment_scale',
  'severity_assessment_result',
  'preventability_assessment_result',
  'approval_status',
].join(', ')

function applyReportFilters(query: any, filters: DashboardFilters) {
  let nextQuery = query

  if (filters.organization !== 'all') {
    nextQuery = nextQuery.eq('organization', filters.organization)
  }

  if (filters.year !== 'all') {
    const year = Number.parseInt(filters.year, 10)
    if (!Number.isNaN(year)) {
      nextQuery = nextQuery.gte('report_date', `${year}-01-01`).lte('report_date', `${year}-12-31`)
    }
  }

  if (filters.approvalStatus !== 'all') {
    nextQuery = nextQuery.eq('approval_status', filters.approvalStatus)
  }

  if (filters.severity !== 'all') {
    nextQuery = nextQuery.eq('severity_level', filters.severity)
  }

  if (filters.reportType !== 'all') {
    nextQuery = nextQuery.eq('report_type', filters.reportType)
  }

  if (filters.profession !== 'all') {
    nextQuery = nextQuery.eq('reporter_profession', filters.profession)
  }

  return nextQuery
}

function toPercentage(count: number, total: number) {
  if (total <= 0) return 0
  return Math.round((count / total) * 100)
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map((part) => Number.parseInt(part, 10))
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' })
}

function createMonthlyBuckets(filters: DashboardFilters) {
  const buckets: string[] = []

  if (filters.year !== 'all') {
    const year = Number.parseInt(filters.year, 10)
    for (let month = 1; month <= 12; month++) {
      buckets.push(`${year}-${String(month).padStart(2, '0')}`)
    }
    return buckets
  }

  const current = new Date()
  for (let index = 11; index >= 0; index--) {
    const date = new Date(current.getFullYear(), current.getMonth() - index, 1)
    buckets.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }
  return buckets
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const filters = parseDashboardFilters(new URL(request.url).searchParams)
    const supabase = createAdminClient()

    let reportQuery = supabase.from('adr_reports').select(REPORT_SELECT).order('report_date', { ascending: true })
    reportQuery = applyReportFilters(reportQuery, filters)

    const { data: reportRows, error: reportError } = await reportQuery

    if (reportError) {
      console.error('Dashboard charts report error:', reportError)
      return NextResponse.json({ error: 'Không thể tải dữ liệu biểu đồ' }, { status: 500 })
    }

    const reports = ((reportRows || []) as unknown) as DashboardReportRow[]
    const reportIds = reports.map((report) => report.id)

    let suspectedDrugs: DashboardDrugRow[] = []

    if (reportIds.length > 0) {
      const { data: suspectedDrugRows, error: suspectedDrugError } = await (supabase as any)
        .from('suspected_drugs')
        .select(
          [
            'report_id',
            'drug_name',
            'commercial_name',
            'treatment_drug_group',
            'route_of_administration',
          ].join(', '),
        )
        .in('report_id', reportIds)

      if (suspectedDrugError) {
        console.error('Dashboard charts suspected drugs error:', suspectedDrugError)
        return NextResponse.json({ error: 'Không thể tải dữ liệu thuốc nghi ngờ' }, { status: 500 })
      }

      suspectedDrugs = (suspectedDrugRows || []) as DashboardDrugRow[]
    }

    const totalReports = reports.length
    const totalDrugs = suspectedDrugs.length
    const chartData: DashboardChartData = {}

    const ageGroups: Record<string, number> = {
      '0-18': 0,
      '19-30': 0,
      '31-50': 0,
      '51-65': 0,
      '66+': 0,
    }

    reports.forEach((report) => {
      const age = report.patient_age ?? null
      if (age === null || age === undefined || Number.isNaN(Number(age))) return

      if (age <= 18) ageGroups['0-18']++
      else if (age <= 30) ageGroups['19-30']++
      else if (age <= 50) ageGroups['31-50']++
      else if (age <= 65) ageGroups['51-65']++
      else ageGroups['66+']++
    })

    chartData.ageDistribution = Object.entries(ageGroups).map(([ageRange, count]) => ({
      ageRange,
      count,
      percentage: toPercentage(count, totalReports),
    }))

    const severityCounts: Record<string, number> = {}
    const outcomeCounts: Record<string, number> = {}
    const genderCounts: Record<string, number> = {}
    const facilityCounts: Record<string, number> = {}
    const professionCounts: Record<string, number> = {}
    const reportTypeCounts: Record<string, number> = {}
    const causalityCounts: Record<string, number> = {}
    const assessmentScaleCounts: Record<string, number> = {}
    const severityAssessmentCounts: Record<string, number> = {}
    const preventabilityCounts: Record<string, number> = {}

    reports.forEach((report) => {
      const severityKey = report.severity_level || 'unknown'
      const outcomeKey = report.outcome_after_treatment || 'unknown'
      const genderKey = report.patient_gender || 'unknown'
      const facilityKey = report.organization || 'Chưa xác định'
      const professionKey = report.reporter_profession || 'Chưa xác định'
      const reportTypeKey = report.report_type || 'unknown'
      const causalityKey = report.causality_assessment || 'unknown'
      const assessmentScaleKey = report.assessment_scale || 'unknown'
      const severityAssessmentKey = parseSeverityAssessmentCategory(report.severity_assessment_result)
      const preventabilityKey = parsePreventabilityCategory(report.preventability_assessment_result)

      severityCounts[severityKey] = (severityCounts[severityKey] || 0) + 1
      outcomeCounts[outcomeKey] = (outcomeCounts[outcomeKey] || 0) + 1
      genderCounts[genderKey] = (genderCounts[genderKey] || 0) + 1
      facilityCounts[facilityKey] = (facilityCounts[facilityKey] || 0) + 1
      professionCounts[professionKey] = (professionCounts[professionKey] || 0) + 1
      reportTypeCounts[reportTypeKey] = (reportTypeCounts[reportTypeKey] || 0) + 1
      causalityCounts[causalityKey] = (causalityCounts[causalityKey] || 0) + 1
      assessmentScaleCounts[assessmentScaleKey] = (assessmentScaleCounts[assessmentScaleKey] || 0) + 1
      severityAssessmentCounts[severityAssessmentKey] = (severityAssessmentCounts[severityAssessmentKey] || 0) + 1
      preventabilityCounts[preventabilityKey] = (preventabilityCounts[preventabilityKey] || 0) + 1
    })

    chartData.severityDistribution = Object.entries(severityCounts)
      .map(([severityKey, count]) => ({
        severity: getSeverityLabel(severityKey),
        severityKey,
        count,
        percentage: toPercentage(count, totalReports),
      }))
      .sort((left, right) => right.count - left.count)

    chartData.outcomeDistribution = Object.entries(outcomeCounts)
      .map(([outcomeKey, count]) => ({
        outcome: getOutcomeLabel(outcomeKey),
        outcomeKey,
        count,
        percentage: toPercentage(count, totalReports),
      }))
      .sort((left, right) => right.count - left.count)

    chartData.genderDistribution = Object.entries(genderCounts)
      .map(([genderKey, count]) => ({
        gender:
          genderKey === 'male' ? 'Nam' : genderKey === 'female' ? 'Nữ' : genderKey === 'other' ? 'Khác' : 'Chưa xác định',
        genderKey,
        count,
        percentage: toPercentage(count, totalReports),
      }))
      .sort((left, right) => right.count - left.count)

    const monthKeys = createMonthlyBuckets(filters)
    const monthlyCounts = new Map<string, { total: number; serious: number }>()
    monthKeys.forEach((monthKey) => {
      monthlyCounts.set(monthKey, { total: 0, serious: 0 })
    })

    reports.forEach((report) => {
      const sourceDate = report.report_date || report.created_at
      if (!sourceDate) return

      const monthKey = sourceDate.slice(0, 7)
      if (!monthlyCounts.has(monthKey)) {
        return
      }

      const month = monthlyCounts.get(monthKey) as { total: number; serious: number }
      month.total++
      if (SERIOUS_SEVERITY_KEYS.has(report.severity_level || '')) {
        month.serious++
      }
    })

    chartData.reportsByDate = monthKeys.map((monthKey) => {
      const values = monthlyCounts.get(monthKey) || { total: 0, serious: 0 }
      return {
        date: formatMonthLabel(monthKey),
        dateKey: monthKey,
        total: values.total,
        serious: values.serious,
        nonSerious: values.total - values.serious,
      }
    })

    chartData.topFacilities = Object.entries(facilityCounts)
      .map(([facilityName, count]) => ({
        facilityName,
        count,
        percentage: toPercentage(count, totalReports),
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 10)

    chartData.occupationAnalysis = Object.entries(professionCounts)
      .map(([profession, count]) => ({
        profession,
        count,
        percentage: toPercentage(count, totalReports),
      }))
      .sort((left, right) => right.count - left.count)

    const topDrugStats = new Map<string, { count: number; commercialNames: Set<string> }>()
    const drugCounts: Record<string, number> = {}
    const drugGroupCounts: Record<string, number> = {}
    const routeCounts: Record<string, number> = {}

    suspectedDrugs.forEach((drug) => {
      const drugKey = (drug.drug_name || 'khác').trim().toLowerCase()
      const commercialName = (drug.commercial_name || '').trim()
      const treatmentGroup = (drug.treatment_drug_group || '').trim()
      const route = (drug.route_of_administration || '').trim()

      if (!topDrugStats.has(drugKey)) {
        topDrugStats.set(drugKey, { count: 0, commercialNames: new Set<string>() })
      }

      const currentDrug = topDrugStats.get(drugKey) as { count: number; commercialNames: Set<string> }
      currentDrug.count++
      if (commercialName) {
        currentDrug.commercialNames.add(commercialName)
      }

      drugCounts[drugKey] = (drugCounts[drugKey] || 0) + 1

      if (treatmentGroup) {
        drugGroupCounts[treatmentGroup] = (drugGroupCounts[treatmentGroup] || 0) + 1
      }

      if (route) {
        routeCounts[route] = (routeCounts[route] || 0) + 1
      }
    })

    chartData.topDrugs = Array.from(topDrugStats.entries())
      .map(([drugKey, value]) => ({
        drugName: drugKey.charAt(0).toUpperCase() + drugKey.slice(1),
        count: value.count,
        commercialNames: value.commercialNames.size > 0 ? Array.from(value.commercialNames).join(', ') : 'Không có',
        percentage: toPercentage(value.count, totalDrugs),
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 10)

    chartData.drugDistribution = Object.entries(drugCounts)
      .map(([drugKey, count]) => ({
        drugName: drugKey.charAt(0).toUpperCase() + drugKey.slice(1),
        count,
        percentage: toPercentage(count, totalDrugs),
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 10)

    chartData.treatmentDrugGroups = Object.entries(drugGroupCounts)
      .map(([groupName, count]) => ({
        groupName,
        count,
        percentage: toPercentage(count, totalDrugs),
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 8)

    chartData.routeDistribution = Object.entries(routeCounts)
      .map(([key, count]) => ({
        key,
        label: key,
        count,
        percentage: toPercentage(count, totalDrugs),
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 8)

    chartData.reportTypeDistribution = Object.entries(reportTypeCounts)
      .map(([key, count]) => ({
        key,
        label: key === 'initial' ? 'Lần đầu' : key === 'follow_up' ? 'Bổ sung' : 'Chưa xác định',
        count,
        percentage: toPercentage(count, totalReports),
      }))
      .sort((left, right) => right.count - left.count)

    chartData.causalityDistribution = Object.entries(causalityCounts)
      .map(([key, count]) => ({
        key,
        label: getCausalityLabel(key),
        count,
        percentage: toPercentage(count, totalReports),
      }))
      .sort((left, right) => right.count - left.count)

    chartData.assessmentScaleDistribution = Object.entries(assessmentScaleCounts)
      .map(([key, count]) => ({
        key,
        label: key === 'who' ? 'WHO-UMC' : key === 'naranjo' ? 'Naranjo' : 'Chưa xác định',
        count,
        percentage: toPercentage(count, totalReports),
      }))
      .sort((left, right) => right.count - left.count)

    chartData.severityAssessmentDistribution = Object.entries(severityAssessmentCounts)
      .map(([key, count]) => ({
        key,
        label: getSeverityAssessmentLabel(key),
        count,
        percentage: toPercentage(count, totalReports),
      }))
      .sort((left, right) => right.count - left.count)

    chartData.preventabilityDistribution = Object.entries(preventabilityCounts)
      .map(([key, count]) => ({
        key,
        label: getPreventabilityLabel(key),
        count,
        percentage: toPercentage(count, totalReports),
      }))
      .sort((left, right) => right.count - left.count)

    const response: DashboardChartsResponse = {
      success: true,
      data: chartData,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Dashboard charts API error:', error)
    return NextResponse.json({ error: 'Không thể tải dữ liệu biểu đồ' }, { status: 500 })
  }
}
