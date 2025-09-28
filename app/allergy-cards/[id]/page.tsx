// =====================================================
// ALLERGY CARD DETAIL PAGE
// Page for viewing detailed allergy card information
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  QrCodeIcon,
  ArrowLeftIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  ExclamationTriangleIcon,
  UserIcon,
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { AllergyCard, SeverityLevel } from '@/types/allergy-card';

interface AllergyCardDetailPageProps {
  params: {
    id: string;
  };
}

export default function AllergyCardDetailPage({ params }: AllergyCardDetailPageProps) {
  const { data: session } = useSession();
  const [card, setCard] = useState<AllergyCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCard();
  }, [params.id]);

  const loadCard = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/allergy-cards/${params.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể tải thông tin thẻ');
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

  const handleExportPDF = async () => {
    if (!card) return;

    try {
      const response = await fetch(`/api/allergy-cards/${card.id}/export-pdf`);
      
      if (!response.ok) {
        throw new Error('Không thể xuất PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `The_Di_Ung_${card.card_code}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Đã xuất PDF thành công');

    } catch (error) {
      console.error('Export PDF error:', error);
      toast.error('Có lỗi khi xuất PDF');
    }
  };

  const handleShare = async () => {
    if (!card) return;

    const shareData = {
      title: `Thẻ dị ứng - ${card.patient_name}`,
      text: `Xem thông tin thẻ dị ứng của ${card.patient_name}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback - copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Đã sao chép link vào clipboard');
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Không thể chia sẻ');
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

  const isAdmin = (session?.user as any)?.role === 'admin';
  const canEdit = card && (isAdmin || card.issued_by_user_id === session?.user?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto">
          <div className="text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không tìm thấy thẻ dị ứng</h3>
            <p className="text-gray-600 mb-4">{error || 'Thẻ không tồn tại hoặc bạn không có quyền xem'}</p>
            <Link href="/allergy-cards">
              <Button>Quay lại danh sách</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Check for severe allergies for warning
  const hasSevereAllergy = card.allergies?.some(a => 
    a.severity_level === 'severe' || a.severity_level === 'life_threatening'
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/allergy-cards">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeftIcon className="w-4 h-4" />
                Quay lại
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <QrCodeIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Chi tiết thẻ dị ứng
                </h1>
                <p className="text-gray-600">
                  Mã thẻ: <span className="font-mono">{card.card_code}</span>
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <ShareIcon className="w-4 h-4" />
                Chia sẻ
              </Button>
              
              <Button
                variant="outline"
                onClick={handleExportPDF}
                className="flex items-center gap-2"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                Xuất PDF
              </Button>
              
              {canEdit && (
                <Link href={`/allergy-cards/${card.id}/edit`}>
                  <Button className="flex items-center gap-2">
                    <PencilIcon className="w-4 h-4" />
                    Chỉnh sửa
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Warning */}
        {hasSevereAllergy && (
          <Card className="p-6 mb-6 border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-bold text-red-900 mb-2">
                  ⚠️ CẢNH BÁO DỊ ỨNG NGHIÊM TRỌNG
                </h2>
                <p className="text-red-800">
                  Bệnh nhân có dị ứng nghiêm trọng hoặc nguy hiểm tính mạng. 
                  Cần đặc biệt cẩn thận khi sử dụng thuốc và các dị nguyên liên quan.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* QR Code Section */}
          <div className="lg:col-span-1">
            <Card className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-4">Mã QR thẻ dị ứng</h2>
              
              {card.qr_code_url && (
                <div className="mb-4">
                  <img 
                    src={card.qr_code_url} 
                    alt="QR Code" 
                    className="mx-auto w-48 h-48 border border-gray-200 rounded-lg"
                  />
                </div>
              )}
              
              <p className="text-sm text-gray-600 mb-4">
                Quét mã QR này để xem thông tin dị ứng khẩn cấp
              </p>
              
              <Link href="/allergy-cards/scan">
                <Button variant="outline" className="w-full">
                  Mở máy quét QR
                </Button>
              </Link>
            </Card>
          </div>

          {/* Main Content */}
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
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Tuổi</label>
                  <p className="text-lg">{card.patient_age} tuổi</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Giới tính</label>
                  <p className="text-lg">
                    {card.patient_gender === 'male' ? 'Nam' : 
                     card.patient_gender === 'female' ? 'Nữ' : 'Khác'}
                  </p>
                </div>
                
                {card.patient_id_number && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">CMND/CCCD</label>
                    <p className="text-lg font-mono">{card.patient_id_number}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Medical Facility */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BuildingOffice2Icon className="w-6 h-6 text-green-600" />
                Cơ sở y tế
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Bệnh viện</label>
                  <p className="text-lg font-semibold">{card.hospital_name}</p>
                </div>
                
                {card.department && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Khoa/Trung tâm</label>
                    <p className="text-lg">{card.department}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Bác sĩ điều trị</label>
                  <p className="text-lg font-semibold">{card.doctor_name}</p>
                </div>
                
                {card.doctor_phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-mono">{card.doctor_phone}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`tel:${card.doctor_phone}`)}
                      >
                        Gọi
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Allergies */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ClipboardDocumentListIcon className="w-6 h-6 text-orange-600" />
                Thông tin dị ứng ({card.allergies?.length || 0})
              </h2>
              
              {card.allergies && card.allergies.length > 0 ? (
                <div className="space-y-4">
                  {card.allergies.map((allergy, index) => (
                    <div 
                      key={allergy.id}
                      className={`p-4 rounded-lg border ${
                        allergy.severity_level === 'severe' || allergy.severity_level === 'life_threatening' 
                          ? 'border-red-200 bg-red-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold">{allergy.allergen_name}</h3>
                        <div className="flex gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            allergy.certainty_level === 'confirmed' 
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}>
                            {allergy.certainty_level === 'confirmed' ? 'Chắc chắn' : 'Nghi ngờ'}
                          </span>
                          
                          {allergy.severity_level && (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityBadgeColor(allergy.severity_level)}`}>
                              {getSeverityText(allergy.severity_level)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {allergy.reaction_type && (
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Loại phản ứng:</span> {allergy.reaction_type}
                        </p>
                      )}
                      
                      {allergy.clinical_manifestation && (
                        <p className="text-gray-700">
                          <span className="font-medium">Biểu hiện lâm sàng:</span> {allergy.clinical_manifestation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Chưa có thông tin dị ứng
                </p>
              )}
            </Card>

            {/* Card Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <InformationCircleIcon className="w-6 h-6 text-purple-600" />
                Thông tin thẻ
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày cấp thẻ</label>
                  <p className="text-lg">{new Date(card.issued_date).toLocaleDateString('vi-VN')}</p>
                </div>
                
                {card.expiry_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ngày hết hạn</label>
                    <p className="text-lg">{new Date(card.expiry_date).toLocaleDateString('vi-VN')}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    card.status === 'active' ? 'bg-green-100 text-green-800' :
                    card.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {card.status === 'active' ? 'Hoạt động' :
                     card.status === 'inactive' ? 'Vô hiệu' : 'Hết hạn'}
                  </span>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Tổ chức cấp</label>
                  <p className="text-lg">{card.organization}</p>
                </div>
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
      </div>
    </div>
  );
}
