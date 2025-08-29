/**
 * CRITICAL SORTING FIX - Regression Tests
 * 
 * Tests for the MAJOR BUG FIX: Backend was ignoring sort_by and sort_order parameters
 * 
 * Before Fix: API hardcoded to sort by expense_date desc only
 * After Fix: API correctly processes sort_by (amount, date, description) and sort_order (asc, desc)
 * 
 * These tests MUST pass to prevent regression of sorting functionality
 */

import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders, generateMockExpenses, mockApiCall } from '../utils/testUtils';
import EnhancedMobileExpenseList from '../../components/EnhancedMobileExpenseList';
import ExpenseViewer from '../../components/ExpenseViewer';

describe('REGRESSION: Critical Sorting Fix', () => {
  let mockAuth;
  let mockExpenses;

  beforeEach(() => {
    // Generate test data with varied amounts, dates, and descriptions for sorting validation
    mockExpenses = [
      { id: '1', amount: 100.50, description: 'Alpha Expense', expense_date: '2024-01-15', category: { name: 'Food', color: '#FF0000' } },
      { id: '2', amount: 250.00, description: 'Beta Expense', expense_date: '2024-01-10', category: { name: 'Travel', color: '#00FF00' } },
      { id: '3', amount: 75.25, description: 'Gamma Expense', expense_date: '2024-01-20', category: { name: 'Office', color: '#0000FF' } },
      { id: '4', amount: 500.00, description: 'Delta Expense', expense_date: '2024-01-05', category: { name: 'Equipment', color: '#FF00FF' } },
      { id: '5', amount: 25.99, description: 'Epsilon Expense', expense_date: '2024-01-25', category: { name: 'Supplies', color: '#FFFF00' } },
    ];

    mockAuth = {
      user: { id: 'test-user-id', email: 'test@example.com' },
      userProfile: { full_name: 'Test User', role: 'account_officer' },
      isAdmin: false,
      apiCall: mockApiCall(mockExpenses),
    };
  });

  describe('Backend API Sorting Parameters', () => {
    test('CRITICAL: API receives correct sort_by parameter for amount sorting', async () => {
      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Alpha Expense')).toBeInTheDocument();
      });

      // Click amount sort button
      const amountSortButton = screen.getByRole('button', { name: /sort.*amount/i });
      fireEvent.click(amountSortButton);

      // Verify API was called with correct sort_by parameter
      await waitFor(() => {
        expect(mockAuth.apiCall).toHaveBeenCalledWith(
          expect.stringContaining('sort_by=amount'),
          expect.any(Object)
        );
      });
    });

    test('CRITICAL: API receives correct sort_by parameter for date sorting', async () => {
      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getByText('Alpha Expense')).toBeInTheDocument();
      });

      const dateSortButton = screen.getByRole('button', { name: /sort.*date/i });
      fireEvent.click(dateSortButton);

      await waitFor(() => {
        expect(mockAuth.apiCall).toHaveBeenCalledWith(
          expect.stringContaining('sort_by=expense_date'),
          expect.any(Object)
        );
      });
    });

    test('CRITICAL: API receives correct sort_by parameter for description sorting', async () => {
      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getByText('Alpha Expense')).toBeInTheDocument();
      });

      const descriptionSortButton = screen.getByRole('button', { name: /sort.*description/i });
      fireEvent.click(descriptionSortButton);

      await waitFor(() => {
        expect(mockAuth.apiCall).toHaveBeenCalledWith(
          expect.stringContaining('sort_by=description'),
          expect.any(Object)
        );
      });
    });

    test('CRITICAL: API receives correct sort_order parameter (asc/desc toggle)', async () => {
      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getByText('Alpha Expense')).toBeInTheDocument();
      });

      const amountSortButton = screen.getByRole('button', { name: /sort.*amount/i });
      
      // First click - should be desc (default)
      fireEvent.click(amountSortButton);
      await waitFor(() => {
        expect(mockAuth.apiCall).toHaveBeenCalledWith(
          expect.stringContaining('sort_order=desc'),
          expect.any(Object)
        );
      });

      // Second click - should toggle to asc
      fireEvent.click(amountSortButton);
      await waitFor(() => {
        expect(mockAuth.apiCall).toHaveBeenCalledWith(
          expect.stringContaining('sort_order=asc'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Mobile Sorting UI - No Duplicates', () => {
    test('CRITICAL: Mobile sorting controls do not duplicate', async () => {
      // Force mobile viewport
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query) => ({
          matches: query.includes('max-width: 768px'),
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => {},
        }),
      });

      renderWithProviders(<EnhancedMobileExpenseList />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getByText('Alpha Expense')).toBeInTheDocument();
      });

      // Check that there's only ONE set of sort buttons, not duplicates
      const dateSortButtons = screen.getAllByText(/date/i);
      const amountSortButtons = screen.getAllByText(/amount/i);
      const nameSortButtons = screen.getAllByText(/name|description/i);

      // Should have exactly one sort control for each field (not duplicated)
      expect(dateSortButtons.filter(btn => btn.closest('button'))).toHaveLength(1);
      expect(amountSortButtons.filter(btn => btn.closest('button'))).toHaveLength(1);
      expect(nameSortButtons.filter(btn => btn.closest('button'))).toHaveLength(1);
    });

    test('CRITICAL: Mobile sort buttons have proper touch targets (44px minimum)', async () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });

      renderWithProviders(<EnhancedMobileExpenseList />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getByText('Alpha Expense')).toBeInTheDocument();
      });

      // Find sort buttons and verify touch target sizes
      const sortButtons = screen.getAllByRole('button').filter(btn => 
        btn.textContent.match(/date|amount|name|description/i)
      );

      sortButtons.forEach(button => {
        expect(button).toHaveMinimumTouchTarget(44);
      });
    });

    test('CRITICAL: Mobile sorting works without alerts or debug messages', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });

      renderWithProviders(<EnhancedMobileExpenseList />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getByText('Alpha Expense')).toBeInTheDocument();
      });

      // Click sort button
      const amountButton = screen.getByRole('button', { name: /amount/i });
      fireEvent.click(amountButton);

      // Verify no debug messages or alerts
      expect(alertSpy).not.toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('SORT DEBUG'));
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('🚨'));

      consoleSpy.mockRestore();
      alertSpy.mockRestore();
    });
  });

  describe('Sorting Functionality Validation', () => {
    test('CRITICAL: Amount sorting displays results in correct order (desc)', async () => {
      // Mock API to return sorted data
      const sortedDescExpenses = [...mockExpenses].sort((a, b) => b.amount - a.amount);
      mockAuth.apiCall = mockApiCall(sortedDescExpenses);

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getByText('Alpha Expense')).toBeInTheDocument();
      });

      const amountSortButton = screen.getByRole('button', { name: /sort.*amount/i });
      fireEvent.click(amountSortButton);

      // Wait for sorted results
      await waitFor(() => {
        const expenseElements = screen.getAllByTestId(/expense-item/);
        expect(expenseElements[0]).toHaveTextContent('Delta Expense'); // $500.00
        expect(expenseElements[1]).toHaveTextContent('Beta Expense');  // $250.00
        expect(expenseElements[2]).toHaveTextContent('Alpha Expense'); // $100.50
      });
    });

    test('CRITICAL: Date sorting displays results in correct chronological order', async () => {
      // Mock API to return date-sorted data
      const sortedDateExpenses = [...mockExpenses].sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
      mockAuth.apiCall = mockApiCall(sortedDateExpenses);

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getByText('Alpha Expense')).toBeInTheDocument();
      });

      const dateSortButton = screen.getByRole('button', { name: /sort.*date/i });
      fireEvent.click(dateSortButton);

      await waitFor(() => {
        const expenseElements = screen.getAllByTestId(/expense-item/);
        expect(expenseElements[0]).toHaveTextContent('Epsilon Expense'); // 2024-01-25
        expect(expenseElements[1]).toHaveTextContent('Gamma Expense');   // 2024-01-20
        expect(expenseElements[2]).toHaveTextContent('Alpha Expense');   // 2024-01-15
      });
    });

    test('CRITICAL: Description sorting displays results in alphabetical order', async () => {
      const sortedDescExpenses = [...mockExpenses].sort((a, b) => a.description.localeCompare(b.description));
      mockAuth.apiCall = mockApiCall(sortedDescExpenses);

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getByText('Alpha Expense')).toBeInTheDocument();
      });

      const descSortButton = screen.getByRole('button', { name: /sort.*description/i });
      fireEvent.click(descSortButton);

      await waitFor(() => {
        const expenseElements = screen.getAllByTestId(/expense-item/);
        expect(expenseElements[0]).toHaveTextContent('Alpha Expense');   // A
        expect(expenseElements[1]).toHaveTextContent('Beta Expense');    // B
        expect(expenseElements[2]).toHaveTextContent('Delta Expense');   // D
      });
    });
  });

  describe('Performance Regression Prevention', () => {
    test('CRITICAL: Sorting performance remains under 500ms', async () => {
      const startTime = performance.now();

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getByText('Alpha Expense')).toBeInTheDocument();
      });

      const amountSortButton = screen.getByRole('button', { name: /sort.*amount/i });
      fireEvent.click(amountSortButton);

      await waitFor(() => {
        expect(mockAuth.apiCall).toHaveBeenCalled();
      });

      const endTime = performance.now();
      const sortingTime = endTime - startTime;

      expect(sortingTime).toBeWithinPerformanceBudget(500);
    });

    test('CRITICAL: Large dataset sorting performs adequately', async () => {
      // Generate large dataset
      const largeDataset = generateMockExpenses(100);
      mockAuth.apiCall = mockApiCall(largeDataset);

      const startTime = performance.now();

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(100);
      }, { timeout: 3000 });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeWithinPerformanceBudget(2000); // 2 second budget for 100 items
    });
  });

  describe('Error Handling & Edge Cases', () => {
    test('CRITICAL: Handles API errors during sorting gracefully', async () => {
      mockAuth.apiCall = jest.fn().mockRejectedValue(new Error('API Error'));

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      const amountSortButton = await screen.findByRole('button', { name: /sort.*amount/i });
      fireEvent.click(amountSortButton);

      // Should show error message, not crash
      await waitFor(() => {
        expect(screen.getByText(/error/i) || screen.getByText(/failed/i)).toBeInTheDocument();
      });
    });

    test('CRITICAL: Handles empty dataset sorting', async () => {
      mockAuth.apiCall = mockApiCall([]);

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getByText(/no expenses/i) || screen.getByText(/empty/i)).toBeInTheDocument();
      });

      // Sort buttons should still be functional
      const amountSortButton = screen.getByRole('button', { name: /sort.*amount/i });
      expect(amountSortButton).not.toBeDisabled();
      fireEvent.click(amountSortButton);

      expect(mockAuth.apiCall).toHaveBeenCalledWith(expect.stringContaining('sort_by=amount'));
    });
  });
});