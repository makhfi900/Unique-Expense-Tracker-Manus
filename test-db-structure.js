const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDatabaseStructure() {
  console.log('🔍 Investigating database structure...');
  
  try {
    // Check expenses table structure
    console.log('\n📋 Checking expenses table columns...');
    const { data: expensesColumns, error: expensesError } = await supabase
      .rpc('get_table_columns', { table_name: 'expenses' });
    
    if (expensesError) {
      console.log('Using alternative method to check expenses table...');
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('❌ Expenses table error:', error.message);
        
        // Try without user_id
        console.log('Checking what columns actually exist...');
        const { data: testData, error: testError } = await supabase
          .from('expenses')
          .select('id, amount, description, category, expense_date, created_at, updated_at, is_active')
          .limit(1);
        
        if (testError) {
          console.error('❌ Basic columns test failed:', testError.message);
        } else {
          console.log('✅ Basic expense columns work:', Object.keys(testData[0] || {}));
        }
      } else {
        console.log('✅ Expenses table accessible, columns:', Object.keys(data[0] || {}));
      }
    }
    
    // Check users table structure
    console.log('\n👥 Checking users table...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Users table error:', usersError.message);
    } else {
      console.log('✅ Users table columns:', Object.keys(usersData[0] || {}));
    }
    
    // Check materialized views
    console.log('\n📊 Checking materialized views...');
    const views = ['mv_monthly_spending', 'mv_daily_spending', 'mv_category_spending', 'mv_user_spending'];
    
    for (const view of views) {
      try {
        const { data, error } = await supabase
          .from(view)
          .select('*')
          .limit(1);
        
        if (error) {
          console.error(`❌ ${view}:`, error.message);
        } else {
          console.log(`✅ ${view}:`, Object.keys(data[0] || {}));
        }
      } catch (e) {
        console.error(`❌ ${view}: Exception -`, e.message);
      }
    }
    
    // Test authentication context
    console.log('\n🔐 Testing auth context...');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    console.log('Auth status:', authError ? authError.message : 'Service role authenticated');
    
    // Check if there are any users
    console.log('\n📈 Database statistics...');
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    const { count: expenseCount } = await supabase
      .from('expenses')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Users: ${userCount}`);
    console.log(`Expenses: ${expenseCount}`);
    
  } catch (error) {
    console.error('💥 Critical error:', error);
  }
}

testDatabaseStructure();