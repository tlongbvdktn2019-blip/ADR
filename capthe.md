<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MẪU THẺ THEO DÕI DỊ ỨNG</title>
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

        /* Container for the top section with QR code and header info */
        .top-container {
            display: flex;
            align-items: flex-start;
            gap: 20px; /* Creates space between QR code and the text */
            margin-bottom: 20px;
        }

        .qr-code img {
            width: 90px;
            height: 90px;
            display: block;
        }
        
        .top-info {
            flex-grow: 1; /* Allows this section to take up remaining space */
        }

        /* Centered text utility classes */
        .header, .subtitle, .title {
            text-align: center;
        }

        /* Header section for the appendix number */
        .header {
            text-align: right;
            font-weight: bold;
        }

        /* Subtitle for the form name and legal basis */
        .subtitle {
            font-weight: bold;
        }

        /* Main title of the card */
        .title {
            font-size: 20px;
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 20px;
        }

        /* Basic table styling */
        table {
            width: 100%;
            border-collapse: collapse;
        }

        /* Styling for the patient information table */
        .info-table td {
            padding: 5px 0;
        }
        
        /* Styling for the main allergy tracking table */
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
        
        /* Flexbox for signature section layout */
        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
        }

        .signature-block {
            text-align: center;
            width: 48%; /* Ensures space between blocks */
        }
        
        /* Styling for the "Three things to remember" section */
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
            content: "• "; /* Custom bullet point */
            font-weight: bold;
        }

        /* Styling for the final, critical instructions */
        .final-instruction {
            font-weight: bold;
            text-align: center;
            margin-top: 10px;
            font-style: italic;
        }

    </style>
</head>
<body>

    <div class="top-container">
        <div class="qr-code">
            <!-- Placeholder for the QR Code -->
            <img src="https://placehold.co/90x90/ffffff/000000?text=QR+CODE" alt="QR Code">
        </div>
        <div class="top-info">
            <div class="header">
                <p>PHỤ LỤC VII</p>
            </div>
        
            <div class="subtitle">
                <p>MẪU THẺ THEO DÕI DỊ ỨNG<br>(Ban hành kèm theo Thông tư số 51/2017/TT-BYT ngày 29 tháng 12 năm 2017 của Bộ trưởng Bộ Y tế)</p>
            </div>
        
            <!-- Hospital and Department Information -->
            <table class="info-table">
                <tr>
                    <td>Bệnh viện: .......................................</td>
                    <td style="text-align: right;">Khoa/Trung tâm: .......................................</td>
                </tr>
            </table>
        </div>
    </div>


    <h1 class="title">THẺ DỊ ỨNG</h1>

    <!-- Patient Information Section -->
    <table class="info-table">
        <tr>
            <td style="width: 50%;">Họ tên: ............................................................................</td>
            <td style="width: 25%;">Nam □  Nữ □</td>
            <td style="width: 25%;">Tuổi: ........................</td>
        </tr>
        <tr>
            <td colspan="3">Số CMND hoặc thẻ căn cước hoặc số định danh công dân: .....................................................</td>
        </tr>
    </table>

    <!-- Allergy Details Table -->
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
            <tr>
                <td>&nbsp;</td>
                <td>□</td>
                <td>□</td>
                <td></td>
            </tr>
            <tr>
                <td>&nbsp;</td>
                <td>□</td>
                <td>□</td>
                <td></td>
            </tr>
            <tr>
                <td>&nbsp;</td>
                <td>□</td>
                <td>□</td>
                <td></td>
            </tr>
            <tr>
                <td>&nbsp;</td>
                <td>□</td>
                <td>□</td>
                <td></td>
            </tr>
            <tr>
                <td>&nbsp;</td>
                <td>□</td>
                <td>□</td>
                <td></td>
            </tr>
        </tbody>
    </table>

    <!-- Doctor's Signature and Contact Section -->
    <div class="signature-section">
        <div class="signature-block">
            <p><strong>Bác sĩ xác nhận chẩn đoán ký:</strong> ......................</p>
            <p><strong>Họ và tên:</strong> ..........................................................</p>
        </div>
        <div class="signature-block">
            <p>ĐT: ...............................................</p>
            <p>Ngày cấp thẻ: ............................</p>
        </div>
    </div>
    
    <!-- Important Instructions Section -->
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
        <p class="final-instruction">“Tiêm bắp adrenalin ngay lập tức”</p>
        <p class="final-instruction">“Gọi 115 hoặc đến cơ sở khám, chữa bệnh gần nhất”</p>
    </div>

</body>
</html>

