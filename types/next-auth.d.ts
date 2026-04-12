import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      email: string
      name: string
      role: string
      organization: string | null
    }
  }

  interface User {
    id: string
    username: string
    email: string
    name: string
    role: string
    organization: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username: string
    role: string
    organization: string | null
  }
}


