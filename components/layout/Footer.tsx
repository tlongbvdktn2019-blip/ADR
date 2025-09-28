'use client'

import { HeartIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-blue-800 border-t border-blue-700" style={{ paddingBottom: '0.05cm' }}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-14">
          
          {/* Version Info - Trái */}
          <div className="text-left">
            <p className="text-xs text-white">
              © {currentYear} - v2025
            </p>
          </div>

          {/* Developer Info - Giữa */}
          <div className="text-center">
          <p className="text-sm text-white font-medium">
              Phần mềm được phát triển bới:
            </p>
            <p className="text-sm text-white font-medium">
              DS.CK1 Nguyễn Thành Long
            </p>
          </div>

          {/* Contact Info - Phải */}
          <div className="text-right">
            <a 
              href="mailto:thanhlongnguyen2013@gmail.com"
              className="inline-flex items-center text-blue-200 hover:text-white transition-colors text-sm"
            >
              <EnvelopeIcon className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">thanhlongnguyen2013@gmail.com</span>
              <span className="sm:hidden">Contact</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
