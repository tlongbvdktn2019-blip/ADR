'use client'

import { useState } from 'react'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { SuspectedDrug } from '@/app/reports/new/page'
import { ConcurrentDrugFormData, createEmptyConcurrentDrug, CONCURRENT_DRUG_LABELS } from '@/types/concurrent-drug'

interface SuspectedDrugsSectionProps {
  drugs: SuspectedDrug[]
  updateDrugs: (drugs: SuspectedDrug[]) => void
  concurrentDrugs?: ConcurrentDrugFormData[]
  updateConcurrentDrugs?: (drugs: ConcurrentDrugFormData[]) => void
}

export default function SuspectedDrugsSection({ 
  drugs, 
  updateDrugs, 
  concurrentDrugs = [], 
  updateConcurrentDrugs = () => {} 
}: SuspectedDrugsSectionProps) {
  const reactionOptions = [
    { value: 'yes', label: 'Có' },
    { value: 'no', label: 'Không' },
    { value: 'not_stopped', label: 'Không ngừng/giảm liều' },
    { value: 'no_information', label: 'Không có thông tin' },
  ]

  const rechallengeOptions = [
    { value: 'yes', label: 'Có' },
    { value: 'no', label: 'Không' },
    { value: 'not_rechallenged', label: 'Không tái sử dụng' },
    { value: 'no_information', label: 'Không có thông tin' },
  ]

  const addDrug = () => {
    const newDrug: SuspectedDrug = {
      id: Date.now().toString(),
      drug_name: '',
      commercial_name: '',
      dosage_form: '',
      manufacturer: '',
      batch_number: '',
      dosage_and_frequency: '',
      route_of_administration: '',
      start_date: '',
      end_date: '',
      indication: '',
      reaction_improved_after_stopping: 'no_information',
      reaction_reoccurred_after_rechallenge: 'no_information',
    }
    updateDrugs([...drugs, newDrug])
  }

  const removeDrug = (id: string) => {
    if (drugs.length > 1) {
      updateDrugs(drugs.filter(drug => drug.id !== id))
    }
  }

  const updateDrug = (id: string, updates: Partial<SuspectedDrug>) => {
    updateDrugs(drugs.map(drug => 
      drug.id === id ? { ...drug, ...updates } : drug
    ))
  }

  // Concurrent drugs functions
  const addConcurrentDrug = () => {
    const newDrug = createEmptyConcurrentDrug()
    updateConcurrentDrugs([...concurrentDrugs, newDrug])
  }

  const removeConcurrentDrug = (id: string) => {
    if (concurrentDrugs.length > 1) {
      updateConcurrentDrugs(concurrentDrugs.filter(drug => drug.id !== id))
    }
  }

  const updateConcurrentDrug = (id: string, updates: Partial<ConcurrentDrugFormData>) => {
    updateConcurrentDrugs(concurrentDrugs.map(drug => 
      drug.id === id ? { ...drug, ...updates } : drug
    ))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Phần C. Thông tin về thuốc nghi ngờ gây ADR
        </h3>
        <p className="text-sm text-gray-600">
          Liệt kê tất cả các thuốc có thể gây ra phản ứng có hại
        </p>
      </div>

      <div className="space-y-6">
        {drugs.map((drug, index) => (
          <Card key={drug.id} className="relative">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">
                Thuốc #{index + 1}
              </h4>
              {drugs.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeDrug(drug.id)}
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <TrashIcon className="w-4 h-4 mr-1" />
                  Xóa
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Tên thuốc (tên gốc)"
                value={drug.drug_name}
                onChange={(e) => updateDrug(drug.id, { drug_name: e.target.value })}
                placeholder="VD: Paracetamol"
                required
              />

              <Input
                label="Tên thương mại"
                value={drug.commercial_name}
                onChange={(e) => updateDrug(drug.id, { commercial_name: e.target.value })}
                placeholder="VD: Panadol"
              />

              <Input
                label="Dạng bào chế, hàm lượng"
                value={drug.dosage_form}
                onChange={(e) => updateDrug(drug.id, { dosage_form: e.target.value })}
                placeholder="VD: Viên nén 500mg"
              />

              <Input
                label="Nhà sản xuất, Số lô"
                value={drug.manufacturer}
                onChange={(e) => updateDrug(drug.id, { manufacturer: e.target.value })}
                placeholder="VD: Công ty ABC, Lô: L123456"
              />

              <Input
                label="Liều dùng, Số lần dùng, Đường dùng"
                value={drug.dosage_and_frequency}
                onChange={(e) => updateDrug(drug.id, { dosage_and_frequency: e.target.value })}
                placeholder="VD: 500mg x 3 lần/ngày, uống"
              />

              <Input
                label="Đường dùng"
                value={drug.route_of_administration}
                onChange={(e) => updateDrug(drug.id, { route_of_administration: e.target.value })}
                placeholder="VD: Uống, tiêm tĩnh mạch"
              />

              <Input
                label="Ngày bắt đầu sử dụng"
                type="date"
                value={drug.start_date}
                onChange={(e) => updateDrug(drug.id, { start_date: e.target.value })}
              />

              <Input
                label="Ngày kết thúc sử dụng"
                type="date"
                value={drug.end_date}
                onChange={(e) => updateDrug(drug.id, { end_date: e.target.value })}
              />

              <div className="md:col-span-2">
                <Textarea
                  label="Lý do dùng thuốc"
                  value={drug.indication}
                  onChange={(e) => updateDrug(drug.id, { indication: e.target.value })}
                  placeholder="Mô tả lý do sử dụng thuốc này..."
                  rows={2}
                />
              </div>

              <Select
                label="Sau khi ngừng/giảm liều, phản ứng có cải thiện không?"
                value={drug.reaction_improved_after_stopping}
                onChange={(e) => updateDrug(drug.id, { 
                  reaction_improved_after_stopping: e.target.value as any 
                })}
                options={reactionOptions}
                required
              />

              <Select
                label="Tái sử dụng thuốc có xuất hiện lại phản ứng không?"
                value={drug.reaction_reoccurred_after_rechallenge}
                onChange={(e) => updateDrug(drug.id, { 
                  reaction_reoccurred_after_rechallenge: e.target.value as any 
                })}
                options={rechallengeOptions}
                required
              />
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={addDrug}
          className="flex items-center"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Thêm thuốc khác
        </Button>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-sm text-green-800">
          <strong>Gợi ý:</strong> Hãy liệt kê tất cả các thuốc mà bệnh nhân đã sử dụng trong khoảng thời gian 
          liên quan đến phản ứng có hại, kể cả các thuốc có vẻ không liên quan.
        </p>
      </div>

      {/* Section 16: Concurrent Drugs */}
      <div className="border-t pt-6">
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-900 mb-2">
            16. Thuốc dùng đồng thời
          </h4>
          <p className="text-sm text-gray-600">
            Các thuốc khác được sử dụng cùng thời gian với thuốc nghi ngờ
          </p>
        </div>

        <div className="space-y-4">
          {concurrentDrugs.length > 0 ? (
            concurrentDrugs.map((drug, index) => (
              <Card key={drug.id} className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-sm font-medium text-gray-900">
                    Thuốc đồng thời #{index + 1}
                  </h5>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeConcurrentDrug(drug.id)}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <TrashIcon className="w-4 h-4 mr-1" />
                    Xóa
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={CONCURRENT_DRUG_LABELS.drug_name}
                    value={drug.drug_name}
                    onChange={(e) => updateConcurrentDrug(drug.id, { drug_name: e.target.value })}
                    placeholder="VD: Aspirin, Metformin..."
                    required
                  />

                  <Input
                    label={CONCURRENT_DRUG_LABELS.dosage_form_strength}
                    value={drug.dosage_form_strength}
                    onChange={(e) => updateConcurrentDrug(drug.id, { dosage_form_strength: e.target.value })}
                    placeholder="VD: Viên nén 100mg, Viên nang 500mg..."
                  />

                  <Input
                    label={CONCURRENT_DRUG_LABELS.start_date}
                    type="date"
                    value={drug.start_date}
                    onChange={(e) => updateConcurrentDrug(drug.id, { start_date: e.target.value })}
                  />

                  <Input
                    label={CONCURRENT_DRUG_LABELS.end_date}
                    type="date"
                    value={drug.end_date}
                    onChange={(e) => updateConcurrentDrug(drug.id, { end_date: e.target.value })}
                  />
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 mb-4">Chưa có thuốc dùng đồng thời nào được thêm</p>
              <Button
                variant="outline"
                onClick={addConcurrentDrug}
                className="flex items-center mx-auto"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Thêm thuốc đầu tiên
              </Button>
            </div>
          )}
        </div>

        {concurrentDrugs.length > 0 && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={addConcurrentDrug}
              className="flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Thêm thuốc khác
            </Button>
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg mt-4">
          <p className="text-sm text-blue-800">
            <strong>Lưu ý:</strong> Thuốc dùng đồng thời là các thuốc được sử dụng trong cùng khoảng thời gian 
            với thuốc nghi ngờ gây ADR, có thể ảnh hưởng đến việc đánh giá mối liên quan.
          </p>
        </div>
      </div>
    </div>
  )
}


