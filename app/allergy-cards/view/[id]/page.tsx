// =====================================================
// PUBLIC ALLERGY CARD VIEW PAGE
// Xem thẻ dị ứng qua QR code (không cần đăng nhập)
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  UserIcon,
  BuildingOffice2Icon,
  InformationCircleIcon,
  PhoneIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { SeverityLevel } from '@/types/allergy-card';

interface PublicAllergyCardViewProps {
  params: {
    id: string;
  };
}

export default function PublicAllergyCardView({ params }: PublicAllergyCardViewProps) {
  const [card, setCard] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCard();
  }, [params.id]);

  const loadCard = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Call API to get card (will create public endpoint)
      const response = await fetch(`/api/allergy-cards/view/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Không thể tải thông tin thẻ');
      }

      const data = await response.json();
      setCard(data.card);

    } catch (error) {
      console.error('Load card error:', error);
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityBadgeColor = (severity?: SeverityLevel) => {
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

  const getSeverityText = (severity?: SeverityLevel) => {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md mx-auto">
          <div className="text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không tìm thấy thẻ dị ứng</h3>
            <p className="text-gray-600 mb-4">{error || 'Thẻ không tồn tại hoặc đã bị xóa'}</p>
            <Link href="/">
              <Button>Về trang chủ</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Check for severe allergies
  const hasSevereAllergy = card.allergies?.some((a: any) => 
    a.severity_level === 'severe' || a.severity_level === 'life_threatening'
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ClipboardDocumentListIcon className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Thẻ Dị Ứng
          </h1>
          <p className="text-gray-600">
            Mã thẻ: <span className="font-mono font-semibold">{card.card_code}</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Thông tin từ: {card.organization || card.hospital_name}
          </p>
        </div>

        {/* Emergency Warning */}
        {hasSevereAllergy && (
          <Card className="p-6 mb-6 border-red-300 bg-red-50">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-10 h-10 text-red-600 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-red-900 mb-2">
                  ⚠️ CẢNH BÁO DỊ ỨNG NGHIÊM TRỌNG
                </h2>
                <p className="text-red-800 font-medium">
                  Bệnh nhân có dị ứng nghiêm trọng hoặc nguy hiểm tính mạng. 
                  <br />
                  <strong>Tuyệt đối không sử dụng các thuốc/chất gây dị ứng!</strong>
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* QR Code Section - For sharing and downloading */}
          <div className="lg:col-span-1">
            <Card className="p-6 text-center sticky top-4">
              <h2 className="text-lg font-semibold mb-4 text-blue-900">📱 Mã QR Thẻ Dị Ứng</h2>
              
              {/* QR Code Display */}
              {(card as any).qr_code_url ? (
                <div className="mb-4">
                  <img 
                    src={(card as any).qr_code_url} 
                    alt={`QR Code - ${card.card_code}`}
                    className="mx-auto w-40 h-40 border-2 border-blue-200 rounded-lg shadow-sm"
                  />
                </div>
              ) : (
                <div className="mb-4 w-40 h-40 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400 text-xs px-4 text-center">
                    QR code
                  </p>
                </div>
              )}
              
              {/* Card Code */}
              <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-gray-600">Mã thẻ:</p>
                <p className="text-lg font-mono font-bold text-blue-900">{card.card_code}</p>
              </div>
              
              <div className="text-xs text-gray-600 mb-3 text-left bg-gray-50 p-3 rounded-lg">
                <p className="font-medium mb-1">Quét QR để:</p>
                <ul className="space-y-0.5">
                  <li>• Xem thông tin thẻ</li>
                  <li>• Chia sẻ với y tá/bác sĩ</li>
                  <li>• Tra cứu nhanh khi cần</li>
                </ul>
              </div>
              
              {(card as any).qr_code_url && (
                <a 
                  href={(card as any).qr_code_url}
                  download={`QR-${card.card_code}.png`}
                  className="block w-full"
                >
                  <Button variant="outline" className="w-full text-sm">
                    💾 Tải QR Code
                  </Button>
                </a>
              )}
            </Card>
          </div>

          {/* Main Content - Allergies and Info */}
          <div className="lg:col-span-2 space-y-6">
          
          {/* Patient Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <UserIcon className="w-6 h-6 text-blue-600" />
              Thông tin bệnh nhân
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Họ và tên</label>
                <p className="text-lg font-semibold">{card.patient_name}</p>
              </div>
              
              {card.patient_age && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Tuổi</label>
                  <p className="text-lg">{card.patient_age} tuổi</p>
                </div>
              )}
              
              {card.patient_gender && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Giới tính</label>
                  <p className="text-lg">
                    {card.patient_gender === 'male' ? 'Nam' : 
                     card.patient_gender === 'female' ? 'Nữ' : 'Khác'}
                  </p>
                </div>
              )}
              
              {card.patient_id_number && (
                <div>
                  <label className="text-sm font-medium text-gray-500">CMND/CCCD</label>
                  <p className="text-lg font-mono">{card.patient_id_number}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Allergies - MOST IMPORTANT */}
          <Card className="p-6 border-2 border-red-300 bg-red-50">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-red-900">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
              DANH SÁCH CÁC CHẤT GÂY DỊ ỨNG ({card.allergies?.length || 0})
            </h2>
            
            {card.allergies && card.allergies.length > 0 ? (
              <div className="space-y-4">
                {card.allergies.map((allergy: any, index: number) => (
                  <div 
                    key={allergy.id || index}
                    className={`p-5 rounded-lg border-2 bg-white ${
                      allergy.severity_level === 'severe' || allergy.severity_level === 'life_threatening' 
                        ? 'border-red-400' 
                        : 'border-orange-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900">{allergy.allergen_name}</h3>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          allergy.certainty_level === 'confirmed' 
                            ? 'bg-red-600 text-white'
                            : 'bg-yellow-500 text-white'
                        }`}>
                          {allergy.certainty_level === 'confirmed' ? '✓ Chắc chắn' : '? Nghi ngờ'}
                        </span>
                        
                        {allergy.severity_level && (
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${getSeverityBadgeColor(allergy.severity_level)}`}>
                            {getSeverityText(allergy.severity_level)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {allergy.clinical_manifestation && (
                      <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-1">Biểu hiện lâm sàng:</p>
                        <p className="text-gray-900">{allergy.clinical_manifestation}</p>
                      </div>
                    )}
                    
                    {allergy.reaction_type && (
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Loại phản ứng:</span> {allergy.reaction_type}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">
                Chưa có thông tin dị ứng
              </p>
            )}
          </Card>

          {/* Medical Facility */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BuildingOffice2Icon className="w-6 h-6 text-green-600" />
              Cơ sở y tế cấp thẻ
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Bệnh viện</label>
                <p className="text-lg font-semibold">{card.hospital_name}</p>
              </div>
              
              {card.department && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Khoa/Phòng</label>
                  <p className="text-lg">{card.department}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-500">Bác sĩ điều trị</label>
                <p className="text-lg font-semibold">{card.doctor_name}</p>
              </div>
              
              {card.doctor_phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">Liên hệ</label>
                  <a 
                    href={`tel:${card.doctor_phone}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    <PhoneIcon className="w-5 h-5" />
                    {card.doctor_phone}
                  </a>
                </div>
              )}
            </div>
          </Card>

          {/* Card Info */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <InformationCircleIcon className="w-6 h-6 text-purple-600" />
              Thông tin thẻ
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày cấp</label>
                  <p className="text-lg">{new Date(card.issued_date).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
              
              {card.expiry_date && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Hết hạn</label>
                    <p className="text-lg">{new Date(card.expiry_date).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              )}
            </div>
            
            {card.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-500">Ghi chú</label>
                <p className="text-gray-700 mt-1">{card.notes}</p>
              </div>
            )}
          </Card>

          </div>
        </div>

        <div className="space-y-6">
          {/* Emergency Notice */}
          <Card className="p-6 bg-yellow-50 border-yellow-300">
            <h3 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
              <InformationCircleIcon className="w-6 h-6 text-yellow-600" />
              Lưu ý quan trọng
            </h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Luôn mang theo thẻ này khi đi khám bệnh</li>
              <li>• Thông báo với bác sĩ/y tá về các dị ứng trước khi dùng thuốc</li>
              <li>• Liên hệ ngay cơ sở y tế nếu có phản ứng dị ứng</li>
              <li>• Gọi 115 trong trường hợp khẩn cấp</li>
            </ul>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Thông tin được cung cấp bởi hệ thống quản lý thẻ dị ứng</p>
          <p className="mt-1">Để biết thêm chi tiết, vui lòng liên hệ cơ sở y tế đã cấp thẻ</p>
        </div>
      </div>
    </div>
  );
}

