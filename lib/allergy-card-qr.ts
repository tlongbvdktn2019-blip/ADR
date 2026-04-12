import { QRCardService } from '@/lib/qr-card-service'

type AllergyCardQrState = {
  id: string
  qr_code_data?: string | null
  qr_code_url?: string | null
}

export async function ensureAllergyCardQrCode(
  supabase: any,
  card: AllergyCardQrState
) {
  if (card.qr_code_data === card.id && card.qr_code_url) {
    return {
      qr_code_data: card.qr_code_data,
      qr_code_url: card.qr_code_url,
      updated: false,
    }
  }

  const qr_code_url = await QRCardService.generateCardQR(card.id)
  const qr_code_data = card.id

  await supabase
    .from('allergy_cards')
    .update({ qr_code_url, qr_code_data })
    .eq('id', card.id)

  return {
    qr_code_data,
    qr_code_url,
    updated: true,
  }
}
