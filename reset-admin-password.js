#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetAdminPassword() {
  console.log('🔧 RESETTING ADMIN PASSWORD');
  console.log('============================');
  
  try {
    // Get the admin user ID first
    const { data: authData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.log('❌ Error listing users:', listError.message);
      return;
    }
    
    const adminUser = authData.users.find(user => user.email === 'admin1@test.com');
    
    if (!adminUser) {
      console.log('❌ Admin user not found in Auth');
      return;
    }
    
    console.log('✅ Found admin user:', adminUser.id);
    
    // Update the password
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      adminUser.id,
      {
        password: 'admin123'
      }
    );
    
    if (updateError) {
      console.log('❌ Error updating password:', updateError.message);
    } else {
      console.log('✅ Password updated successfully');
    }
    
    // Test login
    console.log('\n🔐 Testing login with new password...');
    const supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: 'admin1@test.com',
      password: 'admin123'
    });
    
    if (loginError) {
      console.log('   ❌ Login still failed:', loginError.message);
    } else {
      console.log('   ✅ Login successful with reset password!');
      await supabaseClient.auth.signOut();
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

resetAdminPassword().catch(console.error);