#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTestUsers() {
  console.log('🔍 CHECKING TEST USER STATUS');
  console.log('============================');
  
  // Check users table
  console.log('\n📊 Users in database table:');
  const { data: dbUsers, error: dbError } = await supabaseAdmin
    .from('users')
    .select('id, email, role, is_active')
    .order('email');
    
  if (dbError) {
    console.log('   ❌ Error fetching database users:', dbError.message);
  } else {
    dbUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - Active: ${user.is_active}`);
    });
  }
  
  // Check auth.users (Supabase Auth)
  console.log('\n🔐 Users in Supabase Auth:');
  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.log('   ❌ Error fetching auth users:', authError.message);
    } else {
      if (authData.users && authData.users.length > 0) {
        authData.users.forEach(user => {
          console.log(`   - ${user.email} (ID: ${user.id.substring(0, 8)}...)`);
        });
      } else {
        console.log('   ⚠️  No users found in Supabase Auth');
      }
    }
  } catch (error) {
    console.log('   ❌ Auth API error:', error.message);
  }
  
  // Test creating admin user if missing
  console.log('\n🔧 Creating test admin user if missing...');
  try {
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin1@test.com',
      password: 'admin1',
      user_metadata: {
        full_name: 'Admin User',
        role: 'admin'
      },
      email_confirm: true
    });
    
    if (createError) {
      if (createError.message.includes('already registered')) {
        console.log('   ✅ Admin user already exists in Auth');
      } else {
        console.log('   ❌ Error creating admin user:', createError.message);
      }
    } else {
      console.log('   ✅ Admin user created successfully');
    }
  } catch (error) {
    console.log('   ❌ Create user error:', error.message);
  }
  
  // Test login
  console.log('\n🔐 Testing login with admin1@test.com...');
  const supabaseClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
    email: 'admin1@test.com',
    password: 'admin1'
  });
  
  if (loginError) {
    console.log('   ❌ Login failed:', loginError.message);
  } else {
    console.log('   ✅ Login successful!');
    console.log('   📋 User ID:', loginData.user.id);
    
    // Sign out
    await supabaseClient.auth.signOut();
  }
}

checkTestUsers().catch(console.error);