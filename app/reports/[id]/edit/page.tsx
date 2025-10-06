'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ConcurrentDrugFormData, createEmptyConcurrentDrug } from '@/types/concurrent-drug'
import { toast } from 'react-hot-toast'
import MainLayout from '@/components/layout/MainLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import PatientInfoSection from '@/components/forms/PatientInfoSection'
import ADRInfoSection from '@/components/forms/ADRInfoSection'
import SuspectedDrugsSection from '@/components/forms/SuspectedDrugsSection'
import AssessmentSection from '@/components/forms/AssessmentSection'
import ReporterInfoSection from '@/components/forms/ReporterInfoSection'
import ReportGuideModal from '@/components/forms/ReportGuideModal'
import { ArrowLeftIcon, BookOpenIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { ADRReport } from '@/types/report'

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

interface EditReportPageProps {
  params: {
    id: string
  }
}

export default function EditReportPage({ params }: EditReportPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [report, setReport] = useState<ADRReport | null>(null)
  const [showGuideModal, setShowGuideModal] = useState(false)

  const [formData, setFormData] = useState<ADRFormData>({
    // Default empty values
    patient_name: '',
    patient_birth_date: '',
    patient_age: 0,
    patient_gender: 'male',
    patient_weight: 0,
    adr_occurrence_date: '',
    reaction_onset_time: '',
    adr_description: '',
    related_tests: '',
    medical_history: '',
    treatment_response: '',
    severity_level: 'not_serious',
    outcome_after_treatment: 'unknown',
    suspected_drugs: [{
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
    }],
    concurrent_drugs: [],
    causality_assessment: 'unclassified',
    assessment_scale: 'who',
    medical_staff_comment: '',
    reporter_name: '',
    reporter_profession: '',
    reporter_phone: '',
    reporter_email: '',
    report_type: 'initial',
    report_date: '',
  })

  // Fetch existing report data
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/reports/${params.id}`)
        
        if (!response.ok) {
          if (response.status === 403) {
            toast.error('Không có quyền chỉnh sửa báo cáo này')
            router.push('/reports')
            return
          }
          if (response.status === 404) {
            toast.error('Không tìm thấy báo cáo')
            router.push('/reports')
            return
          }
          throw new Error('Failed to fetch report')
        }

        const data = await response.json()
        const reportData = data.report as ADRReport

        setReport(reportData)
        
        // Populate form with existing data
        setFormData({
          // Patient info
          patient_name: reportData.patient_name,
          patient_birth_date: reportData.patient_birth_date,
          patient_age: reportData.patient_age,
          patient_gender: reportData.patient_gender,
          patient_weight: reportData.patient_weight || 0,
          
          // ADR info
          adr_occurrence_date: reportData.adr_occurrence_date,
          reaction_onset_time: reportData.reaction_onset_time || '',
          adr_description: reportData.adr_description,
          related_tests: reportData.related_tests || '',
          medical_history: reportData.medical_history || '',
          treatment_response: reportData.treatment_response || '',
          severity_level: reportData.severity_level,
          outcome_after_treatment: reportData.outcome_after_treatment,
          
          // Suspected drugs
          suspected_drugs: reportData.suspected_drugs?.map((drug, index) => ({
            id: (index + 1).toString(),
            drug_name: drug.drug_name,
            commercial_name: drug.commercial_name || '',
            dosage_form: drug.dosage_form || '',
            manufacturer: drug.manufacturer || '',
            batch_number: drug.batch_number || '',
            dosage_and_frequency: drug.dosage_and_frequency || '',
            dosage: drug.dosage || '',
            frequency: drug.frequency || '',
            route_of_administration: drug.route_of_administration || '',
            start_date: drug.start_date || '',
            end_date: drug.end_date || '',
            indication: drug.indication || '',
            reaction_improved_after_stopping: drug.reaction_improved_after_stopping,
            reaction_reoccurred_after_rechallenge: drug.reaction_reoccurred_after_rechallenge,
          })) || [{
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
          }],
          
          // Concurrent drugs
          concurrent_drugs: reportData.concurrent_drugs?.map((drug, index) => ({
            id: (index + 1).toString(),
            drug_name: drug.drug_name,
            dosage_form_strength: drug.dosage_form_strength || '',
            start_date: drug.start_date || '',
            end_date: drug.end_date || '',
          })) || [],
          
          // Assessment
          causality_assessment: reportData.causality_assessment,
          assessment_scale: reportData.assessment_scale,
          medical_staff_comment: reportData.medical_staff_comment || '',
          
          // Reporter info
          reporter_name: reportData.reporter_name,
          reporter_profession: reportData.reporter_profession,
          reporter_phone: reportData.reporter_phone || '',
          reporter_email: reportData.reporter_email || '',
          report_type: reportData.report_type,
          report_date: reportData.report_date,
        })

      } catch (error) {
        console.error('Error fetching report:', error)
        toast.error('Không thể tải thông tin báo cáo')
        router.push('/reports')
      } finally {
        setInitialLoading(false)
      }
    }

    if (params.id && session) {
      fetchReport()
    }
  }, [params.id, session, router])

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
      const response = await fetch(`/api/reports/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Báo cáo ADR đã được cập nhật thành công!')
        router.push(`/reports/${params.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Có lỗi xảy ra khi cập nhật báo cáo')
      }
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Có lỗi xảy ra khi cập nhật báo cáo')
    } finally {
      setLoading(false)
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <PatientInfoSection data={formData as any} updateData={updateFormData} />
      case 1:
        return <ADRInfoSection data={formData as any} updateData={updateFormData} />
      case 2:
        return <SuspectedDrugsSection 
          drugs={formData.suspected_drugs} 
          updateDrugs={updateSuspectedDrugs}
          concurrentDrugs={formData.concurrent_drugs}
          updateConcurrentDrugs={updateConcurrentDrugs}
        />
      case 3:
        return <AssessmentSection data={formData as any} updateData={updateFormData} />
      case 4:
        return <ReporterInfoSection data={formData as any} updateData={updateFormData} />
      default:
        return null
    }
  }

  if (initialLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </MainLayout>
    )
  }

  if (!report) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy báo cáo</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/reports/${params.id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Quay lại báo cáo
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa báo cáo ADR</h1>
              <p className="text-gray-600 mt-1">
                Mã báo cáo: {report.report_code} - {report.patient_name}
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <Card>
          <div className="px-4 py-5">
            <div className="flex items-start justify-between gap-4">
              <nav aria-label="Progress" className="flex-1">
                <ol className="space-y-4 md:flex md:space-y-0 md:space-x-8">
                  {steps.map((step, index) => (
                    <li key={step.title} className="md:flex-1">
                      <div
                        className={`group pl-4 py-2 flex flex-col border-l-4 hover:border-gray-300 md:pl-0 md:pt-4 md:pb-0 md:border-l-0 md:border-t-4 ${
                          index === currentStep
                            ? 'border-primary-600'
                            : index < currentStep
                            ? 'border-primary-600'
                            : 'border-gray-200'
                        }`}
                      >
                        <span
                          className={`text-xs font-semibold tracking-wide uppercase ${
                            index <= currentStep ? 'text-primary-600' : 'text-gray-500'
                          }`}
                        >
                          {step.subtitle}
                        </span>
                        <span className="text-sm font-medium">{step.title}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </nav>
              <div className="flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGuideModal(true)}
                  className="flex items-center gap-2"
                >
                  <BookOpenIcon className="w-4 h-4" />
                  <span className="hidden lg:inline">Hướng dẫn</span>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Content */}
        <div className="min-h-[500px]">
          {renderCurrentStep()}
        </div>

        {/* Navigation */}
        <Card>
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={loading}
                >
                  Quay lại
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Bước {currentStep + 1} / {steps.length}
              </span>
            </div>

            <div>
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={loading}
                >
                  Tiếp theo
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner />
                      Đang cập nhật...
                    </>
                  ) : (
                    'Cập nhật báo cáo'
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Report Guide Modal */}
        <ReportGuideModal 
          isOpen={showGuideModal} 
          onClose={() => setShowGuideModal(false)} 
        />
      </div>
    </MainLayout>
  )
}
