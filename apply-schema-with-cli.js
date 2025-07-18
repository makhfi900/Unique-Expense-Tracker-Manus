#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN;
const supabaseDbPassword = process.env.SUPABASE_DB_PASSWORD;
const supabaseProjectId = process.env.SUPABASE_PROJECT_ID;

console.log('🔧 Attempting to apply schema with available credentials...');
console.log('Project ID:', supabaseProjectId);
console.log('Has Access Token:', !!supabaseAccessToken);
console.log('Has DB Password:', !!supabaseDbPassword);

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function applySchemaViaAPI() {
  try {
    console.log('\n📄 Reading fixed schema file...');
    const schemaPath = path.join(__dirname, 'database', 'supabase_auth_schema_fixed.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📊 Schema length:', schemaSql.length, 'characters');
    
    // Try using Supabase Management API
    if (supabaseAccessToken && supabaseProjectId) {
      console.log('\n🔑 Attempting to use Supabase Management API...');
      
      const postData = JSON.stringify({
        sql: schemaSql
      });
      
      const options = {
        hostname: 'api.supabase.com',
        port: 443,
        path: `/v1/projects/${supabaseProjectId}/database/query`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAccessToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            console.log('Status:', res.statusCode);
            console.log('Response:', data);
            
            if (res.statusCode === 200) {
              console.log('✅ Schema applied successfully via Management API!');
              resolve(true);
            } else {
              console.log('❌ Management API failed, trying alternative method...');
              resolve(false);
            }
          });
        });
        
        req.on('error', (error) => {
          console.error('❌ Management API error:', error.message);
          resolve(false);
        });
        
        req.write(postData);
        req.end();
      });
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error in API method:', error.message);
    return false;
  }
}

async function applySchemaViaRPC() {
  try {
    console.log('\n🔄 Attempting to apply schema via RPC...');
    
    const schemaPath = path.join(__dirname, 'database', 'supabase_auth_schema_fixed.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = schemaSql.split(';').filter(stmt => stmt.trim().length > 0);
    console.log('📋 Total statements to execute:', statements.length);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length === 0) continue;
      
      console.log(`\n⏳ Executing statement ${i + 1}/${statements.length}:`);
      console.log('🔍', statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
      
      try {
        // Try to execute via a custom function that bypasses RLS
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          errorCount++;
          
          // If it's a "function does not exist" error, try direct execution
          if (error.message.includes('function public.exec_sql')) {
            console.log('🔄 Trying direct execution...');
            
            // For certain statements, we can try direct table operations
            if (statement.includes('CREATE TABLE') || statement.includes('INSERT INTO')) {
              console.log('⚠️  Skipping CREATE TABLE/INSERT - needs manual execution');
            }
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Execution Summary:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    
    return successCount > 0;
    
  } catch (error) {
    console.error('❌ Error in RPC method:', error.message);
    return false;
  }
}

async function applySchemaViaDirectSQL() {
  try {
    console.log('\n🎯 Attempting direct SQL execution...');
    
    const schemaPath = path.join(__dirname, 'database', 'supabase_auth_schema_fixed.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Try to execute the schema directly through the supabase client
    const { data, error } = await supabase.from('_').select('*').limit(0);
    
    if (error) {
      console.log('❌ Direct SQL not supported:', error.message);
      return false;
    }
    
    console.log('✅ Direct SQL method might work, but needs implementation');
    return false;
    
  } catch (error) {
    console.error('❌ Error in direct SQL method:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting schema application process...\n');
  
  // Try different methods in order of preference
  const methods = [
    { name: 'Management API', func: applySchemaViaAPI },
    { name: 'RPC Method', func: applySchemaViaRPC },
    { name: 'Direct SQL', func: applySchemaViaDirectSQL }
  ];
  
  for (const method of methods) {
    console.log(`\n🔧 Trying ${method.name}...`);
    const success = await method.func();
    
    if (success) {
      console.log(`\n🎉 Schema applied successfully via ${method.name}!`);
      
      // Test the fix
      console.log('\n🧪 Testing the fix...');
      const { data, error } = await supabase.from('users').select('*').limit(1);
      
      if (error) {
        console.log('❌ Post-application test failed:', error.message);
        if (error.message.includes('infinite recursion')) {
          console.log('⚠️  Infinite recursion still present - schema may need manual application');
        }
      } else {
        console.log('✅ Post-application test passed! Authentication should work now.');
      }
      
      return;
    }
  }
  
  console.log('\n❌ All automatic methods failed. Manual application required.');
  console.log('\n📋 Manual Steps:');
  console.log('1. Go to Supabase Dashboard → SQL Editor');
  console.log('2. Copy contents of database/supabase_auth_schema_fixed.sql');
  console.log('3. Paste and execute the SQL');
  console.log('4. Run: node test-supabase-connection.js');
  console.log('5. Run: node scripts/create-demo-users.js setup');
}

main().catch(console.error);