import { describe, expect, it } from 'vitest'
import {
  buildDashboardQueryParams,
  buildQueueReasons,
  DEFAULT_DASHBOARD_FILTERS,
  parseDashboardFilters,
} from './dashboard'

describe('dashboard without report approval workflow', () => {
  it('ignores legacy approvalStatus query parameters', () => {
    const filters = parseDashboardFilters(
      new URLSearchParams('approvalStatus=pending&severity=death'),
    )

    expect(filters).toEqual({
      ...DEFAULT_DASHBOARD_FILTERS,
      severity: 'death',
    })
    expect(buildDashboardQueryParams(filters).has('approvalStatus')).toBe(false)
  })

  it('builds queue reasons only from incomplete report sections', () => {
    expect(
      buildQueueReasons({ A: true, B: false, C: true, D: false, E: true, F: true }),
    ).toEqual(['Thiếu Phần B', 'Thiếu Phần D'])
  })
})
