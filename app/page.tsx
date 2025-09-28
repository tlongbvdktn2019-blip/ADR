import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }
  
  // Redirect based on user role
  if (session.user.role === 'admin') {
    redirect('/dashboard')
  } else {
    redirect('/reports')
  }
}


