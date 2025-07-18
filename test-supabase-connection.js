#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Anon Key exists:', !!supabaseAnonKey);
console.log('Service Role Key exists:', !!supabaseServiceRoleKey);

// Test with anon key
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Test with service role key
const supabaseService = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testConnection() {
  console.log('\n=== Testing Anon Connection ===');
  try {
    const { data, error } = await supabaseAnon.from('users').select('*').limit(1);
    console.log('Anon query result:', { data, error });
  } catch (err) {
    console.error('Anon connection error:', err.message);
  }

  console.log('\n=== Testing Service Role Connection ===');
  try {
    const { data, error } = await supabaseService.from('users').select('*').limit(1);
    console.log('Service role query result:', { data, error });
  } catch (err) {
    console.error('Service role connection error:', err.message);
  }

  console.log('\n=== Testing Schema Check ===');
  try {
    const { data, error } = await supabaseService.rpc('version');
    console.log('Database version:', { data, error });
  } catch (err) {
    console.error('Schema check error:', err.message);
  }

  console.log('\n=== Testing Auth Users Table ===');
  try {
    const { data, error } = await supabaseService.auth.admin.listUsers();
    console.log('Auth users count:', data?.users?.length || 0);
    console.log('Auth users:', data?.users?.map(u => ({ id: u.id, email: u.email })) || []);
  } catch (err) {
    console.error('Auth users check error:', err.message);
  }
}

testConnection().then(() => {
  console.log('\nConnection test completed.');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});