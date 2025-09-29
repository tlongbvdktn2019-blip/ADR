/**
 * Script to check environment variables for Vercel PDF deployment
 * Run: node scripts/check-env-variables.js
 */

console.log('🔍 Checking Environment Variables for PDF Generation...\n')

// Required for authentication
const requiredAuth = [
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
]

// Required for Supabase
const requiredSupabase = [
  'NEXT_PUBLIC_SUPABASE_URL', 
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
]

// Optional for PDF generation
const optionalPDF = [
  'PUPPETEER_SKIP_CHROMIUM_DOWNLOAD',
  'SPARTICUZ_FUNCTION_NAME'
]

// Environment detection
const environmentVars = [
  'NODE_ENV',
  'VERCEL',
  'AWS_EXECUTION_ENV'
]

function checkEnvVars(vars, category, required = true) {
  console.log(`📂 ${category}:`)
  let allPresent = true
  
  vars.forEach(varName => {
    const value = process.env[varName]
    const status = value ? '✅' : (required ? '❌' : '⚠️')
    const display = value ? (varName.includes('SECRET') || varName.includes('KEY') ? '[HIDDEN]' : value) : 'NOT SET'
    
    console.log(`   ${status} ${varName}: ${display}`)
    
    if (required && !value) {
      allPresent = false
    }
  })
  
  console.log()
  return allPresent
}

// Check all categories
const authOK = checkEnvVars(requiredAuth, 'Authentication (Required)', true)
const supabaseOK = checkEnvVars(requiredSupabase, 'Supabase (Required)', true)
const pdfOK = checkEnvVars(optionalPDF, 'PDF Generation (Optional)', false) 
const envOK = checkEnvVars(environmentVars, 'Environment Detection', false)

console.log('📊 Summary:')
console.log(`   Authentication: ${authOK ? '✅ OK' : '❌ Missing required vars'}`)
console.log(`   Supabase: ${supabaseOK ? '✅ OK' : '❌ Missing required vars'}`)
console.log(`   PDF Generation: ${pdfOK ? '✅ All set' : '⚠️ Some optional vars missing'}`)
console.log(`   Environment: ${envOK ? '✅ All detected' : '⚠️ Some vars not set'}`)

console.log('\n🎯 Vercel Environment Variables Recommendations:')
console.log('   ✅ KEEP: PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1')
console.log('   🆕 OPTIONAL: SPARTICUZ_FUNCTION_NAME=pdf-generator')
console.log('   ❌ REMOVE: PUPPETEER_EXECUTABLE_PATH (if set)')

if (!authOK || !supabaseOK) {
  console.log('\n❌ Some required environment variables are missing!')
  console.log('   Please set them in Vercel dashboard before deployment.')
  process.exit(1)
} else {
  console.log('\n🎉 Environment looks good for Vercel deployment!')
}
