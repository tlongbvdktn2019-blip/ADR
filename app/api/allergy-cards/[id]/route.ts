import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createAdminClient } from '@/lib/supabase'
import { ensureAllergyCardQrCode } from '@/lib/allergy-card-qr'
import { AllergyCardFormData } from '@/types/allergy-card'

function isAdminSession(session: any) {
  return session?.user?.role === 'admin'
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    void request

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()
    const cardId = params.id

    const { data: card, error } = await adminSupabase
      .from('allergy_cards_with_details')
      .select('*')
      .eq('id', cardId)
      .single()

    if (error || !card) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Allergy card not found' }, { status: 404 })
    }

    if (!isAdminSession(session) && card.issued_by_user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (card.report_id) {
      const { data: drugs } = await adminSupabase
        .from('suspected_drugs')
        .select('*')
        .eq('report_id', card.report_id)

      card.suspected_drugs = drugs || []
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

    return NextResponse.json({ card })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()
    const cardId = params.id
    const formData: AllergyCardFormData = await request.json()

    const { data: existingCard, error: fetchError } = await adminSupabase
      .from('allergy_cards')
      .select('*')
      .eq('id', cardId)
      .single()

    if (fetchError || !existingCard) {
      return NextResponse.json({ error: 'Allergy card not found' }, { status: 404 })
    }

    if (!isAdminSession(session) && existingCard.issued_by_user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!formData.patient_name || !formData.hospital_name || !formData.doctor_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const cardUpdateData = {
      patient_name: formData.patient_name,
      patient_gender: formData.patient_gender,
      patient_age: formData.patient_age,
      patient_id_number: formData.patient_id_number,
      hospital_name: formData.hospital_name,
      department: formData.department,
      doctor_name: formData.doctor_name,
      doctor_phone: formData.doctor_phone,
      expiry_date: formData.expiry_date && formData.expiry_date.trim() !== '' ? formData.expiry_date : null,
      notes: formData.notes,
      google_drive_url: formData.google_drive_url,
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await adminSupabase
      .from('allergy_cards')
      .update(cardUpdateData)
      .eq('id', cardId)

    if (updateError) {
      console.error('Card update error:', updateError)
      return NextResponse.json({ error: 'Failed to update card' }, { status: 500 })
    }

    const { error: deleteError } = await adminSupabase
      .from('card_allergies')
      .delete()
      .eq('card_id', cardId)

    if (deleteError) {
      console.error('Allergies delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to update allergies' }, { status: 500 })
    }

    if (formData.allergies && formData.allergies.length > 0) {
      const allergiesData = formData.allergies.map((allergy) => ({
        card_id: cardId,
        allergen_name: allergy.allergen_name,
        certainty_level: allergy.certainty_level,
        clinical_manifestation: allergy.clinical_manifestation,
        severity_level: allergy.severity_level,
        reaction_type: allergy.reaction_type,
      }))

      const { error: allergiesError } = await adminSupabase
        .from('card_allergies')
        .insert(allergiesData)

      if (allergiesError) {
        console.error('Allergies insert error:', allergiesError)
        return NextResponse.json({ error: 'Failed to update allergies' }, { status: 500 })
      }
    }

    const { data: updatedCard } = await adminSupabase
      .from('allergy_cards_with_details')
      .select('*')
      .eq('id', cardId)
      .single()

    if (updatedCard?.report_id) {
      const { data: drugs } = await adminSupabase
        .from('suspected_drugs')
        .select('*')
        .eq('report_id', updatedCard.report_id)

      updatedCard.suspected_drugs = drugs || []
    }

    if (updatedCard) {
      try {
        const qrState = await ensureAllergyCardQrCode(adminSupabase, {
          id: updatedCard.id,
          qr_code_url: updatedCard.qr_code_url,
          qr_code_data: updatedCard.qr_code_data,
        })

        updatedCard.qr_code_url = qrState.qr_code_url
        updatedCard.qr_code_data = qrState.qr_code_data
      } catch (qrError) {
        console.error('QR regeneration error:', qrError)
      }
    }

    return NextResponse.json({
      success: true,
      card: updatedCard,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    void request

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()
    const cardId = params.id

    const { data: existingCard, error: fetchError } = await adminSupabase
      .from('allergy_cards')
      .select('*')
      .eq('id', cardId)
      .single()

    if (fetchError || !existingCard) {
      console.error('Card fetch error:', fetchError)
      return NextResponse.json({ error: 'Allergy card not found' }, { status: 404 })
    }

    if (!isAdminSession(session) && existingCard.issued_by_user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error: allergiesDeleteError } = await adminSupabase
      .from('card_allergies')
      .delete()
      .eq('card_id', cardId)

    if (allergiesDeleteError) {
      console.error('Allergies delete error:', allergiesDeleteError)
      return NextResponse.json({ error: 'Failed to delete allergies' }, { status: 500 })
    }

    const { data: updateRows } = await adminSupabase
      .from('allergy_card_updates')
      .select('id')
      .eq('card_id', cardId)

    const updateIds = (updateRows || []).map((row) => row.id)

    if (updateIds.length > 0) {
      const { error: updateAllergiesDeleteError } = await adminSupabase
        .from('update_allergies')
        .delete()
        .in('update_id', updateIds)

      if (updateAllergiesDeleteError) {
        console.error('Update allergies delete error:', updateAllergiesDeleteError)
        return NextResponse.json({ error: 'Failed to delete update allergies' }, { status: 500 })
      }
    }

    const { error: updatesDeleteError } = await adminSupabase
      .from('allergy_card_updates')
      .delete()
      .eq('card_id', cardId)

    if (updatesDeleteError) {
      console.error('Updates delete error:', updatesDeleteError)
      return NextResponse.json({ error: 'Failed to delete card updates' }, { status: 500 })
    }

    const { error: cardDeleteError } = await adminSupabase
      .from('allergy_cards')
      .delete()
      .eq('id', cardId)

    if (cardDeleteError) {
      console.error('Card delete error:', cardDeleteError)
      return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Allergy card deleted',
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
