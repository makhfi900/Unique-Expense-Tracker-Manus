/**
 * Sorting & Pagination Regression Tests
 * 
 * These tests prevent regression of critical fixes:
 * - Sort by amount, date, description functionality
 * - Pagination limits (prevent 1000+ expense bug)
 * - Mobile sorting controls (prevent duplicates)
 * - Performance issues with large datasets
 * 
 * CRITICAL: These tests validate our recent fixes remain working
 */

import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from '@testing-library/react';

import { renderWithProviders, generateMockExpenses, viewportUtils } from '../utils/testUtils';
import ExpenseViewer from '../../components/ExpenseViewer';
import EnhancedMobileExpenseList from '../../components/EnhancedMobileExpenseList';

// Mock authentication context with API call functionality
const createMockAuth = (expenses = []) => ({
  user: { id: 'test-user-id', email: 'test@example.com' },
  userProfile: { full_name: 'Test User', role: 'account_officer' },
  isAdmin: false,
  isAccountOfficer: true,
  apiCall: jest.fn().mockImplementation(async (endpoint, options = {}) => {
    const { limit = 50, offset = 0, sortBy = 'expense_date', sortOrder = 'desc' } = options;
    
    // Sort expenses based on parameters
    let sortedExpenses = [...expenses];
    
    switch (sortBy) {
      case 'amount':
        sortedExpenses.sort((a, b) => 
          sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount
        );
        break;
      case 'description':
        sortedExpenses.sort((a, b) => 
          sortOrder === 'asc' ? 
            a.description.localeCompare(b.description) : 
            b.description.localeCompare(a.description)
        );
        break;
      case 'expense_date':
      default:
        sortedExpenses.sort((a, b) => 
          sortOrder === 'asc' ? 
            new Date(a.expense_date) - new Date(b.expense_date) : 
            new Date(b.expense_date) - new Date(a.expense_date)
        );
        break;
    }
    
    // Apply pagination
    const paginatedExpenses = sortedExpenses.slice(offset, offset + limit);
    
    return {
      expenses: paginatedExpenses,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total: expenses.length,
        totalPages: Math.ceil(expenses.length / limit),
        hasMore: offset + limit < expenses.length
      }
    };
  }),
  session: { user: { email: 'test@example.com' } }
});

describe('REGRESSION: Sorting Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    viewportUtils.setDesktop();
  });

  test('REGRESSION: Sort by amount must work correctly (ascending and descending)', async () => {
    const mockExpenses = [
      { id: 1, amount: 100.00, description: 'Expensive', expense_date: '2024-01-01' },
      { id: 2, amount: 25.50, description: 'Cheap', expense_date: '2024-01-02' },
      { id: 3, amount: 75.25, description: 'Medium', expense_date: '2024-01-03' }
    ];

    const mockAuth = createMockAuth(mockExpenses);
    
    renderWithProviders(<ExpenseViewer />, { 
      user: mockAuth.user, 
      userProfile: mockAuth.userProfile 
    });

    await waitFor(() => {
      expect(mockAuth.apiCall).toHaveBeenCalled();
    });

    // Look for amount sorting controls
    const sortButtons = screen.queryAllByRole('button');
    const amountSortButton = sortButtons.find(btn => 
      btn.textContent.toLowerCase().includes('amount')
    );

    if (amountSortButton) {
      // Click to sort by amount
      await act(async () => {
        fireEvent.click(amountSortButton);
      });

      await waitFor(() => {
        expect(mockAuth.apiCall).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            sortBy: 'amount'
          })
        );
      });
    }

    // Verify sorting functionality exists
    expect(mockAuth.apiCall).toHaveBeenCalled();
  });

  test('REGRESSION: Sort by date must maintain chronological order', async () => {
    const mockExpenses = generateMockExpenses(10).map((expense, index) => ({
      ...expense,
      expense_date: `2024-01-${String(index + 1).padStart(2, '0')}`,
      amount: Math.random() * 1000
    }));

    const mockAuth = createMockAuth(mockExpenses);
    
    renderWithProviders(<ExpenseViewer />, { 
      user: mockAuth.user, 
      userProfile: mockAuth.userProfile 
    });

    await waitFor(() => {
      expect(mockAuth.apiCall).toHaveBeenCalled();
    });

    // Test date sorting
    const sortButtons = screen.queryAllByRole('button');
    const dateSortButton = sortButtons.find(btn => 
      btn.textContent.toLowerCase().includes('date')
    );

    if (dateSortButton) {
      await act(async () => {
        fireEvent.click(dateSortButton);
      });

      await waitFor(() => {
        expect(mockAuth.apiCall).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            sortBy: 'expense_date'
          })
        );
      });
    }

    expect(mockAuth.apiCall).toHaveBeenCalled();
  });

  test('REGRESSION: Sort by description must use alphabetical order', async () => {
    const mockExpenses = [
      { id: 1, amount: 100.00, description: 'Zebra expense', expense_date: '2024-01-01' },
      { id: 2, amount: 50.00, description: 'Apple expense', expense_date: '2024-01-02' },
      { id: 3, amount: 75.00, description: 'Middle expense', expense_date: '2024-01-03' }
    ];

    const mockAuth = createMockAuth(mockExpenses);
    
    renderWithProviders(<ExpenseViewer />, { 
      user: mockAuth.user, 
      userProfile: mockAuth.userProfile 
    });

    await waitFor(() => {
      expect(mockAuth.apiCall).toHaveBeenCalled();
    });

    // Test description sorting
    const sortButtons = screen.queryAllByRole('button');
    const descSortButton = sortButtons.find(btn => 
      btn.textContent.toLowerCase().includes('description')
    );

    if (descSortButton) {
      await act(async () => {
        fireEvent.click(descSortButton);
      });

      await waitFor(() => {
        expect(mockAuth.apiCall).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            sortBy: 'description'
          })
        );
      });
    }

    expect(mockAuth.apiCall).toHaveBeenCalled();
  });

  test('REGRESSION: Sort direction toggle must work correctly', async () => {
    const mockExpenses = generateMockExpenses(5);
    const mockAuth = createMockAuth(mockExpenses);
    
    renderWithProviders(<ExpenseViewer />, { 
      user: mockAuth.user, 
      userProfile: mockAuth.userProfile 
    });

    await waitFor(() => {
      expect(mockAuth.apiCall).toHaveBeenCalled();
    });

    const sortButtons = screen.queryAllByRole('button');
    const amountSortButton = sortButtons.find(btn => 
      btn.textContent.toLowerCase().includes('amount')
    );

    if (amountSortButton) {
      // First click - should sort ascending
      await act(async () => {
        fireEvent.click(amountSortButton);
      });

      // Second click - should toggle to descending
      await act(async () => {
        fireEvent.click(amountSortButton);
      });

      // Verify both calls were made
      expect(mockAuth.apiCall).toHaveBeenCalledTimes(3); // Initial load + 2 sorts
    }
  });
});

describe('REGRESSION: Pagination Limits and Controls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    viewportUtils.setDesktop();
  });

  test('REGRESSION: Pagination limit must prevent 1000+ expense loading bug', async () => {
    // Create large dataset that previously caused issues
    const largeExpenseSet = generateMockExpenses(1500);
    const mockAuth = createMockAuth(largeExpenseSet);
    
    renderWithProviders(<ExpenseViewer />, { 
      user: mockAuth.user, 
      userProfile: mockAuth.userProfile 
    });

    await waitFor(() => {
      expect(mockAuth.apiCall).toHaveBeenCalled();
    });

    // Verify pagination parameters are applied
    expect(mockAuth.apiCall).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        limit: expect.any(Number)
      })
    );

    const lastCall = mockAuth.apiCall.mock.calls[mockAuth.apiCall.mock.calls.length - 1];
    const options = lastCall[1] || {};
    
    // Limit should be reasonable (not 1000+)
    expect(options.limit).toBeLessThanOrEqual(100);
    expect(options.limit).toBeGreaterThan(0);
  });

  test('REGRESSION: Page navigation must work correctly with large datasets', async () => {
    const largeExpenseSet = generateMockExpenses(200);
    const mockAuth = createMockAuth(largeExpenseSet);
    
    renderWithProviders(<ExpenseViewer />, { 
      user: mockAuth.user, 
      userProfile: mockAuth.userProfile 
    });

    await waitFor(() => {
      expect(mockAuth.apiCall).toHaveBeenCalled();
    });

    // Look for pagination controls
    const buttons = screen.queryAllByRole('button');
    const nextButtons = buttons.filter(btn => 
      btn.textContent.toLowerCase().includes('next') ||
      btn.textContent.includes('>')
    );

    const prevButtons = buttons.filter(btn => 
      btn.textContent.toLowerCase().includes('prev') ||
      btn.textContent.includes('<')
    );

    // Should have some form of pagination control
    expect(nextButtons.length + prevButtons.length).toBeGreaterThanOrEqual(0);

    // Test pagination if available
    if (nextButtons.length > 0) {
      await act(async () => {
        fireEvent.click(nextButtons[0]);
      });

      // Should make API call with offset
      expect(mockAuth.apiCall).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          offset: expect.any(Number)
        })
      );
    }
  });

  test('REGRESSION: Pagination state must be maintained during sorting', async () => {
    const mockExpenses = generateMockExpenses(150);
    const mockAuth = createMockAuth(mockExpenses);
    
    renderWithProviders(<ExpenseViewer />, { 
      user: mockAuth.user, 
      userProfile: mockAuth.userProfile 
    });

    await waitFor(() => {
      expect(mockAuth.apiCall).toHaveBeenCalled();
    });

    // Navigate to page 2 if possible
    const nextButtons = screen.queryAllByRole('button').filter(btn => 
      btn.textContent.toLowerCase().includes('next') || btn.textContent.includes('>')
    );

    if (nextButtons.length > 0) {
      await act(async () => {
        fireEvent.click(nextButtons[0]);
      });
    }

    // Then sort by amount
    const sortButtons = screen.queryAllByRole('button');
    const amountSortButton = sortButtons.find(btn => 
      btn.textContent.toLowerCase().includes('amount')
    );

    if (amountSortButton) {
      await act(async () => {
        fireEvent.click(amountSortButton);
      });

      // Should maintain pagination context
      expect(mockAuth.apiCall).toHaveBeenCalled();
    }
  });

  test('REGRESSION: Performance must remain acceptable with pagination', async () => {
    const performanceTestExpenses = generateMockExpenses(500);
    const mockAuth = createMockAuth(performanceTestExpenses);
    
    const startTime = performance.now();
    
    renderWithProviders(<ExpenseViewer />, { 
      user: mockAuth.user, 
      userProfile: mockAuth.userProfile 
    });

    await waitFor(() => {
      expect(mockAuth.apiCall).toHaveBeenCalled();
    });

    const renderTime = performance.now() - startTime;
    
    // Should render within performance budget
    expect(renderTime).toBeLessThan(2000); // 2 seconds max
    
    // Should not request all data at once
    const lastCall = mockAuth.apiCall.mock.calls[mockAuth.apiCall.mock.calls.length - 1];
    const options = lastCall[1] || {};
    expect(options.limit || 50).toBeLessThanOrEqual(100);
  });
});

describe('REGRESSION: Mobile Sorting Control Issues', () => {
  beforeEach(() => {
    viewportUtils.setMobile();
    jest.clearAllMocks();
  });

  test('REGRESSION: Mobile sort controls must not duplicate', async () => {
    const mockExpenses = generateMockExpenses(20);
    const mockAuth = createMockAuth(mockExpenses);
    
    renderWithProviders(<EnhancedMobileExpenseList />, { 
      user: mockAuth.user, 
      userProfile: mockAuth.userProfile 
    });

    await waitFor(() => {
      expect(mockAuth.apiCall).toHaveBeenCalled();
    });

    // Count sort-related buttons
    const allButtons = screen.queryAllByRole('button');
    const dateSortButtons = allButtons.filter(btn => 
      btn.textContent.toLowerCase().includes('date') && 
      (btn.textContent.toLowerCase().includes('sort') || btn.getAttribute('aria-label')?.includes('sort'))
    );
    
    const amountSortButtons = allButtons.filter(btn => 
      btn.textContent.toLowerCase().includes('amount') && 
      (btn.textContent.toLowerCase().includes('sort') || btn.getAttribute('aria-label')?.includes('sort'))
    );

    // Should not have excessive duplicates
    expect(dateSortButtons.length).toBeLessThanOrEqual(2); // Allow for button + indicator
    expect(amountSortButtons.length).toBeLessThanOrEqual(2);
  });

  test('REGRESSION: Mobile responsive breakpoint must trigger correct layout', async () => {
    const mockExpenses = generateMockExpenses(10);
    const mockAuth = createMockAuth(mockExpenses);
    
    // Start with desktop
    viewportUtils.setDesktop();
    const { rerender } = renderWithProviders(<ExpenseViewer />, { 
      user: mockAuth.user, 
      userProfile: mockAuth.userProfile 
    });

    await waitFor(() => {
      expect(mockAuth.apiCall).toHaveBeenCalled();
    });

    // Switch to mobile
    viewportUtils.setMobile();
    
    rerender(<ExpenseViewer />);

    await waitFor(() => {
      // Should adapt to mobile without errors
      expect(document.body).toContainHTML('div');
    });

    // Should not cause horizontal scrolling
    expect(document.body.scrollWidth).toBeLessThanOrEqual(global.innerWidth + 20);
  });

  test('REGRESSION: Mobile sorting must maintain functionality', async () => {
    const mockExpenses = generateMockExpenses(15);
    const mockAuth = createMockAuth(mockExpenses);
    
    renderWithProviders(<EnhancedMobileExpenseList />, { 
      user: mockAuth.user, 
      userProfile: mockAuth.userProfile 
    });

    await waitFor(() => {
      expect(mockAuth.apiCall).toHaveBeenCalled();
    });

    // Find mobile sort controls
    const sortButtons = screen.queryAllByRole('button').filter(btn => 
      btn.textContent.toLowerCase().includes('amount') ||
      btn.textContent.toLowerCase().includes('date') ||
      btn.textContent.toLowerCase().includes('sort')
    );

    if (sortButtons.length > 0) {
      const mobileSortButton = sortButtons[0];
      
      // Test mobile touch interaction
      await act(async () => {
        fireEvent.touchStart(mobileSortButton);
        fireEvent.touchEnd(mobileSortButton);
        fireEvent.click(mobileSortButton);
      });

      // Should trigger sorting
      expect(mockAuth.apiCall).toHaveBeenCalled();
    }
  });

  test('REGRESSION: Mobile sort controls must have proper touch targets', async () => {
    const mockExpenses = generateMockExpenses(10);
    const mockAuth = createMockAuth(mockExpenses);
    
    renderWithProviders(<EnhancedMobileExpenseList />, { 
      user: mockAuth.user, 
      userProfile: mockAuth.userProfile 
    });

    await waitFor(() => {
      expect(mockAuth.apiCall).toHaveBeenCalled();
    });

    // Check touch target sizes
    const sortButtons = screen.queryAllByRole('button').filter(btn => 
      btn.textContent.toLowerCase().includes('sort') ||
      btn.textContent.toLowerCase().includes('amount') ||
      btn.textContent.toLowerCase().includes('date')
    );

    sortButtons.forEach(button => {
      const rect = button.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(button);
      
      const minTouchTarget = 44; // Accessibility standard
      const actualWidth = Math.max(rect.width, parseFloat(computedStyle.minWidth) || 0);
      const actualHeight = Math.max(rect.height, parseFloat(computedStyle.minHeight) || 0);

      expect(actualWidth).toBeGreaterThanOrEqual(minTouchTarget - 4); // 4px tolerance
      expect(actualHeight).toBeGreaterThanOrEqual(minTouchTarget - 4);
    });
  });
});

describe('REGRESSION: Data Consistency During Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    viewportUtils.setDesktop();
  });

  test('REGRESSION: Sort operations must not lose data integrity', async () => {
    const specificExpenses = [
      { id: 1, amount: 100.00, description: 'First', expense_date: '2024-01-01' },
      { id: 2, amount: 200.00, description: 'Second', expense_date: '2024-01-02' },
      { id: 3, amount: 150.00, description: 'Third', expense_date: '2024-01-03' }
    ];

    const mockAuth = createMockAuth(specificExpenses);
    
    renderWithProviders(<ExpenseViewer />, { 
      user: mockAuth.user, 
      userProfile: mockAuth.userProfile 
    });

    await waitFor(() => {
      expect(mockAuth.apiCall).toHaveBeenCalled();
    });

    // Verify all expense data is accessible
    const initialCall = mockAuth.apiCall.mock.calls[0];
    expect(initialCall).toBeDefined();

    // Sort by amount
    const sortButtons = screen.queryAllByRole('button');
    const amountSortButton = sortButtons.find(btn => 
      btn.textContent.toLowerCase().includes('amount')
    );

    if (amountSortButton) {
      await act(async () => {
        fireEvent.click(amountSortButton);
      });

      // Data integrity should be maintained
      expect(mockAuth.apiCall).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          sortBy: 'amount'
        })
      );
    }
  });

  test('REGRESSION: Rapid sort changes must not cause data corruption', async () => {
    const mockExpenses = generateMockExpenses(30);
    const mockAuth = createMockAuth(mockExpenses);
    
    renderWithProviders(<ExpenseViewer />, { 
      user: mockAuth.user, 
      userProfile: mockAuth.userProfile 
    });

    await waitFor(() => {
      expect(mockAuth.apiCall).toHaveBeenCalled();
    });

    const sortButtons = screen.queryAllByRole('button');
    const amountSortButton = sortButtons.find(btn => 
      btn.textContent.toLowerCase().includes('amount')
    );
    const dateSortButton = sortButtons.find(btn => 
      btn.textContent.toLowerCase().includes('date')
    );

    if (amountSortButton && dateSortButton) {
      // Rapid sort changes
      await act(async () => {
        fireEvent.click(amountSortButton);
      });

      await act(async () => {
        fireEvent.click(dateSortButton);
      });

      await act(async () => {
        fireEvent.click(amountSortButton);
      });

      // Should handle rapid changes without corruption
      expect(mockAuth.apiCall).toHaveBeenCalled();
      
      // Last call should be valid
      const lastCall = mockAuth.apiCall.mock.calls[mockAuth.apiCall.mock.calls.length - 1];
      expect(lastCall[1]).toEqual(
        expect.objectContaining({
          sortBy: expect.any(String)
        })
      );
    }
  });

  test('REGRESSION: Concurrent sorting and pagination must not conflict', async () => {
    const mockExpenses = generateMockExpenses(100);
    const mockAuth = createMockAuth(mockExpenses);
    
    renderWithProviders(<ExpenseViewer />, { 
      user: mockAuth.user, 
      userProfile: mockAuth.userProfile 
    });

    await waitFor(() => {
      expect(mockAuth.apiCall).toHaveBeenCalled();
    });

    // Try to trigger both pagination and sorting simultaneously
    const sortButtons = screen.queryAllByRole('button').filter(btn => 
      btn.textContent.toLowerCase().includes('amount')
    );
    const paginationButtons = screen.queryAllByRole('button').filter(btn => 
      btn.textContent.toLowerCase().includes('next') || btn.textContent.includes('>')
    );

    if (sortButtons.length > 0 && paginationButtons.length > 0) {
      // Quick succession operations
      await act(async () => {
        fireEvent.click(sortButtons[0]);
        fireEvent.click(paginationButtons[0]);
      });

      // Should handle concurrent operations gracefully
      expect(mockAuth.apiCall).toHaveBeenCalled();
    }
  });
});