// =====================================================
// PUBLIC ALLERGY CARD VIEW PAGE
// Trang công khai hiển thị thông tin thẻ dị ứng
// KHÔNG CẦN ĐĂNG NHẬP - dành cho quét QR công khai
// =====================================================

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  PhoneIcon,
  BuildingOffice2Icon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  CreditCardIcon,
  InformationCircleIcon,
  PlusCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { AllergyCard, AllergyCardUpdate } from '@/types/allergy-card';

// Severity level colors and labels
const severityConfig = {
  life_threatening: { 
    color: 'bg-red-900 text-white', 
    label: 'Nguy hiểm tính mạng',
    icon: '🚨'
  },
  severe: { 
    color: 'bg-red-600 text-white', 
    label: 'Nghiêm trọng',
    icon: '⚠️'
  },
  moderate: { 
    color: 'bg-orange-500 text-white', 
    label: 'Trung bình',
    icon: '⚡'
  },
  mild: { 
    color: 'bg-yellow-500 text-white', 
    label: 'Nhẹ',
    icon: 'ℹ️'
  }
};

export default function PublicAllergyCardPage() {
  const params = useParams();
  const cardCode = params.code as string;
  
  const [card, setCard] = useState<AllergyCard | null>(null);
  const [updates, setUpdates] = useState<AllergyCardUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCard() {
      try {
        const response = await fetch(`/api/allergy-cards/public/${cardCode}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setCard(data.card);
          setUpdates(data.updates || []);
          setWarning(data.warning || null);
        } else {
          setError(data.error || 'Không thể tải thông tin thẻ dị ứng');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.');
      } finally {
        setLoading(false);
      }
    }

    if (cardCode) {
      fetchCard();
    }
  }, [cardCode]);

  const getUpdateTypeText = (type: string) => {
    switch (type) {
      case 'new_allergy': return 'Phát hiện dị ứng mới';
      case 'medical_facility': return 'Cập nhật cơ sở y tế';
      case 'additional_info': return 'Thông tin bổ sung';
      case 'severity_update': return 'Cập nhật mức độ nghiêm trọng';
      default: return type;
    }
  };

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case 'new_allergy': return 'bg-red-100 text-red-800 border-red-200';
      case 'medical_facility': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'additional_info': return 'bg-green-100 text-green-800 border-green-200';
      case 'severity_update': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityBadgeColor = (severity?: string) => {
    switch (severity) {
      case 'life_threatening':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'severe':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'mild':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityText = (severity?: string) => {
    switch (severity) {
      case 'life_threatening':
        return 'Nguy hiểm tính mạng';
      case 'severe':
        return 'Nghiêm trọng';
      case 'moderate':
        return 'Vừa';
      case 'mild':
        return 'Nhẹ';
      default:
        return 'Chưa xác định';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin thẻ dị ứng...</p>
        </Card>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md border-2 border-red-300">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Không tìm thấy thẻ
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Mã thẻ: <span className="font-mono font-semibold">{cardCode}</span>
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header - Emergency Alert */}
        <div className="mb-6 bg-red-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <ShieldExclamationIcon className="w-12 h-12 flex-shrink-0" />
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                ⚠️ THẺ DỊ ỨNG / ALLERGY CARD
              </h1>
              <p className="text-red-100 text-sm sm:text-base">
                Thông tin dị ứng quan trọng - Vui lòng đọc kỹ trước khi điều trị
              </p>
            </div>
          </div>
        </div>

        {/* Warning if expired/inactive */}
        {warning && (
          <Card className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-400">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0" />
              <p className="text-yellow-800 font-medium">{warning}</p>
            </div>
          </Card>
        )}

        {/* Patient Information */}
        <Card className="mb-6 p-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b">
            <UserIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Thông tin bệnh nhân</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Họ và tên</label>
              <p className="font-semibold text-lg text-gray-900">{card.patient_name}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-600">Tuổi / Giới tính</label>
              <p className="font-semibold text-gray-900">
                {card.patient_age} tuổi - {
                  card.patient_gender === 'male' ? 'Nam' : 
                  card.patient_gender === 'female' ? 'Nữ' : 'Khác'
                }
              </p>
            </div>

            {card.patient_id_number && (
              <div>
                <label className="text-sm text-gray-600">CMND/CCCD</label>
                <p className="font-semibold text-gray-900">{card.patient_id_number}</p>
              </div>
            )}

            <div>
              <label className="text-sm text-gray-600">Mã thẻ</label>
              <p className="font-mono font-bold text-blue-600">{card.card_code}</p>
            </div>
          </div>
        </Card>

        {/* ALLERGIES - Main Section */}
        <Card className="mb-6 p-6 border-2 border-red-500 bg-red-50">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-red-300">
            <ShieldExclamationIcon className="w-7 h-7 text-red-600" />
            <h2 className="text-2xl font-bold text-red-900">
              THÔNG TIN DỊ ỨNG
            </h2>
          </div>

          {card.allergies && card.allergies.length > 0 ? (
            <div className="space-y-3">
              {card.allergies.map((allergy, index) => {
                const severity = allergy.severity_level || 'moderate';
                const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.moderate;
                
                return (
                  <div 
                    key={allergy.id || index}
                    className="bg-white rounded-lg p-4 border-2 border-red-300 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {config.icon} {allergy.allergen_name}
                        </h3>
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
                            {config.label}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            allergy.certainty_level === 'confirmed' 
                              ? 'bg-gray-900 text-white' 
                              : 'bg-gray-300 text-gray-700'
                          }`}>
                            {allergy.certainty_level === 'confirmed' ? 'Đã xác nhận' : 'Nghi ngờ'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {allergy.clinical_manifestation && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-600 font-medium mb-1">Biểu hiện lâm sàng:</p>
                        <p className="text-gray-800">{allergy.clinical_manifestation}</p>
                      </div>
                    )}

                    {allergy.reaction_type && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 font-medium mb-1">Loại phản ứng:</p>
                        <p className="text-gray-800">{allergy.reaction_type}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">
              Không có thông tin dị ứng
            </p>
          )}
        </Card>

        {/* Medical Facility & Doctor Info */}
        <Card className="mb-6 p-6 bg-blue-50">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-blue-300">
            <BuildingOffice2Icon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Thông tin y tế</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 flex items-center gap-2">
                <BuildingOffice2Icon className="w-4 h-4" />
                Bệnh viện / Cơ sở y tế
              </label>
              <p className="font-semibold text-gray-900 text-lg">{card.hospital_name}</p>
              {card.department && (
                <p className="text-gray-600">Khoa: {card.department}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-600 flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Bác sĩ điều trị
              </label>
              <p className="font-semibold text-gray-900">{card.doctor_name}</p>
              {card.doctor_phone && (
                <a 
                  href={`tel:${card.doctor_phone}`}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mt-1"
                >
                  <PhoneIcon className="w-4 h-4" />
                  {card.doctor_phone}
                </a>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Ngày cấp: <span className="font-medium text-gray-900">
                  {new Date(card.issued_date).toLocaleDateString('vi-VN')}
                </span>
              </div>
              {card.expiry_date && (
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  Hết hạn: <span className="font-medium text-gray-900">
                    {new Date(card.expiry_date).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Emergency Instructions */}
        <Card className="mb-6 p-6 bg-orange-50 border-2 border-orange-400">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="w-6 h-6 text-orange-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-orange-900 mb-2">Hướng dẫn khẩn cấp</h3>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• <strong>KHÔNG</strong> sử dụng các chất gây dị ứng đã liệt kê trên</li>
                <li>• Thông báo ngay cho bác sĩ/điều dưỡng về thông tin dị ứng này</li>
                <li>• Kiểm tra kỹ thành phần thuốc trước khi sử dụng</li>
                <li>• Liên hệ bác sĩ điều trị nếu cần thêm thông tin</li>
                <li>• Trong trường hợp khẩn cấp, gọi 115 hoặc đến cơ sở y tế gần nhất</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Notes */}
        {card.notes && (
          <Card className="mb-6 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Ghi chú</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{card.notes}</p>
          </Card>
        )}

        {/* Add Info Button - Nút bổ sung thông tin */}
        {card.id && (
          <Card className="mb-6 p-6 bg-blue-50 border-2 border-blue-400">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <PlusCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-blue-900 mb-1">Bổ sung thông tin mới</h3>
                  <p className="text-sm text-blue-800">
                    Nếu bạn là nhân viên y tế và phát hiện thông tin dị ứng mới, vui lòng bổ sung vào thẻ
                  </p>
                </div>
              </div>
              <Link href={`/allergy-cards/${card.id}/add-info`}>
                <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                  <PlusCircleIcon className="w-5 h-5" />
                  Bổ sung thông tin
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Lịch sử bổ sung - Update History */}
        <Card className="mb-6 p-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b">
            <ClockIcon className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Lịch sử bổ sung ({updates.length})
            </h2>
          </div>
          
          {updates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-medium">Chưa có lịch sử bổ sung</p>
              <p className="text-sm mt-1">
                Khi có cơ sở y tế khác bổ sung thông tin, lịch sử sẽ hiển thị ở đây
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {updates.map((update, index) => (
                <div key={update.id} className="relative">
                  {/* Timeline line */}
                  {index < updates.length - 1 && (
                    <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-gray-200" />
                  )}
                  
                  <div className="flex gap-4">
                    {/* Timeline dot */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center relative z-10">
                      <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    
                    {/* Update content */}
                    <div className="flex-1 pb-6">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-1 text-xs font-medium rounded border ${getUpdateTypeColor(update.update_type)}`}>
                                {getUpdateTypeText(update.update_type)}
                              </span>
                              {update.is_verified && (
                                <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800 border border-green-200">
                                  ✓ Đã xác minh
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {new Date(update.created_at).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>

                        {/* Người bổ sung */}
                        <div className="mb-3">
                          <p className="font-semibold text-gray-900">{update.updated_by_name}</p>
                          <p className="text-sm text-gray-600">
                            {update.updated_by_role && `${update.updated_by_role} • `}
                            {update.updated_by_organization}
                          </p>
                          {update.updated_by_phone && (
                            <p className="text-sm text-gray-600">
                              📞 {update.updated_by_phone}
                            </p>
                          )}
                        </div>

                        {/* Cơ sở y tế */}
                        <div className="mb-3 p-2 bg-white rounded border border-gray-100">
                          <p className="text-sm font-medium text-gray-700">
                            🏥 {update.facility_name}
                          </p>
                          {update.facility_department && (
                            <p className="text-sm text-gray-600">
                              {update.facility_department}
                            </p>
                          )}
                        </div>

                        {/* Lý do và ghi chú */}
                        {update.reason_for_update && (
                          <div className="mb-2">
                            <p className="text-sm">
                              <span className="font-medium">Lý do:</span> {update.reason_for_update}
                            </p>
                          </div>
                        )}
                        
                        {update.update_notes && (
                          <div className="mb-3">
                            <p className="text-sm">
                              <span className="font-medium">Ghi chú:</span> {update.update_notes}
                            </p>
                          </div>
                        )}

                        {/* Allergies added */}
                        {update.allergies_added && update.allergies_added.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              🔴 Dị ứng được bổ sung ({update.allergies_added.length}):
                            </p>
                            <div className="space-y-2">
                              {update.allergies_added.map((allergy: any) => (
                                <div key={allergy.id} className="bg-white p-2 rounded border border-gray-200">
                                  <div className="flex items-start justify-between">
                                    <p className="font-medium">{allergy.allergen_name}</p>
                                    <div className="flex gap-1">
                                      {allergy.certainty_level === 'confirmed' ? (
                                        <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-800">
                                          Chắc chắn
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800">
                                          Nghi ngờ
                                        </span>
                                      )}
                                      {allergy.severity_level && (
                                        <span className={`px-2 py-0.5 text-xs rounded ${getSeverityBadgeColor(allergy.severity_level)}`}>
                                          {getSeverityText(allergy.severity_level)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {allergy.clinical_manifestation && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {allergy.clinical_manifestation}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>Thẻ dị ứng được cấp bởi {card.organization}</p>
          <p className="mt-1">Mã thẻ: <span className="font-mono font-semibold">{card.card_code}</span></p>
          <p className="mt-2 text-xs">
            Thông tin này chỉ mang tính chất tham khảo. 
            Vui lòng liên hệ bác sĩ điều trị để biết thêm chi tiết.
          </p>
        </div>

      </div>
    </div>
  );
}

