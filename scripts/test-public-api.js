/**
 * TEST PUBLIC API - Kiểm tra API public có trả về đầy đủ thông tin không
 * 
 * Cách chạy:
 * node scripts/test-public-api.js AC-2025-123456
 * 
 * Hoặc test trên browser console:
 * await fetch('/api/allergy-cards/public/AC-2025-123456').then(r => r.json())
 */

const cardCode = process.argv[2];

if (!cardCode) {
  console.log('❌ Thiếu mã thẻ!');
  console.log('Cách dùng: node scripts/test-public-api.js AC-2025-123456');
  process.exit(1);
}

const API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const endpoint = `${API_URL}/api/allergy-cards/public/${cardCode}`;

console.log('🔍 Testing Public API...\n');
console.log(`📍 URL: ${endpoint}\n`);

async function testAPI() {
  try {
    console.log('⏳ Đang gọi API...\n');
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    const data = await response.json();

    console.log('📊 HTTP Status:', response.status);
    console.log('═══════════════════════════════════════════\n');

    if (!response.ok) {
      console.log('❌ LỖI:', data.error);
      console.log('💬 Message:', data.message || 'N/A');
      return;
    }

    // Kiểm tra structure
    console.log('✅ API Response OK\n');
    console.log('═══════════════════════════════════════════');
    console.log('📋 CẤU TRÚC DỮ LIỆU:\n');

    // Card info
    console.log('1️⃣ CARD INFO:');
    console.log(`   - ID: ${data.card?.id || '❌ Missing'}`);
    console.log(`   - Card Code: ${data.card?.card_code || '❌ Missing'}`);
    console.log(`   - Patient: ${data.card?.patient_name || '❌ Missing'}`);
    console.log(`   - Status: ${data.card?.status || '❌ Missing'}`);
    console.log('');

    // Allergies
    console.log('2️⃣ ALLERGIES:');
    const allergies = data.card?.allergies || [];
    if (allergies.length === 0) {
      console.log('   ⚠️ Không có dị ứng');
    } else {
      console.log(`   ✅ Có ${allergies.length} dị ứng:`);
      allergies.forEach((a, i) => {
        console.log(`      ${i + 1}. ${a.allergen_name} (${a.severity_level || 'N/A'})`);
      });
    }
    console.log('');

    // Updates - PHẦN QUAN TRỌNG
    console.log('3️⃣ UPDATES (Lịch sử bổ sung): ⭐ QUAN TRỌNG');
    const updates = data.updates || [];
    
    if (!data.updates) {
      console.log('   ❌ KHÔNG CÓ FIELD "updates" - VẤN ĐỀ Ở API!');
      console.log('   → Kiểm tra API có query view allergy_card_updates_with_details không');
    } else if (updates.length === 0) {
      console.log('   ⚠️ Array rỗng - Chưa có ai bổ sung thông tin');
      console.log('   → Có thể bình thường nếu thẻ mới tạo');
    } else {
      console.log(`   ✅ Có ${updates.length} lần bổ sung:\n`);
      
      updates.forEach((update, i) => {
        console.log(`   📝 Lần ${i + 1}:`);
        console.log(`      - ID: ${update.id || '❌'}`);
        console.log(`      - Người bổ sung: ${update.updated_by_name || '❌'}`);
        console.log(`      - Cơ sở: ${update.facility_name || '❌'}`);
        console.log(`      - Loại: ${update.update_type || '❌'}`);
        console.log(`      - Thời gian: ${update.created_at || '❌'}`);
        
        // Allergies added
        const allergiesAdded = update.allergies_added || [];
        if (Array.isArray(allergiesAdded) && allergiesAdded.length > 0) {
          console.log(`      - Dị ứng thêm vào: ${allergiesAdded.length} loại`);
          allergiesAdded.forEach((allergy, j) => {
            console.log(`         ${j + 1}. ${allergy.allergen_name} (${allergy.severity_level || 'N/A'})`);
          });
        } else {
          console.log(`      - Dị ứng thêm vào: 0`);
        }
        console.log('');
      });
    }

    console.log('═══════════════════════════════════════════');
    console.log('🎯 ĐÁNH GIÁ:\n');

    // Evaluation
    let issues = [];
    let successes = [];

    if (data.success) {
      successes.push('✅ API response có success = true');
    } else {
      issues.push('❌ API response không có success = true');
    }

    if (data.card) {
      successes.push('✅ Card data có tồn tại');
    } else {
      issues.push('❌ Card data bị thiếu');
    }

    if (data.card?.allergies) {
      successes.push(`✅ Allergies field tồn tại (${allergies.length} items)`);
    } else {
      issues.push('❌ Allergies field bị thiếu');
    }

    if (data.updates !== undefined) {
      successes.push(`✅ Updates field tồn tại (${updates.length} items)`);
    } else {
      issues.push('❌ Updates field BỊ THIẾU - ĐÂY LÀ VẤN ĐỀ CHÍNH!');
    }

    if (data.total_updates !== undefined) {
      successes.push(`✅ Total updates: ${data.total_updates}`);
    } else {
      issues.push('⚠️ Total updates field thiếu');
    }

    successes.forEach(s => console.log(s));
    issues.forEach(i => console.log(i));

    console.log('');
    console.log('═══════════════════════════════════════════');
    
    if (issues.some(i => i.includes('Updates field BỊ THIẾU'))) {
      console.log('🚨 PHÁT HIỆN VẤN ĐỀ CHÍNH:\n');
      console.log('Field "updates" không có trong API response!');
      console.log('');
      console.log('🔧 CÁCH FIX:');
      console.log('1. Mở Supabase SQL Editor');
      console.log('2. Chạy: supabase/QUICK-CHECK-PUBLIC-ACCESS.sql');
      console.log('3. Nếu có ❌, chạy: supabase/FIX-PUBLIC-ACCESS-VIEW.sql');
      console.log('4. Test lại script này');
      console.log('');
      console.log('📖 Đọc hướng dẫn: docs/FIX-HIEN-THI-LICH-SU-BO-SUNG.md');
    } else if (updates.length === 0) {
      console.log('ℹ️ API hoạt động tốt, nhưng chưa có dữ liệu updates');
      console.log('');
      console.log('Có thể do:');
      console.log('- Thẻ mới tạo, chưa có ai bổ sung');
      console.log('- Database chưa có dữ liệu test');
      console.log('');
      console.log('💡 TẠO DỮ LIỆU TEST:');
      console.log('- Vào trang thẻ dị ứng');
      console.log('- Nhấn "Bổ sung thông tin"');
      console.log('- Điền form và submit');
      console.log('- Chạy lại script này');
    } else {
      console.log('✅ TẤT CẢ ĐỀU OK!');
      console.log('');
      console.log('API trả về đầy đủ thông tin:');
      console.log(`- Card info: ✅`);
      console.log(`- Allergies: ✅ (${allergies.length})`);
      console.log(`- Updates: ✅ (${updates.length})`);
      console.log('');
      console.log('💡 Nếu trang web vẫn không hiển thị:');
      console.log('1. Xóa cache trình duyệt');
      console.log('2. Hard refresh (Ctrl+Shift+R)');
      console.log('3. Kiểm tra Console log (F12)');
    }

  } catch (error) {
    console.log('❌ LỖI KHI GỌI API:\n');
    console.log(error.message);
    console.log('');
    console.log('Kiểm tra:');
    console.log('- Server có đang chạy không?');
    console.log('- URL có đúng không?');
    console.log('- Network connection?');
  }
}

// Run test
testAPI();

