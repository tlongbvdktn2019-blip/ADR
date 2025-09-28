import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Additional middleware logic can be added here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public pages
        if (req.nextUrl.pathname.startsWith('/auth')) {
          return true
        }

        // Require authentication for all other pages
        if (!token) {
          return false
        }

        // Admin-only routes  
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return token.role === 'admin'
        }

        // Dashboard routes (both admin and user can access)
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return token.role === 'admin' || token.role === 'user'
        }

        // User routes (both admin and user can access)
        if (req.nextUrl.pathname.startsWith('/reports')) {
          return token.role === 'admin' || token.role === 'user'
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}


