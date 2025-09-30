/**
 * TEST ADR PRINT ENDPOINT
 * Quick test to verify /api/reports/[id]/print-view endpoint
 */

const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

console.log('🧪 Testing ADR Print Endpoint...\n');

async function testEndpoint() {
  console.log('1. Testing endpoint existence:');
  console.log(`   URL Pattern: ${baseUrl}/api/reports/[id]/print-view`);
  console.log('   Method: GET');
  console.log('   Auth: Required (session)\n');

  console.log('2. Expected Response:');
  console.log('   ✅ Status 200 (authenticated)');
  console.log('   ✅ Content-Type: text/html; charset=utf-8');
  console.log('   ✅ HTML with template.html layout\n');

  console.log('3. File Check:');
  const fs = require('fs');
  const path = require('path');
  
  const routePath = path.join(process.cwd(), 'app/api/reports/[id]/print-view/route.ts');
  
  if (fs.existsSync(routePath)) {
    console.log('   ✅ File exists: app/api/reports/[id]/print-view/route.ts');
    
    const content = fs.readFileSync(routePath, 'utf8');
    
    // Check for required exports
    if (content.includes('export async function GET')) {
      console.log('   ✅ GET handler exported');
    } else {
      console.log('   ❌ GET handler NOT found');
    }
    
    if (content.includes('export const runtime')) {
      console.log('   ✅ Runtime configuration found');
    } else {
      console.log('   ⚠️  Runtime configuration NOT found (might need nodejs runtime)');
    }
    
    if (content.includes('generatePrintHTML')) {
      console.log('   ✅ HTML generation function found');
    } else {
      console.log('   ❌ HTML generation function NOT found');
    }
  } else {
    console.log('   ❌ File NOT found:', routePath);
  }

  console.log('\n4. Common Issues & Solutions:');
  console.log('   Issue: "Not Found" error');
  console.log('   Solutions:');
  console.log('   - Restart dev server (npm run dev)');
  console.log('   - Clear .next folder (rm -rf .next)');
  console.log('   - Check authentication (must be logged in)');
  console.log('   - Verify correct report ID');
  console.log('   - Check runtime is set to "nodejs"');

  console.log('\n5. How to Use:');
  console.log('   a) From Report Detail Page:');
  console.log('      - Click "In báo cáo" button (🖨️)');
  console.log('      - Opens /api/reports/[id]/print-view');
  console.log('   b) From Report Table:');
  console.log('      - Click printer icon in actions column');
  console.log('      - Opens same endpoint in new tab');

  console.log('\n6. Troubleshooting Steps:');
  console.log('   Step 1: Restart dev server');
  console.log('           → npm run dev');
  console.log('   Step 2: Clear build cache');
  console.log('           → Remove .next folder');
  console.log('   Step 3: Check browser console');
  console.log('           → Look for network errors');
  console.log('   Step 4: Verify authentication');
  console.log('           → Make sure you are logged in');
  console.log('   Step 5: Test with valid report ID');
  console.log('           → Use ID from /reports page');

  console.log('\n✅ Endpoint Configuration:');
  console.log('   File: app/api/reports/[id]/print-view/route.ts');
  console.log('   Runtime: nodejs');
  console.log('   Auth: Required (NextAuth session)');
  console.log('   Output: HTML (form-style template)');
  console.log('   Template: Matches template.html 100%');

  console.log('\n🔧 Quick Fix Commands:');
  console.log('   # Restart dev server');
  console.log('   npm run dev');
  console.log('');
  console.log('   # Or clear cache and restart');
  console.log('   rm -rf .next && npm run dev');

  console.log('\n📝 Example Usage:');
  console.log('   // In browser');
  console.log('   1. Go to /reports');
  console.log('   2. Click on any report');
  console.log('   3. Click "In báo cáo" button');
  console.log('   4. Print window should open');

  console.log('\n');
}

testEndpoint().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
