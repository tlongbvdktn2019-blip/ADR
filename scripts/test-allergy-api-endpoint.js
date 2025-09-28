// Test allergy cards API endpoint directly
const https = require('https');
const http = require('http');

async function testAPI() {
  console.log('🧪 Testing Allergy Cards API Endpoint\n');

  // Test data
  const testData = {
    patient_name: 'Test Patient API',
    patient_gender: 'male',
    patient_age: 30,
    hospital_name: 'Test Hospital API',
    doctor_name: 'Dr. Test API',
    allergies: [
      {
        allergen_name: 'Test Allergen API',
        certainty_level: 'confirmed',
        clinical_manifestation: 'Test symptoms',
        severity_level: 'mild',
        reaction_type: 'skin reaction'
      }
    ]
  };

  const postData = JSON.stringify(testData);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/allergy-cards',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    console.log('📡 Making API request...');
    
    const req = http.request(options, (res) => {
      console.log(`📊 Status Code: ${res.statusCode}`);
      console.log(`📋 Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('\n📄 Response Body:');
          console.log(JSON.stringify(response, null, 2));
          
          if (res.statusCode === 201) {
            console.log('\n✅ API Test Successful!');
          } else if (res.statusCode === 401) {
            console.log('\n🔐 Authentication Required (expected without login)');
          } else {
            console.log('\n❌ API Test Failed');
          }
          
          resolve(response);
        } catch (error) {
          console.log('\n📄 Raw Response:');
          console.log(data);
          resolve({ error: 'Invalid JSON response' });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        console.log('💡 Make sure development server is running: npm run dev');
      }
      
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testGET() {
  console.log('\n🔍 Testing GET /api/allergy-cards\n');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/allergy-cards',
    method: 'GET'
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`📊 GET Status Code: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('\n📄 GET Response:');
          console.log(JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.log('\n📄 Raw GET Response:');
          console.log(data);
          resolve({ error: 'Invalid JSON response' });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ GET Request Error:', error.message);
      reject(error);
    });

    req.end();
  });
}

async function main() {
  try {
    console.log('🏥 ADR Management System - API Endpoint Test\n');
    
    // Test GET first (should work without auth for basic endpoint test)
    await testGET();
    
    // Test POST (will require auth but we can see the error type)
    await testAPI();
    
    console.log('\n📝 Summary:');
    console.log('- If you see "infinite recursion" error, RLS policies need fixing');
    console.log('- If you see "Unauthorized", authentication is working but user needs to login');
    console.log('- If you see successful response, API is working correctly');
    console.log('\n💡 To test with authentication, use the web interface after login');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

main();








