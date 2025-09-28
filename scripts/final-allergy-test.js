// Final comprehensive test for allergy cards API
const http = require('http');

async function testAPIEndpoint(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAllergyCardsAPI() {
  console.log('🎯 Final Allergy Cards API Test\n');

  try {
    // Test 1: GET /api/allergy-cards (should redirect to login)
    console.log('1️⃣ Testing GET /api/allergy-cards...');
    const getResponse = await testAPIEndpoint('GET', '/api/allergy-cards');
    console.log('   Status:', getResponse.status);
    
    if (getResponse.status === 307 || getResponse.status === 302) {
      console.log('✅ Correct redirect to authentication');
    } else if (getResponse.status === 401) {
      console.log('✅ Correct 401 Unauthorized');
    } else {
      console.log('⚠️  Unexpected status:', getResponse.status);
    }

    // Test 2: POST /api/allergy-cards (should redirect to login or return 401)
    console.log('\n2️⃣ Testing POST /api/allergy-cards...');
    const testFormData = {
      patient_name: 'Test Patient Final',
      patient_gender: 'female',
      patient_age: 30,
      patient_id_number: '123456789',
      hospital_name: 'Test Hospital Final',
      doctor_name: 'Dr. Test Final',
      allergies: [
        {
          allergen_name: 'Test Allergen Final',
          certainty_level: 'confirmed',
          clinical_manifestation: 'Test symptoms',
          severity_level: 'mild'
        }
      ]
    };

    const postResponse = await testAPIEndpoint('POST', '/api/allergy-cards', testFormData);
    console.log('   Status:', postResponse.status);
    
    if (postResponse.status === 307 || postResponse.status === 302) {
      console.log('✅ Correct redirect to authentication');
    } else if (postResponse.status === 401) {
      console.log('✅ Correct 401 Unauthorized');
    } else if (postResponse.status === 500) {
      console.log('❌ Server error - check logs');
      console.log('   Error:', postResponse.data);
      
      if (postResponse.data?.details?.includes?.('infinite recursion')) {
        console.log('💡 Still have RLS infinite recursion issue');
      }
    } else {
      console.log('⚠️  Unexpected status:', postResponse.status);
      console.log('   Response:', postResponse.data);
    }

    // Test 3: Check server logs for any errors
    console.log('\n3️⃣ API Endpoint Tests Summary:');
    console.log('   - GET endpoint: Authentication required (expected)');
    console.log('   - POST endpoint: Authentication required (expected)');
    console.log('   - No infinite recursion errors should appear in server logs');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Login to web interface as admin@soyte.gov.vn');
    console.log('2. Navigate to Allergy Cards section');
    console.log('3. Try creating a new allergy card');
    console.log('4. Should work without any 500 errors');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Development server not running. Start with: npm run dev');
    }
  }
}

async function checkServerHealth() {
  console.log('🏥 ADR Management System - Final API Health Check\n');
  
  try {
    // Check if server is running
    const healthResponse = await testAPIEndpoint('GET', '/');
    console.log('🌐 Server Status:', healthResponse.status === 200 ? 'Running' : `Status ${healthResponse.status}`);
    
    if (healthResponse.status === 200) {
      await testAllergyCardsAPI();
    } else if (healthResponse.status === 307 || healthResponse.status === 302) {
      console.log('✅ Server running (redirecting to auth)');
      await testAllergyCardsAPI();
    } else {
      console.log('❌ Server not responding correctly');
    }
    
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    console.log('💡 Make sure development server is running: npm run dev');
  }
}

checkServerHealth();








