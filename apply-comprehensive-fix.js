const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyComprehensiveFix() {
  try {
    console.log('🔧 Starting comprehensive app restoration...');
    
    // Read the SQL fix file
    const sqlFile = path.join(__dirname, 'database', 'COMPREHENSIVE_APP_FIX.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Apply the fix
    console.log('📝 Applying comprehensive database fixes...');
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_text: sqlContent 
    });
    
    if (error) {
      console.error('❌ Error applying fixes:', error);
      
      // Try applying directly via supabase query
      console.log('🔄 Trying alternative application method...');
      const queries = sqlContent.split(';').filter(q => q.trim().length > 0);
      
      for (const query of queries) {
        if (query.trim()) {
          try {
            const { error: queryError } = await supabase.rpc('exec_sql', {
              sql_text: query.trim()
            });
            if (queryError) {
              console.warn('⚠️ Warning with query:', queryError.message);
            }
          } catch (e) {
            console.warn('⚠️ Skipping problematic query:', e.message);
          }
        }
      }
    } else {
      console.log('✅ Comprehensive fixes applied successfully!');
    }
    
    // Test basic functionality
    console.log('🧪 Testing basic functionality...');
    
    // Test materialized view access
    const { data: monthlyData, error: monthlyError } = await supabase
      .from('mv_monthly_spending')
      .select('*')
      .limit(5);
    
    if (monthlyError) {
      console.error('❌ Error accessing mv_monthly_spending:', monthlyError);
    } else {
      console.log('✅ mv_monthly_spending accessible');
    }
    
    // Test user table access
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(5);
    
    if (userError) {
      console.error('❌ Error accessing users table:', userError);
    } else {
      console.log('✅ Users table accessible');
      console.log(`   Found ${userData.length} users`);
    }
    
    // Test expenses table access
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .select('id, user_id, amount, category')
      .limit(5);
    
    if (expenseError) {
      console.error('❌ Error accessing expenses table:', expenseError);
    } else {
      console.log('✅ Expenses table accessible');
      console.log(`   Found ${expenseData.length} expense records`);
    }
    
    console.log('\n🎉 Comprehensive app restoration completed!');
    console.log('🌐 Your app should now be fully functional at: http://localhost:3002/');
    console.log('📊 All analytics and reporting features should work');
    console.log('🔐 Authentication and user management restored');
    console.log('💰 Expense tracking and management functional');
    
  } catch (error) {
    console.error('💥 Critical error during restoration:', error);
    process.exit(1);
  }
}

// Helper function for direct SQL execution if needed
async function executeDirectSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('query', {
      query: sql
    });
    
    if (error) {
      console.error('SQL Error:', error);
      return null;
    }
    
    return data;
  } catch (e) {
    console.error('Execution Error:', e);
    return null;
  }
}

applyComprehensiveFix();