import Link from 'next/link'
import Button from '@/components/ui/Button'
import MainLayout from '@/components/layout/MainLayout'
import { DocumentTextIcon } from '@heroicons/react/24/outline'

export default function ReportNotFound() {
  return (
    <MainLayout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <DocumentTextIcon className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Không tìm thấy báo cáo
          </h1>
          
          <p className="text-gray-600 mb-6 max-w-md">
            Báo cáo bạn tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.
          </p>
          
          <div className="space-x-3">
            <Link href="/reports">
              <Button>
                Quay lại danh sách báo cáo
              </Button>
            </Link>
            
            <Link href="/reports/new">
              <Button variant="outline">
                Tạo báo cáo mới
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}


