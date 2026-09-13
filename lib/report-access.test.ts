import { describe, expect, it, vi } from 'vitest'
import {
  applyReportAccessScope,
  canAccessReportOrganization,
  getReportAccessContext,
  type ReportAccessContext,
} from './report-access'

const admin: ReportAccessContext = {
  userId: 'admin-user',
  role: 'admin',
  organizationId: null,
}

const organizationUser: ReportAccessContext = {
  userId: 'organization-user',
  role: 'user',
  organizationId: 'organization-a',
}

describe('report access scope', () => {
  it('does not restrict admin queries', () => {
    const query = { eq: vi.fn() }

    expect(applyReportAccessScope(query, admin)).toBe(query)
    expect(query.eq).not.toHaveBeenCalled()
  })

  it('restricts regular users by the canonical organization id', () => {
    const scopedQuery = { name: 'scoped-query' }
    const query = { eq: vi.fn().mockReturnValue(scopedQuery) }

    expect(applyReportAccessScope(query, organizationUser)).toBe(scopedQuery)
    expect(query.eq).toHaveBeenCalledWith('organization_id', 'organization-a')
  })

  it('gives users without an organization no report query', () => {
    const query = { eq: vi.fn() }
    const unassignedUser = { ...organizationUser, organizationId: null }

    expect(applyReportAccessScope(query, unassignedUser)).toBeNull()
    expect(query.eq).not.toHaveBeenCalled()
  })

  it('allows only matching organizations for regular users', () => {
    expect(canAccessReportOrganization(admin, 'organization-b')).toBe(true)
    expect(canAccessReportOrganization(organizationUser, 'organization-a')).toBe(true)
    expect(canAccessReportOrganization(organizationUser, 'organization-b')).toBe(false)
    expect(canAccessReportOrganization({ ...organizationUser, organizationId: null }, null)).toBe(false)
  })
})

describe('getReportAccessContext', () => {
  it('loads the current role and organization from the database', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'organization-user',
        role: 'user',
        organization_id: 'organization-a',
      },
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })

    await expect(getReportAccessContext('organization-user', { from })).resolves.toEqual(
      organizationUser
    )
    expect(from).toHaveBeenCalledWith('users')
    expect(select).toHaveBeenCalledWith('id, role, organization_id')
    expect(eq).toHaveBeenCalledWith('id', 'organization-user')
  })
})
