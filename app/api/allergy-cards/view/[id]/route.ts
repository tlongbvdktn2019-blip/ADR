import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { allergyCardError, UUID_PATTERN } from '@/lib/allergy-card-api'
import { getEffectiveCardStatus } from '@/lib/allergy-card-workflow'

export const dynamic = 'force-dynamic'

const publicHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_PATTERN.test(params.id)) {
    return allergyCardError('NOT_FOUND', 'Không tìm thấy thẻ dị ứng', 404)
  }

  const supabase = createAdminClient()
  const { data: card, error } = await supabase
    .from('allergy_cards')
    .select(`
      id, card_code, public_token, patient_name, patient_gender, patient_age,
      hospital_name, department, doctor_name, doctor_phone,
      issued_date, expiry_date, organization, status,
      card_allergies(
        id, allergen_name, certainty_level, clinical_manifestation,
        severity_level, reaction_type
      )
    `)
    .eq('public_token', params.id)
    .maybeSingle()

  if (error) console.error('Load public allergy card failed:', error)
  if (!card) return allergyCardError('NOT_FOUND', 'Không tìm thấy thẻ dị ứng', 404)

  const status = getEffectiveCardStatus(card.status, card.expiry_date)
  if (status !== 'active') {
    return allergyCardError(
      'CARD_NOT_ACTIVE',
      status === 'expired' ? 'Thẻ dị ứng đã hết hạn' : 'Thẻ dị ứng không còn hiệu lực',
      410
    )
  }

  const severityOrder: Record<string, number> = {
    life_threatening: 1,
    severe: 2,
    moderate: 3,
    mild: 4,
  }
  const allergies = [...((card as any).card_allergies || [])].sort(
    (a, b) => (severityOrder[a.severity_level] || 99) - (severityOrder[b.severity_level] || 99)
  )

  return NextResponse.json({
    card: {
      card_code: card.card_code,
      patient_name: card.patient_name,
      patient_gender: card.patient_gender,
      patient_age: card.patient_age,
      hospital_name: card.hospital_name,
      department: card.department,
      doctor_name: card.doctor_name,
      doctor_phone: card.doctor_phone,
      issued_date: card.issued_date,
      expiry_date: card.expiry_date,
      organization: card.organization,
      status,
      allergies,
    },
    public_updates_enabled:
      process.env.ALLERGY_PUBLIC_UPDATES_ENABLED === 'true' &&
      Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
    turnstile_site_key: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null,
  }, { headers: publicHeaders })
}
