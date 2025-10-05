import { createClient } from '@supabase/supabase-js'

/**
 * Get Supabase admin client (bypasses RLS)
 */
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

/**
 * Get user ID from email, create user if not exists
 */
export async function getOrCreateUser(email: string, name?: string): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin()

  // Try to get existing user
  const { data: existingUser, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  // User exists, return ID
  if (existingUser && !fetchError) {
    return existingUser.id
  }

  // User doesn't exist, create new user
  if (fetchError && fetchError.code === 'PGRST116') {
    console.log('Creating new user:', email)
    
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        email: email,
        name: name || email.split('@')[0], // Use part before @ as default name
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

    console.log('New user created:', newUser.id)
    return newUser.id
  }

  // Other errors
  console.error('Error fetching user:', fetchError)
  throw new Error('Failed to get or create user')
}

/**
 * Get user ID from session
 */
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
