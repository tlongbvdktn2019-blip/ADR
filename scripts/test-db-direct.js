// Test database connection directly with service role key
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wnkwwjzwyunprnechdru.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indua3d3anp3eXVucHJuZWNoZHJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIxMTY1NSwiZXhwIjoyMDczNzg3NjU1fQ.bP1GQtT5VDv0XX7OHFEbMl4FT8RAIXCb2UQcPI-5UAU';

// Create admin client that bypasses RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testDirectDB() {
  console.log('🔧 Testing Database with Service Role Key (bypasses RLS)\n');

  try {
    // Test users table directly
    console.log('1️⃣ Testing users table...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(3);
    
    if (usersError) {
      console.error('❌ Users table error:', usersError.message);
    } else {
      console.log('✅ Users table accessible');
      console.log('   Users found:', usersData?.length || 0);
      if (usersData && usersData.length > 0) {
        console.log('   Sample user:', usersData[0].email, '(role:', usersData[0].role + ')');
      }
    }

    // Test allergy_cards table
    console.log('\n2️⃣ Testing allergy_cards table...');
    const { data: cardsData, error: cardsError } = await supabase
      .from('allergy_cards')
      .select('id, card_code, patient_name')
      .limit(3);
    
    if (cardsError) {
      console.error('❌ Allergy cards error:', cardsError.message);
      if (cardsError.message.includes('relation "allergy_cards" does not exist')) {
        console.log('💡 Need to run: \\i supabase/allergy-cards-schema.sql');
      }
    } else {
      console.log('✅ Allergy cards table exists');
      console.log('   Cards found:', cardsData?.length || 0);
    }

    // Test card_allergies table
    console.log('\n3️⃣ Testing card_allergies table...');
    const { data: allergiesData, error: allergiesError } = await supabase
      .from('card_allergies')
      .select('id, allergen_name')
      .limit(3);
    
    if (allergiesError) {
      console.error('❌ Card allergies error:', allergiesError.message);
    } else {
      console.log('✅ Card allergies table exists');
      console.log('   Allergies found:', allergiesData?.length || 0);
    }

    // Test view
    console.log('\n4️⃣ Testing allergy_cards_with_details view...');
    const { data: viewData, error: viewError } = await supabase
      .from('allergy_cards_with_details')
      .select('id, card_code, patient_name')
      .limit(1);
    
    if (viewError) {
      console.error('❌ View error:', viewError.message);
    } else {
      console.log('✅ View exists and working');
    }

    // Test creating a card directly
    console.log('\n5️⃣ Testing card creation...');
    
    // Get first user
    const testUser = usersData && usersData.length > 0 ? usersData[0] : null;
    if (!testUser) {
      console.log('❌ No users found for testing');
      return;
    }

    const testCard = {
      patient_name: 'Test Patient Direct',
      patient_gender: 'male',
      patient_age: 25,
      hospital_name: 'Test Hospital Direct',
      doctor_name: 'Dr. Test Direct',
      issued_by_user_id: testUser.id,
      organization: 'Test Org',
      qr_code_data: '{"test": "data"}',
      status: 'active'
    };

    const { data: newCard, error: createError } = await supabase
      .from('allergy_cards')
      .insert(testCard)
      .select()
      .single();

    if (createError) {
      console.error('❌ Card creation error:', createError.message);
      console.error('   Full error:', createError);
    } else {
      console.log('✅ Card created successfully!');
      console.log('   New card ID:', newCard.id);
      console.log('   Card code:', newCard.card_code);

      // Test allergy creation
      const testAllergy = {
        card_id: newCard.id,
        allergen_name: 'Test Allergen Direct',
        certainty_level: 'confirmed',
        clinical_manifestation: 'Test symptoms',
        severity_level: 'mild'
      };

      const { error: allergyError } = await supabase
        .from('card_allergies')
        .insert(testAllergy);

      if (allergyError) {
        console.error('❌ Allergy creation error:', allergyError.message);
      } else {
        console.log('✅ Allergy added successfully!');
      }

      // Clean up
      console.log('\n🧹 Cleaning up test data...');
      await supabase.from('card_allergies').delete().eq('card_id', newCard.id);
      await supabase.from('allergy_cards').delete().eq('id', newCard.id);
      console.log('✅ Test data cleaned up');
    }

  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

async function main() {
  await testDirectDB();
  
  console.log('\n📋 Next Steps:');
  console.log('1. If tables don\'t exist, run the schema files in Supabase SQL Editor');
  console.log('2. If RLS errors persist, run: \\i supabase/fix-users-rls.sql');
  console.log('3. Test the API again after fixing database issues');
}

main();








