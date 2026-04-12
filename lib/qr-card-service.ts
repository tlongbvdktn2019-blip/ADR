import QRCode from 'qrcode'

export class QRCardService {
  static async generateCardQR(cardId: string, baseUrl?: string): Promise<string> {
    try {
      const appUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const qrContent = `${appUrl}/allergy-cards/view/${cardId}`

      return await QRCode.toDataURL(qrContent, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 512,
        margin: 2,
        color: {
          dark: '#dc2626',
          light: '#FFFFFF',
        },
      })
    } catch (error) {
      console.error('Error generating card QR code:', error)
      throw new Error('Failed to generate QR code')
    }
  }

  static async generateCardQRWithData(cardData: {
    id: string
    card_code: string
    patient_name: string
    allergies: Array<{
      allergen_name: string
      severity_level?: string
    }>
  }): Promise<string> {
    try {
      const qrData = {
        type: 'allergy_card',
        id: cardData.id,
        code: cardData.card_code,
        patient: cardData.patient_name,
        allergies: cardData.allergies.map((a) => ({
          name: a.allergen_name,
          severity: a.severity_level,
        })),
      }

      return await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 512,
        margin: 2,
        color: {
          dark: '#dc2626',
          light: '#FFFFFF',
        },
      })
    } catch (error) {
      console.error('Error generating card QR with data:', error)
      throw new Error('Failed to generate QR payload')
    }
  }

  static parseQRData(data: string): {
    isAllergyCard: boolean
    cardCode?: string
    cardId?: string
  } {
    try {
      if (/^AC-\d{4}-\d{6}$/.test(data.trim())) {
        return { isAllergyCard: true, cardCode: data.trim() }
      }

      if (data.startsWith('http')) {
        const url = new URL(data)
        const idMatch = url.pathname.match(/\/allergy-cards\/view\/([a-f0-9-]+)/)
        if (idMatch) {
          return { isAllergyCard: true, cardId: idMatch[1] }
        }
      }

      const parsed = JSON.parse(data)
      if (parsed.type === 'allergy_card') {
        return {
          isAllergyCard: true,
          cardCode: parsed.code,
          cardId: parsed.id,
        }
      }
    } catch {
      // Ignore invalid QR payloads.
    }

    return { isAllergyCard: false }
  }

  static async generateQRBuffer(cardId: string, baseUrl?: string): Promise<Buffer> {
    try {
      const appUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const qrContent = `${appUrl}/allergy-cards/view/${cardId}`

      return await QRCode.toBuffer(qrContent, {
        errorCorrectionLevel: 'H',
        type: 'png',
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
    } catch (error) {
      console.error('Error generating QR buffer:', error)
      throw new Error('Failed to generate QR buffer')
    }
  }
}
