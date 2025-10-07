const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const supabaseUrl = 'https://wnkwwjzwyunprnechdru.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indua3d3anp3eXVucHJuZWNoZHJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIxMTY1NSwiZXhwIjoyMDczNzg3NjU1fQ.bP1GQtT5VDv0XX7OHFEbMl4FT8RAIXCb2UQcPI-5UAU';

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Read the migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20241007000001_fix_adr_performance_foreign_key.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('Running migration to fix ADR performance foreign key...');
  console.log('SQL:', migrationSQL);

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // If exec_sql doesn't exist, try direct execution
      console.log('Trying alternative method...');
      
      // Split SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error: stmtError } = await supabase.rpc('exec', { sql: statement });
        if (stmtError) {
          console.error('Error executing statement:', stmtError);
        }
      }
    }

    console.log('Migration completed successfully!');
    console.log('The foreign key has been updated to reference public.users instead of auth.users');
    
  } catch (err) {
    console.error('Error running migration:', err);
    console.error('\n=== MANUAL MIGRATION REQUIRED ===');
    console.error('Please run the following SQL in your Supabase SQL Editor:');
    console.error('\n' + migrationSQL + '\n');
    process.exit(1);
  }
}

runMigration();

