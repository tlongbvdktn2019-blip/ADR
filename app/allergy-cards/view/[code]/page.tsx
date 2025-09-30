// =====================================================
// PUBLIC ALLERGY CARD VIEW PAGE
// Public page for viewing allergy card via QR scan
// Works with Zalo, camera, and any QR scanner
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  QrCodeIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  ClipboardDocumentListIcon,
  InformationCircleIcon,
  BeakerIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { QRCodeData } from '@/types/allergy-card';
import Link from 'next/link';

export default function PublicAllergyCardViewPage() {
  const params = useParams();
  const cardCode = params.code as string;
  
  const [allergyData, setAllergyData] = useState<QRCodeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCardData();
  }, [cardCode]);

  const loadCardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/allergy-cards/verify/${cardCode}`);
      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Không thể tải thông tin thẻ dị ứng');
        return;
      }

      setAllergyData(result.data);

      // Check for severe allergies and show alert
      const hasSevereAllergy = result.data.allergies?.some(
        (a: any) => a.severity === 'severe' || a.severity === 'life_threatening'
      );

      if (hasSevereAllergy) {
        toast.error('⚠️ CẢNH BÁO: Bệnh nhân có dị ứng nghiêm trọng!', {
          duration: 8000,
        });
      }
    } catch (err) {
      console.error('Load card error:', err);
      setError('Có lỗi xảy ra khi tải thông tin thẻ');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !allergyData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md mx-auto">
          <div className="text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không tìm thấy thẻ dị ứng</h3>
            <p className="text-gray-600 mb-4">{error || 'Thẻ không tồn tại hoặc đã hết hạn'}</p>
            <Link href="/">
              <Button className="flex items-center gap-2 mx-auto">
                <HomeIcon className="w-4 h-4" />
                Về trang chủ
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <QrCodeIcon className="w-10 h-10 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Thẻ Dị Ứng
            </h1>
          </div>
          <p className="text-gray-600">
            Mã thẻ: <span className="font-mono font-semibold">{allergyData.cardCode}</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            🔒 Thông tin được mã hóa và bảo mật
          </p>
        </div>

        {/* Emergency Alert */}
        {allergyData.allergies.some(a => a.severity === 'severe' || a.severity === 'life_threatening') && (
          <Card className="p-6 border-red-200 bg-red-50 mb-6">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-bold text-red-900 mb-2">
                  ⚠️ CẢNH BÁO DỊ ỨNG NGHIÊM TRỌNG
                </h2>
                <p className="text-red-800 font-medium">
                  Bệnh nhân có dị ứng nghiêm trọng. Cần cẩn thận khi sử dụng thuốc!
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-6">
          
          {/* Patient Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <InformationCircleIcon className="w-6 h-6 text-blue-600" />
              Thông tin bệnh nhân
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Họ tên</label>
                <p className="text-lg font-semibold">{allergyData.patientName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Tuổi</label>
                <p className="text-lg">{allergyData.patientAge} tuổi</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Giới tính</label>
                <p className="text-lg">
                  {allergyData.patientGender === 'male' ? 'Nam' : 
                   allergyData.patientGender === 'female' ? 'Nữ' : 'Khác'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Bệnh viện</label>
                <p className="text-lg">{allergyData.hospitalName}</p>
              </div>
            </div>
          </Card>

          {/* Allergy Details */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ClipboardDocumentListIcon className="w-6 h-6 text-orange-600" />
              Thông tin dị ứng ({allergyData.allergies.length})
            </h2>
            
            <div className="space-y-4">
              {allergyData.allergies.map((allergy, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${
                    allergy.severity === 'severe' || allergy.severity === 'life_threatening' 
                      ? 'border-red-200 bg-red-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{allergy.name}</h3>
                    <div className="flex gap-2 flex-wrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        allergy.certainty === 'confirmed' 
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {allergy.certainty === 'confirmed' ? 'Chắc chắn' : 'Nghi ngờ'}
                      </span>
                      
                      {allergy.severity && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          allergy.severity === 'life_threatening' ? 'bg-red-200 text-red-900' :
                          allergy.severity === 'severe' ? 'bg-orange-200 text-orange-900' :
                          allergy.severity === 'moderate' ? 'bg-yellow-200 text-yellow-900' :
                          'bg-green-200 text-green-900'
                        }`}>
                          {
                            allergy.severity === 'life_threatening' ? 'Nguy hiểm' :
                            allergy.severity === 'severe' ? 'Nghiêm trọng' :
                            allergy.severity === 'moderate' ? 'Vừa' : 'Nhẹ'
                          }
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {allergy.symptoms && (
                    <p className="text-gray-700 mt-2">
                      <span className="font-medium">Triệu chứng:</span> {allergy.symptoms}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Suspected Drugs Information */}
          {allergyData.suspectedDrugs && allergyData.suspectedDrugs.length > 0 && (
            <Card className="p-6 border-red-200 bg-red-50">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-red-900">
                <BeakerIcon className="w-6 h-6 text-red-600" />
                Thuốc nghi ngờ gây dị ứng ({allergyData.suspectedDrugs.length})
              </h2>
              
              <div className="space-y-4">
                {allergyData.suspectedDrugs.map((drug, index) => (
                  <div 
                    key={index}
                    className="p-4 rounded-lg border border-red-300 bg-white"
                  >
                    <div className="mb-3">
                      <h3 className="font-bold text-lg text-red-900">{drug.drugName}</h3>
                      {drug.commercialName && (
                        <p className="text-sm text-red-700 mt-1">
                          Tên thương mại: <span className="font-medium">{drug.commercialName}</span>
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {drug.dosageForm && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Dạng bào chế:</span> {drug.dosageForm}
                        </p>
                      )}
                      
                      {drug.indication && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Chỉ định:</span> {drug.indication}
                        </p>
                      )}
                      
                      {drug.reactionImprovedAfterStopping && drug.reactionImprovedAfterStopping !== 'no_information' && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-sm text-yellow-800">
                            <span className="font-medium">Phản ứng sau khi ngừng thuốc:</span>{' '}
                            {drug.reactionImprovedAfterStopping === 'yes' ? 'Cải thiện' : 
                             drug.reactionImprovedAfterStopping === 'no' ? 'Không cải thiện' :
                             drug.reactionImprovedAfterStopping === 'not_stopped' ? 'Không ngừng thuốc' :
                             'Không rõ'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-red-100 rounded-lg border border-red-300">
                <p className="text-red-900 font-bold text-sm">
                  ⚠️ CẢNH BÁO: Tránh sử dụng các thuốc trên cho bệnh nhân này!
                </p>
                <p className="text-red-800 text-sm mt-1">
                  Các thuốc này đã từng gây phản ứng dị ứng cho bệnh nhân.
                </p>
              </div>
            </Card>
          )}

          {/* Emergency Contact */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <PhoneIcon className="w-6 h-6 text-green-600" />
              Liên hệ khẩn cấp
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Bác sĩ điều trị</label>
                <p className="text-lg font-semibold">{allergyData.doctorName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Bệnh viện</label>
                <p className="text-lg">{allergyData.hospitalName}</p>
              </div>
              
              {allergyData.doctorPhone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-lg font-mono">{allergyData.doctorPhone}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`tel:${allergyData.doctorPhone}`)}
                      className="flex items-center gap-1"
                    >
                      <PhoneIcon className="w-4 h-4" />
                      Gọi ngay
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-yellow-900 font-semibold mb-2">
                  📋 Hướng dẫn khẩn cấp:
                </p>
                <p className="text-yellow-800">
                  {allergyData.emergencyInstructions}
                </p>
              </div>
            </div>
          </Card>

          {/* Footer Info */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="text-center text-sm text-blue-800">
              <p className="font-medium mb-1">
                Ngày cấp thẻ: {new Date(allergyData.issuedDate).toLocaleDateString('vi-VN')}
              </p>
              <p className="text-xs text-blue-600">
                ✓ Thông tin này đã được xác thực bởi hệ thống
              </p>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pb-8">
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2">
                <HomeIcon className="w-4 h-4" />
                Về trang chủ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
