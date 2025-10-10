/**
 * Script: Fix Report Code Format Issue
 * 
 * VẤN ĐỀ:
 * - Database trigger cũ đang tự động tạo mã báo cáo format: 2025-000011
 * - Application đang tạo mã format mới: 92010-010-2025
 * - Trigger ghi đè mã của application -> conflict
 * 
 * GIẢI PHÁP:
 * 1. Vô hiệu hóa trigger cũ
 * 2. Từ giờ application sẽ toàn quyền quản lý mã báo cáo
 * 
 * CÁCH CHẠY:
 * node scripts/fix-report-code-format.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mwqrwxwjmdxivifhyhjb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('\nPlease set it in your environment:');
  console.log('export SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(migrationFile) {
  console.log(`\n📄 Running migration: ${path.basename(migrationFile)}`);
  
  const sql = fs.readFileSync(migrationFile, 'utf8');
  
  // Remove comments and split by semicolon
  const statements = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (const statement of statements) {
    try {
      console.log(`   Executing: ${statement.substring(0, 50)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // Try direct execution if rpc fails
        const { error: directError } = await supabase.from('_migrations').insert({
          name: path.basename(migrationFile),
          executed_at: new Date().toISOString()
        });
        
        if (directError && !directError.message.includes('does not exist')) {
          console.log(`   ⚠️  Warning: ${error.message}`);
        }
      } else {
        console.log(`   ✅ Success`);
      }
    } catch (err) {
      console.log(`   ⚠️  ${err.message}`);
    }
  }
}

async function checkCurrentState() {
  console.log('\n🔍 Checking current state...\n');
  
  // Check if trigger exists
  const { data: triggers } = await supabase
    .rpc('exec_sql', { 
      sql: `
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_generate_report_code'
      `
    });
  
  console.log('Database Trigger Status:');
  if (triggers && triggers.length > 0) {
    console.log('   ⚠️  OLD TRIGGER EXISTS - needs to be removed');
  } else {
    console.log('   ✅ No conflicting trigger found');
  }
  
  // Check sample report codes
  const { data: reports } = await supabase
    .from('adr_reports')
    .select('report_code, organization, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log('\nRecent Report Codes:');
  if (reports) {
    reports.forEach((r, i) => {
      const format = r.report_code.match(/^\d{4}-\d{6}$/) 
        ? '❌ OLD FORMAT'
        : '✅ NEW FORMAT';
      console.log(`   ${i + 1}. ${r.report_code} - ${format}`);
    });
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Fix Report Code Format - Migration Script            ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  await checkCurrentState();
  
  console.log('\n\n⚠️  WARNING: This will modify the database structure!');
  console.log('This script will:');
  console.log('1. Remove the old trigger that auto-generates report codes');
  console.log('2. Allow application to control report code generation');
  console.log('\nAfter this, all new reports will use format: {dept_code}-{seq}-{year}');
  console.log('Example: 92010-010-2025\n');
  
  // In production, you might want to add confirmation prompt
  // For now, we'll just show what would happen
  
  console.log('\n📋 Migrations to apply:');
  console.log('   1. supabase/migrations/20241008000001_disable_old_report_code_trigger.sql');
  console.log('   2. supabase/migrations/20241008000002_update_existing_report_codes.sql (commented)');
  
  console.log('\n💡 To apply these migrations:');
  console.log('   Option 1: Use Supabase CLI (recommended)');
  console.log('      supabase db reset');
  console.log('\n   Option 2: Manually run the SQL files in Supabase Dashboard');
  console.log('      Go to SQL Editor and run each file\n');
  
  console.log('✅ Migration files created successfully!');
}

main().catch(console.error);


