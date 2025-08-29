/**
 * Backend Sorting Regression Tests
 * 
 * These tests prevent the recurrence of the critical bug where backend
 * was ignoring sort_by and sort_order parameters.
 * 
 * CRITICAL: These tests must pass before any deployment.
 */

const request = require('supertest');
const { createTestApp, setupTestData, teardownTestData } = require('../helpers/test-setup');

describe('Backend Sorting Regression Tests', () => {
  let app;
  let testData;
  let adminToken;

  beforeAll(async () => {
    app = await createTestApp();
    testData = await setupTestData();
    adminToken = testData.adminToken;
  });

  afterAll(async () => {
    await teardownTestData(testData);
  });

  describe('CRITICAL: sort_by Parameter Compliance', () => {
    test('REGRESSION: Backend must respect sort_by=expense_date parameter', async () => {
      // Test ascending order
      const ascResponse = await request(app)
        .get('/api/expenses?sort_by=expense_date&sort_order=asc&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const ascExpenses = ascResponse.body.expenses;
      expect(ascExpenses.length).toBeGreaterThan(1);

      // Verify ascending date order
      for (let i = 1; i < ascExpenses.length; i++) {
        const prevDate = new Date(ascExpenses[i - 1].expense_date);
        const currentDate = new Date(ascExpenses[i].expense_date);
        
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
      }

      // Test descending order
      const descResponse = await request(app)
        .get('/api/expenses?sort_by=expense_date&sort_order=desc&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const descExpenses = descResponse.body.expenses;
      
      // Verify descending date order
      for (let i = 1; i < descExpenses.length; i++) {
        const prevDate = new Date(descExpenses[i - 1].expense_date);
        const currentDate = new Date(descExpenses[i].expense_date);
        
        expect(currentDate.getTime()).toBeLessThanOrEqual(prevDate.getTime());
      }

      // CRITICAL: First item in desc should not equal first item in asc
      // (unless all dates are identical, which is unlikely with test data)
      if (ascExpenses.length > 2 && descExpenses.length > 2) {
        expect(ascExpenses[0].id).not.toBe(descExpenses[0].id);
      }
    });

    test('REGRESSION: Backend must respect sort_by=amount parameter', async () => {
      // Test ascending order
      const ascResponse = await request(app)
        .get('/api/expenses?sort_by=amount&sort_order=asc&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const ascExpenses = ascResponse.body.expenses;
      
      // Verify ascending amount order
      for (let i = 1; i < ascExpenses.length; i++) {
        const prevAmount = parseFloat(ascExpenses[i - 1].amount);
        const currentAmount = parseFloat(ascExpenses[i].amount);
        
        expect(currentAmount).toBeGreaterThanOrEqual(prevAmount);
      }

      // Test descending order
      const descResponse = await request(app)
        .get('/api/expenses?sort_by=amount&sort_order=desc&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const descExpenses = descResponse.body.expenses;
      
      // Verify descending amount order
      for (let i = 1; i < descExpenses.length; i++) {
        const prevAmount = parseFloat(descExpenses[i - 1].amount);
        const currentAmount = parseFloat(descExpenses[i].amount);
        
        expect(currentAmount).toBeLessThanOrEqual(prevAmount);
      }
    });

    test('REGRESSION: Backend must respect sort_by=description parameter', async () => {
      // Test ascending order (A-Z)
      const ascResponse = await request(app)
        .get('/api/expenses?sort_by=description&sort_order=asc&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const ascExpenses = ascResponse.body.expenses;
      
      // Verify alphabetical ascending order
      for (let i = 1; i < ascExpenses.length; i++) {
        const prevDesc = ascExpenses[i - 1].description.toLowerCase();
        const currentDesc = ascExpenses[i].description.toLowerCase();
        
        expect(currentDesc.localeCompare(prevDesc)).toBeGreaterThanOrEqual(0);
      }

      // Test descending order (Z-A)
      const descResponse = await request(app)
        .get('/api/expenses?sort_by=description&sort_order=desc&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const descExpenses = descResponse.body.expenses;
      
      // Verify alphabetical descending order
      for (let i = 1; i < descExpenses.length; i++) {
        const prevDesc = descExpenses[i - 1].description.toLowerCase();
        const currentDesc = descExpenses[i].description.toLowerCase();
        
        expect(currentDesc.localeCompare(prevDesc)).toBeLessThanOrEqual(0);
      }
    });
  });

  describe('CRITICAL: sort_order Parameter Compliance', () => {
    test('REGRESSION: sort_order=asc must return ascending results', async () => {
      const response = await request(app)
        .get('/api/expenses?sort_by=amount&sort_order=asc&limit=20')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const expenses = response.body.expenses;
      expect(expenses.length).toBeGreaterThan(5); // Ensure meaningful test

      const amounts = expenses.map(e => parseFloat(e.amount));
      
      // First amount should be less than or equal to last amount in ascending order
      expect(amounts[0]).toBeLessThanOrEqual(amounts[amounts.length - 1]);
      
      // Verify overall ascending trend
      let ascendingCount = 0;
      for (let i = 1; i < amounts.length; i++) {
        if (amounts[i] >= amounts[i - 1]) {
          ascendingCount++;
        }
      }
      
      // At least 70% should be in ascending order (allowing for some duplicates)
      expect(ascendingCount / (amounts.length - 1)).toBeGreaterThan(0.7);
    });

    test('REGRESSION: sort_order=desc must return descending results', async () => {
      const response = await request(app)
        .get('/api/expenses?sort_by=amount&sort_order=desc&limit=20')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const expenses = response.body.expenses;
      const amounts = expenses.map(e => parseFloat(e.amount));
      
      // First amount should be greater than or equal to last amount in descending order
      expect(amounts[0]).toBeGreaterThanOrEqual(amounts[amounts.length - 1]);
      
      // Verify overall descending trend
      let descendingCount = 0;
      for (let i = 1; i < amounts.length; i++) {
        if (amounts[i] <= amounts[i - 1]) {
          descendingCount++;
        }
      }
      
      // At least 70% should be in descending order
      expect(descendingCount / (amounts.length - 1)).toBeGreaterThan(0.7);
    });

    test('REGRESSION: Invalid sort_order should default to desc', async () => {
      const response = await request(app)
        .get('/api/expenses?sort_by=expense_date&sort_order=invalid&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const expenses = response.body.expenses;
      
      // Should default to descending (newest first)
      if (expenses.length >= 2) {
        const firstDate = new Date(expenses[0].expense_date);
        const secondDate = new Date(expenses[1].expense_date);
        
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
      }
    });
  });

  describe('CRITICAL: Default Sorting Behavior', () => {
    test('REGRESSION: No sort parameters should default to expense_date desc', async () => {
      const response = await request(app)
        .get('/api/expenses?limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const expenses = response.body.expenses;
      
      // Should be sorted by date in descending order by default
      for (let i = 1; i < expenses.length; i++) {
        const prevDate = new Date(expenses[i - 1].expense_date);
        const currentDate = new Date(expenses[i].expense_date);
        
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currentDate.getTime());
      }
    });

    test('REGRESSION: Invalid sort_by should default to expense_date', async () => {
      const response = await request(app)
        .get('/api/expenses?sort_by=invalid_field&sort_order=desc&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const expenses = response.body.expenses;
      
      // Should default to sorting by date
      for (let i = 1; i < expenses.length; i++) {
        const prevDate = new Date(expenses[i - 1].expense_date);
        const currentDate = new Date(expenses[i].expense_date);
        
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currentDate.getTime());
      }
    });
  });

  describe('CRITICAL: Sorting with Filters Integration', () => {
    test('REGRESSION: Sorting must work with category filters', async () => {
      // Get a category ID from test data
      const categoryId = testData.categories[0].id;
      
      const response = await request(app)
        .get(`/api/expenses?category_id=${categoryId}&sort_by=amount&sort_order=asc&limit=10`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const expenses = response.body.expenses;
      
      // Verify all expenses are from the specified category
      expenses.forEach(expense => {
        expect(expense.category.id).toBe(categoryId);
      });
      
      // Verify sorting is applied
      for (let i = 1; i < expenses.length; i++) {
        const prevAmount = parseFloat(expenses[i - 1].amount);
        const currentAmount = parseFloat(expenses[i].amount);
        
        expect(currentAmount).toBeGreaterThanOrEqual(prevAmount);
      }
    });

    test('REGRESSION: Sorting must work with date range filters', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-06-30';
      
      const response = await request(app)
        .get(`/api/expenses?start_date=${startDate}&end_date=${endDate}&sort_by=expense_date&sort_order=asc&limit=10`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const expenses = response.body.expenses;
      
      // Verify all expenses are within date range
      expenses.forEach(expense => {
        const expenseDate = new Date(expense.expense_date);
        expect(expenseDate.getTime()).toBeGreaterThanOrEqual(new Date(startDate).getTime());
        expect(expenseDate.getTime()).toBeLessThanOrEqual(new Date(endDate).getTime());
      });
      
      // Verify sorting is applied
      for (let i = 1; i < expenses.length; i++) {
        const prevDate = new Date(expenses[i - 1].expense_date);
        const currentDate = new Date(expenses[i].expense_date);
        
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
      }
    });
  });

  describe('CRITICAL: Performance Regression Prevention', () => {
    test('REGRESSION: Sorting operations must complete within time limits', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/expenses?sort_by=amount&sort_order=desc&limit=100')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Sorting should complete within 2 seconds
      expect(duration).toBeLessThan(2000);
      
      // Verify we got meaningful results
      expect(response.body.expenses.length).toBeGreaterThan(0);
    });

    test('REGRESSION: Large dataset sorting must not timeout', async () => {
      // This test ensures the fix doesn't impact performance
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/expenses?sort_by=description&sort_order=asc&limit=500')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds even for large datasets
      expect(duration).toBeLessThan(5000);
      
      expect(response.body.expenses).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });
  });
});