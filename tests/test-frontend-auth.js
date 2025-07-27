#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🧪 Testing frontend authentication flow...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFrontendAuth() {
  try {
    // Test login
    console.log('\n🔐 Testing login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin1@test.com',
      password: 'admin1'
    });

    if (signInError) {
      console.error('❌ Login failed:', signInError.message);
      return false;
    }

    console.log('✅ Login successful!');
    console.log('👤 User:', signInData.user.email);
    console.log('🔑 Role:', signInData.user.user_metadata?.role);

    // Test accessing protected data
    console.log('\n📋 Testing protected data access...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, full_name')
      .eq('id', signInData.user.id)
      .single();

    if (userError) {
      console.error('❌ User data access failed:', userError.message);
    } else {
      console.log('✅ User data accessed successfully:', userData);
    }

    // Test categories access
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, color')
      .limit(3);

    if (categoriesError) {
      console.error('❌ Categories access failed:', categoriesError.message);
    } else {
      console.log('✅ Categories accessed successfully:', categories.length, 'categories');
    }

    // Sign out
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');

    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  console.log('🌐 Frontend URL: http://localhost:5173');
  console.log('🔗 API URL: http://localhost:3001');
  
  const success = await testFrontendAuth();
  
  if (success) {
    console.log('\n🎉 Frontend authentication is working correctly!');
    console.log('\n📋 To test the full application:');
    console.log('1. Open http://localhost:5173 in your browser');
    console.log('2. Login with:');
    console.log('   Email: admin1@test.com');
    console.log('   Password: admin1');
    console.log('3. You should see the dashboard with full admin access');
  } else {
    console.log('\n❌ Frontend authentication test failed');
  }
}

main().catch(console.error);