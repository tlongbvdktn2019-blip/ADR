// Script để test Gemini API key
// Chạy: node test-gemini-key.js YOUR_API_KEY

const apiKey = process.argv[2];

if (!apiKey) {
  console.error('❌ Vui lòng cung cấp API key: node test-gemini-key.js YOUR_API_KEY');
  process.exit(1);
}

async function testGeminiKey(key) {
  console.log('🔍 Testing Gemini API key...\n');
  
  try {
    // Test 1: List available models
    console.log('📋 Test 1: Liệt kê models...');
    const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    
    if (!listResponse.ok) {
      const error = await listResponse.json();
      console.error('❌ Lỗi khi list models:', error);
      console.log('\n⚠️ API key có vấn đề. Vui lòng:');
      console.log('1. Kiểm tra API key đã enable Generative Language API chưa');
      console.log('2. Tạo API key mới từ https://aistudio.google.com/app/apikey');
      return;
    }
    
    const models = await listResponse.json();
    const generateModels = models.models?.filter(m => 
      m.supportedGenerationMethods?.includes('generateContent')
    ) || [];
    
    console.log(`✅ Tìm thấy ${generateModels.length} models khả dụng:`);
    generateModels.slice(0, 5).forEach(m => {
      console.log(`   • ${m.name.replace('models/', '')}`);
    });
    
    // Test 2: Generate content
    console.log('\n💬 Test 2: Generate content...');
    const testModel = generateModels[0]?.name.replace('models/', '') || 'gemini-1.5-flash';
    
    const generateResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say hello in Vietnamese' }] }]
        })
      }
    );
    
    if (!generateResponse.ok) {
      const error = await generateResponse.json();
      console.error('❌ Lỗi khi generate:', error);
      
      if (generateResponse.status === 429) {
        console.log('\n⚠️ Rate limit exceeded. Quota info:');
        console.log('• Free tier: 60 requests/minute, 1500/day');
        console.log('• Vui lòng chờ và thử lại');
      }
      return;
    }
    
    const result = await generateResponse.json();
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    console.log(`✅ Response: ${content}`);
    
    console.log('\n🎉 API KEY HOẠT ĐỘNG TỐT!');
    console.log('✅ Bạn có thể sử dụng API key này trong hệ thống.');
    
  } catch (error) {
    console.error('\n❌ Lỗi khi test:', error.message);
    console.log('\n💡 Gợi ý:');
    console.log('• Kiểm tra kết nối internet');
    console.log('• Đảm bảo API key không có khoảng trắng thừa');
    console.log('• Tạo API key mới từ https://aistudio.google.com/app/apikey');
  }
}

testGeminiKey(apiKey);



