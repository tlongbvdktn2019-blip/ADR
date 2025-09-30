// =====================================================
// DEBUG QR SCAN - Kiểm tra vấn đề quét QR
// =====================================================

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function debugQRScan() {
  console.log('🔍 DEBUG QR SCAN - Kiểm tra hệ thống quét QR\n');
  
  // Test 1: Kiểm tra thẻ trong database
  console.log('📋 Test 1: Kiểm tra danh sách thẻ dị ứng...');
  try {
    const response = await fetch(`${BASE_URL}/api/allergy-cards`);
    const result = await response.json();
    
    if (result.success && result.cards && result.cards.length > 0) {
      console.log(`✅ Tìm thấy ${result.cards.length} thẻ trong hệ thống\n`);
      
      // Hiển thị 3 thẻ đầu tiên
      const cardsToShow = result.cards.slice(0, 3);
      cardsToShow.forEach((card, index) => {
        console.log(`Thẻ ${index + 1}:`);
        console.log(`  - Mã thẻ: ${card.card_code}`);
        console.log(`  - Bệnh nhân: ${card.patient_name}`);
        console.log(`  - Trạng thái: ${card.status}`);
        console.log(`  - Ngày tạo: ${card.issued_date}`);
        console.log('');
      });
      
      // Test verify với thẻ đầu tiên
      const firstCard = result.cards[0];
      console.log(`\n🔬 Test 2: Verify thẻ ${firstCard.card_code}...`);
      
      const verifyResponse = await fetch(`${BASE_URL}/api/allergy-cards/verify/${firstCard.card_code}`);
      const verifyResult = await verifyResponse.json();
      
      if (verifyResult.success) {
        console.log('✅ Verify thành công!');
        console.log(`  - Bệnh nhân: ${verifyResult.data.patientName}`);
        console.log(`  - Số dị ứng: ${verifyResult.data.allergies.length}`);
        console.log(`  - Emergency text: ${verifyResult.emergencyText?.substring(0, 50)}...`);
      } else {
        console.log('❌ Verify thất bại!');
        console.log(`  - Lỗi: ${verifyResult.error}`);
      }
      
      // Test 3: Kiểm tra POST verify
      console.log(`\n🔬 Test 3: POST verify với QR data...`);
      
      const qrData = JSON.stringify({
        cardCode: firstCard.card_code,
        patientName: firstCard.patient_name,
        patientAge: firstCard.patient_age || 0,
        patientGender: firstCard.patient_gender || 'unknown',
        allergies: []
      });
      
      const postResponse = await fetch(`${BASE_URL}/api/allergy-cards/verify/${firstCard.card_code}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData })
      });
      
      const postResult = await postResponse.json();
      
      if (postResult.success) {
        console.log('✅ POST verify thành công!');
      } else {
        console.log('❌ POST verify thất bại!');
        console.log(`  - Lỗi: ${postResult.error}`);
      }
      
    } else {
      console.log('❌ Không tìm thấy thẻ nào trong hệ thống!');
      console.log('💡 Giải pháp: Tạo thẻ dị ứng mới qua giao diện');
    }
    
  } catch (error) {
    console.error('❌ Lỗi khi test:', error.message);
    console.log('\n💡 Kiểm tra:');
    console.log('  1. Server đã chạy chưa? (npm run dev)');
    console.log('  2. Database có kết nối không?');
    console.log('  3. Table allergy_cards có dữ liệu không?');
  }
  
  console.log('\n' + '='.repeat(60));
}

// Chạy debug
debugQRScan().catch(console.error);
