import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tra cứu thẻ dị ứng',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
}

export default function PublicAllergyCardLayout({ children }: { children: React.ReactNode }) {
  return children
}
