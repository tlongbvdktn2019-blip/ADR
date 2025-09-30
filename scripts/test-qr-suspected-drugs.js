/**
 * Test Script for QR Scan with Suspected Drugs Feature
 * Tests the complete flow of creating allergy card from ADR report
 * and verifying suspected drugs appear in QR scan
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  // Replace with actual login credentials for testing
  email: 'test@example.com',
  password: 'testpassword',
  
  // Test ADR Report data
  adrReport: {
    patient_name: 'Nguyễn Test Thuốc',
    patient_birth_date: '1990-01-01',
    patient_age: 34,
    patient_gender: 'male',
    patient_weight: 70,
    adr_occurrence_date: new Date().toISOString().split('T')[0],
    adr_description: 'Phát ban và ngứa sau khi dùng Penicillin',
    severity_level: 'not_serious',
    outcome_after_treatment: 'recovered_without_sequelae',
    causality_assessment: 'probable',
    assessment_scale: 'who',
    reporter_name: 'Bác sĩ Test',
    reporter_profession: 'Bác sĩ',
    report_type: 'initial',
    report_date: new Date().toISOString().split('T')[0],
    organization: 'Bệnh viện Test'
  },
  
  // Test suspected drug
  suspectedDrug: {
    drug_name: 'Penicillin',
    commercial_name: 'Amoxicillin 500mg',
    dosage_form: 'Viên nén',
    indication: 'Nhiễm khuẩn đường hô hấp',
    reaction_improved_after_stopping: 'yes',
    route_of_administration: 'Uống',
    dosage_and_frequency: '500mg x 3 lần/ngày'
  },
  
  // Test allergy card data
  allergyCard: {
    patient_name: 'Nguyễn Test Thuốc',
    patient_gender: 'male',
    patient_age: 34,
    hospital_name: 'Bệnh viện Test',
    doctor_name: 'Bác sĩ Test Dị Ứng',
    doctor_phone: '0123456789',
    allergies: [
      {
        allergen_name: 'Penicillin',
        certainty_level: 'confirmed',
        severity_level: 'severe',
        clinical_manifestation: 'Phát ban, ngứa, khó thở'
      }
    ]
  }
};

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 Starting QR Suspected Drugs Feature Tests...\n');
  
  let authToken;
  let reportId;
  let cardId;
  let cardCode;
  
  try {
    // Test 1: Login
    console.log('📝 Test 1: Authentication');
    authToken = await testLogin();
    console.log('✅ Login successful\n');
    
    // Test 2: Create ADR Report with Suspected Drug
    console.log('📝 Test 2: Create ADR Report with Suspected Drug');
    reportId = await testCreateADRReport(authToken);
    console.log(`✅ ADR Report created: ${reportId}\n`);
    
    // Test 3: Create Allergy Card from Report
    console.log('📝 Test 3: Create Allergy Card from ADR Report');
    const cardResult = await testCreateAllergyCard(authToken, reportId);
    cardId = cardResult.cardId;
    cardCode = cardResult.cardCode;
    console.log(`✅ Allergy Card created: ${cardCode}\n`);
    
    // Test 4: Verify QR Code contains Suspected Drugs
    console.log('📝 Test 4: Verify QR Code Data');
    const qrData = await testVerifyQRCode(cardCode);
    console.log('✅ QR Code verified\n');
    
    // Test 5: Validate Suspected Drugs in QR Data
    console.log('📝 Test 5: Validate Suspected Drugs Data');
    validateSuspectedDrugs(qrData);
    console.log('✅ Suspected Drugs data is correct\n');
    
    // Test 6: Get Card Details
    console.log('📝 Test 6: Get Card Details via API');
    await testGetCardDetails(authToken, cardId);
    console.log('✅ Card details retrieved successfully\n');
    
    console.log('🎉 All tests passed!\n');
    console.log('📋 Summary:');
    console.log(`   - Report ID: ${reportId}`);
    console.log(`   - Card ID: ${cardId}`);
    console.log(`   - Card Code: ${cardCode}`);
    console.log(`   - Scan URL: ${BASE_URL}/allergy-cards/scan`);
    console.log(`\n💡 You can now scan the QR code to see the suspected drugs!`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

/**
 * Test login
 */
async function testLogin() {
  const response = await fetch(`${BASE_URL}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_CONFIG.email,
      password: TEST_CONFIG.password
    })
  });
  
  if (!response.ok) {
    throw new Error('Login failed - Update TEST_CONFIG with valid credentials');
  }
  
  const data = await response.json();
  return data.token || data.session?.access_token;
}

/**
 * Test creating ADR report with suspected drug
 */
async function testCreateADRReport(authToken) {
  const reportData = {
    ...TEST_CONFIG.adrReport,
    suspected_drugs: [TEST_CONFIG.suspectedDrug]
  };
  
  const response = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(reportData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create ADR report: ${JSON.stringify(error)}`);
  }
  
  const data = await response.json();
  console.log(`   Report Code: ${data.report?.report_code}`);
  console.log(`   Suspected Drugs: ${data.report?.suspected_drugs?.length || 0}`);
  
  return data.report.id;
}

/**
 * Test creating allergy card from report
 */
async function testCreateAllergyCard(authToken, reportId) {
  const cardData = {
    ...TEST_CONFIG.allergyCard,
    report_id: reportId
  };
  
  const response = await fetch(`${BASE_URL}/api/allergy-cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(cardData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create allergy card: ${JSON.stringify(error)}`);
  }
  
  const data = await response.json();
  console.log(`   Card Code: ${data.card.card_code}`);
  
  // Parse QR data to check suspected drugs
  const qrData = JSON.parse(data.card.qr_code_data);
  console.log(`   Allergies in QR: ${qrData.allergies?.length || 0}`);
  console.log(`   Suspected Drugs in QR: ${qrData.suspectedDrugs?.length || 0}`);
  
  return {
    cardId: data.card.id,
    cardCode: data.card.card_code
  };
}

/**
 * Test verifying QR code
 */
async function testVerifyQRCode(cardCode) {
  const response = await fetch(`${BASE_URL}/api/allergy-cards/verify/${cardCode}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to verify QR code: ${JSON.stringify(error)}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(`QR verification failed: ${data.error}`);
  }
  
  console.log(`   Patient: ${data.data.patientName}`);
  console.log(`   Allergies: ${data.data.allergies?.length || 0}`);
  console.log(`   Suspected Drugs: ${data.data.suspectedDrugs?.length || 0}`);
  
  return data.data;
}

/**
 * Validate suspected drugs data
 */
function validateSuspectedDrugs(qrData) {
  if (!qrData.suspectedDrugs || qrData.suspectedDrugs.length === 0) {
    throw new Error('No suspected drugs found in QR data!');
  }
  
  const drug = qrData.suspectedDrugs[0];
  
  console.log('   Validating suspected drug data:');
  console.log(`   - Drug Name: ${drug.drugName}`);
  console.log(`   - Commercial Name: ${drug.commercialName}`);
  console.log(`   - Dosage Form: ${drug.dosageForm}`);
  console.log(`   - Indication: ${drug.indication}`);
  console.log(`   - Reaction After Stopping: ${drug.reactionImprovedAfterStopping}`);
  
  // Validate expected values
  if (drug.drugName !== TEST_CONFIG.suspectedDrug.drug_name) {
    throw new Error(`Drug name mismatch: expected ${TEST_CONFIG.suspectedDrug.drug_name}, got ${drug.drugName}`);
  }
  
  if (drug.commercialName !== TEST_CONFIG.suspectedDrug.commercial_name) {
    throw new Error(`Commercial name mismatch`);
  }
  
  console.log('   ✓ All fields validated');
}

/**
 * Test getting card details
 */
async function testGetCardDetails(authToken, cardId) {
  const response = await fetch(`${BASE_URL}/api/allergy-cards/${cardId}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get card details: ${JSON.stringify(error)}`);
  }
  
  const data = await response.json();
  
  console.log(`   Card Status: ${data.card.status}`);
  console.log(`   Report Linked: ${data.card.report_id ? 'Yes' : 'No'}`);
  console.log(`   Suspected Drugs: ${data.card.suspected_drugs?.length || 0}`);
  
  if (data.card.suspected_drugs && data.card.suspected_drugs.length > 0) {
    console.log('   ✓ Suspected drugs available in card details');
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
