import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin', 'latin-ext', 'vietnamese'], display: 'swap' })

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Hệ thống Quản lý ADR',
  description: 'Hệ thống Quản lý và báo cáo phản ứng có hại của thuốc (ADR)',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1e40af', // Blue-800 color for theme
  viewportFit: 'cover', // For notched devices
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}




