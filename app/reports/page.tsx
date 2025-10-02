import MainLayout from '@/components/layout/MainLayout'
import Button from '@/components/ui/Button'
import ReportList from '@/components/reports/ReportList'
import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/24/outline'

export default function ReportsPage() {
  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Báo cáo ADR</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Quản lý báo cáo phản ứng có hại của thuốc</p>
          </div>
          <Link href="/reports/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto touch-target">
              <PlusIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Tạo báo cáo mới</span>
              <span className="sm:hidden">Báo cáo mới</span>
            </Button>
          </Link>
        </div>

        {/* Reports List Component */}
        <ReportList />
      </div>
    </MainLayout>
  )
}
