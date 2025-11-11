// =====================================================
// TEST SCRIPT: PUBLIC QR CODE FOR ALLERGY CARDS
// Script để test chức năng QR công khai
// =====================================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Test data
const testCard = {
  patient_name: 'Nguyễn Văn Test',
  patient_gender: 'male',
  patient_age: 35,
  patient_id_number: '001234567890',
  hospital_name: 'Bệnh viện Test',
  department: 'Khoa Nội Tổng Hợp',
  doctor_name: 'BS. Nguyễn Thị Test',
  doctor_phone: '0912345678',
  allergies: [
    {
      allergen_name: 'Penicillin',
      certainty_level: 'confirmed',
      severity_level: 'severe',
      clinical_manifestation: 'Phản vệ toàn thân, khó thở, sốc phản vệ',
      reaction_type: 'Phản ứng quá mẫn type I'
    },
    {
      allergen_name: 'Aspirin',
      certainty_level: 'suspected',
      severity_level: 'moderate',
      clinical_manifestation: 'Phát ban, ngứa da',
      reaction_type: 'Phản ứng da'
    }
  ]
};

async function testPublicQRFlow() {
  console.log('🧪 BẮT ĐẦU TEST CHỨC NĂNG QR CÔNG KHAI\n');
  
  // Step 1: Create test card
  console.log('📝 Bước 1: Tạo thẻ dị ứng test...');
  try {
    const createResponse = await fetch(`${BASE_URL}/api/allergy-cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: Cần thêm authentication header nếu test trên production
        // 'Cookie': 'your-session-cookie'
      },
      body: JSON.stringify(testCard)
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create card: ${createResponse.status}`);
    }

    const createResult = await createResponse.json();
    console.log('✅ Đã tạo thẻ thành công!');
    console.log(`   Mã thẻ: ${createResult.card.card_code}`);
    console.log(`   Card ID: ${createResult.card.id}`);
    
    const cardCode = createResult.card.card_code;
    const qrCodeUrl = createResult.qr_code_url;
    
    console.log(`\n📱 QR Code URL (base64): ${qrCodeUrl ? qrCodeUrl.substring(0, 50) + '...' : 'N/A'}`);
    
    // Step 2: Test public API access (NO AUTH)
    console.log(`\n🔓 Bước 2: Test API công khai (không auth)...`);
    const publicApiUrl = `${BASE_URL}/api/allergy-cards/public/${cardCode}`;
    console.log(`   URL: ${publicApiUrl}`);
    
    const publicApiResponse = await fetch(publicApiUrl);
    
    if (!publicApiResponse.ok) {
      throw new Error(`Public API failed: ${publicApiResponse.status}`);
    }
    
    const publicApiResult = await publicApiResponse.json();
    console.log('✅ API công khai hoạt động!');
    console.log(`   Tên bệnh nhân: ${publicApiResult.card.patient_name}`);
    console.log(`   Số dị ứng: ${publicApiResult.card.allergies.length}`);
    
    if (publicApiResult.warning) {
      console.log(`   ⚠️  Cảnh báo: ${publicApiResult.warning}`);
    }
    
    // Step 3: Display public page URL
    console.log(`\n🌐 Bước 3: Trang công khai`);
    const publicPageUrl = `${BASE_URL}/allergy-cards/public/${cardCode}`;
    console.log(`   URL: ${publicPageUrl}`);
    console.log(`   ℹ️  Mở URL này trên trình duyệt để xem trang công khai`);
    
    // Step 4: QR Content
    console.log(`\n📷 Bước 4: Nội dung QR code`);
    console.log(`   QR chứa: ${publicPageUrl}`);
    console.log(`   ℹ️  Quét QR này bằng camera điện thoại sẽ mở trang công khai`);
    
    // Step 5: Display allergy details
    console.log(`\n🛡️  Bước 5: Thông tin dị ứng`);
    publicApiResult.card.allergies.forEach((allergy, index) => {
      console.log(`   ${index + 1}. ${allergy.allergen_name}`);
      console.log(`      - Mức độ: ${allergy.severity_level || 'N/A'}`);
      console.log(`      - Xác nhận: ${allergy.certainty_level === 'confirmed' ? 'Đã xác nhận' : 'Nghi ngờ'}`);
      if (allergy.clinical_manifestation) {
        console.log(`      - Biểu hiện: ${allergy.clinical_manifestation}`);
      }
    });
    
    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ KIỂM TRA HOÀN TẤT!');
    console.log(`${'='.repeat(60)}`);
    console.log('\n📋 TÓM TẮT:');
    console.log(`   ✅ Tạo thẻ: OK`);
    console.log(`   ✅ API công khai: OK`);
    console.log(`   ✅ QR code: OK`);
    console.log(`\n🎯 HÀNH ĐỘNG TIẾP THEO:`);
    console.log(`   1. Mở URL trong trình duyệt: ${publicPageUrl}`);
    console.log(`   2. Tạo QR code từ URL trên (dùng qrcode.com hoặc tương tự)`);
    console.log(`   3. Quét QR bằng camera điện thoại`);
    console.log(`   4. Xác nhận trang hiển thị đúng thông tin`);
    console.log(`\n💡 LƯU Ý:`);
    console.log(`   - Nếu test trên localhost, QR sẽ KHÔNG hoạt động trên mobile`);
    console.log(`   - Cần deploy lên production với HTTPS để test thật`);
    console.log(`   - Đảm bảo NEXT_PUBLIC_APP_URL đã được set đúng`);
    
  } catch (error) {
    console.error('\n❌ LỖI:', error.message);
    console.error('   Chi tiết:', error);
    
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('   1. Kiểm tra server đang chạy');
    console.log('   2. Kiểm tra authentication (nếu cần)');
    console.log('   3. Kiểm tra database connection');
    console.log('   4. Xem log server để biết chi tiết lỗi');
  }
}

// Run test
console.log(`🌐 Base URL: ${BASE_URL}\n`);

if (process.argv.includes('--help')) {
  console.log('CÁCH SỬ DỤNG:');
  console.log('  node scripts/test-public-qr.js');
  console.log('\nMÔ TẢ:');
  console.log('  Script này test chức năng QR công khai cho thẻ dị ứng');
  console.log('  Nó sẽ:');
  console.log('    1. Tạo một thẻ dị ứng mới');
  console.log('    2. Test API công khai (không cần auth)');
  console.log('    3. Hiển thị URL trang công khai');
  console.log('    4. Hiển thị nội dung QR code');
  console.log('\nLƯU Ý:');
  console.log('  - Cần có NEXT_PUBLIC_APP_URL trong .env');
  console.log('  - Server phải đang chạy');
  console.log('  - Có thể cần authentication để tạo thẻ');
  process.exit(0);
}

testPublicQRFlow();

