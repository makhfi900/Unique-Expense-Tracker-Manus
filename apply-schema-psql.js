#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseDbPassword = process.env.SUPABASE_DB_PASSWORD;
const supabaseProjectId = process.env.SUPABASE_PROJECT_ID;

console.log('🐘 Attempting to apply schema via direct PostgreSQL connection...');

if (!supabaseUrl || !supabaseDbPassword || !supabaseProjectId) {
  console.error('❌ Missing required environment variables for PostgreSQL connection');
  process.exit(1);
}

// Extract database connection details from Supabase URL
const dbHost = `db.${supabaseProjectId}.supabase.co`;
const dbPort = '5432';
const dbName = 'postgres';
const dbUser = 'postgres';
const dbPassword = supabaseDbPassword;

console.log('📡 Connection details:');
console.log('Host:', dbHost);
console.log('Port:', dbPort);
console.log('Database:', dbName);
console.log('User:', dbUser);

async function applySchemaWithPsql() {
  try {
    console.log('\n📄 Reading schema file...');
    const schemaPath = path.join(__dirname, 'database', 'supabase_auth_schema_fixed.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath);
      return false;
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('📊 Schema size:', schemaSql.length, 'characters');

    console.log('\n🔄 Attempting to connect to PostgreSQL...');
    
    // Create a temporary file for the SQL
    const tempSqlFile = path.join(__dirname, 'temp_schema.sql');
    fs.writeFileSync(tempSqlFile, schemaSql);
    
    // Try to execute using psql command
    const psqlCmd = [
      'psql',
      '-h', dbHost,
      '-p', dbPort,
      '-U', dbUser,
      '-d', dbName,
      '-f', tempSqlFile
    ];
    
    console.log('🚀 Executing command:', psqlCmd.join(' '));
    
    return new Promise((resolve, reject) => {
      const process = spawn(psqlCmd[0], psqlCmd.slice(1), {
        stdio: 'pipe',
        env: { ...process.env, PGPASSWORD: dbPassword }
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
        fs.unlinkSync(tempSqlFile);
        
        console.log('\n📋 Command output:');
        if (stdout) console.log('STDOUT:', stdout);
        if (stderr) console.log('STDERR:', stderr);
        
        if (code === 0) {
          console.log('✅ Schema applied successfully via psql!');
          resolve(true);
        } else {
          console.log('❌ psql command failed with code:', code);
          resolve(false);
        }
      });
      
      process.on('error', (error) => {
        // Clean up temp file
        fs.unlinkSync(tempSqlFile);
        console.error('❌ Error spawning psql:', error.message);
        resolve(false);
      });
    });
    
  } catch (error) {
    console.error('❌ Error in psql method:', error.message);
    return false;
  }
}

async function checkPsqlAvailability() {
  return new Promise((resolve) => {
    const process = spawn('psql', ['--version'], { stdio: 'pipe' });
    
    process.on('close', (code) => {
      resolve(code === 0);
    });
    
    process.on('error', () => {
      resolve(false);
    });
  });
}

async function main() {
  console.log('🔍 Checking if psql is available...');
  const psqlAvailable = await checkPsqlAvailability();
  
  if (!psqlAvailable) {
    console.log('❌ psql command not found. Please install PostgreSQL client tools.');
    console.log('   Ubuntu/Debian: sudo apt-get install postgresql-client');
    console.log('   macOS: brew install postgresql');
    console.log('   Windows: Download from https://www.postgresql.org/download/');
    console.log('\n📋 Alternative: Manual application via Supabase Dashboard');
    return;
  }
  
  console.log('✅ psql is available');
  
  const success = await applySchemaWithPsql();
  
  if (success) {
    console.log('\n🎉 Schema application successful!');
    console.log('🧪 Now testing the connection...');
    
    // Test the connection
    const { spawn } = require('child_process');
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