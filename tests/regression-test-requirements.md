# Regression Test Requirements - Critical Bug Prevention

## Overview

This document outlines comprehensive regression test requirements to prevent the recurrence of three critical bugs that were recently fixed:

1. **Backend Sorting Bug** - Backend was ignoring sort parameters
2. **Backend Pagination Bug** - Backend was returning 1000+ expenses instead of requested 50
3. **Mobile UI Bug** - Mobile scrolling issues and duplicate controls

## 1. Backend Sorting Regression Tests

### 1.1 API Endpoint Sorting Tests

#### Test: `test_expenses_api_respects_sort_by_parameter`
- **Purpose**: Ensure backend applies sort_by parameter correctly
- **Test Cases**:
  ```javascript
  describe('API Sorting Parameters', () => {
    test('should sort by expense_date when sort_by=expense_date', async () => {
      const response = await apiCall('/api/expenses?sort_by=expense_date&sort_order=asc');
      const expenses = response.expenses;
      
      // Verify ascending date order
      for (let i = 1; i < expenses.length; i++) {
        expect(new Date(expenses[i].expense_date))
          .toBeGreaterThanOrEqual(new Date(expenses[i-1].expense_date));
      }
    });

    test('should sort by amount when sort_by=amount', async () => {
      const response = await apiCall('/api/expenses?sort_by=amount&sort_order=desc');
      const expenses = response.expenses;
      
      // Verify descending amount order
      for (let i = 1; i < expenses.length; i++) {
        expect(parseFloat(expenses[i].amount))
          .toBeLessThanOrEqual(parseFloat(expenses[i-1].amount));
      }
    });

    test('should sort by description when sort_by=description', async () => {
      const response = await apiCall('/api/expenses?sort_by=description&sort_order=asc');
      const expenses = response.expenses;
      
      // Verify alphabetical order
      for (let i = 1; i < expenses.length; i++) {
        expect(expenses[i].description.toLowerCase())
          .toBeGreaterThanOrEqual(expenses[i-1].description.toLowerCase());
      }
    });
  });
  ```

#### Test: `test_sort_order_parameter_respected`
- **Purpose**: Ensure sort_order parameter toggles correctly
- **Test Cases**:
  ```javascript
  describe('Sort Order Parameter', () => {
    test('should respect asc sort order', async () => {
      const response = await apiCall('/api/expenses?sort_by=amount&sort_order=asc');
      const expenses = response.expenses;
      
      expect(parseFloat(expenses[0].amount))
        .toBeLessThanOrEqual(parseFloat(expenses[expenses.length - 1].amount));
    });

    test('should respect desc sort order', async () => {
      const response = await apiCall('/api/expenses?sort_by=amount&sort_order=desc');
      const expenses = response.expenses;
      
      expect(parseFloat(expenses[0].amount))
        .toBeGreaterThanOrEqual(parseFloat(expenses[expenses.length - 1].amount));
    });

    test('should default to desc when sort_order is invalid', async () => {
      const response = await apiCall('/api/expenses?sort_by=expense_date&sort_order=invalid');
      const expenses = response.expenses;
      
      // Should default to descending (newest first)
      expect(new Date(expenses[0].expense_date))
        .toBeGreaterThanOrEqual(new Date(expenses[1].expense_date));
    });
  });
  ```

### 1.2 Database Query Verification Tests

#### Test: `test_supabase_query_includes_order_clause`
- **Purpose**: Verify that sorting parameters are passed to Supabase queries
- **Implementation**: Mock Supabase calls and verify `.order()` method is called with correct parameters

### 1.3 Frontend-Backend Integration Tests

#### Test: `test_frontend_sort_buttons_trigger_backend_sort`
- **Purpose**: Ensure UI sort controls actually change backend data order
- **Test Cases**:
  ```javascript
  describe('Frontend-Backend Sort Integration', () => {
    test('clicking date sort button changes API results', async () => {
      render(<ExpenseViewer />);
      
      // Get initial data
      const initialExpenses = await waitFor(() => 
        screen.getAllByTestId('expense-row')
      );
      const initialFirstDate = getExpenseDateFromRow(initialExpenses[0]);
      
      // Click sort button to reverse order
      fireEvent.click(screen.getByRole('button', { name: /sort by date/i }));
      
      // Wait for new data
      await waitFor(() => {
        const newExpenses = screen.getAllByTestId('expense-row');
        const newFirstDate = getExpenseDateFromRow(newExpenses[0]);
        expect(newFirstDate).not.toBe(initialFirstDate);
      });
    });
  });
  ```

## 2. Backend Pagination Regression Tests

### 2.1 API Pagination Limit Tests

#### Test: `test_expenses_api_respects_limit_parameter`
- **Purpose**: Ensure backend returns only the requested number of items
- **Test Cases**:
  ```javascript
  describe('API Pagination Limits', () => {
    test('should return exactly 50 items when limit=50', async () => {
      const response = await apiCall('/api/expenses?limit=50');
      
      expect(response.expenses).toHaveLength(50);
      expect(response.pagination.limit).toBe(50);
    });

    test('should return exactly 25 items when limit=25', async () => {
      const response = await apiCall('/api/expenses?limit=25');
      
      expect(response.expenses).toHaveLength(25);
      expect(response.pagination.limit).toBe(25);
    });

    test('should not return more than 500 items even when limit=1000', async () => {
      const response = await apiCall('/api/expenses?limit=1000');
      
      expect(response.expenses.length).toBeLessThanOrEqual(500);
      expect(response.pagination.limit).toBeLessThanOrEqual(500);
    });

    test('should default to 50 items when no limit specified', async () => {
      const response = await apiCall('/api/expenses');
      
      expect(response.expenses.length).toBeLessThanOrEqual(50);
      expect(response.pagination.limit).toBe(50);
    });
  });
  ```

### 2.2 Pagination Metadata Tests

#### Test: `test_pagination_metadata_accuracy`
- **Purpose**: Ensure pagination metadata correctly reflects actual data
- **Test Cases**:
  ```javascript
  describe('Pagination Metadata', () => {
    test('should return correct total count', async () => {
      const response = await apiCall('/api/expenses?limit=10');
      
      expect(response.pagination).toHaveProperty('total');
      expect(response.pagination).toHaveProperty('totalPages');
      expect(response.pagination).toHaveProperty('page');
      expect(response.pagination).toHaveProperty('hasMore');
      
      // Verify totalPages calculation
      const expectedPages = Math.ceil(response.pagination.total / 10);
      expect(response.pagination.totalPages).toBe(expectedPages);
    });

    test('should correctly indicate hasMore for middle pages', async () => {
      const response = await apiCall('/api/expenses?page=2&limit=10');
      
      if (response.pagination.totalPages > 2) {
        expect(response.pagination.hasMore).toBe(true);
      }
    });

    test('should correctly indicate no more for last page', async () => {
      const firstResponse = await apiCall('/api/expenses?limit=10');
      const lastPage = firstResponse.pagination.totalPages;
      
      const lastPageResponse = await apiCall(`/api/expenses?page=${lastPage}&limit=10`);
      
      expect(lastPageResponse.pagination.hasMore).toBe(false);
    });
  });
  ```

### 2.3 Page Parameter Tests

#### Test: `test_page_parameter_respected`
- **Purpose**: Ensure page parameter correctly offsets results
- **Test Cases**:
  ```javascript
  describe('Page Parameter', () => {
    test('should return different data for different pages', async () => {
      const page1 = await apiCall('/api/expenses?page=1&limit=10');
      const page2 = await apiCall('/api/expenses?page=2&limit=10');
      
      // Verify different expenses are returned
      const page1Ids = page1.expenses.map(e => e.id);
      const page2Ids = page2.expenses.map(e => e.id);
      
      expect(page1Ids).not.toEqual(page2Ids);
      
      // Verify no overlap in IDs
      const overlap = page1Ids.filter(id => page2Ids.includes(id));
      expect(overlap).toHaveLength(0);
    });

    test('should handle edge cases for page parameter', async () => {
      // Test page 0 defaults to page 1
      const page0 = await apiCall('/api/expenses?page=0&limit=10');
      expect(page0.pagination.page).toBe(1);
      
      // Test negative page defaults to page 1
      const pageNeg = await apiCall('/api/expenses?page=-1&limit=10');
      expect(pageNeg.pagination.page).toBe(1);
      
      // Test page beyond total pages returns empty
      const beyondPage = await apiCall('/api/expenses?page=99999&limit=10');
      expect(beyondPage.expenses).toHaveLength(0);
    });
  });
  ```

## 3. Mobile UI Regression Tests

### 3.1 Mobile Sorting Controls Tests

#### Test: `test_mobile_sort_controls_no_duplicates`
- **Purpose**: Ensure mobile sorting controls don't duplicate
- **Test Cases**:
  ```javascript
  describe('Mobile Sort Controls', () => {
    beforeEach(() => {
      // Set mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;
      global.dispatchEvent(new Event('resize'));
    });

    test('should not render duplicate sort buttons', () => {
      render(<EnhancedMobileExpenseList />);
      
      // Count sort buttons for each type
      const dateSortButtons = screen.getAllByText(/sort.*date/i);
      const amountSortButtons = screen.getAllByText(/sort.*amount/i);
      const descSortButtons = screen.getAllByText(/sort.*description/i);
      
      expect(dateSortButtons.length).toBe(1);
      expect(amountSortButtons.length).toBe(1);
      expect(descSortButtons.length).toBe(1);
    });

    test('should render sort controls only once per component', () => {
      const { rerender } = render(<EnhancedMobileExpenseList />);
      
      // Initial render
      const initialSortControls = screen.getAllByTestId(/sort-button/);
      
      // Re-render
      rerender(<EnhancedMobileExpenseList />);
      
      // Should have same number of controls
      const afterRerenderControls = screen.getAllByTestId(/sort-button/);
      expect(afterRerenderControls.length).toBe(initialSortControls.length);
    });

    test('sort controls should be properly positioned', () => {
      render(<EnhancedMobileExpenseList />);
      
      const sortContainer = screen.getByTestId('mobile-sort-container');
      const computedStyle = window.getComputedStyle(sortContainer);
      
      // Should not overlap with other elements
      expect(computedStyle.position).toBe('relative');
      expect(computedStyle.zIndex).toBe('10');
    });
  });
  ```

### 3.2 Mobile Scrolling Tests

#### Test: `test_mobile_scrolling_unrestricted`
- **Purpose**: Ensure mobile scrolling works in all directions
- **Test Cases**:
  ```javascript
  describe('Mobile Scrolling', () => {
    beforeEach(() => {
      // Set mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;
      global.dispatchEvent(new Event('resize'));
    });

    test('should allow vertical scrolling in expense list', async () => {
      render(<EnhancedMobileExpenseList />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('expense-card').length).toBeGreaterThan(5);
      });

      const scrollableContainer = screen.getByTestId('mobile-expense-container');
      
      // Simulate scroll
      fireEvent.scroll(scrollableContainer, {
        target: { scrollTop: 100 }
      });

      // Should not prevent scrolling
      expect(scrollableContainer.scrollTop).toBe(100);
    });

    test('should allow horizontal scrolling when needed', () => {
      render(<EnhancedMobileExpenseList />);
      
      const container = screen.getByTestId('mobile-expense-container');
      const computedStyle = window.getComputedStyle(container);
      
      // Should not restrict overflow
      expect(computedStyle.overflowY).not.toBe('hidden');
      expect(computedStyle.overflowX).not.toBe('hidden');
    });

    test('should not interfere with native scroll behavior', () => {
      render(<EnhancedMobileExpenseList />);
      
      const scrollableArea = screen.getByRole('main');
      
      // Check for scroll restrictions
      const computedStyle = window.getComputedStyle(scrollableArea);
      expect(computedStyle.touchAction).not.toBe('none');
      expect(computedStyle.overscrollBehavior).not.toBe('none');
    });
  });
  ```

### 3.3 Touch Interaction Tests

#### Test: `test_mobile_touch_interactions_responsive`
- **Purpose**: Ensure touch interactions work correctly
- **Test Cases**:
  ```javascript
  describe('Mobile Touch Interactions', () => {
    test('sort buttons respond to touch events', async () => {
      render(<EnhancedMobileExpenseList />);
      
      const sortButton = screen.getByRole('button', { name: /sort by date/i });
      
      // Simulate touch interaction
      fireEvent.touchStart(sortButton);
      fireEvent.touchEnd(sortButton);
      
      // Should trigger visual feedback
      expect(sortButton).toHaveClass(/active|pressed/);
    });

    test('expense cards respond to touch', async () => {
      render(<EnhancedMobileExpenseList />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('expense-card').length).toBeGreaterThan(0);
      });

      const expenseCard = screen.getAllByTestId('expense-card')[0];
      
      // Touch should provide visual feedback
      fireEvent.touchStart(expenseCard);
      
      // Check for active state or transition
      const computedStyle = window.getComputedStyle(expenseCard);
      expect(computedStyle.transform).toBeDefined();
    });

    test('swipe gestures work without conflicts', () => {
      render(<EnhancedMobileExpenseList />);
      
      const container = screen.getByTestId('mobile-expense-container');
      
      // Simulate swipe gesture
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      fireEvent.touchMove(container, {
        touches: [{ clientX: 200, clientY: 100 }]
      });

      fireEvent.touchEnd(container, {
        changedTouches: [{ clientX: 200, clientY: 100 }]
      });

      // Should handle swipe without errors
      expect(container).toBeInTheDocument();
    });
  });
  ```

## 4. Integration Regression Tests

### 4.1 End-to-End Workflow Tests

#### Test: `test_complete_sort_and_pagination_workflow`
- **Purpose**: Test the entire user workflow with sorting and pagination
- **Test Cases**:
  ```javascript
  describe('Complete User Workflow', () => {
    test('should maintain sort order across page changes', async () => {
      render(<ExpenseViewer />);
      
      // Set sort order
      fireEvent.click(screen.getByRole('button', { name: /sort by amount/i }));
      
      await waitFor(() => {
        const expenses = screen.getAllByTestId('expense-row');
        expect(expenses.length).toBeGreaterThan(0);
      });

      // Get first page amounts
      const page1Amounts = getExpenseAmountsFromDOM();
      
      // Go to next page
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      
      await waitFor(() => {
        const page2Amounts = getExpenseAmountsFromDOM();
        
        // Verify sort order is maintained across pages
        expect(page2Amounts[0]).toBeLessThanOrEqual(page1Amounts[page1Amounts.length - 1]);
      });
    });

    test('should handle sort change with pagination reset', async () => {
      render(<ExpenseViewer />);
      
      // Go to page 2
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      
      // Change sort order
      fireEvent.click(screen.getByRole('button', { name: /sort by date/i }));
      
      await waitFor(() => {
        // Should reset to page 1
        const pagination = screen.getByTestId('pagination-info');
        expect(pagination).toHaveTextContent('Page 1');
      });
    });
  });
  ```

### 4.2 Performance Regression Tests

#### Test: `test_sort_and_pagination_performance`
- **Purpose**: Ensure fixes don't impact performance
- **Test Cases**:
  ```javascript
  describe('Performance Regression', () => {
    test('sorting large datasets completes within time limit', async () => {
      // Mock large dataset
      mockLargeExpenseDataset(1000);
      
      const startTime = performance.now();
      
      render(<ExpenseViewer />);
      fireEvent.click(screen.getByRole('button', { name: /sort by amount/i }));
      
      await waitFor(() => {
        expect(screen.getAllByTestId('expense-row').length).toBeGreaterThan(0);
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(2000); // 2 second limit
    });

    test('pagination changes are responsive', async () => {
      const startTime = performance.now();
      
      render(<ExpenseViewer />);
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('pagination-info')).toHaveTextContent('Page 2');
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // 1 second limit
    });
  });
  ```

## 5. Test Implementation Guidelines

### 5.1 Test Environment Setup
- Use consistent viewport sizes for mobile testing (375x667 for mobile, 1024x768 for desktop)
- Mock Supabase calls consistently
- Set up proper cleanup between tests

### 5.2 Test Data Requirements
- Create predictable test datasets with known sort orders
- Include edge cases (empty descriptions, zero amounts, same dates)
- Use factories for consistent test data generation

### 5.3 Assertion Strategies
- Verify both frontend state and backend API calls
- Test actual DOM rendering, not just component state
- Include performance benchmarks for critical paths

### 5.4 Coverage Requirements
- Backend sorting: 100% of sort combinations (field + order)
- Backend pagination: All edge cases (limits, pages, totals)
- Mobile UI: All interactive elements and gestures
- Integration: Complete user workflows

## 6. Continuous Integration Integration

### 6.1 Pre-commit Hooks
- Run regression tests on every commit
- Fail builds if critical regression tests fail

### 6.2 Deployment Gates
- All regression tests must pass before production deployment
- Performance benchmarks must meet thresholds

### 6.3 Monitoring
- Set up alerts for performance degradation
- Monitor API response times for sorting and pagination
- Track mobile user interaction metrics

## 7. Test Maintenance

### 7.1 Review Schedule
- Review regression tests monthly
- Update tests when new features are added
- Retire obsolete tests

### 7.2 Documentation
- Keep this requirements document updated
- Document any new edge cases discovered
- Maintain test data setup instructions

---

**Priority Level**: CRITICAL
**Review Date**: Monthly
**Owner**: QA Team + Development Team
**Last Updated**: 2025-08-28

This regression test suite should prevent the recurrence of the three critical bugs while ensuring overall system stability and performance.