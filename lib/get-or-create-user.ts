import { createClient } from '@supabase/supabase-js'
import { buildUsernameFromEmail, normalizeEmail } from './user-account'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

async function generateUniqueUsername(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>, email: string) {
  const baseUsername = buildUsernameFromEmail(email)
  let candidate = baseUsername
  let suffix = 1

  while (true) {
    const { data: existingUser, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', candidate)
      .maybeSingle()

    if (error) {
      throw new Error('Failed to check username availability')
    }

    if (!existingUser) {
      return candidate
    }

    candidate = `${baseUsername.slice(0, Math.max(1, 50 - String(suffix).length - 1))}-${suffix}`
    suffix += 1
  }
}

export async function getOrCreateUser(email: string, name?: string): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin()
  const normalizedEmail = normalizeEmail(email)

  const { data: existingUser, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .single()

  if (existingUser && !fetchError) {
    return existingUser.id
  }

  if (fetchError && fetchError.code === 'PGRST116') {
    const username = await generateUniqueUsername(supabaseAdmin, normalizedEmail)
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        email: normalizedEmail,
        username,
        name: name || normalizedEmail.split('@')[0],
        role: 'user'
      })
      .select('id')
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      throw new Error('Failed to create user')
    }

    if (!newUser) {
      throw new Error('User creation returned no data')
    }

    return newUser.id
  }

  console.error('Error fetching user:', fetchError)
  throw new Error('Failed to get or create user')
}

export async function getUserIdFromSession(session: any): Promise<string | null> {
  if (!session || !session.user?.email) {
    return null
  }

  try {
    return await getOrCreateUser(session.user.email, session.user.name)
  } catch (error) {
    console.error('Error getting user ID:', error)
    return null
  }
}
