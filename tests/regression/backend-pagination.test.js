/**
 * Backend Pagination Regression Tests
 * 
 * These tests prevent the recurrence of the critical bug where backend
 * was returning 1000+ expenses instead of the requested limit of 50.
 * 
 * CRITICAL: These tests must pass before any deployment.
 */

const request = require('supertest');
const { createTestApp, setupTestData, teardownTestData } = require('../helpers/test-setup');

describe('Backend Pagination Regression Tests', () => {
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

  describe('CRITICAL: Limit Parameter Compliance', () => {
    test('REGRESSION: Backend must return exactly 50 items when limit=50', async () => {
      const response = await request(app)
        .get('/api/expenses?limit=50')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.expenses).toHaveLength(50);
      expect(response.body.pagination.limit).toBe(50);
      
      // CRITICAL: Must not return more than requested
      expect(response.body.expenses.length).not.toBeGreaterThan(50);
    });

    test('REGRESSION: Backend must return exactly 25 items when limit=25', async () => {
      const response = await request(app)
        .get('/api/expenses?limit=25')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.expenses).toHaveLength(25);
      expect(response.body.pagination.limit).toBe(25);
    });

    test('REGRESSION: Backend must return exactly 10 items when limit=10', async () => {
      const response = await request(app)
        .get('/api/expenses?limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.expenses).toHaveLength(10);
      expect(response.body.pagination.limit).toBe(10);
    });

    test('REGRESSION: Backend must return exactly 1 item when limit=1', async () => {
      const response = await request(app)
        .get('/api/expenses?limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.expenses).toHaveLength(1);
      expect(response.body.pagination.limit).toBe(1);
    });

    test('REGRESSION: Backend must default to 50 items when no limit specified', async () => {
      const response = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Should default to 50 or less if there aren't enough records
      expect(response.body.expenses.length).toBeLessThanOrEqual(50);
      expect(response.body.pagination.limit).toBe(50);
    });

    test('REGRESSION: Backend must enforce maximum limit of 500', async () => {
      const response = await request(app)
        .get('/api/expenses?limit=1000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Should cap at 500 max
      expect(response.body.expenses.length).toBeLessThanOrEqual(500);
      expect(response.body.pagination.limit).toBeLessThanOrEqual(500);
    });

    test('REGRESSION: Backend must handle invalid limit parameters gracefully', async () => {
      // Test negative limit
      const negResponse = await request(app)
        .get('/api/expenses?limit=-10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(negResponse.body.expenses.length).toBeGreaterThan(0);
      expect(negResponse.body.pagination.limit).toBeGreaterThan(0);

      // Test zero limit
      const zeroResponse = await request(app)
        .get('/api/expenses?limit=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(zeroResponse.body.expenses.length).toBeGreaterThan(0);
      expect(zeroResponse.body.pagination.limit).toBeGreaterThan(0);

      // Test non-numeric limit
      const invalidResponse = await request(app)
        .get('/api/expenses?limit=abc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(invalidResponse.body.expenses.length).toBeLessThanOrEqual(50);
      expect(invalidResponse.body.pagination.limit).toBe(50);
    });
  });

  describe('CRITICAL: Page Parameter Compliance', () => {
    test('REGRESSION: Backend must return different data for different pages', async () => {
      const page1Response = await request(app)
        .get('/api/expenses?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const page2Response = await request(app)
        .get('/api/expenses?page=2&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const page1Ids = page1Response.body.expenses.map(e => e.id);
      const page2Ids = page2Response.body.expenses.map(e => e.id);

      // Pages should have different expenses (no overlap)
      const overlap = page1Ids.filter(id => page2Ids.includes(id));
      expect(overlap).toHaveLength(0);

      // Both should report correct page numbers
      expect(page1Response.body.pagination.page).toBe(1);
      expect(page2Response.body.pagination.page).toBe(2);
    });

    test('REGRESSION: Backend must handle page=0 by defaulting to page=1', async () => {
      const response = await request(app)
        .get('/api/expenses?page=0&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.expenses.length).toBeGreaterThan(0);
    });

    test('REGRESSION: Backend must handle negative pages by defaulting to page=1', async () => {
      const response = await request(app)
        .get('/api/expenses?page=-5&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.expenses.length).toBeGreaterThan(0);
    });

    test('REGRESSION: Backend must return empty results for pages beyond total', async () => {
      const response = await request(app)
        .get('/api/expenses?page=99999&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.expenses).toHaveLength(0);
      expect(response.body.pagination.page).toBe(99999);
      expect(response.body.pagination.hasMore).toBe(false);
    });

    test('REGRESSION: Backend must handle invalid page parameters', async () => {
      const response = await request(app)
        .get('/api/expenses?page=abc&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.expenses.length).toBeGreaterThan(0);
    });
  });

  describe('CRITICAL: Pagination Metadata Accuracy', () => {
    test('REGRESSION: Backend must return accurate pagination metadata', async () => {
      const response = await request(app)
        .get('/api/expenses?limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const pagination = response.body.pagination;

      // Must include all required pagination fields
      expect(pagination).toHaveProperty('page');
      expect(pagination).toHaveProperty('limit');
      expect(pagination).toHaveProperty('total');
      expect(pagination).toHaveProperty('totalPages');
      expect(pagination).toHaveProperty('hasMore');

      // Verify calculations are correct
      const expectedTotalPages = Math.ceil(pagination.total / pagination.limit);
      expect(pagination.totalPages).toBe(expectedTotalPages);

      // Verify hasMore is accurate for first page
      if (pagination.totalPages > 1) {
        expect(pagination.hasMore).toBe(true);
      } else {
        expect(pagination.hasMore).toBe(false);
      }
    });

    test('REGRESSION: Backend must correctly calculate hasMore for last page', async () => {
      // First get total pages
      const firstResponse = await request(app)
        .get('/api/expenses?limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const totalPages = firstResponse.body.pagination.totalPages;

      if (totalPages > 1) {
        // Get last page
        const lastPageResponse = await request(app)
          .get(`/api/expenses?page=${totalPages}&limit=10`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(lastPageResponse.body.pagination.hasMore).toBe(false);
        expect(lastPageResponse.body.pagination.page).toBe(totalPages);
      }
    });

    test('REGRESSION: Backend must correctly calculate hasMore for middle pages', async () => {
      // First get total pages
      const firstResponse = await request(app)
        .get('/api/expenses?limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const totalPages = firstResponse.body.pagination.totalPages;

      if (totalPages > 2) {
        // Get a middle page
        const middlePage = Math.floor(totalPages / 2);
        const middlePageResponse = await request(app)
          .get(`/api/expenses?page=${middlePage}&limit=5`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(middlePageResponse.body.pagination.hasMore).toBe(true);
        expect(middlePageResponse.body.pagination.page).toBe(middlePage);
      }
    });

    test('REGRESSION: Backend must maintain consistent total count across pages', async () => {
      const page1Response = await request(app)
        .get('/api/expenses?page=1&limit=20')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const page2Response = await request(app)
        .get('/api/expenses?page=2&limit=20')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Total count should be the same for both pages
      expect(page1Response.body.pagination.total)
        .toBe(page2Response.body.pagination.total);
    });
  });

  describe('CRITICAL: Pagination with Sorting Integration', () => {
    test('REGRESSION: Pagination must work correctly with sorting', async () => {
      // Get first page with sorting
      const page1Response = await request(app)
        .get('/api/expenses?page=1&limit=10&sort_by=amount&sort_order=asc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Get second page with same sorting
      const page2Response = await request(app)
        .get('/api/expenses?page=2&limit=10&sort_by=amount&sort_order=asc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Both should respect the sorting
      const page1Amounts = page1Response.body.expenses.map(e => parseFloat(e.amount));
      const page2Amounts = page2Response.body.expenses.map(e => parseFloat(e.amount));

      // Verify page 1 is sorted ascending
      for (let i = 1; i < page1Amounts.length; i++) {
        expect(page1Amounts[i]).toBeGreaterThanOrEqual(page1Amounts[i - 1]);
      }

      // Verify page 2 is sorted ascending
      for (let i = 1; i < page2Amounts.length; i++) {
        expect(page2Amounts[i]).toBeGreaterThanOrEqual(page2Amounts[i - 1]);
      }

      // Verify pagination continuity: last item of page 1 should be <= first item of page 2
      if (page2Amounts.length > 0) {
        const lastPage1Amount = page1Amounts[page1Amounts.length - 1];
        const firstPage2Amount = page2Amounts[0];
        expect(firstPage2Amount).toBeGreaterThanOrEqual(lastPage1Amount);
      }
    });
  });

  describe('CRITICAL: Pagination with Filters Integration', () => {
    test('REGRESSION: Pagination must work correctly with category filters', async () => {
      const categoryId = testData.categories[0].id;

      const response = await request(app)
        .get(`/api/expenses?category_id=${categoryId}&page=1&limit=5`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // All expenses should be from the specified category
      response.body.expenses.forEach(expense => {
        expect(expense.category.id).toBe(categoryId);
      });

      // Should respect the limit
      expect(response.body.expenses.length).toBeLessThanOrEqual(5);
      expect(response.body.pagination.limit).toBe(5);

      // Pagination metadata should be accurate for filtered results
      expect(response.body.pagination.total).toBeDefined();
      expect(response.body.pagination.totalPages).toBeDefined();
    });

    test('REGRESSION: Pagination must work correctly with date range filters', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-06-30';

      const response = await request(app)
        .get(`/api/expenses?start_date=${startDate}&end_date=${endDate}&page=1&limit=8`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // All expenses should be within the date range
      response.body.expenses.forEach(expense => {
        const expenseDate = new Date(expense.expense_date);
        expect(expenseDate.getTime()).toBeGreaterThanOrEqual(new Date(startDate).getTime());
        expect(expenseDate.getTime()).toBeLessThanOrEqual(new Date(endDate).getTime());
      });

      // Should respect the limit
      expect(response.body.expenses.length).toBeLessThanOrEqual(8);
      expect(response.body.pagination.limit).toBe(8);
    });

    test('REGRESSION: Pagination must work correctly with search filters', async () => {
      const response = await request(app)
        .get('/api/expenses?search=test&page=1&limit=12')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Should respect the limit
      expect(response.body.expenses.length).toBeLessThanOrEqual(12);
      expect(response.body.pagination.limit).toBe(12);

      // Pagination metadata should be accurate for search results
      expect(response.body.pagination).toBeDefined();
    });
  });

  describe('CRITICAL: Performance Regression Prevention', () => {
    test('REGRESSION: Pagination queries must complete within time limits', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/expenses?page=1&limit=100')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 2 seconds
      expect(duration).toBeLessThan(2000);

      // Should return expected amount of data
      expect(response.body.expenses.length).toBeLessThanOrEqual(100);
    });

    test('REGRESSION: Large page numbers must not cause performance issues', async () => {
      const startTime = Date.now();

      // This should still be fast even for high page numbers
      const response = await request(app)
        .get('/api/expenses?page=100&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 3 seconds even for high page numbers
      expect(duration).toBeLessThan(3000);

      expect(response.body.pagination.page).toBe(100);
    });

    test('REGRESSION: Counting total records must not cause timeouts', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/expenses?limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Count query should be fast
      expect(duration).toBeLessThan(2000);

      // Should include accurate total count
      expect(response.body.pagination.total).toBeGreaterThan(0);
      expect(typeof response.body.pagination.total).toBe('number');
    });
  });

  describe('CRITICAL: Memory Usage Regression Prevention', () => {
    test('REGRESSION: Large limit requests must not cause memory issues', async () => {
      // This test ensures the fix doesn't allow unrestricted memory usage
      const response = await request(app)
        .get('/api/expenses?limit=500') // Max allowed limit
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Should handle max limit without issues
      expect(response.body.expenses.length).toBeLessThanOrEqual(500);

      // Response should be well-formed
      expect(response.body.pagination).toBeDefined();
      expect(response.body.expenses).toBeDefined();
    });

    test('REGRESSION: Backend must not cache unlimited results', async () => {
      // Make multiple requests to ensure no memory leak
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .get(`/api/expenses?page=${i + 1}&limit=50`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.expenses.length).toBeLessThanOrEqual(50);
        expect(response.body.pagination.limit).toBe(50);
      }
    });
  });
});