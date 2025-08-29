/**
 * SMOKE TESTS - Critical User Journeys
 * 
 * These tests validate the most important user paths through the application.
 * If any of these fail, the application is broken for end users.
 * 
 * Test Categories:
 * - Authentication Flow (Login/Logout)
 * - Expense Management (Add/Edit/Delete)
 * - Mobile UI Interactions
 * - Core Navigation
 * - Search and Filtering
 */

import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders, generateMockExpenses, mockApiCall, viewportUtils } from '../utils/testUtils';
import SupabaseApp from '../../SupabaseApp';
import ExpenseViewer from '../../components/ExpenseViewer';
import EnhancedMobileExpenseList from '../../components/EnhancedMobileExpenseList';
import ExpenseForm from '../../components/ExpenseForm';

describe('SMOKE TESTS: Critical User Journeys', () => {
  let mockAuth;
  let mockExpenses;

  beforeEach(() => {
    mockExpenses = generateMockExpenses(10);
    mockAuth = {
      user: { id: 'test-user-id', email: 'test@example.com' },
      userProfile: { full_name: 'Test User', role: 'account_officer' },
      isAdmin: false,
      isAccountOfficer: true,
      apiCall: mockApiCall(mockExpenses),
      login: jest.fn(),
      logout: jest.fn(),
    };
  });

  describe('🔐 Authentication Flow', () => {
    test('CRITICAL: User can log in successfully', async () => {
      mockAuth.user = null; // Start logged out
      mockAuth.login = jest.fn().mockResolvedValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        profile: { full_name: 'Test User', role: 'account_officer' }
      });

      renderWithProviders(<SupabaseApp />, { 
        auth: { ...mockAuth, user: null } 
      });

      // Should show login form
      expect(screen.getByRole('button', { name: /sign in|login/i })).toBeInTheDocument();

      // Fill in login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in|login/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(loginButton);

      // Should call login function
      expect(mockAuth.login).toHaveBeenCalledWith('test@example.com', 'password123');

      // Should navigate to dashboard after successful login
      await waitFor(() => {
        expect(screen.getByText(/dashboard|expenses|welcome/i)).toBeInTheDocument();
      });
    });

    test('CRITICAL: User can log out successfully', async () => {
      mockAuth.logout = jest.fn().mockResolvedValue(true);

      renderWithProviders(<SupabaseApp />, { auth: mockAuth });

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText(/expenses|dashboard/i)).toBeInTheDocument();
      });

      // Click logout button
      const logoutButton = screen.getByRole('button', { name: /logout|sign out/i });
      fireEvent.click(logoutButton);

      // Should call logout function
      expect(mockAuth.logout).toHaveBeenCalled();

      // Should return to login screen
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in|login/i })).toBeInTheDocument();
      });
    });

    test('CRITICAL: Role-based access works correctly', async () => {
      // Test account officer access
      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getByText(/expenses/i)).toBeInTheDocument();
      });

      // Account officers should NOT see admin features
      expect(screen.queryByText(/user management|admin|analytics/i)).not.toBeInTheDocument();

      // Test admin access
      const adminAuth = {
        ...mockAuth,
        userProfile: { ...mockAuth.userProfile, role: 'admin' },
        isAdmin: true,
        isAccountOfficer: false,
      };

      const { rerender } = renderWithProviders(<ExpenseViewer />, { auth: adminAuth });

      await waitFor(() => {
        expect(screen.getByText(/analytics|admin/i)).toBeInTheDocument();
      });
    });
  });

  describe('💰 Expense Management Journey', () => {
    test('CRITICAL: User can add a new expense successfully', async () => {
      const newExpense = {
        id: 'new-expense-id',
        amount: 150.75,
        description: 'Test Expense',
        expense_date: '2024-01-15',
        category: { name: 'Food', color: '#FF0000' }
      };

      mockAuth.apiCall = jest.fn()
        .mockResolvedValueOnce({ expenses: mockExpenses }) // Initial load
        .mockResolvedValueOnce({ expense: newExpense })    // Create expense
        .mockResolvedValueOnce({ expenses: [...mockExpenses, newExpense] }); // Reload with new expense

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(10);
      });

      // Click "Add Expense" button
      const addButton = screen.getByRole('button', { name: /add expense/i });
      fireEvent.click(addButton);

      // Fill out expense form
      await waitFor(() => {
        expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      });

      const amountInput = screen.getByLabelText(/amount/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const submitButton = screen.getByRole('button', { name: /save|create|add/i });

      await userEvent.type(amountInput, '150.75');
      await userEvent.type(descriptionInput, 'Test Expense');
      fireEvent.click(submitButton);

      // Should call API to create expense
      await waitFor(() => {
        expect(mockAuth.apiCall).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('150.75')
          })
        );
      });

      // Should refresh expense list and show new expense
      await waitFor(() => {
        expect(screen.getByText('Test Expense')).toBeInTheDocument();
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(11);
      });
    });

    test('CRITICAL: User can edit an existing expense', async () => {
      const updatedExpense = {
        ...mockExpenses[0],
        amount: 999.99,
        description: 'Updated Expense'
      };

      mockAuth.apiCall = jest.fn()
        .mockResolvedValueOnce({ expenses: mockExpenses })                               // Initial load
        .mockResolvedValueOnce({ expense: updatedExpense })                             // Update expense
        .mockResolvedValueOnce({ expenses: [updatedExpense, ...mockExpenses.slice(1)] }); // Reload

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(10);
      });

      // Click edit button on first expense
      const firstExpense = screen.getAllByTestId(/expense-item/)[0];
      const editButton = within(firstExpense).getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      // Edit expense details
      await waitFor(() => {
        expect(screen.getByDisplayValue(mockExpenses[0].amount.toString())).toBeInTheDocument();
      });

      const amountInput = screen.getByDisplayValue(mockExpenses[0].amount.toString());
      const descriptionInput = screen.getByDisplayValue(mockExpenses[0].description);

      await userEvent.clear(amountInput);
      await userEvent.type(amountInput, '999.99');
      await userEvent.clear(descriptionInput);
      await userEvent.type(descriptionInput, 'Updated Expense');

      const saveButton = screen.getByRole('button', { name: /save|update/i });
      fireEvent.click(saveButton);

      // Should update expense
      await waitFor(() => {
        expect(screen.getByText('Updated Expense')).toBeInTheDocument();
        expect(screen.getByText('999.99')).toBeInTheDocument();
      });
    });

    test('CRITICAL: User can delete an expense', async () => {
      const remainingExpenses = mockExpenses.slice(1);

      mockAuth.apiCall = jest.fn()
        .mockResolvedValueOnce({ expenses: mockExpenses })        // Initial load
        .mockResolvedValueOnce({ success: true })                 // Delete expense
        .mockResolvedValueOnce({ expenses: remainingExpenses });  // Reload

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(10);
      });

      // Click delete button on first expense
      const firstExpense = screen.getAllByTestId(/expense-item/)[0];
      const deleteButton = within(firstExpense).getByRole('button', { name: /delete/i });
      fireEvent.click(deleteButton);

      // Confirm deletion
      const confirmButton = await screen.findByRole('button', { name: /confirm|yes|delete/i });
      fireEvent.click(confirmButton);

      // Should remove expense from list
      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(9);
      });

      // First expense should be gone
      expect(screen.queryByText(mockExpenses[0].description)).not.toBeInTheDocument();
    });
  });

  describe('📱 Mobile UI Journey', () => {
    beforeEach(() => {
      viewportUtils.setMobileViewport();
    });

    afterEach(() => {
      viewportUtils.resetViewport();
    });

    test('CRITICAL: Mobile navigation works correctly', async () => {
      renderWithProviders(<SupabaseApp />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getByText(/expenses|dashboard/i)).toBeInTheDocument();
      });

      // Should show mobile navigation elements
      expect(screen.getByRole('button', { name: /menu|hamburger/i }) || 
             screen.getByTestId(/mobile-nav/)).toBeInTheDocument();

      // FAB should be present for mobile
      const fab = screen.getByRole('button', { name: /add|floating action/i });
      expect(fab).toBeInTheDocument();
      expect(fab).toHaveMinimumTouchTarget(44);
    });

    test('CRITICAL: Mobile sorting works without duplicates', async () => {
      renderWithProviders(<EnhancedMobileExpenseList />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(10);
      });

      // Find sort controls
      const sortControls = screen.getAllByRole('button').filter(btn => 
        btn.textContent.match(/date|amount|name|description/i)
      );

      // Should have exactly one set of sort controls (not duplicated)
      const dateButtons = sortControls.filter(btn => btn.textContent.match(/date/i));
      const amountButtons = sortControls.filter(btn => btn.textContent.match(/amount/i));

      expect(dateButtons).toHaveLength(1);
      expect(amountButtons).toHaveLength(1);

      // All sort buttons should have proper touch targets
      sortControls.forEach(button => {
        expect(button).toHaveMinimumTouchTarget(44);
      });
    });

    test('CRITICAL: Mobile touch interactions work correctly', async () => {
      renderWithProviders(<EnhancedMobileExpenseList />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(10);
      });

      // Test sort button touch interaction
      const amountSortButton = screen.getByRole('button', { name: /amount/i });
      
      // Should respond to touch events
      fireEvent.touchStart(amountSortButton);
      fireEvent.touchEnd(amountSortButton);

      await waitFor(() => {
        expect(mockAuth.apiCall).toHaveBeenCalledWith(
          expect.stringContaining('sort_by=amount'),
          expect.any(Object)
        );
      });

      // Button should show active state
      expect(amountSortButton).toHaveClass(/active|selected|bg-blue/);
    });

    test('CRITICAL: Mobile scrolling works in all directions', async () => {
      renderWithProviders(<EnhancedMobileExpenseList />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(10);
      });

      const scrollContainer = screen.getByTestId(/expense-list|scroll-container/) || 
                             screen.getByRole('main');

      // Test vertical scrolling
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 500 } });
      
      // Should not trigger any errors or conflicts
      expect(scrollContainer.scrollTop).toBeGreaterThan(0);

      // Test that horizontal scrolling is prevented (no layout overflow)
      expect(scrollContainer).toRenderWithoutLayoutShift();
    });
  });

  describe('🔍 Search and Filter Journey', () => {
    test('CRITICAL: Search functionality works', async () => {
      const searchResults = mockExpenses.filter(e => 
        e.description.toLowerCase().includes('test')
      );

      mockAuth.apiCall = jest.fn()
        .mockResolvedValueOnce({ expenses: mockExpenses })   // Initial load
        .mockResolvedValueOnce({ expenses: searchResults }); // Search results

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(10);
      });

      // Perform search
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      await userEvent.type(searchInput, 'test');

      // Should filter results
      await waitFor(() => {
        expect(mockAuth.apiCall).toHaveBeenCalledWith(
          expect.stringContaining('search=test'),
          expect.any(Object)
        );
      });

      if (searchResults.length > 0) {
        await waitFor(() => {
          expect(screen.getAllByTestId(/expense-item/)).toHaveLength(searchResults.length);
        });
      } else {
        await waitFor(() => {
          expect(screen.getByText(/no.*results|not found/i)).toBeInTheDocument();
        });
      }
    });

    test('CRITICAL: Category filtering works', async () => {
      const foodExpenses = mockExpenses.filter(e => 
        e.category?.name === 'Food'
      );

      mockAuth.apiCall = jest.fn()
        .mockResolvedValueOnce({ expenses: mockExpenses }) // Initial load
        .mockResolvedValueOnce({ expenses: foodExpenses }); // Filtered results

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(10);
      });

      // Select category filter
      const categoryFilter = screen.getByRole('combobox', { name: /category/i });
      fireEvent.click(categoryFilter);

      const foodOption = screen.getByRole('option', { name: /food/i });
      fireEvent.click(foodOption);

      // Should filter by category
      await waitFor(() => {
        expect(mockAuth.apiCall).toHaveBeenCalledWith(
          expect.stringContaining('category'),
          expect.any(Object)
        );
      });
    });

    test('CRITICAL: Date range filtering works', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const filteredExpenses = mockExpenses.filter(e => 
        e.expense_date >= startDate && e.expense_date <= endDate
      );

      mockAuth.apiCall = jest.fn()
        .mockResolvedValueOnce({ expenses: mockExpenses })     // Initial load
        .mockResolvedValueOnce({ expenses: filteredExpenses }); // Date filtered

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(10);
      });

      // Set date range
      const startDateInput = screen.getByLabelText(/start date|from/i);
      const endDateInput = screen.getByLabelText(/end date|to/i);

      await userEvent.type(startDateInput, '2024-01-01');
      await userEvent.type(endDateInput, '2024-01-31');

      // Should filter by date range
      await waitFor(() => {
        expect(mockAuth.apiCall).toHaveBeenCalledWith(
          expect.stringContaining('start_date=2024-01-01'),
          expect.any(Object)
        );
      });
    });
  });

  describe('⚡ Performance Requirements', () => {
    test('CRITICAL: Initial page load performs within budget', async () => {
      const startTime = performance.now();

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(10);
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Should load within 2 seconds
      expect(loadTime).toBeWithinPerformanceBudget(2000);
    });

    test('CRITICAL: Mobile animations perform smoothly', async () => {
      viewportUtils.setMobileViewport();

      const startTime = performance.now();

      renderWithProviders(<EnhancedMobileExpenseList />, { auth: mockAuth });

      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(10);
      });

      // Test animation performance
      const sortButton = screen.getByRole('button', { name: /amount/i });
      fireEvent.click(sortButton);

      // Wait for animation to complete
      await waitFor(() => {
        expect(sortButton).toHaveClass(/active|selected|bg-blue/);
      });

      const endTime = performance.now();
      const animationTime = endTime - startTime;

      // Animation should complete within 500ms
      expect(animationTime).toBeWithinPerformanceBudget(500);

      viewportUtils.resetViewport();
    });
  });

  describe('🚨 Error Handling', () => {
    test('CRITICAL: Network errors are handled gracefully', async () => {
      mockAuth.apiCall = jest.fn().mockRejectedValue(new Error('Network Error'));

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      // Should show error message, not crash
      await waitFor(() => {
        expect(screen.getByText(/error|failed|network/i)).toBeInTheDocument();
      });

      // Should provide retry option
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton).toBeInTheDocument();
      
      // Retry should work
      mockAuth.apiCall.mockResolvedValueOnce({ expenses: mockExpenses });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getAllByTestId(/expense-item/)).toHaveLength(10);
      });
    });

    test('CRITICAL: Authentication errors redirect to login', async () => {
      mockAuth.apiCall = jest.fn().mockRejectedValue({ status: 401, message: 'Unauthorized' });

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      // Should handle auth error and show login
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in|login/i })).toBeInTheDocument();
      });
    });

    test('CRITICAL: Empty states are handled properly', async () => {
      mockAuth.apiCall = jest.fn().mockResolvedValue({ expenses: [] });

      renderWithProviders(<ExpenseViewer />, { auth: mockAuth });

      // Should show empty state message
      await waitFor(() => {
        expect(screen.getByText(/no expenses|empty|get started/i)).toBeInTheDocument();
      });

      // Should provide action to add first expense
      expect(screen.getByRole('button', { name: /add.*expense|get started/i })).toBeInTheDocument();
    });
  });
});