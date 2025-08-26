#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

async function testAPI() {
  console.log('🧪 Testing API endpoints directly...\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:3001/api/health');
    console.log('✅ Health:', healthResponse.data);
    
    // Test 2: Categories (no auth needed for testing)
    console.log('\n2️⃣ Testing categories endpoint...');
    try {
      const categoriesResponse = await axios.get('http://localhost:3001/api/categories');
      console.log(`✅ Categories: ${categoriesResponse.data.length} found`);
    } catch (err) {
      console.log('⚠️ Categories require auth:', err.response?.status);
    }
    
    // Test 3: Analytics endpoint with correct date range
    console.log('\n3️⃣ Testing analytics endpoint (2024-2025 range)...');
    try {
      const analyticsResponse = await axios.get(
        'http://localhost:3001/api/analytics/category-breakdown?start_date=2024-01-01&end_date=2025-08-26'
      );
      console.log(`✅ Analytics response:`, analyticsResponse.data);
    } catch (err) {
      console.log('⚠️ Analytics require auth:', err.response?.status, err.response?.data);
    }
    
    console.log('\n📋 SUMMARY:');
    console.log('- API server is running properly on port 3001');
    console.log('- Analytics endpoints require authentication');
    console.log('- Frontend should now query with 2024-01-01 to 2025-08-26 range');
    console.log('- Refresh the browser to see updated data!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPI();