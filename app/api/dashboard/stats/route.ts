import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createAdminClient } from '@/lib/supabase'
import {
  buildQueueReasons,
  DASHBOARD_SECTION_META,
  DashboardConcurrentDrugRow,
  DashboardDrugRow,
  DashboardFilters,
  DashboardMissingField,
  DashboardReportPreview,
  DashboardReportRow,
  DashboardSectionKey,
  DashboardStatsResponse,
  getApprovalLabel,
  getPreventabilityLabel,
  getReportSectionStatus,
  getReportTypeLabel,
  getSeverityLabel,
  parseDashboardFilters,
  parsePreventabilityCategory,
  SERIOUS_SEVERITY_KEYS,
  isFilled,
} from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

const REPORT_SELECT = [
  'id',
  'report_code',
  'organization',
  'patient_name',
  'patient_birth_date',
  'patient_age',
  'patient_gender',
  'patient_weight',
  'adr_occurrence_date',
  'reaction_onset_time',
  'adr_description',
  'related_tests',
  'medical_history',
  'treatment_response',
  'severity_level',
  'outcome_after_treatment',
  'causality_assessment',
  'assessment_scale',
  'medical_staff_comment',
  'reporter_name',
  'reporter_profession',
  'reporter_phone',
  'reporter_email',
  'report_type',
  'report_date',
  'severity_assessment_result',
  'preventability_assessment_result',
  'approval_status',
  'created_at',
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

function getSortTimestamp(report: DashboardReportRow) {
  return new Date(report.report_date || report.created_at).getTime()
}

function toPercentage(count: number, total: number) {
  if (total <= 0) return 0
  return Math.round((count / total) * 100)
}

function buildMissingFieldSummary(
  reports: DashboardReportRow[],
  drugsByReportId: Map<string, DashboardDrugRow[]>,
): DashboardMissingField[] {
  const definitions: Array<{ key: string; label: string; sectionKey: DashboardSectionKey; missing: number }> = [
    { key: 'patient_weight', label: 'Thiếu cân nặng', sectionKey: 'A', missing: 0 },
    { key: 'reaction_onset_time', label: 'Thiếu thời gian khởi phát', sectionKey: 'B', missing: 0 },
    { key: 'related_tests', label: 'Thiếu xét nghiệm liên quan', sectionKey: 'B', missing: 0 },
    { key: 'medical_history', label: 'Thiếu tiền sử bệnh', sectionKey: 'B', missing: 0 },
    { key: 'treatment_response', label: 'Thiếu cách xử trí', sectionKey: 'B', missing: 0 },
    { key: 'drug_route', label: 'Thiếu đường dùng thuốc nghi ngờ', sectionKey: 'C', missing: 0 },
    { key: 'drug_group', label: 'Thiếu nhóm thuốc điều trị', sectionKey: 'C', missing: 0 },
    { key: 'drug_start_date', label: 'Thiếu ngày bắt đầu dùng thuốc', sectionKey: 'C', missing: 0 },
    { key: 'medical_staff_comment', label: 'Thiếu bình luận chuyên môn', sectionKey: 'D', missing: 0 },
    { key: 'reporter_contact', label: 'Thiếu thông tin liên hệ người báo cáo', sectionKey: 'E', missing: 0 },
    { key: 'severity_assessment_result', label: 'Thiếu đánh giá mức độ nặng', sectionKey: 'F', missing: 0 },
    { key: 'preventability_assessment_result', label: 'Thiếu đánh giá phòng tránh ADR', sectionKey: 'F', missing: 0 },
  ]

  reports.forEach((report) => {
    const drugs = drugsByReportId.get(report.id) || []

    if (!(report.patient_weight !== null && report.patient_weight !== undefined && Number(report.patient_weight) > 0)) {
      definitions[0].missing++
    }
    if (!isFilled(report.reaction_onset_time)) definitions[1].missing++
    if (!isFilled(report.related_tests)) definitions[2].missing++
    if (!isFilled(report.medical_history)) definitions[3].missing++
    if (!isFilled(report.treatment_response)) definitions[4].missing++
    if (!drugs.some((drug) => isFilled(drug.route_of_administration))) definitions[5].missing++
    if (!drugs.some((drug) => isFilled(drug.treatment_drug_group))) definitions[6].missing++
    if (!drugs.some((drug) => isFilled(drug.start_date))) definitions[7].missing++
    if (!isFilled(report.medical_staff_comment)) definitions[8].missing++
    if (!(isFilled(report.reporter_phone) || isFilled(report.reporter_email))) definitions[9].missing++
    if (!isFilled(report.severity_assessment_result)) definitions[10].missing++
    if (!isFilled(report.preventability_assessment_result)) definitions[11].missing++
  })

  return definitions
    .filter((item) => item.missing > 0)
    .map((item) => ({
      key: item.key,
      label: item.label,
      sectionKey: item.sectionKey,
      count: item.missing,
      percentage: toPercentage(item.missing, reports.length),
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 8)
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const filters = parseDashboardFilters(new URL(request.url).searchParams)
    const supabase = createAdminClient()

    let reportQuery = supabase.from('adr_reports').select(REPORT_SELECT).order('report_date', { ascending: false })
    reportQuery = applyReportFilters(reportQuery, filters)

    const { data: reportRows, error: reportError } = await reportQuery

    if (reportError) {
      console.error('Dashboard stats report error:', reportError)
      return NextResponse.json({ error: 'Không thể tải thống kê dashboard' }, { status: 500 })
    }

    const reports = ((reportRows || []) as unknown) as DashboardReportRow[]
    const reportIds = reports.map((report) => report.id)

    let suspectedDrugs: DashboardDrugRow[] = []
    let concurrentDrugs: DashboardConcurrentDrugRow[] = []

    if (reportIds.length > 0) {
      const { data: suspectedDrugRows, error: suspectedDrugError } = await (supabase as any)
        .from('suspected_drugs')
        .select(
          [
            'report_id',
            'drug_name',
            'commercial_name',
            'dosage',
            'frequency',
            'dosage_and_frequency',
            'route_of_administration',
            'treatment_drug_group',
            'start_date',
            'indication',
            'reaction_improved_after_stopping',
            'reaction_reoccurred_after_rechallenge',
          ].join(', '),
        )
        .in('report_id', reportIds)

      if (suspectedDrugError) {
        console.error('Dashboard stats suspected drugs error:', suspectedDrugError)
        return NextResponse.json({ error: 'Không thể tải thống kê thuốc nghi ngờ' }, { status: 500 })
      }

      const { data: concurrentDrugRows, error: concurrentDrugError } = await supabase
        .from('concurrent_drugs')
        .select('id, report_id')
        .in('report_id', reportIds)

      if (concurrentDrugError) {
        console.error('Dashboard stats concurrent drugs error:', concurrentDrugError)
        return NextResponse.json({ error: 'Không thể tải thuốc dùng đồng thời' }, { status: 500 })
      }

      suspectedDrugs = (suspectedDrugRows || []) as DashboardDrugRow[]
      concurrentDrugs = (concurrentDrugRows || []) as DashboardConcurrentDrugRow[]
    }

    const drugsByReportId = new Map<string, DashboardDrugRow[]>()
    suspectedDrugs.forEach((drug) => {
      const current = drugsByReportId.get(drug.report_id) || []
      current.push(drug)
      drugsByReportId.set(drug.report_id, current)
    })

    const concurrentDrugsByReportId = new Map<string, DashboardConcurrentDrugRow[]>()
    concurrentDrugs.forEach((drug) => {
      const current = concurrentDrugsByReportId.get(drug.report_id) || []
      current.push(drug)
      concurrentDrugsByReportId.set(drug.report_id, current)
    })

    const sortedReports = [...reports].sort((left, right) => getSortTimestamp(right) - getSortTimestamp(left))

    const reportPreviews: DashboardReportPreview[] = sortedReports
      .map((report) => {
        const reportDrugs = drugsByReportId.get(report.id) || []
        const reportConcurrentDrugs = concurrentDrugsByReportId.get(report.id) || []
        const sectionStatus = getReportSectionStatus(report, reportDrugs)
        const completedSections = Object.values(sectionStatus).filter(Boolean).length
        const queueReasons = buildQueueReasons(report, sectionStatus)

        return {
          id: report.id,
          reportCode: report.report_code,
          patientName: report.patient_name,
          organization: report.organization,
          reportDate: report.report_date || report.created_at,
          createdAt: report.created_at,
          severityLevel: report.severity_level || 'unknown',
          severityLabel: getSeverityLabel(report.severity_level),
          approvalStatus: report.approval_status || 'pending',
          approvalLabel: getApprovalLabel(report.approval_status),
          reportType: report.report_type || 'initial',
          reportTypeLabel: getReportTypeLabel(report.report_type),
          reporterName: report.reporter_name,
          reporterProfession: report.reporter_profession || 'Chưa xác định',
          suspectedDrugCount: reportDrugs.length,
          concurrentDrugCount: reportConcurrentDrugs.length,
          completedSections,
          sectionStatus,
          queueReasons,
          preventabilityCategory: report.preventability_assessment_result
            ? getPreventabilityLabel(parsePreventabilityCategory(report.preventability_assessment_result))
            : null,
        }
      })

    const totalReports = reportPreviews.length
    const seriousReports = reportPreviews.filter((report) => SERIOUS_SEVERITY_KEYS.has(report.severityLevel)).length
    const pendingReports = reportPreviews.filter((report) => report.approvalStatus === 'pending').length
    const followUpReports = reportPreviews.filter((report) => report.reportType === 'follow_up').length
    const completeReports = reportPreviews.filter((report) => report.completedSections === DASHBOARD_SECTION_META.length).length
    const preventableReports = reports.filter(
      (report) => parsePreventabilityCategory(report.preventability_assessment_result) === 'preventable',
    ).length

    const todayIso = new Date().toISOString().slice(0, 10)
    const monthStartIso = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
    const newReportsToday = reports.filter((report) => report.report_date === todayIso).length
    const newReportsThisMonth = reports.filter(
      (report) => isFilled(report.report_date) && String(report.report_date) >= monthStartIso,
    ).length

    const sectionSummaries = DASHBOARD_SECTION_META.map((section) => {
      const completeCount = reportPreviews.filter((report) => report.sectionStatus[section.key]).length
      const missingCount = totalReports - completeCount

      return {
        ...section,
        completeCount,
        missingCount,
        completionRate: toPercentage(completeCount, totalReports),
      }
    })

    const qualitySignals = [
      {
        key: 'reaction_onset_time',
        label: 'Có thời gian khởi phát',
        count: reports.filter((report) => isFilled(report.reaction_onset_time)).length,
      },
      {
        key: 'related_tests',
        label: 'Có xét nghiệm liên quan',
        count: reports.filter((report) => isFilled(report.related_tests)).length,
      },
      {
        key: 'medical_comment',
        label: 'Có bình luận chuyên môn',
        count: reports.filter((report) => isFilled(report.medical_staff_comment)).length,
      },
      {
        key: 'reporter_contact',
        label: 'Có thông tin liên hệ',
        count: reports.filter((report) => isFilled(report.reporter_phone) || isFilled(report.reporter_email)).length,
      },
      {
        key: 'treatment_group',
        label: 'Có nhóm thuốc điều trị',
        count: reportIds.filter((id) => (drugsByReportId.get(id) || []).some((drug) => isFilled(drug.treatment_drug_group))).length,
      },
      {
        key: 'section_f_complete',
        label: 'Hoàn thành phần F',
        count: reportPreviews.filter((report) => report.sectionStatus.F).length,
      },
    ].map((signal) => ({
      ...signal,
      percentage: toPercentage(signal.count, totalReports),
    }))

    const missingFields = buildMissingFieldSummary(reports, drugsByReportId)

    const pendingQueue = [...reportPreviews]
      .filter((report) => report.queueReasons.length > 0)
      .sort((left, right) => {
        const pendingScore = Number(right.approvalStatus === 'pending') - Number(left.approvalStatus === 'pending')
        if (pendingScore !== 0) return pendingScore

        const seriousScore =
          Number(SERIOUS_SEVERITY_KEYS.has(right.severityLevel)) - Number(SERIOUS_SEVERITY_KEYS.has(left.severityLevel))
        if (seriousScore !== 0) return seriousScore

        if (left.completedSections !== right.completedSections) {
          return left.completedSections - right.completedSections
        }

        return new Date(right.reportDate).getTime() - new Date(left.reportDate).getTime()
      })
      .slice(0, 8)

    const response: DashboardStatsResponse = {
      filters,
      kpis: {
        totalReports,
        seriousReports,
        pendingReports,
        completenessRate: toPercentage(completeReports, totalReports),
        followUpRate: toPercentage(followUpReports, totalReports),
        preventableRate: toPercentage(preventableReports, totalReports),
        newReportsThisMonth,
        newReportsToday,
      },
      sectionSummaries,
      qualitySignals,
      missingFields,
      pendingQueue,
      reportPreviews: reportPreviews.slice(0, 20),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Dashboard stats API error:', error)
    return NextResponse.json({ error: 'Lỗi server khi tải dashboard' }, { status: 500 })
  }
}
