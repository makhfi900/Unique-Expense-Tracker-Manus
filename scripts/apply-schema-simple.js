#!/usr/bin/env node

/**
 * Simple Settings Schema Application
 * Applies schema via Supabase client with direct SQL execution
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const SQL_STATEMENTS = [
  // Enable UUID extension
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
  
  // Create roles table
  `CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
  );`,
  
  // Create role_permissions table
  `CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_name VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    granted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(role_id, permission_name, resource_type, resource_id)
  );`,
  
  // Create feature_visibility table
  `CREATE TABLE IF NOT EXISTS feature_visibility (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    app_id VARCHAR(50) NOT NULL,
    feature_id VARCHAR(100) NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE,
    is_enabled BOOLEAN DEFAULT TRUE,
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    UNIQUE(role_id, app_id, feature_id)
  );`,
  
  // Create user_roles table
  `CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    is_primary BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, role_id)
  );`,
  
  // Create settings_audit_log table
  `CREATE TABLE IF NOT EXISTS settings_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
  );`,
  
  // Create indexes
  `CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);`,
  `CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(is_active);`,
  `CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);`,
  `CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);`,
  
  // Enable RLS
  `ALTER TABLE roles ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE feature_visibility ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE settings_audit_log ENABLE ROW LEVEL SECURITY;`
];

async function executeSQLStatements() {
  console.log('🚀 Applying Settings schema to Supabase...');
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < SQL_STATEMENTS.length; i++) {
    const statement = SQL_STATEMENTS[i];
    console.log(`⚡ Executing statement ${i + 1}/${SQL_STATEMENTS.length}`);
    
    try {
      // Use the REST API to execute SQL
      const { data, error } = await supabase.rpc('exec', { 
        sql: statement 
      });
      
      if (error) {
        console.log(`⚠️ Statement ${i + 1}: ${error.message}`);
        if (!error.message.includes('already exists')) {
          errorCount++;
        }
      } else {
        successCount++;
      }
      
    } catch (err) {
      console.log(`⚠️ Statement ${i + 1}: ${err.message}`);
      if (!err.message.includes('already exists')) {
        errorCount++;
      }
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 Results: ${successCount} successful, ${errorCount} errors`);
  return errorCount === 0;
}

async function seedDefaultRoles() {
  console.log('🌱 Seeding default roles...');
  
  const defaultRoles = [
    {
      name: 'admin',
      display_name: 'Administrator',
      description: 'Full system access and user management',
      is_system_role: true
    },
    {
      name: 'account_officer', 
      display_name: 'Account Officer',
      description: 'Access to expense management',
      is_system_role: true
    }
  ];
  
  for (const role of defaultRoles) {
    try {
      const { data, error } = await supabase
        .from('roles')
        .upsert(role, { 
          onConflict: 'name',
          ignoreDuplicates: false 
        })
        .select()
        .single();
        
      if (error) {
        console.log(`⚠️ Error seeding role ${role.name}:`, error.message);
      } else {
        console.log(`✅ Role '${role.display_name}' ready`);
      }
    } catch (err) {
      console.log(`⚠️ Exception seeding role ${role.name}:`, err.message);
    }
  }
}

async function verifyTables() {
  console.log('🔍 Verifying Settings tables...');
  
  const tables = ['roles', 'role_permissions', 'feature_visibility', 'user_roles', 'settings_audit_log'];
  let allGood = true;
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`);
        allGood = false;
      } else {
        console.log(`✅ Table '${table}': accessible`);
      }
    } catch (err) {
      console.log(`❌ Table '${table}': ${err.message}`);
      allGood = false;
    }
  }
  
  return allGood;
}

async function main() {
  console.log('\n' + '='.repeat(50));
  console.log('🛡️  SETTINGS SCHEMA APPLICATION');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Execute schema statements
    const schemaApplied = await executeSQLStatements();
    
    // Step 2: Seed default roles
    await seedDefaultRoles();
    
    // Step 3: Verify tables
    const tablesOk = await verifyTables();
    
    console.log('\n' + '='.repeat(50));
    if (tablesOk) {
      console.log('✅ SETTINGS SCHEMA READY!');
      console.log('🎯 Settings app can now persist data');
      console.log('💰 Existing expense data preserved');
    } else {
      console.log('⚠️ Some issues detected, check logs above');
    }
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };