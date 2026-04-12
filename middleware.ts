import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware() {
    // Additional middleware logic can be added here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname.startsWith('/auth')) {
          return true
        }

        if (req.nextUrl.pathname === '/') {
          return true
        }

        if (req.nextUrl.pathname.startsWith('/public-report')) {
          return true
        }

        if (req.nextUrl.pathname.startsWith('/contest')) {
          return true
        }

        if (req.nextUrl.pathname.startsWith('/api/public/')) {
          return true
        }

        if (req.nextUrl.pathname.startsWith('/api/contest/')) {
          return true
        }

        if (req.nextUrl.pathname.startsWith('/allergy-cards/view/')) {
          return true
        }

        if (req.nextUrl.pathname.startsWith('/api/allergy-cards/view/')) {
          return true
        }

        if (req.nextUrl.pathname.startsWith('/allergy-cards/public/')) {
          return true
        }

        if (req.nextUrl.pathname.startsWith('/api/allergy-cards/public/')) {
          return true
        }

        if (req.nextUrl.pathname.startsWith('/allergy-cards/scan')) {
          return true
        }

        if (!token) {
          return false
        }

        if (req.nextUrl.pathname.startsWith('/admin')) {
          return token.role === 'admin'
        }

        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return token.role === 'admin' || token.role === 'user'
        }

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
    '/((?!api|_next/static|_next/image|favicon.ico|Logo.jpg|.*\\.(?:jpg|jpeg|png|gif|svg|webp|ico|woff|woff2|ttf|eot)).*)',
  ],
}
