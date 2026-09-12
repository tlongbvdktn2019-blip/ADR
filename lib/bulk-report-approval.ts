export const MAX_BULK_APPROVAL_REPORTS = 100

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface SelectableApprovalReport {
  id: string
  approval_status: ApprovalStatus
}

export interface BulkApprovalResult {
  requested_count: number
  approved_count: number
  skipped_count: number
  approved_ids: string[]
  skipped_ids: string[]
}

export class BulkApprovalValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BulkApprovalValidationError'
  }
}

export function normalizeBulkApprovalIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new BulkApprovalValidationError('report_ids phải là một mảng')
  }

  if (value.length === 0) {
    throw new BulkApprovalValidationError('Vui lòng chọn ít nhất một báo cáo')
  }

  const normalizedIds = value.map((id) => {
    if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
      throw new BulkApprovalValidationError('Danh sách báo cáo chứa ID không hợp lệ')
    }

    return id.toLowerCase()
  })

  const uniqueIds = Array.from(new Set(normalizedIds))

  if (uniqueIds.length > MAX_BULK_APPROVAL_REPORTS) {
    throw new BulkApprovalValidationError(
      `Chỉ có thể duyệt tối đa ${MAX_BULK_APPROVAL_REPORTS} báo cáo mỗi lần`
    )
  }

  return uniqueIds
}

export function getSelectablePendingReportIds(
  reports: SelectableApprovalReport[],
  limit = MAX_BULK_APPROVAL_REPORTS
): string[] {
  return reports
    .filter((report) => report.approval_status === 'pending')
    .slice(0, limit)
    .map((report) => report.id)
}

export function getSelectAllState(
  selectableIds: string[],
  selectedIds: ReadonlySet<string>
): { checked: boolean; indeterminate: boolean } {
  const selectedSelectableCount = selectableIds.filter((id) => selectedIds.has(id)).length

  return {
    checked: selectableIds.length > 0 && selectedSelectableCount === selectableIds.length,
    indeterminate: selectedSelectableCount > 0 && selectedSelectableCount < selectableIds.length,
  }
}

export function buildBulkApprovalResult(
  requestedIds: string[],
  updatedRows: Array<{ id: string }>
): BulkApprovalResult {
  const approvedIdSet = new Set(updatedRows.map((row) => row.id.toLowerCase()))
  const approvedIds = requestedIds.filter((id) => approvedIdSet.has(id))
  const skippedIds = requestedIds.filter((id) => !approvedIdSet.has(id))

  return {
    requested_count: requestedIds.length,
    approved_count: approvedIds.length,
    skipped_count: skippedIds.length,
    approved_ids: approvedIds,
    skipped_ids: skippedIds,
  }
}
