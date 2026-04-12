import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { ensureAllergyCardQrCode } from '@/lib/allergy-card-qr'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    void request

    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    const { data: card, error } = await adminSupabase
      .from('allergy_cards_with_details')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .single()

    if (error || !card) {
      console.error('Card not found:', error)
      return NextResponse.json(
        { error: 'Active allergy card not found' },
        { status: 404 }
      )
    }

    try {
      const qrState = await ensureAllergyCardQrCode(adminSupabase, {
        id: card.id,
        qr_code_url: card.qr_code_url,
        qr_code_data: card.qr_code_data,
      })

      card.qr_code_url = qrState.qr_code_url
      card.qr_code_data = qrState.qr_code_data
    } catch (qrError) {
      console.error('QR regeneration error:', qrError)
    }

    const sortedAllergies = ((card.allergies || []) as any[]).sort((a, b) => {
      const severityOrder: Record<string, number> = {
        life_threatening: 1,
        severe: 2,
        moderate: 3,
        mild: 4,
      }

      return (severityOrder[a.severity_level] || 99) - (severityOrder[b.severity_level] || 99)
    })

    return NextResponse.json({
      card: {
        id: card.id,
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
        allergies: sortedAllergies,
        status: card.status,
        qr_code_url: card.qr_code_url,
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
