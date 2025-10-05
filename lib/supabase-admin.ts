// =====================================================
// SUPABASE ADMIN CLIENT
// Sử dụng Service Role Key để bypass RLS policies
// ⚠️ CHỈ DÙNG TRONG SERVER-SIDE CODE!
// =====================================================

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Kiểm tra environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

/**
 * Supabase Admin Client
 * 
 * Client này sử dụng Service Role Key và BYPASS tất cả RLS policies.
 * 
 * ⚠️ SECURITY WARNINGS:
 * - CHỈ sử dụng trong server-side code (API routes, server components)
 * - KHÔNG BAO GIỜ expose trong client-side code
 * - LUÔN check authentication và authorization trước khi dùng
 * 
 * @example
 * ```typescript
 * // Trong API route
 * import { supabaseAdmin } from '@/lib/supabase-admin';
 * 
 * export async function POST(request: NextRequest) {
 *   // Check auth FIRST!
 *   const session = await getServerSession(authOptions);
 *   if (!session || session.user.role !== 'admin') {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   
 *   // Now safe to use admin client
 *   const { data, error } = await supabaseAdmin
 *     .from('departments')
 *     .insert(newDepartment);
 * }
 * ```
 */
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Verify if a user is admin
 * 
 * @param userId - User ID to check
 * @returns true if user is admin, false otherwise
 * 
 * @example
 * ```typescript
 * const isAdmin = await verifyAdmin(session.user.id);
 * if (!isAdmin) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 * }
 * ```
 */
export async function verifyAdmin(userId: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error verifying admin:', error);
      return false;
    }
    
    return (user as any)?.role === 'admin';
  } catch (error) {
    console.error('Error in verifyAdmin:', error);
    return false;
  }
}

/**
 * Get user by ID (admin only)
 * 
 * @param userId - User ID
 * @returns User data or null
 */
export async function getUserById(userId: string) {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Check if current request is from admin
 * Helper function combining session check and role verification
 * 
 * @param session - NextAuth session
 * @returns true if admin, false otherwise
 */
export function isAdmin(session: any): boolean {
  return session?.user?.role === 'admin';
}

// Export type for TypeScript
export type SupabaseAdmin = typeof supabaseAdmin;















