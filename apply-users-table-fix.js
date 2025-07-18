#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN;
const supabaseProjectId = process.env.SUPABASE_PROJECT_ID;

console.log('🔧 Fixing users table structure and creating user profile...');

async function applyUsersTableFix() {
  try {
    console.log('\n📄 Reading users table fix...');
    const sqlPath = path.join(__dirname, 'database', 'fix_users_table.sql');
    
    if (!fs.existsSync(sqlPath)) {
      console.error('❌ Users table fix file not found:', sqlPath);
      return false;
    }

    const fixSql = fs.readFileSync(sqlPath, 'utf8');
    console.log('📊 Fix size:', fixSql.length, 'characters');

    // Create a temporary JSON file with the SQL
    const tempJsonFile = path.join(__dirname, 'temp_users_fix.json');
    const payload = {
      query: fixSql
    };
    
    fs.writeFileSync(tempJsonFile, JSON.stringify(payload, null, 2));
    
    console.log('\n🔄 Applying users table fix...');
    
    // Construct curl command
    const curlCmd = [
      'curl',
      '-X', 'POST',
      `https://api.supabase.com/v1/projects/${supabaseProjectId}/database/query`,
      '-H', `Authorization: Bearer ${supabaseAccessToken}`,
      '-H', 'Content-Type: application/json',
      '-d', `@${tempJsonFile}`,
      '-s'  // Silent mode
    ];
    
    console.log('🚀 Executing users table fix...');
    
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
          } else {
            console.log('✅ Users table fix applied successfully!');
            resolve(true);
          }
        } catch (parseError) {
          // If we can't parse JSON, check for obvious errors
          if (stdout.includes('ERROR') || stdout.includes('error')) {
            console.log('❌ Error detected in response');
            resolve(false);
          } else {
            console.log('✅ Users table fix appears successful');
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
    console.error('❌ Error in users table fix:', error.message);
    return false;
  }
}

async function main() {
  const success = await applyUsersTableFix();
  
  if (success) {
    console.log('\n🎉 Users table fix applied successfully!');
    console.log('🧪 Testing the authentication system...');
    
    // Test the connection
    const testProcess = spawn('node', ['test-supabase-connection.js'], { 
      stdio: 'inherit',
      cwd: __dirname
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Authentication system working!');
        console.log('📋 Next steps:');
        console.log('1. Run: node scripts/create-demo-users.js setup');
        console.log('2. Start the application');
      } else {
        console.log('\n⚠️  Test may have failed, but users table fix was applied');
      }
    });
  } else {
    console.log('\n❌ Users table fix failed.');
  }
}

main().catch(console.error);