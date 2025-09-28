// Test script để debug allergy cards API
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const SUPABASE_URL = 'https://wnkwwjzwyunprnechdru.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indua3d3anp3eXVucHJuZWNoZHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTE2NTUsImV4cCI6MjA3Mzc4NzY1NX0.CbGqNY1MHagea1fguPmZe8pUI4VH6sEVzm0KQy80vtY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabase() {
  console.log('🏥 Testing Allergy Cards Database Setup\n');

  try {
    // 1. Test users table
    console.log('1️⃣ Testing users table...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(3);
    
    if (usersError) {
      console.error('❌ Users table error:', usersError.message);
      return false;
    } else {
      console.log('✅ Users table exists');
      console.log('   Sample users:', usersData?.length || 0, 'users found');
      if (usersData && usersData.length > 0) {
        console.log('   First user:', usersData[0].email);
      }
    }

    // 2. Test allergy_cards table
    console.log('\n2️⃣ Testing allergy_cards table...');
    const { data: cardsData, error: cardsError } = await supabase
      .from('allergy_cards')
      .select('id, card_code, patient_name')
      .limit(3);
    
    if (cardsError) {
      console.error('❌ Allergy cards table error:', cardsError.message);
      if (cardsError.message.includes('relation "allergy_cards" does not exist')) {
        console.log('💡 Solution: Run supabase/allergy-cards-schema.sql in Supabase SQL Editor');
      }
      return false;
    } else {
      console.log('✅ Allergy cards table exists');
      console.log('   Existing cards:', cardsData?.length || 0, 'cards found');
    }

    // 3. Test card_allergies table
    console.log('\n3️⃣ Testing card_allergies table...');
    const { data: allergiesData, error: allergiesError } = await supabase
      .from('card_allergies')
      .select('id, allergen_name')
      .limit(3);
    
    if (allergiesError) {
      console.error('❌ Card allergies table error:', allergiesError.message);
      return false;
    } else {
      console.log('✅ Card allergies table exists');
      console.log('   Existing allergies:', allergiesData?.length || 0, 'allergies found');
    }

    // 4. Test view
    console.log('\n4️⃣ Testing allergy_cards_with_details view...');
    const { data: viewData, error: viewError } = await supabase
      .from('allergy_cards_with_details')
      .select('id, card_code, patient_name, allergies')
      .limit(1);
    
    if (viewError) {
      console.error('❌ View error:', viewError.message);
      if (viewError.message.includes('relation "allergy_cards_with_details" does not exist')) {
        console.log('💡 Solution: The view is created by allergy-cards-schema.sql');
      }
      return false;
    } else {
      console.log('✅ View exists and working');
    }

    console.log('\n🎉 Database setup looks good!');
    return true;

  } catch (error) {
    console.error('❌ Connection error:', error.message);
    return false;
  }
}

async function testCardCreation() {
  console.log('\n📝 Testing Card Creation Logic\n');

  try {
    // Get a test user
    const { data: testUser } = await supabase
      .from('users')
      .select('id, email')
      .limit(1)
      .single();

    if (!testUser) {
      console.error('❌ No test users found. Run demo-users.sql first.');
      return;
    }

    console.log('👤 Using test user:', testUser.email);

    // Test data similar to what the form would send
    const testCardData = {
      patient_name: 'Test Patient',
      patient_gender: 'male',
      patient_age: 30,
      patient_id_number: '123456789',
      hospital_name: 'Test Hospital',
      department: 'Test Department',
      doctor_name: 'Dr. Test',
      doctor_phone: '0123456789',
      issued_date: new Date().toISOString().split('T')[0],
      issued_by_user_id: testUser.id,
      organization: 'Test Organization',
      notes: 'Test notes',
      qr_code_data: '{}', // Empty JSON as placeholder
      status: 'active'
    };

    console.log('📋 Test card data prepared');

    // Try to insert card
    console.log('\n5️⃣ Testing card insertion...');
    const { data: cardResult, error: cardError } = await supabase
      .from('allergy_cards')
      .insert(testCardData)
      .select()
      .single();

    if (cardError) {
      console.error('❌ Card insertion error:', cardError.message);
      console.error('   Error details:', cardError);
      
      if (cardError.message.includes('violates foreign key constraint')) {
        console.log('💡 Foreign key issue - check if user exists and references are correct');
      }
      if (cardError.message.includes('violates not-null constraint')) {
        console.log('💡 Missing required field - check which field is NULL');
      }
      
      return;
    } else {
      console.log('✅ Card created successfully!');
      console.log('   Card ID:', cardResult.id);
      console.log('   Card Code:', cardResult.card_code);

      // Test allergies insertion
      console.log('\n6️⃣ Testing allergies insertion...');
      const testAllergyData = {
        card_id: cardResult.id,
        allergen_name: 'Test Allergen',
        certainty_level: 'confirmed',
        clinical_manifestation: 'Test symptoms',
        severity_level: 'mild',
        reaction_type: 'skin reaction'
      };

      const { error: allergyError } = await supabase
        .from('card_allergies')
        .insert(testAllergyData);

      if (allergyError) {
        console.error('❌ Allergy insertion error:', allergyError.message);
      } else {
        console.log('✅ Allergy added successfully!');
      }

      // Clean up test data
      console.log('\n🧹 Cleaning up test data...');
      await supabase.from('card_allergies').delete().eq('card_id', cardResult.id);
      await supabase.from('allergy_cards').delete().eq('id', cardResult.id);
      console.log('✅ Test data cleaned up');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

async function main() {
  console.log('🚀 ADR Management System - Allergy Cards API Debug\n');
  
  const dbOk = await testDatabase();
  
  if (dbOk) {
    await testCardCreation();
  }

  console.log('\n📋 Summary:');
  console.log('If all tests pass, the issue might be:');
  console.log('1. Authentication - user session not properly passed to API');
  console.log('2. Form validation - check frontend form data structure');
  console.log('3. CORS or network issues');
  console.log('4. Check browser console and network tab for more details');
}

main();








