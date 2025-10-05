'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ConcurrentDrugFormData } from '@/types/concurrent-drug'
import { toast } from 'react-hot-toast'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PatientInfoSection from '@/components/forms/PatientInfoSection'
import ADRInfoSection from '@/components/forms/ADRInfoSection'
import SuspectedDrugsSection from '@/components/forms/SuspectedDrugsSection'
import AssessmentSection from '@/components/forms/AssessmentSection'
import ReporterInfoSection from '@/components/forms/ReporterInfoSection'
import { ADRFormData, SuspectedDrug } from '@/app/reports/new/page'
import { XMarkIcon, TrophyIcon } from '@heroicons/react/24/outline'

export default function PublicReportForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showBanner, setShowBanner] = useState(true)

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
        dosage: '',
        frequency: '',
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
      
      // Hiển thị thông báo
      alert(`✅ Báo cáo đã được gửi thành công!\n\nMã báo cáo: ${data.report.report_code}\n\nCảm ơn bạn đã đóng góp thông tin.`)
      
      // Reset form
      window.location.reload()
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
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Contest Banner - Responsive for Mobile */}
        {showBanner && (
          <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-1 shadow-xl animate-fade-in">
            <div className="relative bg-white rounded-md sm:rounded-lg p-4 sm:p-6">
              <button
                onClick={() => setShowBanner(false)}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-400 hover:text-gray-600 transition-colors z-10"
                aria-label="Đóng banner"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pr-8 sm:pr-0">
                {/* Icon - Hidden on very small screens, visible on sm+ */}
                <div className="hidden xs:flex flex-shrink-0">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <TrophyIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                </div>
                
                <div className="flex-1 w-full">
                  <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2 leading-tight">
                    🎉 Cuộc thi Kiến thức về ADR đang diễn ra!
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 leading-snug">
                    Tham gia trả lời câu hỏi, cạnh tranh trên bảng xếp hạng và nhận giấy chứng nhận
                  </p>
                  <Link href="/contest" className="block sm:inline-block">
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm sm:text-base">
                      Tham gia ngay →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header - Responsive */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 px-2">Báo cáo Phản ứng có hại của Thuốc (ADR)</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2 px-4">
            Mọi thông tin sẽ được bảo mật. Bạn không cần đăng nhập để gửi báo cáo.
          </p>
        </div>

        {/* Progress Steps */}
        <Card className="mb-6">
          <div className="p-4 sm:p-6">
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
                    <div className={`w-8 sm:w-16 h-0.5 ${
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
          <div className="p-4 sm:p-6">
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
            ← Quay lại
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext}>
              Tiếp theo →
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Đang gửi...' : '✓ Gửi báo cáo'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}



