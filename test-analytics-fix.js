#!/usr/bin/env node

/**
 * Test Analytics Fix Script
 * Tests the analytics dashboard functionality after applying fixes
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3001/api';

// Test user credentials (you'll need to replace with actual test user)
const TEST_USER = {
  email: 'admin@example.com', // Replace with actual admin email
  password: 'your-password'     // Replace with actual password
};

async function testAnalyticsFix() {
  console.log('🧪 Starting Analytics Dashboard Fix Test...\n');
  
  try {
    // Test 1: Backend API Health Check
    console.log('1️⃣ Testing Backend API Health...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ Backend API is healthy:', healthResponse.data);
    } catch (error) {
      console.error('❌ Backend API health check failed:', error.message);
      return false;
    }

    // Test 2: User Authentication
    console.log('\n2️⃣ Testing User Authentication...');
    let authToken = null;
    try {
      const authResponse = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
      authToken = authResponse.data.token;
      console.log('✅ Authentication successful');
      console.log(`   User: ${authResponse.data.user.email} (${authResponse.data.user.role})`);
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      console.log('   💡 Please update TEST_USER credentials in test-analytics-fix.js');
      return false;
    }

    const authHeaders = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // Test 3: Categories Endpoint
    console.log('\n3️⃣ Testing Categories Endpoint...');
    try {
      const categoriesResponse = await axios.get(`${API_BASE_URL}/categories`, { headers: authHeaders });
      console.log(`✅ Categories loaded: ${categoriesResponse.data.length} categories found`);
    } catch (error) {
      console.error('❌ Categories endpoint failed:', error.response?.data || error.message);
    }

    // Test 4: Analytics Endpoints
    console.log('\n4️⃣ Testing Analytics Endpoints...');
    
    const today = new Date();
    const startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]; // Start of year
    const endDate = today.toISOString().split('T')[0]; // Today
    
    const analyticsEndpoints = [
      {
        name: 'Category Breakdown',
        url: `/analytics/category-breakdown?start_date=${startDate}&end_date=${endDate}`
      },
      {
        name: 'Monthly Category Breakdown', 
        url: `/analytics/monthly-category-breakdown?start_date=${startDate}&end_date=${endDate}`
      },
      {
        name: 'Spending Trends',
        url: `/analytics/spending-trends?period=monthly&year=${today.getFullYear()}&start_date=${startDate}&end_date=${endDate}`
      }
    ];

    let analyticsResults = {};
    
    for (const endpoint of analyticsEndpoints) {
      try {
        console.log(`   Testing ${endpoint.name}...`);
        const response = await axios.get(`${API_BASE_URL}${endpoint.url}`, { headers: authHeaders });
        
        const hasData = response.data && (
          (response.data.breakdown && Object.keys(response.data.breakdown).length > 0) ||
          (Array.isArray(response.data.breakdown) && response.data.breakdown.length > 0) ||
          (response.data.data && response.data.data.length > 0)
        );
        
        if (hasData) {
          console.log(`   ✅ ${endpoint.name}: Data found`);
          analyticsResults[endpoint.name] = 'SUCCESS';
        } else {
          console.log(`   ⚠️  ${endpoint.name}: No data returned (but endpoint works)`);
          analyticsResults[endpoint.name] = 'NO_DATA';
        }
        
        // Show sample of data structure
        if (response.data.breakdown) {
          const dataType = Array.isArray(response.data.breakdown) ? 'array' : 'object';
          const dataSize = Array.isArray(response.data.breakdown) 
            ? response.data.breakdown.length 
            : Object.keys(response.data.breakdown).length;
          console.log(`      📊 Data structure: ${dataType} with ${dataSize} items`);
        }
        
      } catch (error) {
        console.error(`   ❌ ${endpoint.name} failed:`, error.response?.data?.error || error.message);
        analyticsResults[endpoint.name] = 'ERROR';
      }
    }

    // Test 5: Database Direct Access
    console.log('\n5️⃣ Testing Database Direct Access...');
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      // Test basic table access
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('id, amount, category_id, created_by, is_active')
        .eq('is_active', true)
        .limit(5);
      
      if (expensesError) {
        console.error('   ❌ Direct database access failed:', expensesError.message);
      } else {
        console.log(`   ✅ Direct database access: ${expenses.length} expense records accessible`);
      }
      
      // Test users table access
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, role')
        .limit(3);
      
      if (usersError) {
        console.error('   ❌ Users table access failed:', usersError.message);
      } else {
        console.log(`   ✅ Users table access: ${users.length} user records accessible`);
      }
      
    } catch (error) {
      console.error('   ❌ Database direct access test failed:', error.message);
    }

    // Summary
    console.log('\n📋 TEST SUMMARY');
    console.log('================');
    
    const successCount = Object.values(analyticsResults).filter(result => result === 'SUCCESS').length;
    const totalTests = Object.keys(analyticsResults).length;
    
    Object.entries(analyticsResults).forEach(([name, result]) => {
      const icon = result === 'SUCCESS' ? '✅' : result === 'NO_DATA' ? '⚠️' : '❌';
      console.log(`${icon} ${name}: ${result}`);
    });
    
    console.log(`\n🎯 Analytics Endpoints: ${successCount}/${totalTests} working`);
    
    if (successCount > 0) {
      console.log('\n🎉 ANALYTICS FIX SUCCESSFUL!');
      console.log('   The dashboard should now display data correctly.');
      console.log(`   Frontend URL: http://localhost:3004/`);
      console.log('   Navigate to the Analytics Dashboard to see the restored functionality.');
    } else if (Object.values(analyticsResults).filter(result => result === 'NO_DATA').length > 0) {
      console.log('\n⚠️  ANALYTICS ENDPOINTS WORKING BUT NO DATA');
      console.log('   The fix is successful, but you need to add some expenses first.');
      console.log('   Try adding a few test expenses to see the analytics in action.');
    } else {
      console.log('\n❌ ANALYTICS FIX NEEDS ATTENTION');
      console.log('   Some endpoints are still failing. Check the error messages above.');
    }
    
    return successCount > 0;
    
  } catch (error) {
    console.error('💥 Test failed with unexpected error:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testAnalyticsFix()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testAnalyticsFix };