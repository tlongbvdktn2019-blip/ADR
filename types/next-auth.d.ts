import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      organization: string | null
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    organization: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    organization: string | null
  }
}


