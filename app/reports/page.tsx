import MainLayout from '@/components/layout/MainLayout'
import Button from '@/components/ui/Button'
import ReportList from '@/components/reports/ReportList'
import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/24/outline'

export default function ReportsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Báo cáo ADR</h1>
            <p className="text-gray-600 mt-1">Quản lý báo cáo phản ứng có hại của thuốc</p>
          </div>
          <Link href="/reports/new">
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              Tạo báo cáo mới
            </Button>
          </Link>
        </div>

        {/* Reports List Component */}
        <ReportList />
      </div>
    </MainLayout>
  )
}
