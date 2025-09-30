/**
 * CHECK ALLERGY CARDS DATA
 * Script to verify data exists in allergy_cards table
 */

console.log('🔍 Checking Allergy Cards Data...\n');

// Simulate database check instructions
function showDataCheckInstructions() {
  console.log('1. Database Query Check:');
  console.log('   Run these queries in your database:');
  console.log('');
  console.log('   -- Check total cards count');
  console.log('   SELECT COUNT(*) as total_cards FROM allergy_cards;');
  console.log('');
  console.log('   -- List all cards with basic info');
  console.log('   SELECT id, card_code, patient_name, created_at');
  console.log('   FROM allergy_cards');
  console.log('   ORDER BY created_at DESC');
  console.log('   LIMIT 10;');
  console.log('');
  console.log('   -- Check specific card (replace UUID with actual ID)');
  console.log('   SELECT * FROM allergy_cards');
  console.log('   WHERE id = \'435ec6cf-5252-4863-b95e-b99bddba52d4\';');
}

function showRLSCheck() {
  console.log('\n2. RLS (Row Level Security) Check:');
  console.log('   Check if RLS is blocking access:');
  console.log('');
  console.log('   -- Check RLS policies on allergy_cards');
  console.log('   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual');
  console.log('   FROM pg_policies');
  console.log('   WHERE tablename = \'allergy_cards\';');
  console.log('');
  console.log('   -- Check current user context');
  console.log('   SELECT current_user, session_user;');
}

function showUserPermissionCheck() {
  console.log('\n3. User Permission Check:');
  console.log('   Verify user has access:');
  console.log('');
  console.log('   -- Check user exists and role');
  console.log('   SELECT id, email, name, role, organization');
  console.log('   FROM users');
  console.log('   WHERE email = \'YOUR-LOGIN-EMAIL\';');
  console.log('');
  console.log('   -- Check if user created any cards');
  console.log('   SELECT COUNT(*) as cards_by_user');
  console.log('   FROM allergy_cards ac');
  console.log('   JOIN users u ON ac.issued_by_user_id = u.id');
  console.log('   WHERE u.email = \'YOUR-LOGIN-EMAIL\';');
}

function showSolutionSteps() {
  console.log('\n4. Solution Steps:');
  console.log('');
  console.log('   OPTION A: If no cards exist (most likely)');
  console.log('   ✅ Create a test allergy card first:');
  console.log('      1. Go to /allergy-cards');
  console.log('      2. Click "Tạo thẻ mới"');
  console.log('      3. Fill in patient info');
  console.log('      4. Add some allergies');
  console.log('      5. Save the card');
  console.log('      6. Then try printing');
  console.log('');
  console.log('   OPTION B: If cards exist but RLS blocks access');
  console.log('   ✅ Check RLS policies and fix permissions');
  console.log('');
  console.log('   OPTION C: If cards exist but wrong ID');
  console.log('   ✅ Use correct ID from /allergy-cards list');
}

function showQuickTest() {
  console.log('\n5. Quick Test:');
  console.log('   Instead of direct URL, use the UI:');
  console.log('');
  console.log('   ✅ Go to: http://localhost:3000/allergy-cards');
  console.log('   ✅ If you see cards → Click one → Click "In thẻ"');
  console.log('   ✅ If no cards → Click "Tạo thẻ mới" first');
  console.log('');
  console.log('   This ensures you\'re using valid, accessible card IDs');
}

function showDebugAPI() {
  console.log('\n6. Debug API Endpoint:');
  console.log('   Create a debug endpoint to list available cards:');
  console.log('');
  console.log('   ✅ URL: /api/allergy-cards');
  console.log('   ✅ Should return list of cards user can access');
  console.log('   ✅ Use IDs from this list for printing');
}

// Run all checks
console.log('═'.repeat(70));
console.log('  ALLERGY CARDS DATA CHECK - DIAGNOSIS');
console.log('═'.repeat(70));

showDataCheckInstructions();
showRLSCheck();
showUserPermissionCheck();
showSolutionSteps();
showQuickTest();
showDebugAPI();

console.log('\n═'.repeat(70));
console.log('  LIKELY CAUSE & SOLUTION');
console.log('═'.repeat(70));
console.log('\n  🎯 MOST LIKELY: No allergy cards exist in database');
console.log('  ✅ SOLUTION: Create a card first via UI');
console.log('  📍 URL: http://localhost:3000/allergy-cards → "Tạo thẻ mới"');
console.log('\n  🔧 THEN: Test print with the newly created card');
console.log('\n');
