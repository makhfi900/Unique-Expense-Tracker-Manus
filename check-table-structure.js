#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkTableStructure() {
  console.log('🔍 Checking current table structure...');
  
  try {
    // Check what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'categories', 'expenses', 'login_activities']);
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
      return;
    }
    
    console.log('📋 Existing tables:', tables.map(t => t.table_name));
    
    // Check users table structure
    const { data: userColumns, error: userColumnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'users');
    
    if (userColumnsError) {
      console.error('❌ Error checking users table structure:', userColumnsError);
    } else {
      console.log('\n🏗️  Users table structure:');
      userColumns.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}) default: ${col.column_default}`);
      });
    }
    
    // Check current users data
    const { data: currentUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, full_name, created_at')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Error checking users data:', usersError);
    } else {
      console.log('\n👥 Current users:');
      currentUsers.forEach(user => {
        console.log(`  ${user.email} (${user.role}) - ID: ${user.id}`);
      });
    }
    
    // Check auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error checking auth users:', authError);
    } else {
      console.log('\n🔐 Auth users:');
      authUsers.users.forEach(user => {
        console.log(`  ${user.email} - ID: ${user.id}`);
        console.log(`    Metadata: ${JSON.stringify(user.user_metadata)}`);
      });
    }
    
    // Check current policies
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('schemaname, tablename, policyname, roles, cmd, qual')
      .eq('schemaname', 'public');
    
    if (policiesError) {
      console.error('❌ Error checking policies:', policiesError);
    } else {
      console.log('\n🔒 Current RLS policies:');
      policies.forEach(policy => {
        console.log(`  ${policy.tablename}.${policy.policyname} (${policy.cmd})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTableStructure();