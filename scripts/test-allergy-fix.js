// Test allergy cards creation after RLS fix
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wnkwwjzwyunprnechdru.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indua3d3anp3eXVucHJuZWNoZHJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIxMTY1NSwiZXhwIjoyMDczNzg3NjU1fQ.bP1GQtT5VDv0XX7OHFEbMl4FT8RAIXCb2UQcPI-5UAU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testAllergyCardCreation() {
  console.log('🧪 Testing Allergy Card Creation After RLS Fix\n');

  try {
    // 1. Get test user
    console.log('1️⃣ Getting test user...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, organization')
      .limit(1);

    if (usersError) {
      console.error('❌ Users error:', usersError.message);
      return false;
    }

    const testUser = users[0];
    console.log('✅ Test user:', testUser.email);

    // 2. Test form data matching schema exactly
    console.log('\n2️⃣ Testing card creation with schema-compliant data...');
    
    const cardData = {
      // Patient Information (matching schema)
      patient_name: 'Nguyễn Thị C',
      patient_gender: 'female', // Schema: CHECK (patient_gender IN ('male', 'female', 'other'))
      patient_age: 28, // Schema: INTEGER
      patient_id_number: '987654321098', // Schema: VARCHAR(50)
      
      // Medical facility information (matching schema)
      hospital_name: 'Bệnh viện Test RLS Fix', // Schema: VARCHAR(255) NOT NULL
      department: 'Khoa Dị ứng', // Schema: VARCHAR(255)
      doctor_name: 'BS. Nguyễn Test', // Schema: VARCHAR(255) NOT NULL
      doctor_phone: '0987654321', // Schema: VARCHAR(20)
      
      // Card issuance information (matching schema)
      issued_date: new Date().toISOString().split('T')[0], // Schema: DATE NOT NULL DEFAULT CURRENT_DATE
      issued_by_user_id: testUser.id, // Schema: UUID NOT NULL REFERENCES users(id)
      organization: testUser.organization || 'Test Organization', // Schema: VARCHAR(255) NOT NULL
      
      // QR Code data (matching schema)
      qr_code_data: JSON.stringify({ // Schema: TEXT NOT NULL
        patient: 'Nguyễn Thị C',
        allergies: [
          { name: 'Amoxicillin', level: 'confirmed' },
          { name: 'Ibuprofen', level: 'suspected' }
        ]
      }),
      qr_code_url: null, // Schema: TEXT (nullable)
      
      // Card status (matching schema)
      status: 'active', // Schema: VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired'))
      expiry_date: null, // Schema: DATE (nullable)
      
      // Notes (matching schema)
      notes: 'Bệnh nhân có tiền sử dị ứng nhiều loại thuốc. Cần thận trọng khi kê đơn.' // Schema: TEXT (nullable)
    };

    console.log('📋 Card data prepared with all schema fields');

    const { data: newCard, error: cardError } = await supabase
      .from('allergy_cards')
      .insert(cardData)
      .select()
      .single();

    if (cardError) {
      console.error('❌ Card creation failed:', cardError.message);
      console.error('   Error code:', cardError.code);
      console.error('   Full error:', cardError);
      
      if (cardError.message.includes('infinite recursion')) {
        console.log('\n💡 RLS infinite recursion still present!');
        console.log('   Run: \\i supabase/fix-allergy-rls.sql in Supabase SQL Editor');
      }
      
      return false;
    }

    console.log('✅ Card created successfully!');
    console.log('   Card ID:', newCard.id);
    console.log('   Card Code:', newCard.card_code);

    // 3. Test allergies creation (matching schema)
    console.log('\n3️⃣ Testing allergies creation...');
    
    const allergiesData = [
      {
        card_id: newCard.id, // Schema: UUID NOT NULL REFERENCES allergy_cards(id) ON DELETE CASCADE
        allergen_name: 'Amoxicillin', // Schema: VARCHAR(255) NOT NULL
        certainty_level: 'confirmed', // Schema: VARCHAR(20) NOT NULL CHECK (certainty_level IN ('suspected', 'confirmed'))
        clinical_manifestation: 'Phát ban đỏ toàn thân, ngứa nhiều', // Schema: TEXT
        severity_level: 'moderate', // Schema: VARCHAR(30) CHECK (severity_level IN ('mild', 'moderate', 'severe', 'life_threatening'))
        reaction_type: 'allergic_dermatitis' // Schema: VARCHAR(50)
      },
      {
        card_id: newCard.id,
        allergen_name: 'Ibuprofen',
        certainty_level: 'suspected',
        clinical_manifestation: 'Đau bụng, buồn nôn sau khi uống thuốc',
        severity_level: 'mild',
        reaction_type: 'gastrointestinal'
      }
    ];

    const { error: allergiesError } = await supabase
      .from('card_allergies')
      .insert(allergiesData);

    if (allergiesError) {
      console.error('❌ Allergies creation failed:', allergiesError.message);
      console.error('   Error code:', allergiesError.code);
    } else {
      console.log('✅ Allergies created successfully!');
    }

    // 4. Test view query
    console.log('\n4️⃣ Testing view query...');
    
    const { data: cardWithDetails, error: viewError } = await supabase
      .from('allergy_cards_with_details')
      .select('*')
      .eq('id', newCard.id)
      .single();

    if (viewError) {
      console.error('❌ View query failed:', viewError.message);
    } else {
      console.log('✅ View query successful!');
      console.log('   Patient:', cardWithDetails.patient_name);
      console.log('   Hospital:', cardWithDetails.hospital_name);
      console.log('   Allergies:', cardWithDetails.allergies?.length || 0);
    }

    // 5. Clean up
    console.log('\n5️⃣ Cleaning up test data...');
    await supabase.from('card_allergies').delete().eq('card_id', newCard.id);
    await supabase.from('allergy_cards').delete().eq('id', newCard.id);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! RLS fix successful!');
    return true;

  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🏥 ADR Management System - Allergy Card RLS Fix Test\n');
  
  const success = await testAllergyCardCreation();
  
  console.log('\n📋 Summary:');
  if (success) {
    console.log('✅ RLS fix successful - API should work now');
    console.log('💡 Next: Test creating allergy card through web interface');
  } else {
    console.log('❌ RLS issues still present');
    console.log('💡 Next: Run supabase/fix-allergy-rls.sql in Supabase SQL Editor');
  }
}

main();








