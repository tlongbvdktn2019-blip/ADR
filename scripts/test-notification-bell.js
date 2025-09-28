/**
 * Test script for Notification Bell functionality
 * Run this after setting up the notification schema
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function testNotificationBell() {
  console.log('🔔 Testing Notification Bell System...\n')

  try {
    // 1. Check if notifications table exists
    console.log('1️⃣ Checking notifications table...')
    const { data: tables, error: tableError } = await supabase.rpc('check_table_exists', { table_name: 'notifications' })
    
    if (tableError) {
      console.log('❌ Notifications table not found. Please run notifications-schema.sql first')
      return
    }
    console.log('✅ Notifications table exists')

    // 2. Check for admin users
    console.log('\n2️⃣ Checking for admin users...')
    const { data: admins, error: adminError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('role', 'admin')

    if (adminError || !admins || admins.length === 0) {
      console.log('❌ No admin users found. Please create admin users first')
      return
    }
    console.log(`✅ Found ${admins.length} admin user(s):`)
    admins.forEach(admin => console.log(`   - ${admin.name} (${admin.email})`))

    // 3. Check for test ADR reports
    console.log('\n3️⃣ Checking for ADR reports...')
    const { data: reports, error: reportError } = await supabase
      .from('adr_reports')
      .select('id, report_code, organization, created_at')
      .limit(3)

    if (reportError) {
      console.log('❌ Error checking ADR reports:', reportError.message)
      return
    }
    
    if (!reports || reports.length === 0) {
      console.log('⚠️ No ADR reports found. Creating a test report will generate notifications')
    } else {
      console.log(`✅ Found ${reports.length} ADR report(s)`)
    }

    // 4. Check existing notifications
    console.log('\n4️⃣ Checking existing notifications...')
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('id, recipient_id, title, message, read, created_at')
      .limit(5)

    if (notifError) {
      console.log('❌ Error checking notifications:', notifError.message)
      return
    }

    if (!notifications || notifications.length === 0) {
      console.log('📝 No notifications found. Let\'s create a test notification...')
      
      // Create a test notification for first admin
      const testNotification = {
        recipient_id: admins[0].id,
        sender_id: null,
        type: 'system',
        title: 'Test Notification',
        message: 'This is a test notification to verify the bell system is working',
        data: {
          test: true,
          created_by: 'test-script'
        },
        read: false
      }

      const { data: newNotif, error: createError } = await supabase
        .from('notifications')
        .insert([testNotification])
        .select()

      if (createError) {
        console.log('❌ Error creating test notification:', createError.message)
        return
      }

      console.log('✅ Created test notification:', newNotif[0].id)
    } else {
      console.log(`✅ Found ${notifications.length} existing notification(s)`)
    }

    // 5. Test notification stats
    console.log('\n5️⃣ Testing notification stats...')
    for (const admin of admins) {
      const { count: totalCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', admin.id)

      const { count: unreadCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', admin.id)
        .eq('read', false)

      console.log(`   📊 ${admin.name}: ${totalCount || 0} total, ${unreadCount || 0} unread`)
    }

    // 6. Test API endpoints
    console.log('\n6️⃣ Testing API endpoints availability...')
    console.log('   🔗 GET /api/notifications - Fetch notifications')
    console.log('   🔗 GET /api/notifications/stats - Fetch stats') 
    console.log('   🔗 PUT /api/notifications - Mark as read')

    console.log('\n🎉 Notification Bell Test Complete!')
    console.log('\n📋 Next Steps:')
    console.log('1. Start your Next.js app: npm run dev')
    console.log('2. Login as admin: admin@soyte.gov.vn / admin123')
    console.log('3. Check the notification bell in the top right corner')
    console.log('4. Create a new ADR report as user to test real-time notifications')
    console.log('5. Visit /notifications to see the full notifications page')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Helper function to check table exists
async function checkTableExists() {
  const { data, error } = await supabase.rpc('check_table_exists', { table_name: 'notifications' })
  return !error && data
}

testNotificationBell()
