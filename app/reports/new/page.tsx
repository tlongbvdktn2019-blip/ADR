'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ConcurrentDrugFormData, createEmptyConcurrentDrug } from '@/types/concurrent-drug'
import { toast } from 'react-hot-toast'
import MainLayout from '@/components/layout/MainLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PatientInfoSection from '@/components/forms/PatientInfoSection'
import ADRInfoSection from '@/components/forms/ADRInfoSection'
import SuspectedDrugsSection from '@/components/forms/SuspectedDrugsSection'
import AssessmentSection from '@/components/forms/AssessmentSection'
import ReporterInfoSection from '@/components/forms/ReporterInfoSection'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export interface SuspectedDrug {
  id: string
  drug_name: string
  commercial_name: string
  dosage_form: string
  manufacturer: string
  batch_number: string
  dosage_and_frequency: string
  route_of_administration: string
  start_date: string
  end_date: string
  indication: string
  reaction_improved_after_stopping: 'yes' | 'no' | 'not_stopped' | 'no_information'
  reaction_reoccurred_after_rechallenge: 'yes' | 'no' | 'not_rechallenged' | 'no_information'
}

export interface ADRFormData {
  // Phần A: Thông tin bệnh nhân
  patient_name: string
  patient_birth_date: string
  patient_age: number
  patient_gender: 'male' | 'female'
  patient_weight: number
  
  // Phần B: Thông tin ADR
  adr_occurrence_date: string
  reaction_onset_time: string
  adr_description: string
  related_tests: string
  medical_history: string
  treatment_response: string
  severity_level: 'death' | 'life_threatening' | 'hospitalization' | 'birth_defect' | 'permanent_disability' | 'not_serious'
  outcome_after_treatment: 'death_by_adr' | 'death_unrelated' | 'not_recovered' | 'recovering' | 'recovered_with_sequelae' | 'recovered_without_sequelae' | 'unknown'
  
  // Phần C: Thuốc nghi ngờ
  suspected_drugs: SuspectedDrug[]
  concurrent_drugs: ConcurrentDrugFormData[]
  
  // Phần D: Thẩm định ADR
  causality_assessment: 'certain' | 'probable' | 'possible' | 'unlikely' | 'unclassified' | 'unclassifiable'
  assessment_scale: 'who' | 'naranjo'
  medical_staff_comment: string
  
  // Phần E: Thông tin người báo cáo
  reporter_name: string
  reporter_profession: string
  reporter_phone: string
  reporter_email: string
  report_type: 'initial' | 'follow_up'
  report_date: string
}

export default function NewReportPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const [formData, setFormData] = useState<ADRFormData>({
    // Phần A
    patient_name: '',
    patient_birth_date: '',
    patient_age: 0,
    patient_gender: 'male',
    patient_weight: 0,
    
    // Phần B
    adr_occurrence_date: '',
    reaction_onset_time: '',
    adr_description: '',
    related_tests: '',
    medical_history: '',
    treatment_response: '',
    severity_level: 'not_serious',
    outcome_after_treatment: 'unknown',
    
    // Phần C
    suspected_drugs: [
      {
        id: '1',
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
    ],
    concurrent_drugs: [],
    
    // Phần D
    causality_assessment: 'unclassified',
    assessment_scale: 'who',
    medical_staff_comment: '',
    
    // Phần E
    reporter_name: session?.user?.name || '',
    reporter_profession: '',
    reporter_phone: '',
    reporter_email: session?.user?.email || '',
    report_type: 'initial',
    report_date: new Date().toISOString().split('T')[0],
  })

  const steps = [
    { title: 'Thông tin bệnh nhân', subtitle: 'Phần A' },
    { title: 'Thông tin ADR', subtitle: 'Phần B' },
    { title: 'Thuốc nghi ngờ', subtitle: 'Phần C' },
    { title: 'Thẩm định ADR', subtitle: 'Phần D' },
    { title: 'Người báo cáo', subtitle: 'Phần E' },
  ]

  const updateFormData = (updates: Partial<ADRFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const updateSuspectedDrugs = (drugs: SuspectedDrug[]) => {
    setFormData(prev => ({ ...prev, suspected_drugs: drugs }))
  }

  const updateConcurrentDrugs = (drugs: ConcurrentDrugFormData[]) => {
    setFormData(prev => ({ ...prev, concurrent_drugs: drugs }))
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          organization: session?.user?.organization || '',
        }),
      })

      if (response.ok) {
        toast.success('Báo cáo ADR đã được tạo thành công!')
        router.push('/reports')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Có lỗi xảy ra khi tạo báo cáo')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Có lỗi xảy ra khi tạo báo cáo')
    } finally {
      setLoading(false)
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <PatientInfoSection data={formData} updateData={updateFormData} />
      case 1:
        return <ADRInfoSection data={formData} updateData={updateFormData} />
      case 2:
        return <SuspectedDrugsSection 
          drugs={formData.suspected_drugs} 
          updateDrugs={updateSuspectedDrugs}
          concurrentDrugs={formData.concurrent_drugs}
          updateConcurrentDrugs={updateConcurrentDrugs}
        />
      case 3:
        return <AssessmentSection data={formData} updateData={updateFormData} />
      case 4:
        return <ReporterInfoSection data={formData} updateData={updateFormData} />
      default:
        return null
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/reports">
              <Button variant="outline" size="sm">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tạo báo cáo ADR mới</h1>
              <p className="text-gray-600 mt-1">Điền thông tin chi tiết về phản ứng có hại của thuốc</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <Card>
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
              >
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index === currentStep 
                      ? 'bg-primary-600 text-white' 
                      : index < currentStep 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="text-center mt-2">
                    <div className={`text-sm font-medium ${
                      index === currentStep ? 'text-primary-600' : 'text-gray-900'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500">{step.subtitle}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    index < currentStep ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Form Content */}
        <Card>
          {renderCurrentStep()}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <div>
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  Trước đó
                </Button>
              )}
            </div>
            
            <div className="space-x-3">
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext}>
                  Tiếp theo
                </Button>
              ) : (
                <Button onClick={handleSubmit} loading={loading}>
                  Tạo báo cáo
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}


