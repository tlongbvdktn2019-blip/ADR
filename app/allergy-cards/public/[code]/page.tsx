// =====================================================
// PUBLIC ALLERGY CARD VIEW PAGE
// Trang công khai hiển thị thông tin thẻ dị ứng
// KHÔNG CẦN ĐĂNG NHẬP - dành cho quét QR công khai
// =====================================================

'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
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
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  PrinterIcon,
  ShareIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { AllergyCard, AllergyCardUpdate, SeverityLevel } from '@/types/allergy-card';

export default function PublicAllergyCardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const cardCode = params.code as string;
  
  const [card, setCard] = useState<AllergyCard | null>(null);
  const [updates, setUpdates] = useState<AllergyCardUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to fetch card data
  const fetchCard = async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) {
        setIsRefreshing(true);
      }
      
      // Thêm timestamp để tránh cache (đặc biệt quan trọng cho Vercel)
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/allergy-cards/public/${cardCode}?t=${timestamp}&_=${Math.random()}`, {
        cache: 'no-store',
        next: { revalidate: 0 },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        console.log('📦 Frontend received data:', {
          allergies: data.card?.allergies?.length,
          updates: data.updates?.length,
          total_updates: data.total_updates,
          updatesList: data.updates?.map((u: any) => ({
            id: u.id,
            type: u.update_type,
            by: u.updated_by_name,
            date: u.created_at,
            allergies_count: u.allergies_count || u.allergies_added?.length || 0
          }))
        });
        
        // Ensure updates are sorted by created_at descending
        const sortedUpdates = (data.updates || []).sort((a: any, b: any) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA; // Newest first
        });
        
        console.log('📋 Sorted updates:', sortedUpdates.map((u: any) => ({
          id: u.id,
          date: u.created_at,
          by: u.updated_by_name
        })));
        
        setCard(data.card);
        setUpdates(sortedUpdates);
        setWarning(data.warning || null);
        setError(null); // Clear any previous errors
      } else {
        setError(data.error || 'Không thể tải thông tin thẻ dị ứng');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.');
    } finally {
      setLoading(false);
      if (showRefreshingState) {
        setIsRefreshing(false);
      }
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    await fetchCard(true);
  };

  // Initial load
  useEffect(() => {
    if (cardCode) {
      fetchCard(false);
    }
  }, [cardCode]);

  // Auto-refresh when returning from add-info page
  useEffect(() => {
    const updated = searchParams.get('updated');
    if (updated === 'true' && card) {
      console.log('🔄 Auto-refreshing after update...');
      fetchCard(true);
      
      // Clean up URL after refresh
      if (window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete('updated');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin thẻ dị ứng...</p>
        </Card>
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
            <p className="text-gray-600 mb-4">{error || 'Thẻ không tồn tại'}</p>
            <p className="text-sm text-gray-500">
              Mã thẻ: <span className="font-mono font-semibold">{cardCode}</span>
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Check for severe allergies for warning
  const hasSevereAllergy = card.allergies?.some(a => 
    a.severity_level === 'severe' || a.severity_level === 'life_threatening'
  );

  const handleShare = async () => {
    const shareData = {
      title: `Thẻ dị ứng - ${card.patient_name}`,
      text: `Xem thông tin thẻ dị ứng của ${card.patient_name}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Đã sao chép link vào clipboard');
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handlePrint = () => {
    if (!card.id) return;
    const printUrl = `/api/allergy-cards/${card.id}/print-view?card_code=${encodeURIComponent(card.card_code)}`;
    window.open(printUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardDocumentListIcon className="w-8 h-8 text-blue-600" />
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
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
              >
                <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Đang tải...' : 'Làm mới'}
              </Button>

              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex items-center gap-2"
              >
                <PrinterIcon className="w-4 h-4" />
                In thẻ
              </Button>

              <Button
                variant="outline"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <ShareIcon className="w-4 h-4" />
                Chia sẻ
              </Button>
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

        {/* Warning if expired/inactive */}
        {warning && (
          <Card className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-400">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0" />
              <p className="text-yellow-800 font-medium">{warning}</p>
            </div>
          </Card>
        )}

        {/* Main Content - Full Width */}
        <div className="space-y-6">
            
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

            {/* Lịch sử bổ sung */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <ClockIcon className="w-6 h-6 text-purple-600" />
                  Lịch sử bổ sung ({updates.length})
                </h2>
                {card.id && (
                  <Link href={`/allergy-cards/${card.id}/add-info?card_code=${card.card_code}`}>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <PlusCircleIcon className="w-4 h-4" />
                      Bổ sung mới
                    </Button>
                  </Link>
                )}
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
                  {updates.map((update, index) => {
                    // Debug log for each update being rendered
                    if (index === 0) {
                      console.log('🎨 Rendering updates:', {
                        total: updates.length,
                        first_update: {
                          id: update.id,
                          type: update.update_type,
                          by: update.updated_by_name,
                          date: update.created_at
                        }
                      });
                    }
                    return (
                    <div key={`update-${update.id}-${index}`} className="relative">
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

                            {/* Allergies added - CHỈ HIỂN THỊ TÊN, chi tiết xem ở section "Thông tin dị ứng" */}
                            {update.allergies_added && update.allergies_added.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                  🔴 Đã bổ sung {update.allergies_added.length} dị ứng:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {update.allergies_added.map((allergy: any) => (
                                    <span 
                                      key={allergy.id} 
                                      className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 border border-red-200 rounded-full text-sm"
                                    >
                                      <span className="font-medium text-red-900">{allergy.allergen_name}</span>
                                      {allergy.severity_level && (
                                        <span className={`text-xs px-2 py-0.5 rounded ${getSeverityBadgeColor(allergy.severity_level)}`}>
                                          {getSeverityText(allergy.severity_level)}
                                        </span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  💡 Xem chi tiết đầy đủ trong phần "Thông tin dị ứng" ở trên
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </Card>
        </div>

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

