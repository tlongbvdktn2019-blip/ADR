import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'
import { Database } from '@/types/supabase'
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
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email và mật khẩu là bắt buộc')
        }

        try {
          // Get user from Supabase
          const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .single()

          if (error) {
            console.log('Database error:', error)
            throw new Error('Thông tin đăng nhập không chính xác')
          }

          if (!user) {
            console.log('User not found:', credentials.email)
            throw new Error('Thông tin đăng nhập không chính xác')
          }

          // Check if user has a password set
          if (!(user as any).password_hash) {
            console.log('User has no password set:', (user as any).email)
            throw new Error('Tài khoản chưa được thiết lập mật khẩu. Vui lòng liên hệ admin.')
          }

          // Verify password using bcrypt
          const isValidPassword = await bcrypt.compare(credentials.password, (user as any).password_hash)
          
          if (!isValidPassword) {
            console.log('Invalid password for user:', (user as any).email, 'role:', (user as any).role)
            throw new Error('Mật khẩu không chính xác')
          }

          console.log('Login successful for:', (user as any).email, 'role:', (user as any).role)

          return {
            id: (user as any).id,
            email: (user as any).email,
            name: (user as any).name,
            role: (user as any).role,
            organization: (user as any).organization,
          }
        } catch (error) {
          console.error('Auth error:', error)
          throw error
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.organization = user.organization
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
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
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: config.nextAuth.secret,
}
