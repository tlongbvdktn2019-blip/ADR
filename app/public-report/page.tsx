'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ConcurrentDrugFormData, createEmptyConcurrentDrug } from '@/types/concurrent-drug'
import { toast } from 'react-hot-toast'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PatientInfoSection from '@/components/forms/PatientInfoSection'
import ADRInfoSection from '@/components/forms/ADRInfoSection'
import SuspectedDrugsSection from '@/components/forms/SuspectedDrugsSection'
import AssessmentSection from '@/components/forms/AssessmentSection'
import ReporterInfoSection from '@/components/forms/ReporterInfoSection'
import AssessmentResultSection from '@/components/forms/AssessmentResultSection'
import ReportGuideModal from '@/components/forms/ReportGuideModal'
import { ArrowLeftIcon, XMarkIcon, TrophyIcon, BookOpenIcon } from '@heroicons/react/24/outline'

export interface SuspectedDrug {
  id: string
  drug_name: string
  commercial_name: string
  dosage_form: string
  manufacturer: string
  batch_number: string
  dosage_and_frequency: string  // Kept for backward compatibility
  dosage: string  // Liều dùng
  frequency: string  // Số lần dùng
  route_of_administration: string
  treatment_drug_group?: string
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
  
  // Phần F: Đánh giá
  severity_assessment_result?: string
  preventability_assessment_result?: string
}

export default function PublicReportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showBanner, setShowBanner] = useState(true)
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

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
    
    // Phần F
    severity_assessment_result: '',
    preventability_assessment_result: '',
  })

  const steps = [
    { title: 'Thông tin bệnh nhân', subtitle: 'Phần A' },
    { title: 'Thông tin ADR', subtitle: 'Phần B' },
    { title: 'Thuốc nghi ngờ', subtitle: 'Phần C' },
    { title: 'Thẩm định ADR', subtitle: 'Phần D' },
    { title: 'Người báo cáo', subtitle: 'Phần E' },
    { title: 'Đánh giá', subtitle: 'Phần F' },
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

  // Auto show modal on first visit
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenADRGuide')
    if (!hasSeenGuide) {
      // Delay để animation mượt hơn
      const timer = setTimeout(() => {
        setShowGuideModal(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleCloseGuideModal = () => {
    setShowGuideModal(false)
    if (dontShowAgain) {
      localStorage.setItem('hasSeenADRGuide', 'true')
    }
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
      case 5:
        return <AssessmentResultSection data={formData} updateData={updateFormData} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Báo cáo ADR</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2 px-2">Báo cáo phản ứng có hại của thuốc (Không cần đăng nhập)</p>
          </div>

          {/* Progress Steps */}
          <Card className="mb-6">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center justify-between flex-1">
                  {steps.map((step, index) => (
                    <div key={index} className="flex items-center">
                      <div 
                        className="flex flex-col items-center cursor-pointer group"
                        onClick={() => setCurrentStep(index)}
                        title={`Chuyển đến ${step.subtitle}: ${step.title}`}
                      >
                        <div className={`flex items-center justify-center w-8 sm:w-10 h-8 sm:h-10 rounded-full border-2 transition-all ${
                          index <= currentStep 
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : 'border-gray-300 text-gray-500 group-hover:border-blue-400 group-hover:text-blue-500'
                        }`}>
                          <span className="text-xs sm:text-sm">{index + 1}</span>
                        </div>
                        <div className="mt-2 text-center">
                          <div className={`text-xs font-medium transition-colors ${
                            index <= currentStep ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'
                          }`}>
                            {step.subtitle}
                          </div>
                          <div className="text-xs text-gray-500 hidden sm:block group-hover:text-gray-700">
                            {step.title}
                          </div>
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-8 sm:w-12 md:w-24 h-0.5 ${
                          index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={() => setShowGuideModal(true)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    aria-label="Hướng dẫn báo cáo"
                  >
                    <BookOpenIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
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

          {/* Report Guide Modal */}
          <ReportGuideModal 
            isOpen={showGuideModal} 
            onClose={handleCloseGuideModal}
            dontShowAgain={dontShowAgain}
            setDontShowAgain={setDontShowAgain}
          />
        </div>
      </div>
    </div>
  )
}



