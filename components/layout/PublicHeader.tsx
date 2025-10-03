'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { UserCircleIcon, ChartBarIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useState } from 'react';

export default function PublicHeader() {
  const { data: session } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
      return;
    }

    setSigningOut(true);
    
    try {
      toast.loading('Đang đăng xuất...', { id: 'logout' });
      
      await signOut({ 
        callbackUrl: '/',
        redirect: true
      });
      
      toast.success('Đã đăng xuất thành công!', { id: 'logout' });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Có lỗi xảy ra khi đăng xuất', { id: 'logout' });
      setSigningOut(false);
    }
  };

  return (
    <header className="bg-blue-600 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Title */}
          <Link href="/" className="flex items-center space-x-3">
            <img
              src="/Logo.jpg"
              alt="Logo Hệ thống ADR"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div>
              <div className="text-white text-lg font-bold">Hệ thống ADR</div>
              <div className="text-blue-100 text-xs hidden sm:block">Báo cáo phản ứng có hại của thuốc</div>
            </div>
          </Link>

          {/* Right Side - Login/Dashboard/Logout Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {session ? (
              <>
                <span className="hidden md:block text-white text-sm">
                  Xin chào, <strong>{session.user.name}</strong>
                </span>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="bg-white text-blue-600 hover:bg-blue-50">
                    <ChartBarIcon className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Vào hệ thống</span>
                    <span className="sm:hidden">Hệ thống</span>
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="bg-red-500 text-white hover:bg-red-600 border-red-500"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                  <span className="sm:hidden">Thoát</span>
                </Button>
              </>
            ) : (
              <Link href="/auth/login">
                <Button variant="outline" className="bg-white text-blue-600 hover:bg-blue-50">
                  <UserCircleIcon className="w-5 h-5 mr-2" />
                  Đăng nhập
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

