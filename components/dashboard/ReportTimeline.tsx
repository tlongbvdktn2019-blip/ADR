// =====================================================
// REPORT TIMELINE COMPONENT
// Displays a timeline of recent ADR reports
// =====================================================

'use client';

import { ClockIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ReportTimelineItem {
  id: string;
  report_code: string;
  organization: string;
  severity_level: string;
  approval_status: string;
  created_at: string;
}

interface ReportTimelineProps {
  reports: ReportTimelineItem[];
}

const SEVERITY_LABELS: Record<string, string> = {
  death: 'Tử vong',
  life_threatening: 'Đe dọa tính mạng',
  hospitalization: 'Nhập viện',
  birth_defect: 'Dị tật thai nhi',
  permanent_disability: 'Tàn tật vĩnh viễn',
  not_serious: 'Không nghiêm trọng',
};

const SEVERITY_COLORS: Record<string, string> = {
  death: 'text-red-700 bg-red-50',
  life_threatening: 'text-red-600 bg-red-50',
  hospitalization: 'text-orange-600 bg-orange-50',
  birth_defect: 'text-purple-600 bg-purple-50',
  permanent_disability: 'text-red-500 bg-red-50',
  not_serious: 'text-gray-600 bg-gray-50',
};

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending: 'Chưa duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
};

export default function ReportTimeline({ reports }: ReportTimelineProps) {
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Vừa xong';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'pending':
      default:
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'pending':
      default:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  if (reports.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <ClockIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p>Chưa có báo cáo nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report, index) => (
        <Link 
          key={report.id}
          href={`/reports/${report.id}`}
          className="block group"
        >
          <div className="relative pl-8 pb-4">
            {/* Timeline line */}
            {index < reports.length - 1 && (
              <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-gray-200"></div>
            )}
            
            {/* Timeline dot */}
            <div className="absolute left-0 top-1.5">
              {getStatusIcon(report.approval_status)}
            </div>

            {/* Content card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group-hover:border-blue-300">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {report.report_code}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(report.approval_status)}`}>
                      {APPROVAL_STATUS_LABELS[report.approval_status] || report.approval_status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {report.organization}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs text-gray-500">{getTimeAgo(report.created_at)}</p>
                </div>
              </div>

              {/* Severity badge */}
              <div className="flex items-center gap-2">
                {(['death', 'life_threatening', 'hospitalization'].includes(report.severity_level)) && (
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-xs px-2 py-1 rounded ${SEVERITY_COLORS[report.severity_level] || 'text-gray-600 bg-gray-50'}`}>
                  {SEVERITY_LABELS[report.severity_level] || report.severity_level}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}








