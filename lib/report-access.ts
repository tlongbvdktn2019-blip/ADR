export interface ReportAccessContext {
  userId: string
  role: 'admin' | 'user'
  organizationId: string | null
}

type SupabaseClientLike = {
  from: (table: string) => any
}

export async function getReportAccessContext(
  userId: string,
  supabase: SupabaseClientLike
): Promise<ReportAccessContext | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, role, organization_id')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    console.error('Cannot resolve report access context:', error)
    return null
  }

  return {
    userId: data.id,
    role: data.role === 'admin' ? 'admin' : 'user',
    organizationId: data.organization_id || null,
  }
}

/**
 * Applies the authoritative organization boundary to a report query.
 * A null result means that a non-admin user has no assigned organization and
 * therefore cannot access any reports.
 */
export function applyReportAccessScope<T>(
  query: T,
  context: ReportAccessContext
): T | null {
  if (context.role === 'admin') {
    return query
  }

  if (!context.organizationId) {
    return null
  }

  return (query as any).eq('organization_id', context.organizationId) as T
}

export function canAccessReportOrganization(
  context: ReportAccessContext,
  organizationId?: string | null
): boolean {
  return context.role === 'admin' || (
    Boolean(context.organizationId) && context.organizationId === organizationId
  )
}
