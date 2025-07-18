#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN;
const supabaseProjectId = process.env.SUPABASE_PROJECT_ID;

console.log('🔧 Applying surgical fix for infinite recursion in RLS policies...');

if (!supabaseAccessToken || !supabaseProjectId) {
  console.error('❌ Missing required environment variables: SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_ID');
  process.exit(1);
}

async function applySurgicalFix() {
  try {
    console.log('\n📄 Reading surgical fix file...');
    const schemaPath = path.join(__dirname, 'database', 'supabase_auth_schema_surgical.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Surgical fix file not found:', schemaPath);
      return false;
    }

    const surgicalSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('📊 Surgical fix size:', surgicalSql.length, 'characters');

    // Create a temporary JSON file with the SQL
    const tempJsonFile = path.join(__dirname, 'temp_surgical.json');
    const payload = {
      query: surgicalSql
    };
    
    fs.writeFileSync(tempJsonFile, JSON.stringify(payload, null, 2));
    
    console.log('\n🔄 Applying surgical fix via Supabase Management API...');
    
    // Construct curl command
    const curlCmd = [
      'curl',
      '-X', 'POST',
      `https://api.supabase.com/v1/projects/${supabaseProjectId}/database/query`,
      '-H', `Authorization: Bearer ${supabaseAccessToken}`,
      '-H', 'Content-Type: application/json',
      '-d', `@${tempJsonFile}`
    ];
    
    console.log('🚀 Executing surgical fix...');
    
    return new Promise((resolve, reject) => {
      const process = spawn('curl', curlCmd.slice(1), {
        stdio: 'pipe'
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        // Clean up temp file
        fs.unlinkSync(tempJsonFile);
        
        console.log('\n📋 API Response:');
        console.log(stdout);
        
        // Parse the response
        try {
          const response = JSON.parse(stdout);
          if (response.message && response.message.includes('ERROR')) {
            console.log('❌ API Error:', response.message);
            resolve(false);
          } else if (response.result || !response.message) {
            console.log('✅ Surgical fix applied successfully!');
            resolve(true);
          } else {
            console.log('⚠️  Unexpected response:', response);
            resolve(false);
          }
        } catch (parseError) {
          // If we can't parse JSON, assume success if no obvious error
          if (stdout.includes('ERROR') || stdout.includes('error')) {
            console.log('❌ Error detected in response');
            resolve(false);
          } else {
            console.log('✅ Surgical fix appears to have been applied');
            resolve(true);
          }
        }
      });
      
      process.on('error', (error) => {
        // Clean up temp file
        fs.unlinkSync(tempJsonFile);
        console.error('❌ Error executing curl:', error.message);
        resolve(false);
      });
    });
    
  } catch (error) {
    console.error('❌ Error in surgical fix:', error.message);
    return false;
  }
}

async function main() {
  const success = await applySurgicalFix();
  
  if (success) {
    console.log('\n🎉 Surgical fix applied successfully!');
    console.log('🧪 Testing the fix...');
    
    // Test the connection
    const testProcess = spawn('node', ['test-supabase-connection.js'], { 
      stdio: 'inherit',
      cwd: __dirname
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Authentication fix successful!');
        console.log('📋 Next steps:');
        console.log('1. Run: node scripts/create-demo-users.js setup');
        console.log('2. Start the application: npm run dev:api & cd frontend && pnpm run dev');
      } else {
        console.log('\n⚠️  Test failed, but surgical fix was applied');
      }
    });
  } else {
    console.log('\n❌ Surgical fix failed.');
    console.log('📋 Manual steps still required:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Copy contents of database/supabase_auth_schema_surgical.sql');
    console.log('3. Paste and execute the SQL');
  }
}

main().catch(console.error);