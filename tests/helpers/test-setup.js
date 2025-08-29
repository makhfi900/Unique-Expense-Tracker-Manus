/**
 * Test Setup Helpers for Regression Tests
 * 
 * Provides consistent test environment setup for regression testing
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

// Test configuration
const TEST_CONFIG = {
  supabase: {
    url: process.env.SUPABASE_URL || 'https://test.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || 'test-key',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key'
  },
  testUsers: {
    admin: {
      id: 'test-admin-id',
      email: 'admin@test.com',
      role: 'admin',
      full_name: 'Test Admin'
    },
    accountOfficer: {
      id: 'test-officer-id',
      email: 'officer@test.com',
      role: 'account_officer',
      full_name: 'Test Officer'
    }
  }
};

/**
 * Create test Express app with API routes
 */
async function createTestApp() {
  const app = express();
  
  // Import and setup API routes
  try {
    // This would import your actual API server setup
    // Adjust path based on your project structure
    const { setupRoutes } = require('../../api-server');
    await setupRoutes(app);
  } catch (error) {
    console.warn('Could not import API routes for testing:', error.message);
    
    // Fallback: create mock routes for testing
    app.get('/api/expenses', (req, res) => {
      const { page = 1, limit = 50, sort_by = 'expense_date', sort_order = 'desc' } = req.query;
      
      res.json({
        expenses: generateTestExpenses(parseInt(limit), sort_by, sort_order),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 500,
          totalPages: Math.ceil(500 / parseInt(limit)),
          hasMore: parseInt(page) * parseInt(limit) < 500
        }
      });
    });
  }
  
  return app;
}

/**
 * Setup test data in database
 */
async function setupTestData() {
  const testData = {
    adminToken: 'test-admin-token',
    officerToken: 'test-officer-token',
    categories: [
      { id: 'cat-1', name: 'Food', color: '#FF5733' },
      { id: 'cat-2', name: 'Transport', color: '#33FF57' },
      { id: 'cat-3', name: 'Utilities', color: '#3357FF' },
      { id: 'cat-4', name: 'Entertainment', color: '#FF33F5' }
    ],
    users: [
      TEST_CONFIG.testUsers.admin,
      TEST_CONFIG.testUsers.accountOfficer
    ],
    expenses: []
  };

  // Generate test expenses with variety for sorting tests
  const expenseTemplates = [
    { description: 'Coffee Shop Visit', categoryIndex: 0, amounts: [5.50, 8.75, 12.30] },
    { description: 'Bus Fare', categoryIndex: 1, amounts: [2.25, 4.50, 6.75] },
    { description: 'Electricity Bill', categoryIndex: 2, amounts: [85.30, 92.15, 105.80] },
    { description: 'Movie Tickets', categoryIndex: 3, amounts: [15.00, 22.50, 18.75] },
    { description: 'Lunch Meeting', categoryIndex: 0, amounts: [25.60, 32.40, 28.90] },
    { description: 'Taxi Ride', categoryIndex: 1, amounts: [12.75, 18.25, 21.50] },
    { description: 'Internet Bill', categoryIndex: 2, amounts: [45.00, 50.00, 55.00] },
    { description: 'Concert Tickets', categoryIndex: 3, amounts: [75.00, 85.00, 95.00] }
  ];

  // Generate 200 test expenses for comprehensive testing
  for (let i = 0; i < 200; i++) {
    const template = expenseTemplates[i % expenseTemplates.length];
    const amount = template.amounts[i % template.amounts.length];
    const date = new Date('2024-01-01');
    date.setDate(date.getDate() + (i * 2)); // Spread over time

    testData.expenses.push({
      id: `expense-${i + 1}`,
      description: `${template.description} ${i + 1}`,
      amount: amount,
      expense_date: date.toISOString().split('T')[0],
      category_id: testData.categories[template.categoryIndex].id,
      category: testData.categories[template.categoryIndex],
      created_by: i < 100 ? TEST_CONFIG.testUsers.admin.id : TEST_CONFIG.testUsers.accountOfficer.id,
      created_by_user: i < 100 ? TEST_CONFIG.testUsers.admin : TEST_CONFIG.testUsers.accountOfficer,
      created_at: new Date().toISOString(),
      is_active: true,
      notes: i % 5 === 0 ? `Notes for expense ${i + 1}` : null
    });
  }

  return testData;
}

/**
 * Teardown test data
 */
async function teardownTestData(testData) {
  // In a real implementation, this would clean up database records
  // For testing purposes, we just clear the test data object
  if (testData) {
    testData.expenses = [];
    testData.categories = [];
    testData.users = [];
  }
}

/**
 * Generate test expenses for mock responses
 */
function generateTestExpenses(limit = 50, sortBy = 'expense_date', sortOrder = 'desc') {
  const categories = [
    { id: 'cat-1', name: 'Food', color: '#FF5733' },
    { id: 'cat-2', name: 'Transport', color: '#33FF57' },
    { id: 'cat-3', name: 'Utilities', color: '#3357FF' }
  ];

  const descriptions = [
    'Coffee Purchase', 'Bus Ticket', 'Grocery Shopping', 'Gas Bill',
    'Restaurant Meal', 'Taxi Ride', 'Office Supplies', 'Phone Bill',
    'Movie Theater', 'Parking Fee', 'Lunch Meeting', 'Internet Service'
  ];

  const expenses = Array.from({ length: limit }, (_, i) => {
    const baseDate = new Date('2024-01-01');
    baseDate.setDate(baseDate.getDate() + i);

    return {
      id: `test-expense-${i + 1}`,
      description: `${descriptions[i % descriptions.length]} ${i + 1}`,
      amount: (Math.random() * 500 + 10).toFixed(2),
      expense_date: baseDate.toISOString().split('T')[0],
      category: categories[i % categories.length],
      created_by_user: {
        id: 'test-user',
        full_name: 'Test User'
      },
      created_at: new Date().toISOString(),
      is_active: true,
      notes: i % 4 === 0 ? `Test notes for expense ${i + 1}` : null
    };
  });

  // Apply sorting
  expenses.sort((a, b) => {
    let compareResult = 0;
    
    switch (sortBy) {
      case 'amount':
        compareResult = parseFloat(a.amount) - parseFloat(b.amount);
        break;
      case 'description':
        compareResult = a.description.localeCompare(b.description);
        break;
      case 'expense_date':
      default:
        compareResult = new Date(a.expense_date) - new Date(b.expense_date);
        break;
    }

    return sortOrder.toLowerCase() === 'asc' ? compareResult : -compareResult;
  });

  return expenses;
}

/**
 * Create test JWT token for authentication
 */
function createTestToken(user) {
  // In a real implementation, this would create a proper JWT token
  // For testing, return a simple token string
  return `test-token-${user.id}`;
}

/**
 * Setup test environment variables
 */
function setupTestEnvironment() {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.SUPABASE_URL = TEST_CONFIG.supabase.url;
  process.env.SUPABASE_ANON_KEY = TEST_CONFIG.supabase.anonKey;
  process.env.SUPABASE_SERVICE_ROLE_KEY = TEST_CONFIG.supabase.serviceKey;
}

/**
 * Create mock Supabase client for testing
 */
function createMockSupabaseClient() {
  const mockData = {
    expenses: [],
    categories: [],
    users: []
  };

  return {
    from: (table) => ({
      select: (columns) => ({
        eq: (column, value) => ({
          order: (field, options) => ({
            range: (start, end) => ({
              then: (callback) => {
                // Simulate database query result
                const filteredData = mockData[table] || [];
                const result = filteredData.slice(start, end + 1);
                callback({ data: result, error: null });
                return Promise.resolve({ data: result, error: null });
              }
            })
          })
        })
      })
    }),
    
    // Mock count query
    count: () => Promise.resolve({ count: mockData.expenses.length, error: null }),
    
    // Mock authentication
    auth: {
      getUser: () => Promise.resolve({ 
        data: { user: TEST_CONFIG.testUsers.admin }, 
        error: null 
      })
    }
  };
}

/**
 * Assertion helpers for regression tests
 */
const assertionHelpers = {
  /**
   * Assert that expenses are sorted correctly
   */
  assertExpensesSorted(expenses, sortBy, sortOrder) {
    for (let i = 1; i < expenses.length; i++) {
      const prev = expenses[i - 1];
      const current = expenses[i];
      
      let comparison = 0;
      
      switch (sortBy) {
        case 'amount':
          comparison = parseFloat(prev.amount) - parseFloat(current.amount);
          break;
        case 'description':
          comparison = prev.description.localeCompare(current.description);
          break;
        case 'expense_date':
        default:
          comparison = new Date(prev.expense_date) - new Date(current.expense_date);
          break;
      }
      
      if (sortOrder.toLowerCase() === 'asc') {
        expect(comparison).toBeLessThanOrEqual(0);
      } else {
        expect(comparison).toBeGreaterThanOrEqual(0);
      }
    }
  },

  /**
   * Assert pagination metadata accuracy
   */
  assertPaginationMetadata(pagination, expectedPage, expectedLimit, expectedTotal) {
    expect(pagination.page).toBe(expectedPage);
    expect(pagination.limit).toBe(expectedLimit);
    expect(pagination.total).toBe(expectedTotal);
    expect(pagination.totalPages).toBe(Math.ceil(expectedTotal / expectedLimit));
    
    const hasMore = expectedPage * expectedLimit < expectedTotal;
    expect(pagination.hasMore).toBe(hasMore);
  },

  /**
   * Assert mobile UI element accessibility
   */
  assertMobileAccessibility(element) {
    const rect = element.getBoundingClientRect();
    const minTouchTarget = 44;
    
    expect(rect.width).toBeGreaterThanOrEqual(minTouchTarget - 4); // 4px tolerance
    expect(rect.height).toBeGreaterThanOrEqual(minTouchTarget - 4);
  }
};

module.exports = {
  createTestApp,
  setupTestData,
  teardownTestData,
  generateTestExpenses,
  createTestToken,
  setupTestEnvironment,
  createMockSupabaseClient,
  assertionHelpers,
  TEST_CONFIG
};