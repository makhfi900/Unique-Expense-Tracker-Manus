#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function setDemoPassword() {
  console.log('🔐 Setting up demo account password...');
  
  try {
    // Get the existing admin user
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      return false;
    }
    
    const adminUser = users.users.find(user => user.email === 'admin@test.com');
    
    if (!adminUser) {
      console.error('❌ Admin user not found');
      return false;
    }
    
    console.log('👤 Found admin user:', adminUser.email);
    
    // Set the password to "admin123"
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      {
        password: 'admin123',
        user_metadata: {
          role: 'admin',
          full_name: 'System Administrator'
        }
      }
    );
    
    if (updateError) {
      console.error('❌ Error setting password:', updateError);
      return false;
    }
    
    console.log('✅ Password set successfully!');
    
    // Test the login
    console.log('\n🧪 Testing login with new password...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    if (signInError) {
      console.error('❌ Login test failed:', signInError.message);
      return false;
    }
    
    console.log('✅ Login test successful!');
    console.log('👤 User:', signInData.user.email);
    console.log('🔑 Role:', signInData.user.user_metadata?.role);
    
    // Sign out to clean up
    await supabase.auth.signOut();
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  const success = await setDemoPassword();
  
  if (success) {
    console.log('\n🎉 Demo account setup complete!');
    console.log('\n📋 Login Credentials:');
    console.log('┌─────────────────────────────────────┐');
    console.log('│ Email:    admin@test.com            │');
    console.log('│ Password: admin123                  │');
    console.log('│ Role:     admin                     │');
    console.log('└─────────────────────────────────────┘');
    
    console.log('\n🚀 Ready to start the application!');
    console.log('Run: npm run dev:api & cd frontend && pnpm run dev');
  } else {
    console.log('\n❌ Demo account setup failed');
  }
}

main().catch(console.error);