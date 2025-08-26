#!/usr/bin/env node

/**
 * Debug Analytics Dashboard - Quick diagnostics
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function debugAnalytics() {
  console.log('🔍 DEBUGGING ANALYTICS DASHBOARD...\n');
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Check 1: Do we have users?
    console.log('1️⃣ Checking users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Users query failed:', usersError.message);
    } else {
      console.log(`✅ Found ${users.length} users:`);
      users.forEach(user => console.log(`   - ${user.email} (${user.role})`));
    }
    
    // Check 2: Do we have categories?
    console.log('\n2️⃣ Checking categories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, color')
      .limit(10);
    
    if (categoriesError) {
      console.error('❌ Categories query failed:', categoriesError.message);
    } else {
      console.log(`✅ Found ${categories.length} categories:`);
      categories.forEach(cat => console.log(`   - ${cat.name}`));
    }
    
    // Check 3: Do we have expenses?
    console.log('\n3️⃣ Checking expenses...');
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('id, amount, description, expense_date, category_id, created_by, is_active')
      .eq('is_active', true)
      .limit(10);
    
    if (expensesError) {
      console.error('❌ Expenses query failed:', expensesError.message);
    } else {
      console.log(`✅ Found ${expenses.length} active expenses:`);
      if (expenses.length > 0) {
        expenses.forEach(exp => console.log(`   - $${exp.amount} - ${exp.description} (${exp.expense_date})`));
        
        // Total amount check
        const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
        console.log(`   📊 Total amount: $${totalAmount.toFixed(2)}`);
      } else {
        console.log('⚠️  NO EXPENSES FOUND - This is why analytics is empty!');
      }
    }
    
    // Check 4: Test analytics query manually
    console.log('\n4️⃣ Testing manual analytics query...');
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('expenses')
      .select(`
        amount,
        expense_date,
        categories!inner(name, color),
        created_by
      `)
      .eq('is_active', true)
      .gte('expense_date', '2025-01-01')
      .lte('expense_date', '2025-12-31');
    
    if (analyticsError) {
      console.error('❌ Analytics query failed:', analyticsError.message);
    } else {
      console.log(`✅ Analytics query returned ${analyticsData.length} records`);
      
      if (analyticsData.length > 0) {
        // Group by category
        const categoryTotals = {};
        analyticsData.forEach(item => {
          const categoryName = item.categories.name;
          const amount = parseFloat(item.amount || 0);
          categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + amount;
        });
        
        console.log('📊 Category breakdown:');
        Object.entries(categoryTotals).forEach(([name, total]) => {
          console.log(`   - ${name}: $${total.toFixed(2)}`);
        });
      }
    }
    
    // Check 5: Check materialized views (if they exist)
    console.log('\n5️⃣ Checking materialized views...');
    try {
      const { data: mvData, error: mvError } = await supabase
        .from('mv_category_spending')
        .select('*')
        .limit(5);
      
      if (mvError) {
        console.log('⚠️  Materialized views not accessible:', mvError.message);
      } else {
        console.log(`✅ Materialized view accessible: ${mvData?.length || 0} records`);
      }
    } catch (err) {
      console.log('⚠️  Materialized views not available');
    }
    
    // Summary and recommendations
    console.log('\n📋 DIAGNOSIS SUMMARY');
    console.log('==================');
    
    if (expenses && expenses.length === 0) {
      console.log('🎯 ROOT CAUSE: NO EXPENSE DATA');
      console.log('   The analytics dashboard is empty because there are no expenses in the database.');
      console.log('   The API calls are working, but they return empty results.');
      console.log('');
      console.log('🛠️  SOLUTIONS:');
      console.log('   1. Add some test expenses through the UI');
      console.log('   2. Or run the sample data script below');
      console.log('');
      
      // Generate sample data script
      if (users && users.length > 0 && categories && categories.length > 0) {
        console.log('📝 SAMPLE DATA SCRIPT:');
        const userId = users[0].id;
        const categoryId = categories[0].id;
        console.log(`
-- Add sample expenses (run in Supabase SQL editor)
INSERT INTO expenses (amount, description, expense_date, category_id, created_by, is_active)
VALUES 
  (25.50, 'Coffee and breakfast', '2025-08-20', '${categoryId}', '${userId}', true),
  (150.00, 'Groceries', '2025-08-19', '${categoryId}', '${userId}', true),
  (45.75, 'Gas station', '2025-08-18', '${categoryId}', '${userId}', true),
  (89.99, 'Restaurant dinner', '2025-08-17', '${categoryId}', '${userId}', true),
  (12.99, 'Streaming service', '2025-08-16', '${categoryId}', '${userId}', true);
        `);
      }
    } else if (expenses && expenses.length > 0) {
      console.log('🎯 EXPENSE DATA EXISTS - Frontend/API issue');
      console.log('   Check browser console for detailed debug logs');
      console.log('   Verify API authentication and response processing');
    }
    
  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  }
}

// Run diagnostics
if (require.main === module) {
  debugAnalytics().catch(console.error);
}

module.exports = { debugAnalytics };