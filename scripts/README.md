# 🛠️ Scripts Directory

## 📋 Overview
This directory contains utility scripts to help with ADR Management System setup, testing, and maintenance.

---

## 🔍 system-check.js

### **Purpose:**
Automated health check script that verifies your ADR Management System is properly configured and ready to run.

### **Usage:**
```bash
# Run from project root directory
node scripts/system-check.js
```

### **What it checks:**

#### **✅ Environment Setup**
- Node.js version (18+ required)
- package.json validity and dependencies
- .env.local file existence and configuration
- Environment variables completeness

#### **📁 Project Structure**
- Required directories (app/, components/, lib/, types/, supabase/)
- Critical files (layout.tsx, middleware.ts, schema.sql, etc.)
- Next.js and Tailwind configuration files

#### **🗄️ Database Setup**
- SQL files presence and content
- Database schema file validation
- Demo data files verification

#### **🌐 External Services**
- Supabase connection test
- Environment variables validation
- API keys format checking

#### **📦 Dependencies**
- node_modules installation status
- Key packages availability
- Package versions compatibility

### **Output Example:**
```
🔍 Starting ADR System Health Check...

✅ Node.js version v18.17.0 ✓
✅ All required dependencies found in package.json
✅ All required environment variables found
⚠️  Environment file contains placeholder values
   💡 Suggestion: Replace placeholder values with actual keys from Supabase
✅ Project structure is complete
✅ Database setup files are present
✅ Supabase connection successful
✅ Key packages are installed

============================================================
🏥 ADR SYSTEM HEALTH CHECK REPORT
============================================================

📊 SUMMARY:
   ✅ Passed: 7
   ⚠️  Warnings: 1
   ❌ Failed: 0

🎯 OVERALL STATUS:
   ✅ GOOD! System should work with minor issues
   ➡️  Run: npm run dev
   📝 Address warnings when possible
```

### **Exit Codes:**
- `0`: All checks passed or minor warnings only
- `1`: Critical errors found, system not ready

### **When to Use:**
- **First-time setup**: Before running `npm run dev`
- **After environment changes**: When modifying .env.local
- **Troubleshooting**: When facing setup issues
- **Pre-deployment**: Before production deployment
- **Team onboarding**: New developers joining project

---

## 🚀 Future Scripts (Planned)

### **setup-wizard.js**
Interactive setup wizard for first-time configuration:
- Guides through Supabase project creation
- Generates .env.local automatically
- Downloads and configures database schema
- Validates setup end-to-end

### **test-runner.js**
Automated testing script:
- Runs comprehensive feature tests
- Validates all API endpoints
- Tests email functionality
- Generates test reports

### **db-migrate.js**
Database migration utility:
- Handles schema updates
- Backs up existing data
- Applies migrations safely
- Validates migration success

### **deploy-check.js**
Production readiness checker:
- Validates production configuration
- Checks security settings
- Tests performance benchmarks
- Verifies deployment requirements

---

## 📝 Usage Guidelines

### **Running Scripts:**
```bash
# Make script executable (Unix/Mac)
chmod +x scripts/system-check.js

# Run with Node.js
node scripts/system-check.js

# Run with npm (if script added to package.json)
npm run system-check
```

### **Common Issues:**

#### **❌ "Cannot find module"**
```bash
# Ensure you're in project root directory
cd path/to/adr-management
node scripts/system-check.js
```

#### **❌ Permission denied**
```bash
# On Unix/Mac systems
chmod +x scripts/system-check.js
```

#### **❌ Script fails to run**
- Verify Node.js installation: `node --version`
- Check script path exists: `ls -la scripts/`
- Ensure no syntax errors in script

---

## 🎯 Integration with Documentation

### **Related Files:**
- **START-HERE.md** - Quick orientation guide
- **QUICK-START-GUIDE.md** - Detailed setup instructions  
- **TESTING-CHECKLIST.md** - Manual testing procedures
- **PROJECT-SUMMARY.md** - Complete system documentation

### **Workflow:**
1. **Read** START-HERE.md for orientation
2. **Run** system-check.js for automated verification
3. **Follow** QUICK-START-GUIDE.md for detailed setup
4. **Validate** with TESTING-CHECKLIST.md
5. **Demo** using DEMO-SCRIPT.md

---

## 💡 Tips & Best Practices

### **For Developers:**
- Run system-check.js before starting development work
- Use it as part of your git pre-commit hooks
- Include output in bug reports for better debugging

### **For System Administrators:**
- Integrate into CI/CD pipelines
- Use for environment validation in staging
- Schedule regular health checks in production

### **For New Team Members:**
- First step after cloning repository
- Helps identify environment setup issues early  
- Provides clear next steps for resolution

---

## 🔧 Customization

### **Adding New Checks:**
```javascript
// In system-check.js
async checkCustomFeature() {
  this.log('Checking custom feature...', 'check');
  
  // Your check logic here
  if (customCondition) {
    this.pass('Custom feature configured correctly');
  } else {
    this.fail('Custom feature issue', 'Resolution suggestion');
  }
}

// Add to run() method
async run() {
  // ... existing checks
  await this.checkCustomFeature();
  // ...
}
```

### **Modifying Output:**
- Change colors in the `colors` object
- Modify symbols in `log()` method
- Customize report format in `generateReport()`

---

## 📞 Support

### **For Script Issues:**
1. Check Node.js version compatibility
2. Verify project structure is intact
3. Review error messages carefully
4. Check file permissions (Unix/Mac)

### **For System Issues Found by Script:**
1. Follow suggestions provided in output
2. Refer to QUICK-START-GUIDE.md for detailed fixes
3. Use /debug page in application for additional diagnostics
4. Check Supabase project status if connection fails

---

**Happy scripting! 🚀 The system-check script is your first line of defense against configuration issues.**
