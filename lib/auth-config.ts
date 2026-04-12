import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import { Database } from '@/types/supabase'
import { normalizeEmail, normalizeUsername } from '@/lib/user-account'

const bcrypt = require('bcryptjs')

// Create Supabase client with service role key for admin operations
const supabaseAdmin = createClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Tên đăng nhập hoặc email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const identifier = String(credentials?.identifier || '').trim()
        const password = credentials?.password || ''

        if (!identifier || !password) {
          throw new Error('Tên đăng nhập hoặc email và mật khẩu là bắt buộc')
        }

        const isEmailLogin = identifier.includes('@')
        const normalizedIdentifier = isEmailLogin
          ? normalizeEmail(identifier)
          : normalizeUsername(identifier)

        const userQuery = supabaseAdmin
          .from('users')
          .select('*')

        const { data: user, error } = await (isEmailLogin
          ? userQuery.eq('email', normalizedIdentifier).maybeSingle()
          : userQuery.eq('username', normalizedIdentifier).maybeSingle())

        if (error) {
          console.error('Auth lookup error:', error)
          throw new Error('Không thể đăng nhập lúc này. Vui lòng thử lại sau.')
        }

        if (!user) {
          return null
        }

        if (!(user as any).password_hash) {
          throw new Error('Tài khoản chưa được thiết lập mật khẩu. Vui lòng liên hệ admin.')
        }

        const isValidPassword = await bcrypt.compare(password, (user as any).password_hash)

        if (!isValidPassword) {
          return null
        }

        return {
          id: (user as any).id,
          username: (user as any).username,
          email: (user as any).email,
          name: (user as any).name,
          role: (user as any).role,
          organization: (user as any).organization,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username
        token.role = user.role
        token.organization = user.organization
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.username = typeof token.username === 'string' ? token.username : ''
        session.user.role = token.role as string
        session.user.organization = token.organization as string | null
      }

      return session
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  secret: config.nextAuth.secret,
}
