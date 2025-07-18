#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function applySchema() {
  try {
    console.log('Reading fixed schema file...');
    const schemaPath = path.join(__dirname, 'database', 'supabase_auth_schema_fixed.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Applying schema using service role...');
    console.log('Schema length:', schemaSql.length, 'characters');
    
    // Split the SQL into individual statements
    const statements = schemaSql.split(';').filter(stmt => stmt.trim().length > 0);
    console.log('Total statements to execute:', statements.length);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length === 0) continue;
      
      console.log(`\nExecuting statement ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error(`Error in statement ${i + 1}:`, error);
        } else {
          console.log(`✓ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`Exception in statement ${i + 1}:`, err.message);
      }
    }
    
    console.log('\nSchema application completed!');
    
  } catch (error) {
    console.error('Error applying schema:', error);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function applySchemaDirectly() {
  try {
    console.log('Reading fixed schema file...');
    const schemaPath = path.join(__dirname, 'database', 'supabase_auth_schema_fixed.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Attempting direct SQL execution...');
    
    // Try to execute the entire schema at once
    const { data, error } = await supabase.from('pg_stat_activity').select('*').limit(1);
    
    if (error) {
      console.error('Direct execution not supported:', error);
      console.log('\nPlease copy the following SQL and paste it into the Supabase SQL Editor:');
      console.log('=' * 80);
      console.log(schemaSql);
      console.log('=' * 80);
    } else {
      console.log('Database connection confirmed. Please use the Supabase SQL Editor to execute the schema.');
    }
    
  } catch (error) {
    console.error('Error:', error);
    
    console.log('\nPlease copy the following SQL and paste it into the Supabase SQL Editor:');
    console.log('=' * 80);
    const schemaPath = path.join(__dirname, 'database', 'supabase_auth_schema_fixed.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log(schemaSql);
    console.log('=' * 80);
  }
}

console.log('Starting schema application...');
applySchemaDirectly().then(() => {
  console.log('\nSchema application process completed.');
}).catch(err => {
  console.error('Process failed:', err);
  process.exit(1);
});