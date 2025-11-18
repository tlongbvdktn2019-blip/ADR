// =====================================================
// ADD INFORMATION TO ALLERGY CARD PAGE
// Public page - Cho phép bổ sung thông tin vào thẻ dị ứng
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ClipboardDocumentListIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BuildingOffice2Icon,
  UserIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import SimpleSelect from '@/components/ui/SimpleSelect';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  AllergyCard,
  AllergyCardUpdateFormData,
  UpdateType,
  CertaintyLevel,
  SeverityLevel
} from '@/types/allergy-card';

interface AddInfoPageProps {
  params: {
    id: string;
  };
}

export default function AddInfoToAllergyCardPage({ params }: AddInfoPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [card, setCard] = useState<AllergyCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCardCodeVerify, setShowCardCodeVerify] = useState(true);
  const [cardCodeInput, setCardCodeInput] = useState('');

  // Form state
  const [formData, setFormData] = useState<AllergyCardUpdateFormData>({
    card_id: params.id,
    card_code: '',
    updated_by_name: '',
    updated_by_organization: '',
    updated_by_role: '',
    updated_by_phone: '',
    updated_by_email: '',
    facility_name: '',
    facility_department: '',
    update_type: 'new_allergy',
    update_notes: '',
    reason_for_update: '',
    allergies: []
  });

  useEffect(() => {
    loadCard();
  }, [params.id]);

  const loadCard = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Lấy card_code từ URL nếu có (từ public QR scan)
      const cardCodeFromUrl = searchParams.get('card_code');
      
      // Nếu có card_code, dùng API public, ngược lại dùng API thông thường
      let response;
      if (cardCodeFromUrl) {
        response = await fetch(`/api/allergy-cards/public/${cardCodeFromUrl}`);
      } else {
        response = await fetch(`/api/allergy-cards/${params.id}`);
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể tải thông tin thẻ');
      }

      const data = await response.json();
      setCard(data.card);

      // Tự động verify nếu có card_code trong URL (từ QR scan)
      if (cardCodeFromUrl && data.card && cardCodeFromUrl === data.card.card_code) {
        setFormData(prev => ({ ...prev, card_code: cardCodeFromUrl }));
        setShowCardCodeVerify(false);
        toast.success('Đã xác thực mã thẻ tự động');
      }

    } catch (error) {
      console.error('Load card error:', error);
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCardCode = () => {
    if (!card) return;

    if (cardCodeInput.trim() === card.card_code) {
      setFormData(prev => ({ ...prev, card_code: cardCodeInput.trim() }));
      setShowCardCodeVerify(false);
      toast.success('Xác thực mã thẻ thành công');
    } else {
      toast.error('Mã thẻ không chính xác');
    }
  };

  const handleInputChange = (field: keyof AllergyCardUpdateFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAllergy = () => {
    setFormData(prev => ({
      ...prev,
      allergies: [
        ...prev.allergies,
        {
          allergen_name: '',
          certainty_level: 'suspected',
          clinical_manifestation: '',
          severity_level: undefined,
          reaction_type: '',
          discovered_date: new Date().toISOString().split('T')[0]
        }
      ]
    }));
  };

  const handleRemoveAllergy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  const handleAllergyChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.map((allergy, i) =>
        i === index ? { ...allergy, [field]: value } : allergy
      )
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.updated_by_name.trim()) {
      toast.error('Vui lòng nhập tên người bổ sung');
      return false;
    }

    if (!formData.updated_by_organization.trim()) {
      toast.error('Vui lòng nhập tổ chức/bệnh viện');
      return false;
    }

    if (!formData.facility_name.trim()) {
      toast.error('Vui lòng nhập tên cơ sở y tế');
      return false;
    }

    if (formData.update_type === 'new_allergy' && formData.allergies.length === 0) {
      toast.error('Vui lòng thêm ít nhất một dị ứng');
      return false;
    }

    // Validate allergies
    for (let i = 0; i < formData.allergies.length; i++) {
      const allergy = formData.allergies[i];
      if (!allergy.allergen_name.trim()) {
        toast.error(`Vui lòng nhập tên dị nguyên cho dị ứng #${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/allergy-cards/${params.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể bổ sung thông tin');
      }

      toast.success(`Đã bổ sung thành công! ${data.allergies_added || 0} dị ứng được thêm vào.`);
      
      // Redirect back to public view page if coming from QR scan
      if (card?.card_code) {
        router.push(`/allergy-cards/public/${card.card_code}`);
      } else {
        router.push(`/allergy-cards/${params.id}`);
      }

    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto">
          <div className="text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không tìm thấy thẻ dị ứng</h3>
            <p className="text-gray-600 mb-4">{error || 'Thẻ không tồn tại'}</p>
            <Link href="/allergy-cards/scan">
              <Button>Quét QR lại</Button>
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
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link href={card?.card_code ? `/allergy-cards/public/${card.card_code}` : `/allergy-cards/${params.id}`}>
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeftIcon className="w-4 h-4" />
                Quay lại
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <ClipboardDocumentListIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Bổ sung thông tin thẻ dị ứng
              </h1>
              <p className="text-gray-600">
                Thẻ của: <span className="font-semibold">{card.patient_name}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card Code Verification */}
        {showCardCodeVerify && (
          <Card className="p-6 mb-6 border-blue-200 bg-blue-50">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-blue-900 mb-2">
                  Xác thực mã thẻ
                </h2>
                <p className="text-blue-800 mb-4">
                  Để bảo mật, vui lòng nhập mã thẻ dị ứng (có trên thẻ hoặc từ QR code)
                </p>
                <div className="flex gap-3">
                  <Input
                    placeholder="Nhập mã thẻ (VD: AC-2024-000001)"
                    value={cardCodeInput}
                    onChange={(e) => setCardCodeInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleVerifyCardCode()}
                    className="flex-1"
                  />
                  <Button onClick={handleVerifyCardCode}>
                    Xác thực
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {!showCardCodeVerify && (
          <form onSubmit={handleSubmit}>
            {/* Thông tin người bổ sung */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <UserIcon className="w-6 h-6 text-blue-600" />
                Thông tin người bổ sung
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.updated_by_name}
                    onChange={(e) => handleInputChange('updated_by_name', e.target.value)}
                    placeholder="Tên người bổ sung"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tổ chức/Bệnh viện <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.updated_by_organization}
                    onChange={(e) => handleInputChange('updated_by_organization', e.target.value)}
                    placeholder="Tên tổ chức"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vai trò/Chức danh
                  </label>
                  <Input
                    value={formData.updated_by_role}
                    onChange={(e) => handleInputChange('updated_by_role', e.target.value)}
                    placeholder="VD: Bác sĩ, Y tá, Dược sĩ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <Input
                    value={formData.updated_by_phone}
                    onChange={(e) => handleInputChange('updated_by_phone', e.target.value)}
                    placeholder="Số điện thoại liên hệ"
                    type="tel"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    value={formData.updated_by_email}
                    onChange={(e) => handleInputChange('updated_by_email', e.target.value)}
                    placeholder="Email liên hệ"
                    type="email"
                  />
                </div>
              </div>
            </Card>

            {/* Thông tin cơ sở y tế */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BuildingOffice2Icon className="w-6 h-6 text-green-600" />
                Thông tin cơ sở y tế (nơi bổ sung)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên cơ sở y tế <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.facility_name}
                    onChange={(e) => handleInputChange('facility_name', e.target.value)}
                    placeholder="Tên bệnh viện/phòng khám"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Khoa/Phòng
                  </label>
                  <Input
                    value={formData.facility_department}
                    onChange={(e) => handleInputChange('facility_department', e.target.value)}
                    placeholder="VD: Khoa Nội, Khoa Cấp cứu"
                  />
                </div>
              </div>
            </Card>

            {/* Loại cập nhật và ghi chú */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                Thông tin bổ sung
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại cập nhật <span className="text-red-500">*</span>
                  </label>
                  <SimpleSelect
                    value={formData.update_type}
                    onChange={(e) => handleInputChange('update_type', e.target.value as UpdateType)}
                    required
                  >
                    <option value="new_allergy">Phát hiện dị ứng mới</option>
                    <option value="medical_facility">Cập nhật cơ sở y tế</option>
                    <option value="additional_info">Thông tin bổ sung</option>
                    <option value="severity_update">Cập nhật mức độ nghiêm trọng</option>
                  </SimpleSelect>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lý do bổ sung
                  </label>
                  <Input
                    value={formData.reason_for_update}
                    onChange={(e) => handleInputChange('reason_for_update', e.target.value)}
                    placeholder="VD: Khám bệnh, Cấp cứu, Phát hiện mới"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú chi tiết
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    value={formData.update_notes}
                    onChange={(e) => handleInputChange('update_notes', e.target.value)}
                    placeholder="Ghi chú thêm về lần bổ sung này..."
                  />
                </div>
              </div>
            </Card>

            {/* Danh sách dị ứng */}
            {formData.update_type === 'new_allergy' && (
              <Card className="p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    Dị ứng phát hiện mới ({formData.allergies.length})
                  </h2>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddAllergy}
                    className="flex items-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Thêm dị ứng
                  </Button>
                </div>

                {formData.allergies.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Chưa có dị ứng nào. Nhấn "Thêm dị ứng" để bắt đầu.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.allergies.map((allergy, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">Dị ứng #{index + 1}</h3>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveAllergy(index)}
                            className="text-red-600"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tên dị nguyên <span className="text-red-500">*</span>
                            </label>
                            <Input
                              value={allergy.allergen_name}
                              onChange={(e) => handleAllergyChange(index, 'allergen_name', e.target.value)}
                              placeholder="VD: Penicillin, Phấn hoa"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Mức độ chắc chắn <span className="text-red-500">*</span>
                            </label>
                            <SimpleSelect
                              value={allergy.certainty_level}
                              onChange={(e) => handleAllergyChange(index, 'certainty_level', e.target.value as CertaintyLevel)}
                            >
                              <option value="suspected">Nghi ngờ</option>
                              <option value="confirmed">Chắc chắn</option>
                            </SimpleSelect>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Mức độ nghiêm trọng
                            </label>
                            <SimpleSelect
                              value={allergy.severity_level || ''}
                              onChange={(e) => handleAllergyChange(index, 'severity_level', e.target.value || undefined)}
                            >
                              <option value="">Chọn mức độ</option>
                              <option value="mild">Nhẹ</option>
                              <option value="moderate">Vừa</option>
                              <option value="severe">Nghiêm trọng</option>
                              <option value="life_threatening">Nguy hiểm tính mạng</option>
                            </SimpleSelect>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Loại phản ứng
                            </label>
                            <Input
                              value={allergy.reaction_type}
                              onChange={(e) => handleAllergyChange(index, 'reaction_type', e.target.value)}
                              placeholder="VD: Phát ban, Sốc phản vệ"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Ngày phát hiện
                            </label>
                            <Input
                              type="date"
                              value={allergy.discovered_date}
                              onChange={(e) => handleAllergyChange(index, 'discovered_date', e.target.value)}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Biểu hiện lâm sàng
                            </label>
                            <textarea
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              rows={2}
                              value={allergy.clinical_manifestation}
                              onChange={(e) => handleAllergyChange(index, 'clinical_manifestation', e.target.value)}
                              placeholder="Mô tả triệu chứng, biểu hiện..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Submit buttons */}
            <div className="flex gap-3 justify-end">
              <Link href={card?.card_code ? `/allergy-cards/public/${card.card_code}` : `/allergy-cards/${params.id}`}>
                <Button type="button" variant="outline">
                  Hủy bỏ
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-4 h-4" />
                    Bổ sung thông tin
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

