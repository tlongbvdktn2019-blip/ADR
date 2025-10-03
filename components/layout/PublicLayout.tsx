'use client';

import PublicHeader from './PublicHeader';
import Footer from './Footer';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicHeader />
      
      <main className="flex-1">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}

