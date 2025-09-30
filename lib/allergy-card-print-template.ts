// =====================================================
// ALLERGY CARD PRINT TEMPLATE
// HTML template generator for printing allergy cards
// =====================================================

export interface AllergyCardPrintData {
  patient_name: string;
  patient_gender: string;
  patient_age: number;
  patient_id_number?: string;
  hospital_name: string;
  department?: string;
  doctor_name: string;
  doctor_phone?: string;
  issued_date: string;
  qr_code_url?: string;
  allergies?: any[];
}

/**
 * Generate HTML for printing allergy card based on capthe.html template
 */
export function generateAllergyCardPrintHTML(card: AllergyCardPrintData): string {
  // Parse allergies from JSON if needed
  let allergies = [];
  try {
    allergies = typeof card.allergies === 'string' 
      ? JSON.parse(card.allergies) 
      : (card.allergies || []);
  } catch (e) {
    console.error('Error parsing allergies:', e);
    allergies = [];
  }

  // Generate allergy table rows
  const allergyRows = allergies.map((allergy: any) => `
    <tr>
      <td>${allergy.allergen_name || ''}</td>
      <td>${allergy.certainty_level === 'suspected' ? '☑' : '☐'}</td>
      <td>${allergy.certainty_level === 'confirmed' ? '☑' : '☐'}</td>
      <td>${allergy.clinical_manifestation || ''}</td>
    </tr>
  `).join('');

  // Add empty rows to fill table (minimum 5 rows)
  let emptyRowsCount = Math.max(0, 5 - allergies.length);
  const emptyRows = Array(emptyRowsCount).fill(0).map(() => `
    <tr>
      <td>&nbsp;</td>
      <td>☐</td>
      <td>☐</td>
      <td></td>
    </tr>
  `).join('');

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // Generate gender checkbox
  const genderMaleChecked = card.patient_gender === 'male' ? '☑' : '☐';
  const genderFemaleChecked = card.patient_gender === 'female' ? '☑' : '☐';

  // Get QR code URL or use placeholder
  const qrCodeUrl = card.qr_code_url || 'https://placehold.co/90x90/ffffff/000000?text=QR+CODE';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>THẺ DỊ ỨNG - ${card.patient_name}</title>
    <style>
        /* General body styling */
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 14px;
            line-height: 1.6;
            width: 800px;
            margin: auto;
            border: 1px solid black;
            padding: 20px;
            background-color: #f9f9f9;
        }

        .top-container {
            display: flex;
            align-items: flex-start;
            gap: 20px;
            margin-bottom: 20px;
        }

        .qr-code img {
            width: 90px;
            height: 90px;
            display: block;
        }
        
        .top-info {
            flex-grow: 1;
        }

        .header, .subtitle, .title {
            text-align: center;
        }

        .header {
            text-align: right;
            font-weight: bold;
        }

        .subtitle {
            font-weight: bold;
        }

        .title {
            font-size: 20px;
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 20px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 5px 0;
        }
        
        .allergy-table {
            margin-top: 15px;
            margin-bottom: 15px;
        }

        .allergy-table th, .allergy-table td {
            border: 1px solid black;
            padding: 8px;
            text-align: center;
        }

        .allergy-table th {
            font-weight: bold;
            background-color: #f2f2f2;
        }
        
        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
        }

        .signature-block {
            text-align: center;
            width: 48%;
        }
        
        .remember-section {
            margin-top: 30px;
            border: 1px dashed black;
            padding: 15px;
        }

        .remember-section h3 {
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            margin-top: 0;
        }

        .remember-section ul {
            list-style-type: none;
            padding-left: 15px;
        }

        .remember-section li::before {
            content: "• ";
            font-weight: bold;
        }

        .final-instruction {
            font-weight: bold;
            text-align: center;
            margin-top: 10px;
            font-style: italic;
        }

        .print-button-container {
            text-align: center;
            margin-bottom: 20px;
        }

        .print-button {
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .print-button:hover {
            background-color: #1d4ed8;
        }

        @media print {
            .print-button-container {
                display: none;
            }
            body {
                border: none;
                padding: 0;
                margin: 0;
                background-color: white;
            }
        }
    </style>
    <script>
        function printCard() {
            window.print();
        }
    </script>
</head>
<body>

    <div class="print-button-container">
        <button class="print-button" onclick="printCard()">🖨️ In Thẻ Dị Ứng</button>
    </div>

    <div class="top-container">
        <div class="qr-code">
            <img src="${qrCodeUrl}" alt="QR Code">
        </div>
        <div class="top-info">
            <div class="header">
                <p>PHỤ LỤC VII</p>
            </div>
        
            <div class="subtitle">
                <p>MẪU THẺ THEO DÕI DỊ ỨNG<br>(Ban hành kèm theo Thông tư số 51/2017/TT-BYT ngày 29 tháng 12 năm 2017 của Bộ trưởng Bộ Y tế)</p>
            </div>
        
            <table class="info-table">
                <tr>
                    <td>Bệnh viện: ${card.hospital_name || '.......................................'}</td>
                    <td style="text-align: right;">Khoa/Trung tâm: ${card.department || '.......................................'}</td>
                </tr>
            </table>
        </div>
    </div>

    <h1 class="title">THẺ DỊ ỨNG</h1>

    <table class="info-table">
        <tr>
            <td style="width: 50%;">Họ tên: ${card.patient_name || '............................................................................'}</td>
            <td style="width: 25%;">Nam ${genderMaleChecked}  Nữ ${genderFemaleChecked}</td>
            <td style="width: 25%;">Tuổi: ${card.patient_age || '........................'}</td>
        </tr>
        <tr>
            <td colspan="3">Số CMND hoặc thẻ căn cước hoặc số định danh công dân: ${card.patient_id_number || '...................................................'}</td>
        </tr>
    </table>

    <table class="allergy-table">
        <thead>
            <tr>
                <th>Dị nguyên/thuốc</th>
                <th>Nghi ngờ</th>
                <th>Chắc chắn</th>
                <th>Biểu hiện lâm sàng</th>
            </tr>
        </thead>
        <tbody>
            ${allergyRows}
            ${emptyRows}
        </tbody>
    </table>

    <div class="signature-section">
        <div class="signature-block">
            <p><strong>Bác sĩ xác nhận chẩn đoán ký:</strong> ....................</p>
            <p><strong>Họ và tên:</strong> ${card.doctor_name || '........................................................'}</p>
        </div>
        <div class="signature-block">
            <p>ĐT: ${card.doctor_phone || '.............................................'}</p>
            <p>Ngày cấp thẻ: ${formatDate(card.issued_date)}</p>
        </div>
    </div>
    
    <div class="remember-section">
        <h3>Ba điều cần nhớ</h3>
        <p><strong>1) Các dấu hiệu nhận biết phản vệ:</strong><br>Sau khi tiếp xúc với dị nguyên có một trong những triệu chứng sau đây:</p>
        <ul>
            <li><strong>Miệng, họng:</strong> Ngứa, phù môi, lưỡi, khó thở, khàn giọng.</li>
            <li><strong>Da:</strong> ngứa, phát ban, đỏ da, phù nề.</li>
            <li><strong>Tiêu hóa:</strong> nôn, tiêu chảy, đau bụng.</li>
            <li><strong>Hô hấp:</strong> khó thở, tức ngực, thở rít, ho.</li>
            <li><strong>Tim mạch:</strong> mạch yếu, choáng váng.</li>
        </ul>
        <p><strong>2) Luôn mang adrenalin theo người.</strong></p>
        <p><strong>3) Khi có dấu hiệu phản vệ:</strong></p>
        <p class="final-instruction">"Tiêm bắp adrenalin ngay lập tức"</p>
        <p class="final-instruction">"Gọi 115 hoặc đến cơ sở khám, chữa bệnh gần nhất"</p>
    </div>

</body>
</html>`;
}
