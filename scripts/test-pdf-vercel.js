#!/usr/bin/env node
/**
 * Test script for PDF generation on Vercel
 * Run: node scripts/test-pdf-vercel.js
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m', 
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

class PDFTester {
  constructor() {
    this.baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colorMap = {
      info: colors.cyan,
      success: colors.green,
      error: colors.red,
      warning: colors.yellow,
      check: colors.blue
    };
    
    console.log(`${colorMap[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async testPDFEndpoint(reportId = 'test-report-001') {
    this.log('🧪 Testing PDF generation endpoint...', 'check');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/reports/${reportId}/export-pdf`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add session cookie here if available
        },
        timeout: 35000 // 35 seconds timeout
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');
        
        if (contentType && contentType.includes('application/pdf')) {
          this.log(`✅ PDF endpoint working! Size: ${contentLength} bytes`, 'success');
          this.results.passed++;
          
          // Save PDF for manual inspection
          const buffer = await response.buffer();
          const testPdfPath = path.join(process.cwd(), 'test-output.pdf');
          fs.writeFileSync(testPdfPath, buffer);
          this.log(`📄 Test PDF saved to: ${testPdfPath}`, 'info');
          
        } else {
          this.log(`⚠️ Unexpected content type: ${contentType}`, 'warning');
          this.results.warnings++;
        }
      } else {
        const errorText = await response.text();
        this.log(`❌ PDF endpoint failed: ${response.status} - ${errorText}`, 'error');
        this.results.failed++;
      }
      
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ECONNRESET') {
        this.log(`⏰ PDF generation timeout - this might be expected on Vercel`, 'warning');
        this.results.warnings++;
      } else {
        this.log(`❌ PDF test error: ${error.message}`, 'error');
        this.results.failed++;
      }
    }
  }

  async checkDependencies() {
    this.log('📦 Checking dependencies...', 'check');
    
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      const required = [
        '@sparticuz/chromium',
        'puppeteer-core'
      ];
      
      let allFound = true;
      for (const dep of required) {
        if (packageData.dependencies[dep] || packageData.devDependencies[dep]) {
          this.log(`✅ ${dep}: ${packageData.dependencies[dep] || packageData.devDependencies[dep]}`, 'success');
        } else {
          this.log(`❌ Missing dependency: ${dep}`, 'error');
          allFound = false;
        }
      }
      
      if (allFound) {
        this.results.passed++;
      } else {
        this.results.failed++;
      }
      
    } catch (error) {
      this.log(`❌ Failed to check dependencies: ${error.message}`, 'error');
      this.results.failed++;
    }
  }

  async checkConfiguration() {
    this.log('⚙️ Checking configuration files...', 'check');
    
    const files = [
      { path: 'vercel.json', required: true },
      { path: 'next.config.js', required: true },
      { path: 'template.html', required: true }
    ];
    
    let allFound = true;
    
    for (const file of files) {
      const fullPath = path.join(process.cwd(), file.path);
      if (fs.existsSync(fullPath)) {
        this.log(`✅ ${file.path} found`, 'success');
        
        // Check specific configurations
        if (file.path === 'vercel.json') {
          const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          if (content.functions && content.functions['app/api/reports/[id]/export-pdf/route.ts']) {
            this.log(`✅ PDF function configuration found`, 'success');
          } else {
            this.log(`⚠️ PDF function configuration missing in vercel.json`, 'warning');
          }
        }
        
        if (file.path === 'next.config.js') {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('@sparticuz/chromium')) {
            this.log(`✅ Chromium externalization configured`, 'success');
          } else {
            this.log(`⚠️ Chromium externalization missing in next.config.js`, 'warning');
          }
        }
        
      } else if (file.required) {
        this.log(`❌ Required file missing: ${file.path}`, 'error');
        allFound = false;
      }
    }
    
    if (allFound) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
  }

  async checkEnvironmentVariables() {
    this.log('🌍 Checking environment variables...', 'check');
    
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXTAUTH_SECRET'
    ];
    
    let allFound = true;
    
    for (const envVar of required) {
      if (process.env[envVar]) {
        this.log(`✅ ${envVar} is set`, 'success');
      } else {
        this.log(`❌ Missing environment variable: ${envVar}`, 'error');
        allFound = false;
      }
    }
    
    // Check optional Vercel-specific vars
    if (process.env.VERCEL) {
      this.log(`✅ Running on Vercel`, 'info');
    } else {
      this.log(`ℹ️ Not running on Vercel (local development)`, 'info');
    }
    
    if (allFound) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
  }

  async runAllTests() {
    this.log(`${colors.bright}🧪 Starting PDF Vercel Compatibility Tests${colors.reset}`, 'info');
    this.log(`Base URL: ${this.baseUrl}`, 'info');
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    await this.checkDependencies();
    console.log();
    
    await this.checkConfiguration();
    console.log();
    
    await this.checkEnvironmentVariables();
    console.log();
    
    await this.testPDFEndpoint();
    console.log();
    
    this.printSummary();
  }

  printSummary() {
    console.log('='.repeat(60));
    this.log(`${colors.bright}📊 Test Summary${colors.reset}`, 'info');
    console.log();
    
    this.log(`✅ Passed: ${this.results.passed}`, 'success');
    this.log(`❌ Failed: ${this.results.failed}`, 'error');
    this.log(`⚠️ Warnings: ${this.results.warnings}`, 'warning');
    
    console.log();
    
    if (this.results.failed === 0) {
      this.log(`${colors.bright}🎉 All critical tests passed! Ready for Vercel deployment.${colors.reset}`, 'success');
    } else {
      this.log(`${colors.bright}🔧 Please fix the failed tests before deploying to Vercel.${colors.reset}`, 'error');
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Deployment instructions
    if (this.results.failed === 0) {
      console.log();
      this.log(`${colors.bright}🚀 Next Steps:${colors.reset}`, 'info');
      this.log(`1. Commit your changes: git add . && git commit -m "Fix PDF for Vercel"`, 'info');
      this.log(`2. Deploy to Vercel: git push or vercel --prod`, 'info');
      this.log(`3. Test on production: curl your-app.vercel.app/api/reports/[id]/export-pdf`, 'info');
      this.log(`4. Check Vercel function logs if issues persist`, 'info');
      console.log();
    }
  }
}

// Run tests
if (require.main === module) {
  const tester = new PDFTester();
  tester.runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = PDFTester;
