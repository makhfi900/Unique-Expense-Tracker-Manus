#!/usr/bin/env node

/**
 * Test Expense Editing Functionality
 * Tests both backend API and database permissions
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3001/api';

async function testExpenseEditing() {
  console.log('🧪 TESTING EXPENSE EDITING FUNCTIONALITY...\n');

  try {
    // 1. Login to get auth token
    console.log('1️⃣ Authenticating...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'mquresh900@gmail.com', // Replace with your admin email
      password: 'your-password' // Replace with actual password
    });

    const authToken = loginResponse.data.token;
    const authHeaders = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    console.log('✅ Authentication successful');

    // 2. Get a test expense to edit
    console.log('\n2️⃣ Getting test expense...');
    const expensesResponse = await axios.get(
      `${API_BASE_URL}/expenses?limit=1`, 
      { headers: authHeaders }
    );

    if (!expensesResponse.data.length) {
      console.log('❌ No expenses found to test editing');
      return;
    }

    const testExpense = expensesResponse.data[0];
    console.log(`✅ Found test expense: $${testExpense.amount} - "${testExpense.description}"`);

    // 3. Test updating the expense
    console.log('\n3️⃣ Testing expense update...');
    
    const updatedData = {
      amount: testExpense.amount,
      description: testExpense.description + ' (EDITED)',
      category_id: testExpense.category_id,
      expense_date: testExpense.expense_date,
      notes: (testExpense.notes || '') + ' [Test edit]'
    };

    try {
      const updateResponse = await axios.put(
        `${API_BASE_URL}/expenses/${testExpense.id}`,
        updatedData,
        { headers: authHeaders }
      );

      console.log('✅ Expense update successful!');
      console.log('   Response:', updateResponse.data);

      // Verify the update
      const verifyResponse = await axios.get(
        `${API_BASE_URL}/expenses/${testExpense.id}`, 
        { headers: authHeaders }
      );
      
      console.log('✅ Updated expense verified:');
      console.log(`   Description: ${verifyResponse.data.description}`);
      console.log(`   Notes: ${verifyResponse.data.notes}`);

    } catch (updateError) {
      console.error('❌ Expense update failed:');
      console.error('   Status:', updateError.response?.status);
      console.error('   Error:', updateError.response?.data);
      
      // Check if it's a permission issue
      if (updateError.response?.status === 403) {
        console.log('\n🔍 PERMISSION ISSUE DETECTED:');
        console.log('   This suggests RLS policies or user permission problems');
        
        // Test direct database access
        console.log('\n4️⃣ Testing direct database update...');
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: directUpdate, error: directError } = await supabase
          .from('expenses')
          .update({ notes: (testExpense.notes || '') + ' [Direct DB edit]' })
          .eq('id', testExpense.id)
          .select();

        if (directError) {
          console.error('   ❌ Direct DB update failed:', directError.message);
        } else {
          console.log('   ✅ Direct DB update successful');
          console.log('   This confirms the API has permission issues, not DB issues');
        }
      }
    }

    // 4. Test creating a new expense
    console.log('\n5️⃣ Testing expense creation...');
    const newExpenseData = {
      amount: 100,
      description: 'Test Expense Creation',
      category_id: testExpense.category_id,
      expense_date: new Date().toISOString().split('T')[0],
      notes: 'Created by test script'
    };

    try {
      const createResponse = await axios.post(
        `${API_BASE_URL}/expenses`,
        newExpenseData,
        { headers: authHeaders }
      );

      console.log('✅ Expense creation successful!');
      console.log('   New expense ID:', createResponse.data.expense?.id);

      // Clean up - delete the test expense
      if (createResponse.data.expense?.id) {
        try {
          await axios.delete(
            `${API_BASE_URL}/expenses/${createResponse.data.expense.id}`,
            { headers: authHeaders }
          );
          console.log('✅ Test expense cleaned up');
        } catch (deleteError) {
          console.warn('⚠️  Could not clean up test expense');
        }
      }

    } catch (createError) {
      console.error('❌ Expense creation failed:');
      console.error('   Status:', createError.response?.status);
      console.error('   Error:', createError.response?.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.status === 401) {
      console.log('\n💡 AUTHENTICATION ISSUE:');
      console.log('   Please update the login credentials in this script');
      console.log('   Current attempt: mquresh900@gmail.com');
    }
  }
}

// Manual test without authentication (you can call this if login fails)
async function testDirectDatabaseAccess() {
  console.log('\n🔍 TESTING DIRECT DATABASE ACCESS...\n');
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get a test expense
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .limit(1);

  if (expenses && expenses.length > 0) {
    const testExpense = expenses[0];
    console.log(`✅ Found expense: $${testExpense.amount} - "${testExpense.description}"`);

    // Try to update it
    const { data: updated, error: updateError } = await supabase
      .from('expenses')
      .update({ 
        notes: (testExpense.notes || '') + ' [DB test edit]',
        updated_at: new Date().toISOString()
      })
      .eq('id', testExpense.id)
      .select();

    if (updateError) {
      console.error('❌ Direct DB update failed:', updateError.message);
    } else {
      console.log('✅ Direct DB update successful');
      console.log('   This means database editing works fine');
      console.log('   The issue is likely in the API or frontend');
    }
  }
}

// Run tests
if (require.main === module) {
  testExpenseEditing()
    .then(() => testDirectDatabaseAccess())
    .catch(console.error);
}

module.exports = { testExpenseEditing, testDirectDatabaseAccess };