// Test script for shift management using direct database access
// Run with: node test-shifts-db.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local manually
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SHOP_ID = '00000000-0000-4000-8000-000000000001';
const TEST_USER_ID = '00000000-0000-4000-8000-000000000002';
const TEST_STATION_ID = '00000000-0000-4000-8000-000000000003';

async function runTests() {
  console.log('=== Starting Shift Management Database Tests ===\n');

  try {
    // Create test user if not exists
    console.log('Creating test user if not exists...');
    await supabase.from('users').upsert({
      id: TEST_USER_ID,
      shop_id: SHOP_ID,
      login_id: 'test_user',
      display_name: 'مستخدم تجريبي',
      role: 'owner',
      permissions: { manage_sessions: true, manage_shifts: true, record_sales: true, manage_settings: true, manage_team: true },
      is_active: true,
    }, { onConflict: 'id' });
    console.log('✅ Test user ready\n');

    // Create test station if not exists
    console.log('Creating test station if not exists...');
    await supabase.from('stations').upsert({
      id: TEST_STATION_ID,
      shop_id: SHOP_ID,
      name: 'PS1',
      station_type: 'playstation',
      sort_order: 1,
      is_active: true,
    }, { onConflict: 'id' });
    console.log('✅ Test station ready\n');

    // Clean up any existing test data
    console.log('Cleaning up existing test data...');
    await supabase.from('sessions').delete().eq('shift_id', TEST_USER_ID);
    await supabase.from('shifts').delete().eq('opened_by_user_id', TEST_USER_ID);
    console.log('✅ Cleanup complete\n');

    // Test 1: Open a new shift
    console.log('Test 1: Open a new shift');
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .insert({
        shop_id: SHOP_ID,
        responsible_name: 'Test User',
        opened_by_user_id: TEST_USER_ID,
        shift_number: 1,
        status: 'open',
        opened_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (shiftError) {
      console.error('❌ Failed to open shift:', shiftError);
      return;
    }
    console.log('✅ Shift opened successfully');
    console.log(`Shift ID: ${shift.id}`);
    console.log(`Shift Number: ${shift.shift_number}\n`);

    // Test 2: Try to open another shift (should be rejected by API, but we're testing DB directly)
    console.log('Test 2: Try to open another shift (DB allows it, API should reject)');
    const { data: shift2, error: shift2Error } = await supabase
      .from('shifts')
      .insert({
        shop_id: SHOP_ID,
        responsible_name: 'Test User 2',
        opened_by_user_id: TEST_USER_ID,
        shift_number: 2,
        status: 'open',
        opened_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (shift2Error) {
      console.error('❌ Failed to open second shift:', shift2Error);
    } else {
      console.log('⚠️  DB allowed second shift (API should reject this)');
      await supabase.from('shifts').delete().eq('id', shift2.id);
      console.log('✅ Cleaned up second shift\n');
    }

    // Test 3: Insert an active session
    console.log('Test 3: Insert an active session');
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        shop_id: SHOP_ID,
        shift_id: shift.id,
        station_id: TEST_STATION_ID,
        mode: 'single',
        status: 'active',
        start_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Failed to create session:', sessionError);
      return;
    }
    console.log('✅ Active session created');
    console.log(`Session ID: ${session.id}\n`);

    // Test 4: Try to close shift with active session (should be rejected by API)
    console.log('Test 4: Try to close shift with active session (API should reject)');
    const { data: closedShift, error: closeError } = await supabase
      .from('shifts')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
      })
      .eq('id', shift.id)
      .select()
      .single();

    if (closeError) {
      console.error('❌ Failed to close shift:', closeError);
    } else {
      console.log('⚠️  DB allowed closing shift with active session (API should reject this)');
      // Reopen the shift for further tests
      await supabase
        .from('shifts')
        .update({ status: 'open', closed_at: null })
        .eq('id', shift.id);
      console.log('✅ Reopened shift for further tests\n');
    }

    // Test 5: Close the active session
    console.log('Test 5: Close the active session');
    await supabase
      .from('sessions')
      .update({ status: 'completed', end_time: new Date().toISOString() })
      .eq('id', session.id);
    console.log('✅ Session closed\n');

    // Test 6: Close shift without active sessions (should succeed)
    console.log('Test 6: Close shift without active sessions');
    const { data: finalShift, error: finalCloseError } = await supabase
      .from('shifts')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
      })
      .eq('id', shift.id)
      .select()
      .single();

    if (finalCloseError) {
      console.error('❌ Failed to close shift:', finalCloseError);
    } else {
      console.log('✅ Shift closed successfully');
      console.log(`Closed at: ${finalShift.closed_at}\n`);
    }

    // Test 7: Verify shift data is preserved
    console.log('Test 7: Verify shift data is preserved');
    const { data: preservedShift } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', shift.id)
      .single();

    if (preservedShift) {
      console.log('✅ Shift data preserved');
      console.log(`Status: ${preservedShift.status}`);
      console.log(`Closed at: ${preservedShift.closed_at}\n`);
    } else {
      console.log('❌ Shift data not found\n');
    }

    // Cleanup
    console.log('Cleaning up test data...');
    await supabase.from('sessions').delete().eq('id', session.id);
    await supabase.from('shifts').delete().eq('id', shift.id);
    console.log('✅ Cleanup complete\n');

    console.log('=== All database tests completed ===');
    console.log('\nNote: API-level validations (rejecting duplicate shifts,');
    console.log('rejecting shift close with active sessions) are implemented');
    console.log('in the API routes and should be tested in the browser.');

  } catch (error) {
    console.error('Test error:', error);
  }
}

runTests();
