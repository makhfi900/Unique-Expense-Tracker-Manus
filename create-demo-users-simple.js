#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createDemoUsers() {
  console.log('🚀 Creating demo users with simple approach...\n');

  // First, update the existing admin@test.com to be a proper admin
  console.log('🔧 Updating existing admin user...');
  try {
    // Update the auth user metadata
    const { data: authUpdate, error: authError } = await supabase.auth.admin.updateUserById(
      'a3fc8908-d1b2-40f1-bb5f-8df90be90102',
      {
        user_metadata: {
          role: 'admin',
          full_name: 'System Administrator'
        }
      }
    );
    
    if (authError) {
      console.error('❌ Error updating auth user:', authError);
    } else {
      console.log('✅ Auth user updated successfully');
    }
    
    // Update the profile in users table
    const { data: profileUpdate, error: profileError } = await supabase
      .from('users')
      .update({
        role: 'admin',
        full_name: 'System Administrator'
      })
      .eq('id', 'a3fc8908-d1b2-40f1-bb5f-8df90be90102');
    
    if (profileError) {
      console.error('❌ Error updating user profile:', profileError);
    } else {
      console.log('✅ User profile updated successfully');
    }
    
  } catch (error) {
    console.error('❌ Error updating admin user:', error);
  }
  
  // Create additional demo users
  const demoUsers = [
    {
      email: 'admin@expensetracker.com',
      password: 'admin123',
      user_metadata: {
        full_name: 'Admin User',
        role: 'admin'
      }
    },
    {
      email: 'officer@expensetracker.com',
      password: 'officer123',
      user_metadata: {
        full_name: 'Account Officer',
        role: 'account_officer'
      }
    }
  ];

  for (const userData of demoUsers) {
    try {
      console.log(`\n📝 Creating user: ${userData.email}...`);
      
      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: userData.user_metadata,
        email_confirm: true
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`⚠️  User ${userData.email} already exists`);
        } else {
          console.error(`❌ Error creating auth user ${userData.email}:`, authError.message);
        }
      } else {
        console.log(`✅ Auth user created: ${userData.email}`);
        
        // Create profile (this should be handled by the trigger, but let's make sure)
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .upsert({
            id: authUser.user.id,
            email: userData.email,
            full_name: userData.user_metadata.full_name,
            role: userData.user_metadata.role,
            password_hash: null,
            is_active: true
          }, {
            onConflict: 'id'
          });
        
        if (profileError) {
          console.error(`❌ Error creating profile for ${userData.email}:`, profileError);
        } else {
          console.log(`✅ Profile created for ${userData.email}`);
        }
      }
    } catch (error) {
      console.error(`❌ Unexpected error creating ${userData.email}:`, error.message);
    }
  }

  // List all users
  console.log('\n📋 Current demo users:');
  try {
    const { data: allUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
    } else {
      allUsers.users.forEach(user => {
        console.log(`✅ ${user.email} (${user.user_metadata?.role || 'no role'})`);
      });
    }
  } catch (error) {
    console.error('❌ Error listing users:', error);
  }
  
  console.log('\n🎉 Demo users setup complete!');
  console.log('\n📋 Login Credentials:');
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ Admin User (original):                                  │');
  console.log('│   Email: admin@test.com                                │');
  console.log('│   Password: [Use Supabase password reset]              │');
  console.log('│   Role: admin                                          │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log('│ Admin User (new):                                       │');
  console.log('│   Email: admin@expensetracker.com                      │');
  console.log('│   Password: admin123                                   │');
  console.log('│   Role: admin                                          │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log('│ Account Officer:                                        │');
  console.log('│   Email: officer@expensetracker.com                    │');
  console.log('│   Password: officer123                                 │');
  console.log('│   Role: account_officer                                │');
  console.log('└─────────────────────────────────────────────────────────┘');
}

createDemoUsers().catch(console.error);