#!/usr/bin/env node

/**
 * Test API Expense Editing
 * Test the actual API endpoints for expense editing
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3001/api';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAPIExpenseEditing() {
  console.log('🔧 TESTING API EXPENSE EDITING...\n');

  try {
    // 1. Get user credentials from database
    console.log('1️⃣ Getting user credentials...');
    const { data: users } = await supabase
      .from('users')
      .select('id, email, role, password_hash')
      .limit(2);

    console.log('Found users:', users);
    
    if (!users || users.length === 0) {
      throw new Error('No users found in database');
    }

    const adminUser = users.find(u => u.role === 'admin');
    if (!adminUser) {
      throw new Error('No admin user found');
    }
    
    console.log(`Admin user: ${adminUser.email}`);

    // 2. Login with admin user (we'll need to check if there's a test password)
    console.log('\n2️⃣ Testing login endpoint...');
    
    try {
      // First, let's just test if we can access the expenses endpoint without login
      const response = await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ API health check successful:', response.data);
    } catch (err) {
      console.error('❌ API health check failed:', err.message);
    }

    // 3. Get a test expense directly from database
    console.log('\n3️⃣ Getting test expense...');
    const { data: expenses } = await supabase
      .from('expenses')
      .select('id, amount, description, category_id, expense_date, notes, created_by')
      .limit(1);

    if (!expenses || expenses.length === 0) {
      console.log('❌ No expenses found');
      return;
    }

    const testExpense = expenses[0];
    console.log(`Test expense: $${testExpense.amount} - "${testExpense.description}"`);

    // 4. Create a manual JWT token for testing (using the same method as the API)
    console.log('\n4️⃣ Creating test JWT token...');
    const jwt = require('jsonwebtoken');
    const testToken = jwt.sign(
      { 
        id: adminUser.id, 
        email: adminUser.email, 
        role: adminUser.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log('✅ Test token created');

    // 5. Test the PUT endpoint
    console.log('\n5️⃣ Testing expense update API...');
    const updatedData = {
      amount: testExpense.amount,
      description: testExpense.description + ' (API EDIT TEST)',
      category_id: testExpense.category_id,
      expense_date: testExpense.expense_date,
      notes: (testExpense.notes || '') + ' [API Edit Test - ' + new Date().toISOString() + ']'
    };

    try {
      const updateResponse = await axios.put(
        `${API_BASE_URL}/expenses/${testExpense.id}`,
        updatedData,
        {
          headers: {
            'Authorization': `Bearer ${testToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Expense update API successful!');
      console.log('   Response status:', updateResponse.status);
      console.log('   Response data:', updateResponse.data);

    } catch (apiError) {
      console.error('❌ Expense update API failed:');
      console.error('   Status:', apiError.response?.status);
      console.error('   Error:', apiError.response?.data);
      console.error('   Message:', apiError.message);
    }

    // 6. Verify the update in database
    console.log('\n6️⃣ Verifying update in database...');
    const { data: verifyExpense } = await supabase
      .from('expenses')
      .select('id, description, notes')
      .eq('id', testExpense.id)
      .single();

    if (verifyExpense) {
      console.log('✅ Database verification:');
      console.log('   Description:', verifyExpense.description);
      console.log('   Notes:', verifyExpense.notes);
    }

    console.log('\n🎉 API EXPENSE EDITING TEST COMPLETED!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testAPIExpenseEditing()
    .then(() => {
      console.log('\n✅ API test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 API test failed:', error);
      process.exit(1);
    });
}

module.exports = { testAPIExpenseEditing };