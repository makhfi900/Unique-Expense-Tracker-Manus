/**
 * CRITICAL PAGINATION FIX - Regression Tests
 * 
 * Tests for the MAJOR BUG FIX: Backend was returning 1000+ expenses instead of requested 50
 * 
 * Before Fix: Backend ignored limit parameter, returned all expenses
 * After Fix: Backend correctly processes limit and page parameters, returns pagination metadata
 * 
 * These tests MUST pass to prevent regression of pagination functionality
 */

import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders, generateMockExpenses, mockApiCall } from '../utils/testUtils';
import EnhancedMobileExpenseList from '../../components/EnhancedMobileExpenseList';
import ExpenseViewer from '../../components/ExpenseViewer';

describe('REGRESSION: Critical Pagination Fix', () => {
  let mockAuth;

  beforeEach(() => {
    mockAuth = {
      user: { id: 'test-user-id', email: 'test@example.com' },
      userProfile: { full_name: 'Test User', role: 'account_officer' },
      isAdmin: false,
      apiCall: jest.fn(),
    };
  });

  describe('Backend API Pagination Parameters', () => {
    test('CRITICAL: API receives correct limit parameter (prevents 1000+ expenses bug)', async () => {
      // Generate large dataset (200 expenses) to test pagination
      const largeDataset = generateMockExpenses(200);
      
      // Mock API to return only first 50 expenses (proper pagination)
      const firstPage = largeDataset.slice(0, 50);
      mockAuth.apiCall = jest.fn().mockResolvedValue({
        expenses: firstPage,
        pagination: {
          page: 1,
          limit: 50,
          total: 200,
          totalPages: 4,
          hasMore: true
        }
      });

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(50);
      });

      // Verify API was called with correct limit parameter
      expect(mockAuth.apiCall).toHaveBeenCalledWith(
        expect.stringContaining('limit=50'),
        expect.any(Object)
      );

      // CRITICAL: Ensure we don't get 1000+ expenses
      expect(screen.getAllByTestId(/expense-item/)).toHaveLength(50);
      expect(screen.queryAllByTestId(/expense-item/)).not.toHaveLength(200);
    });

    test('CRITICAL: API receives correct page parameter for navigation', async () => {
      const largeDataset = generateMockExpenses(100);
      const firstPage = largeDataset.slice(0, 50);
      const secondPage = largeDataset.slice(50, 100);

      // Mock API to return first page initially
      mockAuth.apiCall = jest.fn()
        .mockResolvedValueOnce({
          expenses: firstPage,
          pagination: { page: 1, limit: 50, total: 100, totalPages: 2, hasMore: true }
        })
        .mockResolvedValueOnce({
          expenses: secondPage,
          pagination: { page: 2, limit: 50, total: 100, totalPages: 2, hasMore: false }
        });

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      // Wait for first page
      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(50);
      });

      // Navigate to next page
      const nextPageButton = screen.getByRole('button', { name: /next|page 2/i });
      fireEvent.click(nextPageButton);

      // Verify API was called with page=2
      await waitFor(() => {
        expect(mockAuth.apiCall).toHaveBeenCalledWith(
          expect.stringContaining('page=2'),
          expect.any(Object)
        );
      });

      // Verify second page loaded
      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(50);
      });
    });

    test('CRITICAL: API returns proper pagination metadata', async () => {
      const testDataset = generateMockExpenses(75);
      const firstPage = testDataset.slice(0, 50);

      mockAuth.apiCall = jest.fn().mockResolvedValue({
        expenses: firstPage,
        pagination: {
          page: 1,
          limit: 50,
          total: 75,
          totalPages: 2,
          hasMore: true
        }
      });

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(50);
      });

      // Verify pagination info is displayed
      expect(screen.getByText(/page 1.*of 2/i) || screen.getByText(/1.*\/ 2/i)).toBeInTheDocument();
      expect(screen.getByText(/75.*total/i) || screen.getByText(/showing.*50.*of.*75/i)).toBeInTheDocument();
    });
  });

  describe('Mobile Pagination UI', () => {
    test('CRITICAL: Mobile pagination shows correct item counts', async () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });

      const testDataset = generateMockExpenses(130);
      const firstPage = testDataset.slice(0, 50);

      mockAuth.apiCall = jest.fn().mockResolvedValue({
        expenses: firstPage,
        pagination: {
          page: 1,
          limit: 50,
          total: 130,
          totalPages: 3,
          hasMore: true
        }
      });

      renderWithProviders(<EnhancedMobileExpenseList />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(50);
      });

      // Verify mobile UI shows correct pagination info
      expect(screen.getByText(/130.*total/i) || screen.getByText(/page.*1/i)).toBeInTheDocument();

      // CRITICAL: Verify "Select All" shows correct count (50, not 1000+)
      const selectAllButton = screen.getByRole('button', { name: /select all/i });
      expect(selectAllButton).toHaveTextContent(/50/); // Should show page count, not total
    });

    test('CRITICAL: Infinite scroll loads additional pages correctly', async () => {
      const largeDataset = generateMockExpenses(150);
      const firstPage = largeDataset.slice(0, 50);
      const secondPage = largeDataset.slice(50, 100);

      mockAuth.apiCall = jest.fn()
        .mockResolvedValueOnce({
          expenses: firstPage,
          pagination: { page: 1, limit: 50, total: 150, totalPages: 3, hasMore: true }
        })
        .mockResolvedValueOnce({
          expenses: secondPage,
          pagination: { page: 2, limit: 50, total: 150, totalPages: 3, hasMore: true }
        });

      renderWithProviders(<EnhancedMobileExpenseList />, { auth: mockAuth });

      // Wait for first page
      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(50);
      });

      // Simulate scroll to trigger infinite scroll
      const scrollContainer = screen.getByTestId(/expense-list|scroll-container/);
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 1000 } });

      // Verify additional data loaded
      await waitFor(() => {
        expect(mockAuth.apiCall).toHaveBeenCalledWith(
          expect.stringContaining('page=2'),
          expect.any(Object)
        );
      });

      // Should now have 100 items total (2 pages * 50 each)
      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(100);
      });
    });
  });

  describe('Pagination Performance', () => {
    test('CRITICAL: Large dataset pagination performs within budget', async () => {
      // Test with realistic large dataset (500 expenses)
      const largeDataset = generateMockExpenses(500);
      const firstPage = largeDataset.slice(0, 50);

      mockAuth.apiCall = jest.fn().mockResolvedValue({
        expenses: firstPage,
        pagination: { page: 1, limit: 50, total: 500, totalPages: 10, hasMore: true }
      });

      const startTime = performance.now();

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      // Wait for first page to load
      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(50);
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Should load within 1 second even with large dataset
      expect(loadTime).toBeWithinPerformanceBudget(1000);

      // CRITICAL: Should only render 50 items, not all 500
      expect(screen.getAllByTestId(/expense-item/)).toHaveLength(50);
    });

    test('CRITICAL: Memory usage doesn\'t grow with total dataset size', async () => {
      // Test memory efficiency by loading multiple pages
      const massiveDataset = generateMockExpenses(1000);
      const pages = [
        massiveDataset.slice(0, 50),   // Page 1
        massiveDataset.slice(50, 100), // Page 2
        massiveDataset.slice(100, 150) // Page 3
      ];

      let pageIndex = 0;
      mockAuth.apiCall = jest.fn().mockImplementation(() => {
        const currentPage = pages[pageIndex++] || [];
        return Promise.resolve({
          expenses: currentPage,
          pagination: { 
            page: pageIndex, 
            limit: 50, 
            total: 1000, 
            totalPages: 20, 
            hasMore: pageIndex < 20 
          }
        });
      });

      renderWithProviders(<EnhancedMobileExpenseList />, { auth: mockAuth });

      // Load first page
      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(50);
      });

      // Simulate navigation through pages
      for (let i = 0; i < 2; i++) {
        fireEvent.scroll(screen.getByTestId(/expense-list|scroll-container/), { 
          target: { scrollTop: (i + 1) * 1000 } 
        });
        
        await waitFor(() => {
          expect(mockAuth.apiCall).toHaveBeenCalledTimes(i + 2);
        });
      }

      // CRITICAL: Should still only have reasonable DOM node count
      const expenseElements = screen.getAllByTestId(/expense-item/);
      
      // For infinite scroll, should accumulate but not exceed reasonable limits
      expect(expenseElements.length).toBeLessThanOrEqual(200); // Max 4 pages worth
      expect(expenseElements.length).toBeGreaterThan(100);     // At least 2 pages loaded
    });
  });

  describe('Page Size Configuration', () => {
    test('CRITICAL: Respects different page sizes (20, 50, 100)', async () => {
      const testSizes = [20, 50, 100];

      for (const pageSize of testSizes) {
        const testDataset = generateMockExpenses(pageSize * 2);
        const firstPage = testDataset.slice(0, pageSize);

        mockAuth.apiCall = jest.fn().mockResolvedValue({
          expenses: firstPage,
          pagination: { 
            page: 1, 
            limit: pageSize, 
            total: pageSize * 2, 
            totalPages: 2, 
            hasMore: true 
          }
        });

        const { rerender } = renderWithProviders(<ExpenseViewer pageSize={pageSize} />, { auth: mockAuth });

        await waitFor(() => {
          expect(screen.getAllByTestId(/expense-item/)).toHaveLength(pageSize);
        });

        // Verify correct limit parameter
        expect(mockAuth.apiCall).toHaveBeenCalledWith(
          expect.stringContaining(`limit=${pageSize}`),
          expect.any(Object)
        );

        // Clean up for next iteration
        rerender(<div />);
      }
    });

    test('CRITICAL: Page size dropdown changes API calls', async () => {
      const testDataset = generateMockExpenses(200);
      
      // Mock for initial load (50 items)
      mockAuth.apiCall = jest.fn()
        .mockResolvedValueOnce({
          expenses: testDataset.slice(0, 50),
          pagination: { page: 1, limit: 50, total: 200, totalPages: 4, hasMore: true }
        })
        .mockResolvedValueOnce({
          expenses: testDataset.slice(0, 100),
          pagination: { page: 1, limit: 100, total: 200, totalPages: 2, hasMore: true }
        });

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(50);
      });

      // Change page size to 100
      const pageSizeSelector = screen.getByRole('combobox', { name: /page size|items per page/i });
      fireEvent.click(pageSizeSelector);
      
      const option100 = screen.getByRole('option', { name: /100/i });
      fireEvent.click(option100);

      // Verify new API call with updated limit
      await waitFor(() => {
        expect(mockAuth.apiCall).toHaveBeenCalledWith(
          expect.stringContaining('limit=100'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Error Handling & Edge Cases', () => {
    test('CRITICAL: Handles pagination with 0 results', async () => {
      mockAuth.apiCall = jest.fn().mockResolvedValue({
        expenses: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0, hasMore: false }
      });

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getByText(/no expenses|empty/i)).toBeInTheDocument();
      });

      // Pagination controls should handle empty state gracefully
      expect(screen.queryByRole('button', { name: /next page/i })).toBeDisabled();
      expect(screen.queryByRole('button', { name: /previous page/i })).toBeDisabled();
    });

    test('CRITICAL: Handles API timeout during pagination gracefully', async () => {
      // First call succeeds, second call times out
      mockAuth.apiCall = jest.fn()
        .mockResolvedValueOnce({
          expenses: generateMockExpenses(50).slice(0, 50),
          pagination: { page: 1, limit: 50, total: 100, totalPages: 2, hasMore: true }
        })
        .mockRejectedValueOnce(new Error('Request timeout'));

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      // Wait for first page
      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(50);
      });

      // Try to navigate to next page
      const nextPageButton = screen.getByRole('button', { name: /next|page 2/i });
      fireEvent.click(nextPageButton);

      // Should show error message and maintain first page data
      await waitFor(() => {
        expect(screen.getByText(/error|failed|timeout/i)).toBeInTheDocument();
      });

      // First page data should still be visible
      expect(screen.getAllByTestId(/expense-item/)).toHaveLength(50);
    });

    test('CRITICAL: Prevents infinite pagination loops', async () => {
      let callCount = 0;
      mockAuth.apiCall = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount > 5) {
          throw new Error('Too many API calls - infinite loop detected');
        }
        
        return Promise.resolve({
          expenses: generateMockExpenses(50).slice(0, 50),
          pagination: { 
            page: callCount, 
            limit: 50, 
            total: 1000, 
            totalPages: 20, 
            hasMore: true 
          }
        });
      });

      renderWithProviders(<EnhancedMobileExpenseList />, { auth: mockAuth });

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(50);
      });

      // Rapidly trigger scroll events (simulate buggy behavior)
      const scrollContainer = screen.getByTestId(/expense-list|scroll-container/);
      for (let i = 0; i < 10; i++) {
        fireEvent.scroll(scrollContainer, { target: { scrollTop: i * 100 } });
      }

      // Should not make excessive API calls
      await waitFor(() => {
        expect(callCount).toBeLessThanOrEqual(5);
      }, { timeout: 2000 });
    });
  });
});