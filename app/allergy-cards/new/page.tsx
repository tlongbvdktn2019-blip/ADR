'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AllergyCardIssuanceForm from '@/components/forms/AllergyCardIssuanceForm'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

function NewAllergyCardContent() {
  const searchParams = useSearchParams()
  return <AllergyCardIssuanceForm initialReportId={searchParams.get('reportId') || undefined} />
}

export default function NewAllergyCardPage() {
  return <Suspense fallback={<div className="min-h-screen grid place-items-center"><LoadingSpinner size="lg" /></div>}><NewAllergyCardContent /></Suspense>
}
