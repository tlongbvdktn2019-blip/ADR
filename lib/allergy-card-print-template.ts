export interface AllergyCardPrintData {
  card_code: string
  patient_name: string
  patient_gender: string
  patient_age: number
  patient_id_number?: string
  hospital_name: string
  department?: string
  doctor_name: string
  doctor_phone?: string
  issued_date: string
  expiry_date?: string
  qr_code_url?: string
  allergies?: Array<{
    allergen_name?: string
    certainty_level?: string
    clinical_manifestation?: string
  }>
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatDate(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN').format(new Date(`${value.slice(0, 10)}T00:00:00`))
}

export function generateAllergyCardPrintHTML(card: AllergyCardPrintData): string {
  const allergies = Array.isArray(card.allergies) ? card.allergies : []
  const rows = allergies.map((allergy) => `<tr>
    <td>${escapeHtml(allergy.allergen_name)}</td>
    <td>${allergy.certainty_level === 'suspected' ? '☑' : '☐'}</td>
    <td>${allergy.certainty_level === 'confirmed' ? '☑' : '☐'}</td>
    <td>${escapeHtml(allergy.clinical_manifestation)}</td>
  </tr>`).join('')
  const emptyRows = Array.from({ length: Math.max(0, 5 - allergies.length) }, () => '<tr><td>&nbsp;</td><td>☐</td><td>☐</td><td></td></tr>').join('')

  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Thẻ dị ứng - ${escapeHtml(card.patient_name)}</title>
<style>
@page{size:A4;margin:12mm}*{box-sizing:border-box}body{font-family:"Times New Roman",serif;color:#111;max-width:800px;margin:0 auto;padding:18px;font-size:14px}.toolbar{text-align:center;margin-bottom:16px}.toolbar button{border:0;border-radius:6px;background:#1d4ed8;color:white;padding:10px 22px;font:600 15px sans-serif;cursor:pointer}.top{display:grid;grid-template-columns:110px 1fr;gap:18px;align-items:start}.qr img{width:100px;height:100px}.meta{text-align:center}.appendix{text-align:right;font-weight:700}.meta h2{font-size:15px;margin:5px 0}.title{text-align:center;font-size:24px;margin:20px 0 12px}.code{text-align:center;font:600 13px monospace;margin-bottom:16px}.info{display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px;margin:10px 0}.line{border-bottom:1px dotted #555;padding-bottom:3px}.allergies{width:100%;border-collapse:collapse;margin:16px 0}.allergies th,.allergies td{border:1px solid #111;padding:7px;text-align:center}.allergies th:first-child,.allergies td:first-child,.allergies th:last-child,.allergies td:last-child{text-align:left}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:24px 0;text-align:center}.remember{border:1px dashed #222;padding:12px 16px}.remember h3{text-align:center;margin:0 0 8px}.remember li{margin:3px 0}.foot{text-align:center;font-weight:700;font-style:italic}@media print{.toolbar{display:none}body{padding:0}}
</style></head><body>
<div class="toolbar"><button onclick="window.print()">In thẻ dị ứng</button></div>
<section class="top"><div class="qr"><img src="${escapeHtml(card.qr_code_url)}" alt="Mã QR"></div><div class="meta"><div class="appendix">PHỤ LỤC VII</div><h2>MẪU THẺ THEO DÕI DỊ ỨNG</h2><div>(Ban hành kèm theo Thông tư số 51/2017/TT-BYT ngày 29 tháng 12 năm 2017 của Bộ trưởng Bộ Y tế)</div><p><strong>Bệnh viện:</strong> ${escapeHtml(card.hospital_name)} &nbsp; <strong>Khoa/Trung tâm:</strong> ${escapeHtml(card.department || '........................')}</p></div></section>
<h1 class="title">THẺ DỊ ỨNG</h1><div class="code">Mã thẻ: ${escapeHtml(card.card_code)}</div>
<section class="info"><div class="line"><strong>Họ tên:</strong> ${escapeHtml(card.patient_name)}</div><div class="line">Nam ${card.patient_gender === 'male' ? '☑' : '☐'} &nbsp; Nữ ${card.patient_gender === 'female' ? '☑' : '☐'}</div><div class="line"><strong>Tuổi:</strong> ${escapeHtml(card.patient_age)}</div></section>
<p class="line"><strong>Số CMND/CCCD/định danh:</strong> ${escapeHtml(card.patient_id_number || '................................................')}</p>
<table class="allergies"><thead><tr><th>Dị nguyên/thuốc</th><th>Nghi ngờ</th><th>Chắc chắn</th><th>Biểu hiện lâm sàng</th></tr></thead><tbody>${rows}${emptyRows}</tbody></table>
<section class="signatures"><div><strong>Bác sĩ xác nhận chẩn đoán ký</strong><p>Họ và tên: ${escapeHtml(card.doctor_name)}</p></div><div><strong>Thông tin cấp thẻ</strong><p>ĐT: ${escapeHtml(card.doctor_phone || '....................')}</p><p>Ngày cấp: ${escapeHtml(formatDate(card.issued_date))}${card.expiry_date ? ` · Hết hạn: ${escapeHtml(formatDate(card.expiry_date))}` : ''}</p></div></section>
<section class="remember"><h3>Ba điều cần nhớ</h3><ol><li>Khi có biểu hiện khó thở, phù môi/lưỡi, nổi ban nhanh, choáng hoặc ngất sau tiếp xúc dị nguyên, cần gọi cấp cứu.</li><li>Luôn mang theo thẻ và thông báo cho nhân viên y tế về tiền sử dị ứng.</li><li>Không tự ý dùng lại thuốc/dị nguyên đã ghi trên thẻ.</li></ol><p class="foot">Mã QR mở bản tra cứu công khai; không chứa CCCD và ghi chú nội bộ.</p></section>
</body></html>`
}
