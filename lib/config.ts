// Configuration file for environment variables
// Copy this to .env.local and fill in the actual values

export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  nextAuth: {
    secret: process.env.NEXTAUTH_SECRET!,
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  email: {
    from: process.env.EMAIL_FROM || 'noreply@adrsystem.gov.vn',
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
} as const

// Environment variables required:
// NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
// SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
// NEXTAUTH_SECRET=your_nextauth_secret
// NEXTAUTH_URL=http://localhost:3000

// Email configuration (optional for development):
// EMAIL_FROM=noreply@yourcompany.com
// SMTP_HOST=smtp.gmail.com
// SMTP_PORT=587
// SMTP_SECURE=false
// SMTP_USER=your-gmail@gmail.com
// SMTP_PASS=your-app-password
