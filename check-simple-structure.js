#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkSimpleStructure() {
  console.log('🔍 Checking current database structure...');
  
  try {
    // Check current users data
    console.log('\n👥 Checking users table...');
    const { data: currentUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(2);
    
    if (usersError) {
      console.error('❌ Error checking users data:', usersError);
    } else {
      console.log('✅ Users table exists with', currentUsers.length, 'records');
      if (currentUsers.length > 0) {
        console.log('🔍 Sample user columns:', Object.keys(currentUsers[0]));
        console.log('📋 Sample user data:');
        currentUsers.forEach(user => {
          console.log(`  ${user.email} (${user.role || 'no role'}) - ID: ${user.id}`);
        });
      }
    }
    
    // Check categories table
    console.log('\n📂 Checking categories table...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(2);
    
    if (categoriesError) {
      console.error('❌ Error checking categories:', categoriesError);
    } else {
      console.log('✅ Categories table exists with', categories.length, 'records');
    }
    
    // Check expenses table
    console.log('\n💰 Checking expenses table...');
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .limit(2);
    
    if (expensesError) {
      console.error('❌ Error checking expenses:', expensesError);
    } else {
      console.log('✅ Expenses table exists with', expenses.length, 'records');
    }
    
    // Check auth users
    console.log('\n🔐 Checking auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error checking auth users:', authError);
    } else {
      console.log('✅ Auth system has', authUsers.users.length, 'users');
      authUsers.users.forEach(user => {
        console.log(`  ${user.email} - ID: ${user.id}`);
        console.log(`    Metadata: ${JSON.stringify(user.user_metadata)}`);
      });
    }
    
    // Test the current infinite recursion issue
    console.log('\n🧪 Testing current authentication (should show infinite recursion)...');
    const { data: testUsers, error: testError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('❌ Current error (expected):', testError.message);
      if (testError.message.includes('infinite recursion')) {
        console.log('✅ Confirmed: Infinite recursion issue exists');
      }
    } else {
      console.log('⚠️  No error? This is unexpected:', testUsers);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkSimpleStructure();