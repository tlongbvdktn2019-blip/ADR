'use client'

import Footer from './Footer'

interface SimpleLayoutProps {
  children: React.ReactNode
  showFooter?: boolean
}

export default function SimpleLayout({ 
  children, 
  showFooter = true 
}: SimpleLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  )
}









