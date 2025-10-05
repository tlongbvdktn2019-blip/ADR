// Test OpenAI API key
const apiKey = process.argv[2];

if (!apiKey) {
  console.error('❌ Usage: node test-openai-key.js YOUR_OPENAI_KEY');
  process.exit(1);
}

async function testOpenAIKey(key) {
  console.log('🔍 Testing OpenAI API key...\n');
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say hello in Vietnamese' }],
        max_tokens: 50
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Lỗi:', error);
      
      if (response.status === 401) {
        console.log('\n⚠️ API key không hợp lệ. Vui lòng:');
        console.log('1. Kiểm tra API key có đúng không');
        console.log('2. Tạo API key mới tại: https://platform.openai.com/api-keys');
      } else if (response.status === 429) {
        console.log('\n⚠️ Quota exceeded hoặc rate limit');
      }
      return;
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    const tokensUsed = result.usage?.total_tokens;

    console.log(`✅ Response: ${content}`);
    console.log(`📊 Tokens used: ${tokensUsed}`);
    console.log(`💰 Cost: ~$${(tokensUsed / 1000 * 0.002).toFixed(6)}`);
    console.log('\n🎉 API KEY HOẠT ĐỘNG TỐT!');
    console.log('✅ Bạn có thể sử dụng key này cho ChatGPT trong hệ thống.');
    
  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
  }
}

testOpenAIKey(apiKey);



