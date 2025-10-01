// =====================================================
// ALLERGY CARD FORM COMPONENT
// Form for creating and editing allergy cards
// =====================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SimpleSelect from '@/components/ui/SimpleSelect';
import Textarea from '@/components/ui/Textarea';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  AllergyCardFormData, 
  CertaintyLevel, 
  SeverityLevel, 
  PatientGender,
  AllergyCard
} from '@/types/allergy-card';

interface AllergyCardFormProps {
  initialData?: AllergyCard;
  mode?: 'create' | 'edit';
  reportId?: string; // Optional link to existing ADR report
}

export function AllergyCardForm({ 
  initialData, 
  mode = 'create',
  reportId 
}: AllergyCardFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Form setup with react-hook-form
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<AllergyCardFormData>({
    defaultValues: initialData ? {
      patient_name: initialData.patient_name,
      patient_gender: initialData.patient_gender,
      patient_age: initialData.patient_age,
      patient_id_number: initialData.patient_id_number || '',
      hospital_name: initialData.hospital_name,
      department: initialData.department || '',
      doctor_name: initialData.doctor_name,
      doctor_phone: initialData.doctor_phone || '',
      issued_date: initialData.issued_date,
      expiry_date: initialData.expiry_date || '',
      notes: initialData.notes || '',
      google_drive_url: (initialData as any).google_drive_url || '',
      allergies: initialData.allergies?.map(a => ({
        allergen_name: a.allergen_name,
        certainty_level: a.certainty_level,
        clinical_manifestation: a.clinical_manifestation || '',
        severity_level: a.severity_level,
        reaction_type: a.reaction_type || ''
      })) || [{ 
        allergen_name: '', 
        certainty_level: 'suspected' as CertaintyLevel, 
        clinical_manifestation: '', 
        severity_level: undefined,
        reaction_type: ''
      }],
      report_id: reportId || initialData.report_id
    } : {
      patient_name: '',
      patient_gender: 'other' as PatientGender,
      patient_age: 0,
      patient_id_number: '',
      hospital_name: '',
      department: '',
      doctor_name: '',
      doctor_phone: '',
      issued_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      notes: '',
      google_drive_url: '',
      allergies: [{ 
        allergen_name: '', 
        certainty_level: 'suspected' as CertaintyLevel, 
        clinical_manifestation: '', 
        severity_level: undefined,
        reaction_type: ''
      }],
      report_id: reportId
    }
  });

  // Dynamic allergies array
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'allergies'
  });

  // Form submission
  const onSubmit = async (data: AllergyCardFormData) => {
    try {
      setIsLoading(true);

      const url = mode === 'edit' && initialData
        ? `/api/allergy-cards/${initialData.id}`
        : '/api/allergy-cards';

      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra');
      }

      toast.success(
        mode === 'edit' 
          ? 'Đã cập nhật thẻ dị ứng thành công!'
          : 'Đã tạo thẻ dị ứng thành công!'
      );

      // Redirect to card detail
      if (result.card) {
        router.push(`/allergy-cards/${result.card.id}`);
      } else {
        router.push('/allergy-cards');
      }

    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  // Add new allergy row
  const addAllergy = () => {
    append({
      allergen_name: '',
      certainty_level: 'suspected',
      clinical_manifestation: '',
      severity_level: undefined,
      reaction_type: ''
    });
  };

  // Remove allergy row
  const removeAllergy = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ClipboardDocumentListIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            {mode === 'edit' ? 'Chỉnh sửa thẻ dị ứng' : 'Cấp thẻ dị ứng mới'}
          </h1>
        </div>
        <p className="text-gray-600">
          {mode === 'edit' 
            ? 'Cập nhật thông tin thẻ dị ứng của bệnh nhân'
            : 'Nhập thông tin bệnh nhân và dị ứng để tạo thẻ dị ứng'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Patient Information Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Thông tin bệnh nhân
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Họ và tên bệnh nhân *"
                {...register('patient_name', { 
                  required: 'Vui lòng nhập tên bệnh nhân' 
                })}
                error={errors.patient_name?.message}
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <Input
                label="Tuổi *"
                type="number"
                min="0"
                max="120"
                {...register('patient_age', { 
                  required: 'Vui lòng nhập tuổi',
                  min: { value: 0, message: 'Tuổi phải lớn hơn 0' },
                  max: { value: 120, message: 'Tuổi không hợp lệ' }
                })}
                error={errors.patient_age?.message}
                placeholder="35"
              />
            </div>

            <div>
              <SimpleSelect
                label="Giới tính *"
                {...register('patient_gender', { required: 'Vui lòng chọn giới tính' })}
                error={errors.patient_gender?.message}
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </SimpleSelect>
            </div>

            <div>
              <Input
                label="CMND/CCCD/Passport"
                {...register('patient_id_number')}
                placeholder="123456789012"
              />
            </div>
          </div>
        </Card>

        {/* Medical Facility Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Thông tin cơ sở y tế
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Tên bệnh viện *"
                {...register('hospital_name', { 
                  required: 'Vui lòng nhập tên bệnh viện' 
                })}
                error={errors.hospital_name?.message}
                placeholder="Bệnh viện Đa khoa Trung ương"
              />
            </div>

            <div>
              <Input
                label="Khoa/Trung tâm"
                {...register('department')}
                placeholder="Khoa Nội"
              />
            </div>

            <div>
              <Input
                label="Tên bác sĩ *"
                {...register('doctor_name', { 
                  required: 'Vui lòng nhập tên bác sĩ' 
                })}
                error={errors.doctor_name?.message}
                placeholder="BS. Nguyễn Thị B"
              />
            </div>

            <div>
              <Input
                label="Số điện thoại bác sĩ"
                {...register('doctor_phone')}
                placeholder="0123456789"
              />
            </div>
          </div>
        </Card>

        {/* Allergy Information */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Thông tin dị ứng
            </h2>
            <Button
              type="button"
              variant="outline"
              onClick={addAllergy}
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Thêm dị ứng
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">
                    Dị ứng #{index + 1}
                  </h3>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAllergy(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Tên dị nguyên/thuốc *"
                      {...register(`allergies.${index}.allergen_name`, {
                        required: 'Vui lòng nhập tên dị nguyên'
                      })}
                      error={errors.allergies?.[index]?.allergen_name?.message}
                      placeholder="Penicillin"
                    />
                  </div>

                  <div>
                    <SimpleSelect
                      label="Mức độ chắc chắn *"
                      {...register(`allergies.${index}.certainty_level`, {
                        required: 'Vui lòng chọn mức độ chắc chắn'
                      })}
                      error={errors.allergies?.[index]?.certainty_level?.message}
                    >
                      <option value="suspected">Nghi ngờ</option>
                      <option value="confirmed">Chắc chắn</option>
                    </SimpleSelect>
                  </div>

                  <div>
                    <SimpleSelect
                      label="Mức độ nghiêm trọng"
                      {...register(`allergies.${index}.severity_level`)}
                    >
                      <option value="">Chọn mức độ</option>
                      <option value="mild">Nhẹ</option>
                      <option value="moderate">Vừa</option>
                      <option value="severe">Nghiêm trọng</option>
                      <option value="life_threatening">Nguy hiểm tính mạng</option>
                    </SimpleSelect>
                  </div>

                  <div>
                    <Input
                      label="Loại phản ứng"
                      {...register(`allergies.${index}.reaction_type`)}
                      placeholder="Anaphylaxis, Phát ban, ..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Textarea
                      label="Biểu hiện lâm sàng"
                      {...register(`allergies.${index}.clinical_manifestation`)}
                      placeholder="Mô tả chi tiết các triệu chứng dị ứng..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Additional Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Thông tin bổ sung
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Ngày cấp thẻ"
                type="date"
                {...register('issued_date')}
              />
            </div>

            <div>
              <Input
                label="Ngày hết hạn"
                type="date"
                {...register('expiry_date')}
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label="Link Google Drive thẻ dị ứng"
                {...register('google_drive_url')}
                placeholder="https://drive.google.com/file/d/..."
                helperText="Link đến file PDF/hình ảnh thẻ dị ứng trên Google Drive. QR code sẽ chứa link này."
              />
            </div>

            <div className="md:col-span-2">
              <Textarea
                label="Ghi chú"
                {...register('notes')}
                placeholder="Thông tin bổ sung về dị ứng hoặc hướng dẫn đặc biệt..."
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Hủy bỏ
          </Button>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading && <LoadingSpinner size="sm" />}
            {mode === 'edit' ? 'Cập nhật thẻ' : 'Tạo thẻ dị ứng'}
          </Button>
        </div>
      </form>
    </div>
  );
}
