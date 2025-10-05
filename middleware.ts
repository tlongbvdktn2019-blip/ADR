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

        // Allow access to homepage (public report form)
        if (req.nextUrl.pathname === '/') {
          return true
        }

        // Allow public access to report page
        if (req.nextUrl.pathname.startsWith('/public-report')) {
          return true
        }

        // Allow public access to contest pages
        if (req.nextUrl.pathname.startsWith('/contest')) {
          return true
        }

        // Allow public API access
        if (req.nextUrl.pathname.startsWith('/api/public/')) {
          return true
        }
        
        // Allow public access to contest APIs
        if (req.nextUrl.pathname.startsWith('/api/contest/')) {
          return true
        }

        // Allow public access to allergy card view (via QR code)
        if (req.nextUrl.pathname.startsWith('/allergy-cards/view/')) {
          return true
        }

        // Allow public API access for card view
        if (req.nextUrl.pathname.startsWith('/api/allergy-cards/view/')) {
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
     * - api/* (ALL API routes - they handle their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Logo.jpg (logo file)
     * - Static files (images, fonts, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|Logo.jpg|.*\\.(?:jpg|jpeg|png|gif|svg|webp|ico|woff|woff2|ttf|eot)).*)',
  ],
}


