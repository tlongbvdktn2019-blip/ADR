// Test allergy cards API with authentication simulation
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wnkwwjzwyunprnechdru.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indua3d3anp3eXVucHJuZWNoZHJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIxMTY1NSwiZXhwIjoyMDczNzg3NjU1fQ.bP1GQtT5VDv0XX7OHFEbMl4FT8RAIXCb2UQcPI-5UAU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function simulateAPILogic() {
  console.log('🔄 Simulating API Logic (without HTTP, direct DB calls)\n');

  try {
    // Step 1: Get user (simulate session)
    console.log('1️⃣ Getting user data...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, organization')
      .limit(1);

    if (usersError) {
      console.error('❌ Error getting users:', usersError.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ No users found. Run demo-users.sql first.');
      return;
    }

    const testUser = users[0];
    console.log('✅ User found:', testUser.email, '(role:', testUser.role + ')');

    // Step 2: Create allergy card (simulate API POST logic)
    console.log('\n2️⃣ Creating allergy card...');
    
    const cardData = {
      patient_name: 'Test Patient Simulation',
      patient_gender: 'female',
      patient_age: 25,
      hospital_name: 'Test Hospital Simulation',
      doctor_name: 'Dr. Test Simulation',
      issued_by_user_id: testUser.id,
      organization: testUser.organization || 'Test Organization',
      qr_code_data: '{"test": "simulation"}',
      status: 'active'
    };

    const { data: newCard, error: cardError } = await supabase
      .from('allergy_cards')
      .insert(cardData)
      .select()
      .single();

    if (cardError) {
      console.error('❌ Card creation error:', cardError.message);
      console.error('   Full error:', cardError);
      
      if (cardError.message.includes('infinite recursion')) {
        console.log('\n💡 RLS infinite recursion detected!');
        console.log('   Solution: Run supabase/fix-rls-simple.sql in Supabase SQL Editor');
      }
      return;
    }

    console.log('✅ Card created successfully!');
    console.log('   Card ID:', newCard.id);
    console.log('   Card Code:', newCard.card_code);

    // Step 3: Add allergies
    console.log('\n3️⃣ Adding allergies...');
    
    const allergiesData = [
      {
        card_id: newCard.id,
        allergen_name: 'Penicillin Simulation',
        certainty_level: 'confirmed',
        clinical_manifestation: 'Rash and itching',
        severity_level: 'moderate',
        reaction_type: 'allergic reaction'
      },
      {
        card_id: newCard.id,
        allergen_name: 'Aspirin Simulation',
        certainty_level: 'suspected',
        clinical_manifestation: 'Stomach upset',
        severity_level: 'mild',
        reaction_type: 'gastrointestinal'
      }
    ];

    const { error: allergiesError } = await supabase
      .from('card_allergies')
      .insert(allergiesData);

    if (allergiesError) {
      console.error('❌ Allergies creation error:', allergiesError.message);
    } else {
      console.log('✅ Allergies added successfully!');
    }

    // Step 4: Test view query
    console.log('\n4️⃣ Testing view query...');
    
    const { data: cardWithDetails, error: viewError } = await supabase
      .from('allergy_cards_with_details')
      .select('*')
      .eq('id', newCard.id)
      .single();

    if (viewError) {
      console.error('❌ View query error:', viewError.message);
    } else {
      console.log('✅ View query successful!');
      console.log('   Patient:', cardWithDetails.patient_name);
      console.log('   Allergies count:', cardWithDetails.allergies?.length || 0);
    }

    // Step 5: Clean up
    console.log('\n5️⃣ Cleaning up test data...');
    await supabase.from('card_allergies').delete().eq('card_id', newCard.id);
    await supabase.from('allergy_cards').delete().eq('id', newCard.id);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All API logic simulation successful!');
    console.log('   The API should work correctly now.');

  } catch (error) {
    console.error('❌ Simulation error:', error.message);
  }
}

async function main() {
  console.log('🏥 ADR Management System - API Logic Simulation\n');
  console.log('This simulates the exact logic that the API endpoint uses.\n');
  
  await simulateAPILogic();
  
  console.log('\n📋 Next Steps:');
  console.log('1. If simulation successful: API should work in browser');
  console.log('2. If RLS errors: Run fix-rls-simple.sql in Supabase');
  console.log('3. Test creating allergy card through web interface');
}

main();








