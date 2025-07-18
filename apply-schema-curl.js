#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN;
const supabaseProjectId = process.env.SUPABASE_PROJECT_ID;

console.log('🌐 Attempting to apply schema via Supabase Management API with curl...');

if (!supabaseAccessToken || !supabaseProjectId) {
  console.error('❌ Missing required environment variables: SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_ID');
  process.exit(1);
}

async function applySchemaWithCurl() {
  try {
    console.log('\n📄 Reading schema file...');
    const schemaPath = path.join(__dirname, 'database', 'supabase_auth_schema_fixed.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath);
      return false;
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('📊 Schema size:', schemaSql.length, 'characters');

    // Create a temporary JSON file with the SQL
    const tempJsonFile = path.join(__dirname, 'temp_schema.json');
    const payload = {
      query: schemaSql
    };
    
    fs.writeFileSync(tempJsonFile, JSON.stringify(payload, null, 2));
    
    console.log('\n🔄 Attempting to send request to Supabase Management API...');
    
    // Construct curl command
    const curlCmd = [
      'curl',
      '-X', 'POST',
      `https://api.supabase.com/v1/projects/${supabaseProjectId}/database/query`,
      '-H', `Authorization: Bearer ${supabaseAccessToken}`,
      '-H', 'Content-Type: application/json',
      '-d', `@${tempJsonFile}`,
      '-v'
    ];
    
    console.log('🚀 Executing curl command...');
    
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
        console.log('STDOUT:', stdout);
        if (stderr) console.log('STDERR:', stderr);
        
        // Parse the response
        try {
          const response = JSON.parse(stdout);
          if (response.error) {
            console.log('❌ API Error:', response.error);
            resolve(false);
          } else if (response.result) {
            console.log('✅ Schema applied successfully via Management API!');
            resolve(true);
          } else {
            console.log('⚠️  Unexpected response format');
            resolve(false);
          }
        } catch (parseError) {
          console.log('❌ Could not parse API response:', parseError.message);
          resolve(false);
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
    console.error('❌ Error in curl method:', error.message);
    return false;
  }
}

async function checkCurlAvailability() {
  return new Promise((resolve) => {
    const process = spawn('curl', ['--version'], { stdio: 'pipe' });
    
    process.on('close', (code) => {
      resolve(code === 0);
    });
    
    process.on('error', () => {
      resolve(false);
    });
  });
}

async function main() {
  console.log('🔍 Checking if curl is available...');
  const curlAvailable = await checkCurlAvailability();
  
  if (!curlAvailable) {
    console.log('❌ curl command not found.');
    return;
  }
  
  console.log('✅ curl is available');
  
  const success = await applySchemaWithCurl();
  
  if (success) {
    console.log('\n🎉 Schema application successful!');
    console.log('🧪 Now testing the connection...');
    
    // Test the connection
    spawn('node', ['test-supabase-connection.js'], { stdio: 'inherit' });
  } else {
    console.log('\n❌ Schema application failed.');
    console.log('📋 Manual steps required:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Copy contents of database/supabase_auth_schema_fixed.sql');
    console.log('3. Paste and execute the SQL');
  }
}

main().catch(console.error);