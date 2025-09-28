// =====================================================
// NEW ALLERGY CARD PAGE
// Page for creating new allergy cards
// =====================================================

'use client';

import { useSearchParams } from 'next/navigation';
import { AllergyCardForm } from '@/components/forms/AllergyCardForm';

export default function NewAllergyCardPage() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get('reportId') || undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <AllergyCardForm 
        mode="create"
        reportId={reportId}
      />
    </div>
  );
}

