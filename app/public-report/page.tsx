'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConcurrentDrugFormData, createEmptyConcurrentDrug } from '@/types/concurrent-drug'
import { toast } from 'react-hot-toast'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PatientInfoSection from '@/components/forms/PatientInfoSection'
import ADRInfoSection from '@/components/forms/ADRInfoSection'
import SuspectedDrugsSection from '@/components/forms/SuspectedDrugsSection'
import AssessmentSection from '@/components/forms/AssessmentSection'
import ReporterInfoSection from '@/components/forms/ReporterInfoSection'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

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
  // Thông tin báo cáo
  organization: string
  report_code: string
  
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

export default function PublicReportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const [formData, setFormData] = useState<ADRFormData>({
    // Thông tin báo cáo
    organization: '',
    report_code: '',
    
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
    reporter_name: '',
    reporter_profession: '',
    reporter_phone: '',
    reporter_email: '',
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
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/public/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra')
      }

      toast.success('Báo cáo đã được gửi thành công!')
      
      // Hiển thị thông báo và chuyển về trang chủ
      alert(`✅ Báo cáo đã được gửi thành công!\n\nMã báo cáo: ${data.report.report_code}\n\nCảm ơn bạn đã đóng góp thông tin.`)
      router.push('/')
    } catch (error: any) {
      console.error('Submit error:', error)
      toast.error(error.message || 'Có lỗi xảy ra khi gửi báo cáo')
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Báo cáo ADR</h1>
            <p className="text-gray-600 mt-2">Báo cáo phản ứng có hại của thuốc (Không cần đăng nhập)</p>
          </div>

          {/* Progress Steps */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                        index <= currentStep 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'border-gray-300 text-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="mt-2 text-center">
                        <div className={`text-xs font-medium ${
                          index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {step.subtitle}
                        </div>
                        <div className="text-xs text-gray-500 hidden sm:block">
                          {step.title}
                        </div>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-12 sm:w-24 h-0.5 ${
                        index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Form Content */}
          <Card>
            <div className="p-6">
              {renderCurrentStep()}
            </div>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Quay lại
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext}>
                Tiếp theo
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

