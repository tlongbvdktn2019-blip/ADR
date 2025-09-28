#!/usr/bin/env node

/**
 * 🔍 ADR System Health Check Script
 * 
 * This script automatically verifies that your ADR Management System
 * is properly configured and ready to run.
 * 
 * Usage: node scripts/system-check.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class SystemChecker {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      issues: []
    };
  }

  log(message, type = 'info') {
    const symbols = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      check: '🔍'
    };

    const typeColors = {
      info: colors.cyan,
      success: colors.green,
      warning: colors.yellow,
      error: colors.red,
      check: colors.blue
    };

    console.log(`${symbols[type]} ${typeColors[type]}${message}${colors.reset}`);
  }

  pass(message) {
    this.results.passed++;
    this.log(message, 'success');
  }

  fail(message, suggestion = '') {
    this.results.failed++;
    this.results.issues.push({ message, suggestion, type: 'error' });
    this.log(message, 'error');
    if (suggestion) {
      this.log(`   💡 Suggestion: ${suggestion}`, 'info');
    }
  }

  warn(message, suggestion = '') {
    this.results.warnings++;
    this.results.issues.push({ message, suggestion, type: 'warning' });
    this.log(message, 'warning');
    if (suggestion) {
      this.log(`   💡 Suggestion: ${suggestion}`, 'info');
    }
  }

  async checkNodeVersion() {
    this.log('Checking Node.js version...', 'check');
    
    const version = process.version;
    const major = parseInt(version.split('.')[0].substring(1));
    
    if (major >= 18) {
      this.pass(`Node.js version ${version} ✓`);
    } else {
      this.fail(
        `Node.js version ${version} is too old (need 18+)`,
        'Update Node.js from https://nodejs.org'
      );
    }
  }

  checkPackageJson() {
    this.log('Checking package.json...', 'check');
    
    const packagePath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packagePath)) {
      this.fail(
        'package.json not found',
        'Make sure you are in the project root directory'
      );
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Check required dependencies
      const requiredDeps = [
        'next',
        'react',
        'next-auth',
        '@supabase/supabase-js',
        'tailwindcss',
        'react-hook-form',
        'react-hot-toast',
        'nodemailer'
      ];

      const missing = requiredDeps.filter(dep => 
        !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
      );

      if (missing.length === 0) {
        this.pass(`All required dependencies found in package.json`);
      } else {
        this.fail(
          `Missing dependencies: ${missing.join(', ')}`,
          'Run: npm install'
        );
      }

      // Check scripts
      if (packageJson.scripts && packageJson.scripts.dev) {
        this.pass('npm scripts configured correctly');
      } else {
        this.fail(
          'Missing npm dev script',
          'Check package.json scripts section'
        );
      }

    } catch (error) {
      this.fail(
        'Invalid package.json format',
        'Check JSON syntax in package.json'
      );
    }
  }

  checkEnvironmentFile() {
    this.log('Checking environment configuration...', 'check');
    
    const envPath = path.join(process.cwd(), '.env.local');
    
    if (!fs.existsSync(envPath)) {
      this.fail(
        '.env.local file not found',
        'Create .env.local file with required environment variables'
      );
      return;
    }

    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      const requiredEnvVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'NEXTAUTH_SECRET'
      ];

      const missing = requiredEnvVars.filter(varName => {
        const regex = new RegExp(`^${varName}=.+`, 'm');
        return !regex.test(envContent);
      });

      if (missing.length === 0) {
        this.pass('All required environment variables found');
      } else {
        this.fail(
          `Missing environment variables: ${missing.join(', ')}`,
          'Add missing variables to .env.local'
        );
      }

      // Check for placeholder values
      if (envContent.includes('your-') || envContent.includes('YOUR_')) {
        this.warn(
          'Environment file contains placeholder values',
          'Replace placeholder values with actual keys from Supabase'
        );
      }

      // Check NEXTAUTH_SECRET
      const secretMatch = envContent.match(/NEXTAUTH_SECRET=(.+)/);
      if (secretMatch) {
        const secret = secretMatch[1].trim();
        if (secret.length < 32) {
          this.warn(
            'NEXTAUTH_SECRET is too short',
            'Use a random string with at least 32 characters'
          );
        }
      }

    } catch (error) {
      this.fail(
        'Cannot read .env.local file',
        'Check file permissions and content'
      );
    }
  }

  checkProjectStructure() {
    this.log('Checking project structure...', 'check');
    
    const requiredDirs = [
      'app',
      'components',
      'lib',
      'types',
      'supabase'
    ];

    const requiredFiles = [
      'app/layout.tsx',
      'app/page.tsx',
      'middleware.ts',
      'next.config.js',
      'tailwind.config.js',
      'supabase/schema.sql'
    ];

    let allDirsExist = true;
    let allFilesExist = true;

    // Check directories
    requiredDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        this.fail(
          `Missing directory: ${dir}`,
          'Ensure all project files were properly extracted/cloned'
        );
        allDirsExist = false;
      }
    });

    // Check critical files
    requiredFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        this.fail(
          `Missing file: ${file}`,
          'Ensure all project files were properly extracted/cloned'
        );
        allFilesExist = false;
      }
    });

    if (allDirsExist && allFilesExist) {
      this.pass('Project structure is complete');
    }
  }

  checkDatabaseFiles() {
    this.log('Checking database setup files...', 'check');
    
    const dbFiles = [
      'supabase/schema.sql',
      'supabase/demo-users.sql',
      'supabase/demo-reports.sql'
    ];

    let allExist = true;

    dbFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.trim().length > 0) {
          // Check for SQL content
          if (content.includes('CREATE TABLE') || content.includes('INSERT INTO')) {
            // File looks good
          } else {
            this.warn(
              `Database file ${file} might be incomplete`,
              'Verify SQL content in the file'
            );
          }
        } else {
          this.warn(
            `Database file ${file} is empty`,
            'Check if file content was properly saved'
          );
        }
      } else {
        this.fail(
          `Missing database file: ${file}`,
          'Ensure database setup files are present'
        );
        allExist = false;
      }
    });

    if (allExist) {
      this.pass('Database setup files are present');
    }
  }

  async checkSupabaseConnection() {
    this.log('Testing Supabase connection...', 'check');
    
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
      this.warn(
        'Cannot test Supabase - no .env.local file',
        'Create .env.local first'
      );
      return;
    }

    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
      
      if (!urlMatch) {
        this.warn(
          'SUPABASE_URL not found in .env.local',
          'Add NEXT_PUBLIC_SUPABASE_URL to environment file'
        );
        return;
      }

      const supabaseUrl = urlMatch[1].trim();
      
      // Basic URL validation
      if (!supabaseUrl.includes('supabase.co')) {
        this.warn(
          'Supabase URL format looks incorrect',
          'Should be: https://your-project.supabase.co'
        );
        return;
      }

      // Test connection (basic ping)
      return new Promise((resolve) => {
        const urlObj = new URL(supabaseUrl);
        const options = {
          hostname: urlObj.hostname,
          port: 443,
          path: '/rest/v1/',
          method: 'GET',
          timeout: 5000
        };

        const req = https.request(options, (res) => {
          if (res.statusCode === 401 || res.statusCode === 403) {
            this.pass('Supabase connection successful (authentication required)');
          } else if (res.statusCode === 200) {
            this.pass('Supabase connection successful');
          } else {
            this.warn(
              `Supabase response: HTTP ${res.statusCode}`,
              'Check if your Supabase project is active'
            );
          }
          resolve();
        });

        req.on('error', (error) => {
          this.warn(
            `Cannot connect to Supabase: ${error.message}`,
            'Check internet connection and Supabase project status'
          );
          resolve();
        });

        req.on('timeout', () => {
          this.warn(
            'Supabase connection timeout',
            'Check internet connection'
          );
          resolve();
        });

        req.end();
      });

    } catch (error) {
      this.warn(
        'Error checking Supabase connection',
        'Verify .env.local format'
      );
    }
  }

  checkNextJsConfig() {
    this.log('Checking Next.js configuration...', 'check');
    
    const configFile = 'next.config.js';
    
    if (fs.existsSync(configFile)) {
      this.pass('Next.js config file found');
    } else {
      this.warn(
        'next.config.js not found',
        'Create basic Next.js configuration'
      );
    }

    // Check Tailwind config
    const tailwindConfig = 'tailwind.config.js';
    if (fs.existsSync(tailwindConfig)) {
      this.pass('Tailwind CSS config found');
    } else {
      this.fail(
        'tailwind.config.js not found',
        'Run: npx tailwindcss init -p'
      );
    }
  }

  async checkNodeModules() {
    this.log('Checking node_modules...', 'check');
    
    const nodeModulesPath = 'node_modules';
    
    if (!fs.existsSync(nodeModulesPath)) {
      this.fail(
        'node_modules directory not found',
        'Run: npm install'
      );
      return;
    }

    // Check for key packages
    const keyPackages = ['next', 'react', '@supabase/supabase-js'];
    let allInstalled = true;

    keyPackages.forEach(pkg => {
      const pkgPath = path.join(nodeModulesPath, pkg);
      if (!fs.existsSync(pkgPath)) {
        this.fail(
          `Package ${pkg} not installed`,
          'Run: npm install'
        );
        allInstalled = false;
      }
    });

    if (allInstalled) {
      this.pass('Key packages are installed');
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.bright}🏥 ADR SYSTEM HEALTH CHECK REPORT${colors.reset}`);
    console.log('='.repeat(60));
    
    console.log(`\n📊 ${colors.bright}SUMMARY:${colors.reset}`);
    console.log(`   ✅ Passed: ${colors.green}${this.results.passed}${colors.reset}`);
    console.log(`   ⚠️  Warnings: ${colors.yellow}${this.results.warnings}${colors.reset}`);
    console.log(`   ❌ Failed: ${colors.red}${this.results.failed}${colors.reset}`);

    if (this.results.issues.length > 0) {
      console.log(`\n🔧 ${colors.bright}ISSUES TO ADDRESS:${colors.reset}`);
      this.results.issues.forEach((issue, index) => {
        const symbol = issue.type === 'error' ? '❌' : '⚠️';
        const color = issue.type === 'error' ? colors.red : colors.yellow;
        
        console.log(`\n${index + 1}. ${symbol} ${color}${issue.message}${colors.reset}`);
        if (issue.suggestion) {
          console.log(`   💡 ${issue.suggestion}`);
        }
      });
    }

    console.log(`\n🎯 ${colors.bright}OVERALL STATUS:${colors.reset}`);
    
    if (this.results.failed === 0 && this.results.warnings === 0) {
      console.log(`   🎉 ${colors.green}EXCELLENT! Your system is fully ready!${colors.reset}`);
      console.log(`   ➡️  Run: npm run dev`);
    } else if (this.results.failed === 0) {
      console.log(`   ✅ ${colors.yellow}GOOD! System should work with minor issues${colors.reset}`);
      console.log(`   ➡️  Run: npm run dev`);
      console.log(`   📝 Address warnings when possible`);
    } else {
      console.log(`   🚨 ${colors.red}NEEDS ATTENTION! Fix critical issues first${colors.reset}`);
      console.log(`   ➡️  Address failed checks before running`);
    }

    console.log('\n📚 Next Steps:');
    console.log('   📖 Read: QUICK-START-GUIDE.md for detailed setup');
    console.log('   🔍 Debug: http://localhost:3000/debug (after starting server)');
    console.log('   ✅ Test: Use TESTING-CHECKLIST.md for full verification');

    console.log('\n' + '='.repeat(60) + '\n');
  }

  async run() {
    console.log(`${colors.cyan}🔍 Starting ADR System Health Check...${colors.reset}\n`);

    await this.checkNodeVersion();
    this.checkPackageJson();
    this.checkEnvironmentFile();
    this.checkProjectStructure();
    this.checkDatabaseFiles();
    await this.checkSupabaseConnection();
    this.checkNextJsConfig();
    await this.checkNodeModules();

    this.generateReport();
  }
}

// Run the system check
if (require.main === module) {
  const checker = new SystemChecker();
  checker.run().catch(error => {
    console.error(`${colors.red}❌ System check failed:${colors.reset}`, error.message);
    process.exit(1);
  });
}

module.exports = SystemChecker;
