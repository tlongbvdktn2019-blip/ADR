const REPORT_CODE_PAGE_SIZE = 1000
const REPORT_CODE_RETRY_LIMIT = 5

type SupabaseClientLike = {
  from: (table: string) => any
}

type Department = {
  id?: string
  code: string
  name: string
}

type GenerateReportCodeOptions = {
  departmentId?: string
  organization?: string
  year?: number
}

type CreateReportOptions = {
  organization: string
  values: Record<string, unknown>
  maxAttempts?: number
}

export class ReportCodeError extends Error {
  status: number

  constructor(message: string, status = 500) {
    super(message)
    this.name = 'ReportCodeError'
    this.status = status
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function getDepartment(
  supabase: SupabaseClientLike,
  options: GenerateReportCodeOptions
): Promise<Department> {
  let query = supabase
    .from('departments')
    .select('id, code, name')

  if (options.departmentId) {
    query = query.eq('id', options.departmentId)
  } else if (options.organization) {
    query = query.eq('name', options.organization)
  } else {
    throw new ReportCodeError('Thiếu thông tin đơn vị để tạo mã báo cáo', 400)
  }

  const { data: department, error } = await query.single()

  if (error || !department) {
    throw new ReportCodeError('Không tìm thấy đơn vị', 404)
  }

  if (!department.code) {
    throw new ReportCodeError('Đơn vị chưa có mã code', 400)
  }

  return department as Department
}

async function getHighestSequence(
  supabase: SupabaseClientLike,
  departmentCode: string,
  year: number
) {
  const codePattern = `${departmentCode}-%-${year}`
  const codeRegex = new RegExp(
    `^${escapeRegExp(departmentCode)}-(\\d+)-${year}$`
  )
  let highestSequence = 0
  let from = 0

  while (true) {
    const to = from + REPORT_CODE_PAGE_SIZE - 1
    const { data: reports, error } = await supabase
      .from('adr_reports')
      .select('report_code')
      .like('report_code', codePattern)
      .order('report_code', { ascending: true })
      .range(from, to)

    if (error) {
      throw new ReportCodeError('Lỗi khi kiểm tra mã báo cáo hiện có')
    }

    const rows = (reports || []) as Array<{ report_code?: string | null }>

    for (const report of rows) {
      const match = report.report_code?.match(codeRegex)
      if (!match) continue

      const sequence = Number.parseInt(match[1], 10)
      if (Number.isSafeInteger(sequence) && sequence > highestSequence) {
        highestSequence = sequence
      }
    }

    if (rows.length < REPORT_CODE_PAGE_SIZE) {
      return highestSequence
    }

    from += REPORT_CODE_PAGE_SIZE
  }
}

export async function generateNextReportCode(
  supabase: SupabaseClientLike,
  options: GenerateReportCodeOptions
) {
  const department = await getDepartment(supabase, options)
  const year = options.year ?? new Date().getFullYear()
  const highestSequence = await getHighestSequence(
    supabase,
    department.code,
    year
  )
  const sequenceNumber = String(highestSequence + 1).padStart(3, '0')

  return {
    reportCode: `${department.code}-${sequenceNumber}-${year}`,
    organization: department.name,
    departmentCode: department.code,
    sequenceNumber,
    year,
  }
}

function isReportCodeConflict(error: any) {
  if (error?.code !== '23505') return false

  const errorText = [
    error.message,
    error.details,
    error.hint,
    error.constraint,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return (
    errorText.includes('report_code') ||
    errorText.includes('report-code') ||
    errorText.includes('adr_reports_report_code_key') ||
    errorText.includes('adr-reports-report-code-key')
  )
}

export async function createReportWithUniqueCode(
  supabase: SupabaseClientLike,
  options: CreateReportOptions
) {
  const maxAttempts = options.maxAttempts ?? REPORT_CODE_RETRY_LIMIT
  let lastError: any = null

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const generated = await generateNextReportCode(supabase, {
      organization: options.organization,
    })

    const { data, error } = await supabase
      .from('adr_reports')
      .insert({
        ...options.values,
        organization: generated.organization,
        report_code: generated.reportCode,
      })
      .select()
      .single()

    if (!error) {
      return { data, error: null }
    }

    lastError = error
    if (!isReportCodeConflict(error)) {
      return { data: null, error }
    }
  }

  console.error(
    `Report code collision persisted after ${maxAttempts} attempts:`,
    lastError
  )

  return {
    data: null,
    error: {
      code: 'REPORT_CODE_RETRY_EXHAUSTED',
      message:
        'Không thể cấp mã báo cáo duy nhất. Vui lòng thử gửi lại sau ít phút.',
    },
  }
}
