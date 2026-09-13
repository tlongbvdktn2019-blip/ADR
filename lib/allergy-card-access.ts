import { createAdminClient } from '@/lib/supabase'

export interface AllergyCardAccessContext {
  userId: string
  role: 'admin' | 'user'
  organizationId: string | null
  organization: string | null
  name: string
}

export async function getAllergyCardAccessContext(userId: string): Promise<AllergyCardAccessContext | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, role, organization_id, organization, name')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    console.error('Cannot resolve allergy-card access context:', error)
    return null
  }

  return {
    userId: data.id,
    role: data.role === 'admin' ? 'admin' : 'user',
    organizationId: data.organization_id || null,
    organization: data.organization || null,
    name: data.name || '',
  }
}

export function canAccessOrganization(
  context: AllergyCardAccessContext,
  organizationId?: string | null
): boolean {
  return context.role === 'admin' || (
    Boolean(context.organizationId) && context.organizationId === organizationId
  )
}

