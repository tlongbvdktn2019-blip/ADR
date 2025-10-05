import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// Force Node.js runtime
export const runtime = 'nodejs';

/**
 * POST /api/contest/certificate
 * Generate certificate HTML for a submission
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { submission_id } = body;

    if (!submission_id) {
      return NextResponse.json(
        { success: false, error: 'Thiếu submission_id' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Fetch submission with related data
    const { data: submission, error } = await supabase
      .from('contest_submissions')
      .select(`
        *,
        contest:contests(*),
        participant:contest_participants(
          *,
          department:departments(name),
          unit:units(name)
        )
      `)
      .eq('id', submission_id)
      .single();

    if (error || !submission) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy bài thi' },
        { status: 404 }
      );
    }

    // Check if passed (at least 60%)
    const percentage = Math.round((submission.correct_answers / submission.total_questions) * 100);
    if (percentage < 60) {
      return NextResponse.json(
        { success: false, error: 'Điểm chưa đạt yêu cầu để nhận chứng nhận (tối thiểu 60%)' },
        { status: 400 }
      );
    }

    // Format data
    const participant = submission.participant;
    const contest = submission.contest;
    const timeInMinutes = Math.floor(submission.time_taken / 60);
    const timeInSeconds = submission.time_taken % 60;
    const completionTime = `${timeInMinutes}:${timeInSeconds.toString().padStart(2, '0')}`;
    const completionDate = new Date(submission.submitted_at).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Generate HTML certificate
    const html = generateCertificateHTML({
      fullName: participant.full_name,
      department: participant.department?.name || 'Chưa xác định',
      unit: participant.unit?.name || 'Chưa xác định',
      contestTitle: contest.title,
      score: submission.score,
      totalQuestions: submission.total_questions,
      percentage,
      completionTime,
      completionDate,
    });

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error: any) {
    console.error('Certificate generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

interface CertificateData {
  fullName: string;
  department: string;
  unit: string;
  contestTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completionTime: string;
  completionDate: string;
}

function generateCertificateHTML(data: CertificateData): string {
  const {
    fullName,
    department,
    unit,
    contestTitle,
    score,
    totalQuestions,
    percentage,
    completionTime,
    completionDate
  } = data;

  const achievementBadge = percentage >= 80 
    ? `<div class="achievement-badge">✨ THÀNH TÍCH XUẤT SẮC ✨</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chứng nhận - ${fullName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }

    .certificate-container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      border: 10px solid #FFD700;
      border-radius: 15px;
      padding: 30px 50px;
      box-shadow: 0 10px 50px rgba(0, 0, 0, 0.3);
      position: relative;
    }

    .certificate-container::before {
      content: '';
      position: absolute;
      top: 15px;
      left: 15px;
      right: 15px;
      bottom: 15px;
      border: 3px solid #FFC107;
      border-radius: 8px;
      pointer-events: none;
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
    }

    .trophy {
      font-size: 50px;
      margin-bottom: 10px;
    }

    .title {
      font-size: 48px;
      font-weight: 900;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 5px;
      letter-spacing: 2px;
    }

    .subtitle {
      font-size: 20px;
      color: #666;
      font-weight: 600;
      margin-bottom: 15px;
    }

    .body {
      text-align: center;
      margin-bottom: 20px;
    }

    .intro-text {
      font-size: 16px;
      color: #555;
      margin-bottom: 15px;
    }

    .contest-name {
      background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%);
      padding: 12px 20px;
      border-radius: 10px;
      margin: 15px 0;
    }

    .contest-name-text {
      font-size: 24px;
      font-weight: 800;
      color: #5a3c9d;
    }

    .participant-name-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }

    .participant-name {
      font-size: 38px;
      font-weight: 900;
      color: #333;
      border-bottom: 3px solid #667eea;
      display: inline-block;
      padding-bottom: 5px;
      margin: 10px 0 20px;
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 20px 0;
      text-align: left;
    }

    .detail-item {
      background: #f8f9fa;
      padding: 12px 15px;
      border-radius: 8px;
      border-left: 3px solid #667eea;
    }

    .detail-label {
      font-size: 11px;
      color: #666;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-value {
      font-size: 16px;
      font-weight: 700;
      color: #333;
    }

    .achievement-badge {
      display: inline-block;
      background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
      color: white;
      padding: 10px 30px;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 800;
      margin: 15px 0 10px;
      box-shadow: 0 4px 15px rgba(255, 165, 0, 0.4);
    }

    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 25px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
    }

    .footer-item {
      text-align: center;
      flex: 1;
    }

    .footer-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .footer-value {
      font-size: 16px;
      font-weight: 700;
      color: #333;
    }

    .signature {
      font-size: 16px;
      font-weight: 700;
      font-style: italic;
      color: #333;
      margin-top: 20px;
    }

    .decorative-element {
      position: absolute;
      font-size: 40px;
      opacity: 0.1;
    }

    .dec-1 { top: 40px; left: 40px; }
    .dec-2 { top: 40px; right: 40px; }
    .dec-3 { bottom: 80px; left: 50px; font-size: 30px; }
    .dec-4 { bottom: 80px; right: 50px; font-size: 30px; }

    .print-controls {
      text-align: center;
      margin: 30px 0;
    }

    .btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 15px 40px;
      border-radius: 10px;
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      margin: 0 10px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }

    .btn-secondary {
      background: #6c757d;
    }

    .instructions {
      text-align: center;
      color: #666;
      margin-top: 20px;
      font-size: 14px;
    }

    @media print {
      @page {
        size: A4 landscape;
        margin: 0;
      }

      body {
        background: white;
        padding: 0;
        margin: 0;
      }
      
      .print-controls,
      .instructions {
        display: none !important;
      }

      .certificate-container {
        max-width: none;
        width: 100%;
        height: 100vh;
        border: 10px solid #FFD700;
        box-shadow: none;
        page-break-inside: avoid;
        page-break-after: avoid;
        page-break-before: avoid;
        margin: 0;
        padding: 30px 50px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
    }

    @media (max-width: 768px) {
      .certificate-container {
        padding: 40px 30px;
      }

      .title {
        font-size: 48px;
      }

      .participant-name {
        font-size: 36px;
      }

      .details-grid {
        grid-template-columns: 1fr;
      }

      .footer {
        flex-direction: column;
        gap: 30px;
      }
    }
  </style>
  <script>
    function printCertificate() {
      window.print();
    }

    function closeWindow() {
      window.close();
    }
  </script>
</head>
<body>
  <div class="print-controls">
    <button class="btn" onclick="printCertificate()">🖨️ In chứng nhận</button>
    <button class="btn btn-secondary" onclick="closeWindow()">✖️ Đóng</button>
  </div>

  <div class="certificate-container">
    <!-- Decorative Elements -->
    <div class="decorative-element dec-1">🎓</div>
    <div class="decorative-element dec-2">📚</div>
    <div class="decorative-element dec-3">⭐</div>
    <div class="decorative-element dec-4">⭐</div>

    <!-- Header -->
    <div class="header">
      <div class="trophy">🏆</div>
      <div class="title">CHỨNG NHẬN</div>
      <div class="subtitle">HOÀN THÀNH XUẤT SẮC</div>
    </div>

    <!-- Body -->
    <div class="body">
      <p class="intro-text">Chứng nhận người có tên dưới đây đã hoàn thành xuất sắc:</p>
      
      <div class="contest-name">
        <div class="contest-name-text">${contestTitle}</div>
      </div>

      <div class="participant-name-label">Họ và tên:</div>
      <div class="participant-name">${fullName}</div>

      <!-- Details Grid -->
      <div class="details-grid">
        <div class="detail-item">
          <div class="detail-label">Đơn vị</div>
          <div class="detail-value">${department}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">Khoa/Phòng</div>
          <div class="detail-value">${unit}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">Điểm số</div>
          <div class="detail-value">${score}/${totalQuestions} điểm (${percentage}%)</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">Thời gian hoàn thành</div>
          <div class="detail-value">${completionTime}</div>
        </div>
      </div>

      ${achievementBadge}
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-item">
        <div class="footer-label">Ngày cấp</div>
        <div class="footer-value">${completionDate}</div>
      </div>
      
      <div class="footer-item">
        <div class="footer-label">Ban Giám Đốc</div>
        <div class="signature">(Đã ký)</div>
      </div>
    </div>
  </div>

  <div class="instructions">
    <p><em>Được tạo bởi hệ thống CODEX ADR</em></p>
    <p><small>Để lưu thành PDF: Nhấn "In chứng nhận" → Chọn "Save as PDF"</small></p>
  </div>
</body>
</html>`;
}

