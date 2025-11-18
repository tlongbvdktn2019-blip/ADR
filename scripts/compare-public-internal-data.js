/**
 * Script để so sánh dữ liệu giữa API public và internal
 * Giúp xác định tại sao dữ liệu hiển thị khác nhau
 */

const CARD_CODE = 'AC-2025-000001'; // Thay bằng mã thẻ thực tế
const CARD_ID = ''; // Thay bằng UUID của thẻ
const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = ''; // Lấy từ browser cookie (next-auth.session-token)

async function compareData() {
  console.log('🔍 Bắt đầu so sánh dữ liệu...\n');
  console.log('════════════════════════════════════════════════════════════\n');

  // 1. Lấy dữ liệu từ PUBLIC API
  console.log('📡 Đang lấy dữ liệu từ PUBLIC API...');
  console.log(`   URL: ${BASE_URL}/api/allergy-cards/public/${CARD_CODE}`);
  
  try {
    const publicResponse = await fetch(`${BASE_URL}/api/allergy-cards/public/${CARD_CODE}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!publicResponse.ok) {
      throw new Error(`HTTP ${publicResponse.status}: ${publicResponse.statusText}`);
    }
    
    const publicData = await publicResponse.json();
    
    console.log('✅ Public API - Thành công!\n');
    console.log('📊 Thống kê Public API:');
    console.log(`   - Card Code: ${publicData.card?.card_code}`);
    console.log(`   - Patient: ${publicData.card?.patient_name}`);
    console.log(`   - Allergies: ${publicData.card?.allergies?.length || 0} items`);
    console.log(`   - Updates: ${publicData.updates?.length || 0} items`);
    console.log(`   - Warning: ${publicData.warning || 'None'}`);
    
    // Chi tiết allergies
    if (publicData.card?.allergies && publicData.card.allergies.length > 0) {
      console.log('\n   🔴 Danh sách dị ứng (Public):');
      publicData.card.allergies.forEach((allergy, idx) => {
        console.log(`      ${idx + 1}. ${allergy.allergen_name} (${allergy.certainty_level}, ${allergy.severity_level || 'N/A'})`);
      });
    }
    
    // Chi tiết updates
    if (publicData.updates && publicData.updates.length > 0) {
      console.log('\n   📋 Lịch sử bổ sung (Public):');
      publicData.updates.forEach((update, idx) => {
        const date = new Date(update.created_at).toLocaleString('vi-VN');
        const allergiesCount = update.allergies_added?.length || 0;
        console.log(`      ${idx + 1}. [${date}] ${update.update_type} - ${update.updated_by_name} (${allergiesCount} dị ứng)`);
      });
    }
    
    console.log('\n════════════════════════════════════════════════════════════\n');
    
    // 2. Lấy dữ liệu từ INTERNAL API
    if (!CARD_ID) {
      console.log('⚠️  Cần cung cấp CARD_ID để test Internal API');
      console.log(`   Card ID có thể lấy từ public response: ${publicData.card?.id}\n`);
      return;
    }
    
    if (!AUTH_TOKEN) {
      console.log('⚠️  Cần cung cấp AUTH_TOKEN để test Internal API');
      console.log('   1. Mở browser DevTools');
      console.log('   2. Vào Application → Cookies');
      console.log('   3. Copy giá trị của next-auth.session-token\n');
      return;
    }
    
    console.log('📡 Đang lấy dữ liệu từ INTERNAL API...');
    console.log(`   URL 1: ${BASE_URL}/api/allergy-cards/${CARD_ID}`);
    console.log(`   URL 2: ${BASE_URL}/api/allergy-cards/${CARD_ID}/updates`);
    
    // 2a. Lấy card data
    const cardResponse = await fetch(`${BASE_URL}/api/allergy-cards/${CARD_ID}`, {
      headers: {
        'Cookie': `next-auth.session-token=${AUTH_TOKEN}`
      }
    });
    
    if (!cardResponse.ok) {
      throw new Error(`HTTP ${cardResponse.status}: ${cardResponse.statusText}`);
    }
    
    const internalCardData = await cardResponse.json();
    console.log('✅ Internal API (Card) - Thành công!');
    
    // 2b. Lấy updates data
    const updatesResponse = await fetch(`${BASE_URL}/api/allergy-cards/${CARD_ID}/updates`, {
      headers: {
        'Cookie': `next-auth.session-token=${AUTH_TOKEN}`
      }
    });
    
    if (!updatesResponse.ok) {
      console.log('❌ Internal API (Updates) - Thất bại!');
      console.log(`   Status: ${updatesResponse.status}`);
      console.log(`   Error: ${updatesResponse.statusText}`);
    }
    
    const internalUpdatesData = await updatesResponse.json();
    console.log('✅ Internal API (Updates) - Thành công!\n');
    
    console.log('📊 Thống kê Internal API:');
    console.log(`   - Card Code: ${internalCardData.card?.card_code}`);
    console.log(`   - Patient: ${internalCardData.card?.patient_name}`);
    console.log(`   - Allergies: ${internalCardData.card?.allergies?.length || 0} items`);
    console.log(`   - Updates: ${internalUpdatesData.updates?.length || 0} items`);
    
    // Chi tiết allergies
    if (internalCardData.card?.allergies && internalCardData.card.allergies.length > 0) {
      console.log('\n   🔴 Danh sách dị ứng (Internal):');
      internalCardData.card.allergies.forEach((allergy, idx) => {
        console.log(`      ${idx + 1}. ${allergy.allergen_name} (${allergy.certainty_level}, ${allergy.severity_level || 'N/A'})`);
      });
    }
    
    // Chi tiết updates
    if (internalUpdatesData.updates && internalUpdatesData.updates.length > 0) {
      console.log('\n   📋 Lịch sử bổ sung (Internal):');
      internalUpdatesData.updates.forEach((update, idx) => {
        const date = new Date(update.created_at).toLocaleString('vi-VN');
        const allergiesCount = update.allergies_added?.length || 0;
        console.log(`      ${idx + 1}. [${date}] ${update.update_type} - ${update.updated_by_name} (${allergiesCount} dị ứng)`);
      });
    }
    
    console.log('\n════════════════════════════════════════════════════════════\n');
    
    // 3. SO SÁNH DỮ LIỆU
    console.log('🔎 SO SÁNH DỮ LIỆU:\n');
    
    // So sánh allergies count
    const publicAllergiesCount = publicData.card?.allergies?.length || 0;
    const internalAllergiesCount = internalCardData.card?.allergies?.length || 0;
    
    if (publicAllergiesCount === internalAllergiesCount) {
      console.log(`✅ Số lượng dị ứng GIỐNG NHAU: ${publicAllergiesCount}`);
    } else {
      console.log(`❌ Số lượng dị ứng KHÁC NHAU:`);
      console.log(`   - Public: ${publicAllergiesCount}`);
      console.log(`   - Internal: ${internalAllergiesCount}`);
      console.log(`   - Chênh lệch: ${Math.abs(publicAllergiesCount - internalAllergiesCount)}`);
    }
    
    // So sánh updates count
    const publicUpdatesCount = publicData.updates?.length || 0;
    const internalUpdatesCount = internalUpdatesData.updates?.length || 0;
    
    if (publicUpdatesCount === internalUpdatesCount) {
      console.log(`✅ Số lượng updates GIỐNG NHAU: ${publicUpdatesCount}`);
    } else {
      console.log(`❌ Số lượng updates KHÁC NHAU:`);
      console.log(`   - Public: ${publicUpdatesCount}`);
      console.log(`   - Internal: ${internalUpdatesCount}`);
      console.log(`   - Chênh lệch: ${Math.abs(publicUpdatesCount - internalUpdatesCount)}`);
    }
    
    // So sánh chi tiết allergies
    if (publicAllergiesCount > 0 && internalAllergiesCount > 0) {
      console.log('\n📋 Chi tiết so sánh dị ứng:');
      const publicAllergens = new Set(publicData.card.allergies.map(a => a.allergen_name));
      const internalAllergens = new Set(internalCardData.card.allergies.map(a => a.allergen_name));
      
      // Allergies chỉ có trong public
      const onlyInPublic = [...publicAllergens].filter(a => !internalAllergens.has(a));
      if (onlyInPublic.length > 0) {
        console.log(`   ⚠️  Chỉ có trong Public (${onlyInPublic.length}):`);
        onlyInPublic.forEach(a => console.log(`      - ${a}`));
      }
      
      // Allergies chỉ có trong internal
      const onlyInInternal = [...internalAllergens].filter(a => !publicAllergens.has(a));
      if (onlyInInternal.length > 0) {
        console.log(`   ⚠️  Chỉ có trong Internal (${onlyInInternal.length}):`);
        onlyInInternal.forEach(a => console.log(`      - ${a}`));
      }
      
      if (onlyInPublic.length === 0 && onlyInInternal.length === 0) {
        console.log('   ✅ Tất cả dị ứng đều khớp nhau!');
      }
    }
    
    // So sánh chi tiết updates
    if (publicUpdatesCount > 0 && internalUpdatesCount > 0) {
      console.log('\n📋 Chi tiết so sánh updates:');
      const publicUpdateIds = new Set(publicData.updates.map(u => u.id));
      const internalUpdateIds = new Set(internalUpdatesData.updates.map(u => u.id));
      
      // Updates chỉ có trong public
      const onlyInPublic = publicData.updates.filter(u => !internalUpdateIds.has(u.id));
      if (onlyInPublic.length > 0) {
        console.log(`   ⚠️  Chỉ có trong Public (${onlyInPublic.length}):`);
        onlyInPublic.forEach(u => {
          const date = new Date(u.created_at).toLocaleString('vi-VN');
          console.log(`      - [${date}] ${u.update_type} by ${u.updated_by_name}`);
        });
      }
      
      // Updates chỉ có trong internal
      const onlyInInternal = internalUpdatesData.updates.filter(u => !publicUpdateIds.has(u.id));
      if (onlyInInternal.length > 0) {
        console.log(`   ⚠️  Chỉ có trong Internal (${onlyInInternal.length}):`);
        onlyInInternal.forEach(u => {
          const date = new Date(u.created_at).toLocaleString('vi-VN');
          console.log(`      - [${date}] ${u.update_type} by ${u.updated_by_name}`);
        });
      }
      
      if (onlyInPublic.length === 0 && onlyInInternal.length === 0) {
        console.log('   ✅ Tất cả updates đều khớp nhau!');
      }
    }
    
    console.log('\n════════════════════════════════════════════════════════════\n');
    
    // 4. KẾT LUẬN & KHUYẾN NGHỊ
    console.log('💡 KẾT LUẬN & KHUYẾN NGHỊ:\n');
    
    if (publicAllergiesCount !== internalAllergiesCount || publicUpdatesCount !== internalUpdatesCount) {
      console.log('❌ DỮ LIỆU KHÔNG KHỚP - Cần kiểm tra:\n');
      
      if (publicAllergiesCount !== internalAllergiesCount) {
        console.log('   1. Kiểm tra view allergy_cards_with_details:');
        console.log('      - Có thể view chưa được refresh');
        console.log('      - Chạy: REFRESH MATERIALIZED VIEW allergy_cards_with_details;');
        console.log('      - Hoặc query trực tiếp từ card_allergies table');
      }
      
      if (publicUpdatesCount !== internalUpdatesCount) {
        console.log('\n   2. Kiểm tra API /api/allergy-cards/[id]/updates:');
        console.log('      - Có thể API này bị fail nhưng không báo lỗi');
        console.log('      - Kiểm tra browser DevTools → Network tab');
        console.log('      - Xem response của API này');
      }
      
      console.log('\n   3. Kiểm tra RLS (Row Level Security):');
      console.log('      - Public API dùng admin client (bypass RLS)');
      console.log('      - Internal API dùng user client (có RLS)');
      console.log('      - Có thể RLS đang block một số records');
      
      console.log('\n   4. Kiểm tra cache:');
      console.log('      - Clear browser cache và thử lại');
      console.log('      - Disable cache trong DevTools');
      
      console.log('\n   5. Giải pháp khuyến nghị:');
      console.log('      - Thống nhất API: Trả về updates trong cùng response với card');
      console.log('      - Xem file PHAN-TICH-KHAC-BIET-TRANG-PUBLIC-NOI-BO.md');
      
    } else {
      console.log('✅ DỮ LIỆU KHỚP NHAU - Hệ thống hoạt động tốt!\n');
      console.log('   - Số lượng allergies giống nhau');
      console.log('   - Số lượng updates giống nhau');
      console.log('   - Không có vấn đề về đồng bộ dữ liệu');
    }
    
  } catch (error) {
    console.error('\n❌ LỖI:', error.message);
    console.error('\n🔧 Khắc phục:');
    console.error('   1. Kiểm tra server đang chạy: http://localhost:3000');
    console.error('   2. Kiểm tra CARD_CODE và CARD_ID đúng');
    console.error('   3. Kiểm tra AUTH_TOKEN còn hiệu lực');
  }
}

// Chạy script
compareData();

