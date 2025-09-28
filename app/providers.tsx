'use client'

import { SessionProvider } from 'next-auth/react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClientComponentClient())

  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}


