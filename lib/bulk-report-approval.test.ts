import { describe, expect, it } from 'vitest'
import {
  BulkApprovalValidationError,
  MAX_BULK_APPROVAL_REPORTS,
  buildBulkApprovalResult,
  getSelectAllState,
  getSelectablePendingReportIds,
  normalizeBulkApprovalIds,
} from './bulk-report-approval'

const uuid = (value: number) => `00000000-0000-4000-8000-${value.toString().padStart(12, '0')}`

describe('normalizeBulkApprovalIds', () => {
  it('normalizes casing and removes duplicate IDs while preserving order', () => {
    const firstId = 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA'
    const secondId = uuid(2)

    expect(normalizeBulkApprovalIds([firstId, secondId, firstId])).toEqual([
      firstId.toLowerCase(),
      secondId,
    ])
  })

  it.each([
    undefined,
    null,
    {},
    'not-an-array',
  ])('rejects a non-array value: %j', (value) => {
    expect(() => normalizeBulkApprovalIds(value)).toThrow(BulkApprovalValidationError)
  })

  it('rejects an empty array', () => {
    expect(() => normalizeBulkApprovalIds([])).toThrow('Vui lòng chọn ít nhất một báo cáo')
  })

  it.each([
    [['not-a-uuid']],
    [[123]],
    [[uuid(1), '']],
  ] as Array<[unknown[]]>)('rejects invalid report IDs: %j', (value) => {
    expect(() => normalizeBulkApprovalIds(value)).toThrow('ID không hợp lệ')
  })

  it('rejects more than the maximum number of unique IDs', () => {
    const reportIds = Array.from(
      { length: MAX_BULK_APPROVAL_REPORTS + 1 },
      (_, index) => uuid(index)
    )

    expect(() => normalizeBulkApprovalIds(reportIds)).toThrow(
      `tối đa ${MAX_BULK_APPROVAL_REPORTS} báo cáo`
    )
  })

  it('allows more than the raw limit when duplicates reduce the unique count', () => {
    const reportIds = Array.from(
      { length: MAX_BULK_APPROVAL_REPORTS + 1 },
      (_, index) => uuid(index % MAX_BULK_APPROVAL_REPORTS)
    )

    expect(normalizeBulkApprovalIds(reportIds)).toHaveLength(MAX_BULK_APPROVAL_REPORTS)
  })
})

describe('bulk selection helpers', () => {
  it('returns only pending report IDs up to the requested limit', () => {
    expect(
      getSelectablePendingReportIds(
        [
          { id: 'pending-1', approval_status: 'pending' },
          { id: 'approved', approval_status: 'approved' },
          { id: 'pending-2', approval_status: 'pending' },
        ],
        1
      )
    ).toEqual(['pending-1'])
  })

  it('reports unchecked, indeterminate, and checked select-all states', () => {
    const selectableIds = ['one', 'two']

    expect(getSelectAllState(selectableIds, new Set())).toEqual({
      checked: false,
      indeterminate: false,
    })
    expect(getSelectAllState(selectableIds, new Set(['one']))).toEqual({
      checked: false,
      indeterminate: true,
    })
    expect(getSelectAllState(selectableIds, new Set(selectableIds))).toEqual({
      checked: true,
      indeterminate: false,
    })
  })
})

describe('buildBulkApprovalResult', () => {
  it('preserves request order and separates approved and skipped IDs', () => {
    const requestedIds = [uuid(1), uuid(2), uuid(3)]

    expect(buildBulkApprovalResult(requestedIds, [{ id: uuid(3) }, { id: uuid(1) }])).toEqual({
      requested_count: 3,
      approved_count: 2,
      skipped_count: 1,
      approved_ids: [uuid(1), uuid(3)],
      skipped_ids: [uuid(2)],
    })
  })
})
