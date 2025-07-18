#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔍 Debugging Role Detection Issue...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugRoleIssue() {
  try {
    // Step 1: Login as admin
    console.log('\n1. 🔐 Logging in as admin...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123'
    });

    if (signInError) {
      console.error('❌ Login failed:', signInError.message);
      return;
    }

    console.log('✅ Login successful');
    
    // Step 2: Check user metadata
    console.log('\n2. 📋 Checking user metadata...');
    const user = signInData.user;
    console.log('User ID:', user.id);
    console.log('User Email:', user.email);
    console.log('User Metadata:', JSON.stringify(user.user_metadata, null, 2));
    console.log('App Metadata:', JSON.stringify(user.app_metadata, null, 2));
    
    // Step 3: Check role detection logic
    console.log('\n3. 🔍 Testing role detection logic...');
    const isAdmin = user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin';
    const isAccountOfficer = user?.user_metadata?.role === 'account_officer' || user?.app_metadata?.role === 'account_officer';
    
    console.log('Role detection results:');
    console.log('- isAdmin:', isAdmin);
    console.log('- isAccountOfficer:', isAccountOfficer);
    console.log('- user_metadata.role:', user?.user_metadata?.role);
    console.log('- app_metadata.role:', user?.app_metadata?.role);
    
    // Step 4: Check database user profile
    console.log('\n4. 🗄️ Checking database user profile...');
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (dbError) {
      console.error('❌ Database query failed:', dbError.message);
    } else {
      console.log('Database user profile:', JSON.stringify(dbUser, null, 2));
      console.log('Database role:', dbUser.role);
    }
    
    // Step 5: Test what frontend would see
    console.log('\n5. 🎭 Frontend role detection simulation...');
    
    // Simulating the exact logic from SupabaseAuthContext
    const frontendIsAdmin = user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin';
    const frontendIsAccountOfficer = user?.user_metadata?.role === 'account_officer' || user?.app_metadata?.role === 'account_officer';
    
    console.log('Frontend would detect:');
    console.log('- isAdmin:', frontendIsAdmin);
    console.log('- isAccountOfficer:', frontendIsAccountOfficer);
    
    if (frontendIsAdmin) {
      console.log('✅ Frontend SHOULD show admin role');
    } else if (frontendIsAccountOfficer) {
      console.log('❌ Frontend INCORRECTLY shows account officer role');
    } else {
      console.log('⚠️  Frontend shows no role');
    }
    
    // Step 6: Test session state
    console.log('\n6. 🔄 Testing session state...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message);
    } else {
      console.log('Session user metadata:', JSON.stringify(session?.user?.user_metadata, null, 2));
    }
    
    // Sign out
    await supabase.auth.signOut();
    console.log('\n✅ Signed out successfully');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugRoleIssue();