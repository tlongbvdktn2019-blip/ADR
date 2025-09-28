import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { config } from '@/lib/config'

// Client-side Supabase client
export const createClient = () =>
  createClientComponentClient<Database>()

// Server-side Supabase client
export const createServerClient = () =>
  createServerComponentClient<Database>({
    cookies,
  })

// Admin Supabase client with service role key (bypasses RLS)
export const createAdminClient = () =>
  createSupabaseClient(config.supabase.url, config.supabase.serviceRoleKey)

// Database types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]


