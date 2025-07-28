#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

async function testRealLoginTracking() {
  console.log('🧪 Testing Real Login Activity Tracking');
  console.log('=====================================\n');

  // Get initial count of login activities
  const { data: initialData, count: initialCount } = await supabase
    .from('login_activities')
    .select('*', { count: 'exact' });
  
  console.log('📊 Initial login activities count:', initialCount);

  // Test successful login
  console.log('\n1. 🔐 Testing successful login tracking...');
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'admin1@test.com',
    password: 'admin123'
  });

  if (loginError) {
    console.log('❌ Login failed:', loginError.message);
  } else {
    console.log('✅ Login successful');
    
    // Wait a moment for the login activity to be recorded
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if new login activity was recorded
    const { data: newData, count: newCount } = await supabase
      .from('login_activities')
      .select('*', { count: 'exact' })
      .order('login_time', { ascending: false })
      .limit(1);
    
    console.log('📊 New login activities count:', newCount);
    
    if (newCount > initialCount) {
      console.log('✅ Login activity recorded successfully!');
      const latestActivity = newData[0];
      console.log('📋 Latest activity details:');
      console.log('   User ID:', latestActivity.user_id);
      console.log('   Success:', latestActivity.success);
      console.log('   Device:', latestActivity.device_type);
      console.log('   Browser:', latestActivity.browser);
      console.log('   OS:', latestActivity.operating_system);
      console.log('   Time:', latestActivity.login_time);
    } else {
      console.log('❌ Login activity was not recorded');
    }
  }

  // Test failed login
  console.log('\n2. 🚫 Testing failed login tracking...');
  const { error: failedLoginError } = await supabase.auth.signInWithPassword({
    email: 'admin1@test.com',
    password: 'wrongpassword'
  });

  if (failedLoginError) {
    console.log('✅ Failed login detected:', failedLoginError.message);
    
    // Wait a moment for the failed login activity to be recorded
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if failed login activity was recorded
    const { data: failedData } = await supabase
      .from('login_activities')
      .select('*')
      .eq('success', false)
      .order('login_time', { ascending: false })
      .limit(1);
    
    if (failedData && failedData.length > 0) {
      console.log('✅ Failed login activity recorded successfully!');
      const failedActivity = failedData[0];
      console.log('📋 Failed activity details:');
      console.log('   User ID:', failedActivity.user_id);
      console.log('   Success:', failedActivity.success);
      console.log('   Failure reason:', failedActivity.failure_reason);
      console.log('   Time:', failedActivity.login_time);
    } else {
      console.log('❌ Failed login activity was not recorded');
    }
  }

  // Test cleanup functionality
  console.log('\n3. 🧹 Testing cleanup functionality...');
  
  // First, ensure we're logged in as admin
  if (loginData && !loginError) {
    try {
      const token = loginData.session.access_token;
      const response = await fetch('http://localhost:3001/api/login-activities/cleanup', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Cleanup successful:', result.message);
      } else {
        const errorText = await response.text();
        console.log('❌ Cleanup failed:', errorText);
      }
    } catch (err) {
      console.log('❌ Cleanup network error:', err.message);
    }
  }

  // Final count
  const { count: finalCount } = await supabase
    .from('login_activities')
    .select('*', { count: 'exact' });
  
  console.log('\n📊 Final login activities count:', finalCount);

  // Sign out
  await supabase.auth.signOut();
  console.log('\n✅ Test completed and signed out');
}

testRealLoginTracking().catch(console.error);