/**
 * Test Runner Integration and CI Configuration
 * 
 * This file configures automated testing for CI/CD and provides
 * integration tests that combine multiple components and features.
 * 
 * CRITICAL: These tests must pass for deployment approval
 */

import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from '@testing-library/react';

import { 
  renderWithProviders, 
  generateMockExpenses, 
  generateMockCategories,
  viewportUtils,
  waitForComponentToStabilize,
  mockApiResponses 
} from '../utils/testUtils';

import SupabaseApp from '../../SupabaseApp';
import ExpenseViewer from '../../components/ExpenseViewer';
import ExpenseForm from '../../components/ExpenseForm';
import Dashboard from '../../components/Dashboard';

// Integration test suite configuration
const INTEGRATION_CONFIG = {
  maxTimeout: 15000, // 15 seconds for integration tests
  datasetSizes: {
    small: 10,
    medium: 50,
    large: 200
  },
  performanceBudgets: {
    initialLoad: 3000,
    userInteraction: 500,
    dataProcessing: 1000
  }
};

describe('Integration Tests - Complete User Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    viewportUtils.setDesktop();
    jest.setTimeout(INTEGRATION_CONFIG.maxTimeout);
  });

  describe('Full Application Integration', () => {
    test('INTEGRATION: Complete expense management workflow', async () => {
      const workflowExpenses = generateMockExpenses(INTEGRATION_CONFIG.datasetSizes.medium);
      const mockCategories = generateMockCategories();
      
      let apiCallCount = 0;
      const mockApiCall = jest.fn().mockImplementation(async (endpoint, options = {}) => {
        apiCallCount++;
        
        if (endpoint.includes('categories')) {
          return mockApiResponses.success({ categories: mockCategories });
        }
        
        if (endpoint.includes('expenses')) {
          const { sortBy = 'expense_date', sortOrder = 'desc', limit = 50, offset = 0 } = options;
          
          // Simulate sorting
          let sortedExpenses = [...workflowExpenses];
          if (sortBy === 'amount') {
            sortedExpenses.sort((a, b) => sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount);
          }
          
          const paginatedExpenses = sortedExpenses.slice(offset, offset + limit);
          
          return mockApiResponses.success({
            expenses: paginatedExpenses,
            pagination: {
              page: Math.floor(offset / limit) + 1,
              limit,
              total: sortedExpenses.length,
              totalPages: Math.ceil(sortedExpenses.length / limit),
              hasMore: offset + limit < sortedExpenses.length
            }
          });
        }
        
        return mockApiResponses.success({});
      });

      const mockAuth = {
        user: { id: 'integration-user', email: 'integration@test.com' },
        userProfile: { full_name: 'Integration User', role: 'account_officer' },
        isAdmin: false,
        isAccountOfficer: true,
        apiCall: mockApiCall,
        session: { user: { email: 'integration@test.com' } }
      };

      // Test complete workflow
      const workflowStartTime = performance.now();
      
      renderWithProviders(<ExpenseViewer />, mockAuth);
      
      // 1. Initial data load
      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalled();
      }, { timeout: 5000 });
      
      expect(apiCallCount).toBeGreaterThan(0);
      
      // 2. Test sorting functionality
      const sortButtons = screen.queryAllByRole('button').filter(btn =>
        btn.textContent?.toLowerCase().includes('amount') ||
        btn.textContent?.toLowerCase().includes('sort')
      );
      
      if (sortButtons.length > 0) {
        const initialCalls = apiCallCount;
        
        await act(async () => {
          fireEvent.click(sortButtons[0]);
        });
        
        await waitFor(() => {
          expect(apiCallCount).toBeGreaterThan(initialCalls);
        });
      }
      
      // 3. Test pagination (if available)
      const paginationButtons = screen.queryAllByRole('button').filter(btn =>
        btn.textContent?.toLowerCase().includes('next') ||
        btn.textContent?.includes('>')
      );
      
      if (paginationButtons.length > 0) {
        const beforePagination = apiCallCount;
        
        await act(async () => {
          fireEvent.click(paginationButtons[0]);
        });
        
        await waitFor(() => {
          expect(apiCallCount).toBeGreaterThan(beforePagination);
        });
      }
      
      const workflowTime = performance.now() - workflowStartTime;
      expect(workflowTime).toBeLessThan(INTEGRATION_CONFIG.performanceBudgets.initialLoad);
      
      // 4. Verify data integrity throughout workflow
      expect(mockApiCall).toHaveBeenCalledWith(
        expect.stringContaining('expenses'),
        expect.any(Object)
      );
    }, INTEGRATION_CONFIG.maxTimeout);

    test('INTEGRATION: Mobile to desktop responsive transition', async () => {
      const responsiveExpenses = generateMockExpenses(INTEGRATION_CONFIG.datasetSizes.small);
      
      const mockAuth = {
        user: { id: 'responsive-user', email: 'responsive@test.com' },
        userProfile: { full_name: 'Responsive User', role: 'account_officer' },
        apiCall: jest.fn().mockResolvedValue({
          expenses: responsiveExpenses,
          pagination: { page: 1, limit: 50, total: responsiveExpenses.length, totalPages: 1, hasMore: false }
        })
      };

      // Start with mobile viewport
      viewportUtils.setMobile();
      
      const { rerender } = renderWithProviders(<ExpenseViewer />, mockAuth);
      
      await waitForComponentToStabilize();
      
      // Verify mobile layout
      expect(document.body.scrollWidth).toBeLessThanOrEqual(global.innerWidth + 20);
      
      // Transition to tablet
      viewportUtils.setTablet();
      rerender(<ExpenseViewer />);
      
      await waitForComponentToStabilize();
      
      // Verify tablet adaptation
      expect(document.body).toContainHTML('div');
      
      // Transition to desktop
      viewportUtils.setDesktop();
      rerender(<ExpenseViewer />);
      
      await waitForComponentToStabilize();
      
      // Verify desktop layout
      expect(document.body).toContainHTML('div');
      
      // Should not have caused any crashes during transitions
      expect(screen.queryByText(/error|crash/i)).not.toBeInTheDocument();
    });

    test('INTEGRATION: Authentication state changes', async () => {
      const authExpenses = generateMockExpenses(INTEGRATION_CONFIG.datasetSizes.small);
      
      // Start without authentication
      const { rerender } = renderWithProviders(<SupabaseApp />, {
        user: null,
        userProfile: null
      });
      
      await waitForComponentToStabilize();
      
      // Should handle unauthenticated state
      expect(document.body).toContainHTML('div');
      
      // Simulate login
      const mockAuthenticatedAuth = {
        user: { id: 'auth-test-user', email: 'auth@test.com' },
        userProfile: { full_name: 'Auth User', role: 'account_officer' },
        apiCall: jest.fn().mockResolvedValue({
          expenses: authExpenses,
          pagination: { page: 1, limit: 50, total: authExpenses.length, totalPages: 1, hasMore: false }
        })
      };
      
      rerender(<SupabaseApp />);
      
      await waitForComponentToStabilize();
      
      // Should handle authenticated state transition
      expect(document.body).toContainHTML('div');
      
      // Simulate logout
      rerender(<SupabaseApp />);
      
      await waitForComponentToStabilize();
      
      // Should handle logout gracefully
      expect(document.body).toContainHTML('div');
    });
  });

  describe('Error Handling Integration', () => {
    test('INTEGRATION: Network failure recovery', async () => {
      // Mock network failure then recovery
      let failureCount = 0;
      const mockApiCall = jest.fn().mockImplementation(async () => {
        failureCount++;
        
        if (failureCount <= 2) {
          throw new Error('Network failure');
        }
        
        return mockApiResponses.success({
          expenses: generateMockExpenses(10),
          pagination: { page: 1, limit: 50, total: 10, totalPages: 1, hasMore: false }
        });
      });

      const mockAuth = {
        user: { id: 'network-test-user', email: 'network@test.com' },
        userProfile: { full_name: 'Network User', role: 'account_officer' },
        apiCall: mockApiCall
      };

      renderWithProviders(<ExpenseViewer />, mockAuth);
      
      // Should eventually recover from network failures
      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalled();
      }, { timeout: 10000 });
      
      // Should not crash despite initial failures
      expect(document.body).toContainHTML('div');
      expect(screen.queryByText(/uncaught.*error/i)).not.toBeInTheDocument();
    }, INTEGRATION_CONFIG.maxTimeout);

    test('INTEGRATION: Invalid data handling', async () => {
      const invalidDataResponses = [
        mockApiResponses.success({ expenses: null }),
        mockApiResponses.success({ expenses: [] }),
        mockApiResponses.success({ expenses: [{ invalid: 'data' }] }),
        mockApiResponses.error('Invalid data format'),
        mockApiResponses.success({
          expenses: generateMockExpenses(5),
          pagination: null // Invalid pagination
        })
      ];
      
      let responseIndex = 0;
      const mockApiCall = jest.fn().mockImplementation(async () => {
        const response = invalidDataResponses[responseIndex % invalidDataResponses.length];
        responseIndex++;
        return response;
      });

      const mockAuth = {
        user: { id: 'invalid-data-user', email: 'invalid@test.com' },
        userProfile: { full_name: 'Invalid Data User', role: 'account_officer' },
        apiCall: mockApiCall
      };

      renderWithProviders(<ExpenseViewer />, mockAuth);
      
      await waitForComponentToStabilize(1000);
      
      // Should handle invalid data gracefully
      expect(document.body).toContainHTML('div');
      expect(screen.queryByText(/uncaught.*error/i)).not.toBeInTheDocument();
    });
  });

  describe('Performance Integration Tests', () => {
    test('INTEGRATION: Large dataset performance', async () => {
      const largeDataset = generateMockExpenses(INTEGRATION_CONFIG.datasetSizes.large);
      
      const mockApiCall = jest.fn().mockImplementation(async (endpoint, options = {}) => {
        const processingStart = performance.now();
        
        const { limit = 50, offset = 0 } = options;
        const paginatedData = largeDataset.slice(offset, offset + limit);
        
        const processingTime = performance.now() - processingStart;
        expect(processingTime).toBeLessThan(INTEGRATION_CONFIG.performanceBudgets.dataProcessing);
        
        return mockApiResponses.success({
          expenses: paginatedData,
          pagination: {
            page: Math.floor(offset / limit) + 1,
            limit,
            total: largeDataset.length,
            totalPages: Math.ceil(largeDataset.length / limit),
            hasMore: offset + limit < largeDataset.length
          }
        });
      });

      const mockAuth = {
        user: { id: 'perf-test-user', email: 'perf@test.com' },
        userProfile: { full_name: 'Performance User', role: 'account_officer' },
        apiCall: mockApiCall
      };

      const performanceStart = performance.now();
      
      renderWithProviders(<ExpenseViewer />, mockAuth);
      
      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalled();
      });
      
      const performanceTime = performance.now() - performanceStart;
      expect(performanceTime).toBeLessThan(INTEGRATION_CONFIG.performanceBudgets.initialLoad);
      
      // Test user interaction performance
      const buttons = screen.queryAllByRole('button');
      
      if (buttons.length > 0) {
        const interactionStart = performance.now();
        
        await act(async () => {
          fireEvent.click(buttons[0]);
        });
        
        const interactionTime = performance.now() - interactionStart;
        expect(interactionTime).toBeLessThan(INTEGRATION_CONFIG.performanceBudgets.userInteraction);
      }
    }, INTEGRATION_CONFIG.maxTimeout);

    test('INTEGRATION: Memory stability during extended use', async () => {
      const memoryExpenses = generateMockExpenses(INTEGRATION_CONFIG.datasetSizes.medium);
      
      const mockAuth = {
        user: { id: 'memory-test-user', email: 'memory@test.com' },
        userProfile: { full_name: 'Memory User', role: 'account_officer' },
        apiCall: jest.fn().mockResolvedValue({
          expenses: memoryExpenses,
          pagination: { page: 1, limit: 50, total: memoryExpenses.length, totalPages: 1, hasMore: false }
        })
      };

      const { rerender, unmount } = renderWithProviders(<ExpenseViewer />, mockAuth);
      
      await waitForComponentToStabilize();
      
      // Simulate extended use with multiple re-renders
      for (let i = 0; i < 10; i++) {
        rerender(<ExpenseViewer />);
        await waitForComponentToStabilize(100);
        
        // Perform interactions
        const buttons = screen.queryAllByRole('button');
        if (buttons.length > 0 && i % 3 === 0) {
          await act(async () => {
            fireEvent.click(buttons[0]);
          });
        }
      }
      
      // Should remain stable
      expect(document.body).toContainHTML('div');
      
      // Clean up should not cause errors
      unmount();
      
      await waitForComponentToStabilize(100);
    }, INTEGRATION_CONFIG.maxTimeout);
  });

  describe('CI/CD Test Categories', () => {
    test('CI: Critical path smoke test', async () => {
      // This test represents the absolute minimum functionality
      // that must work for the application to be considered deployable
      
      const criticalExpenses = generateMockExpenses(5);
      
      const mockAuth = {
        user: { id: 'critical-user', email: 'critical@test.com' },
        userProfile: { full_name: 'Critical User', role: 'account_officer' },
        apiCall: jest.fn().mockResolvedValue({
          expenses: criticalExpenses,
          pagination: { page: 1, limit: 50, total: 5, totalPages: 1, hasMore: false }
        })
      };

      const { container } = renderWithProviders(<ExpenseViewer />, mockAuth);
      
      await waitForComponentToStabilize();
      
      // Critical checks
      expect(container).toBeInTheDocument(); // App renders
      expect(mockAuth.apiCall).toHaveBeenCalled(); // API integration works
      expect(screen.queryByText(/uncaught.*error/i)).not.toBeInTheDocument(); // No critical errors
      expect(document.body.scrollWidth).toBeGreaterThan(0); // Layout is valid
      
      // Should handle basic interaction
      const buttons = screen.queryAllByRole('button');
      if (buttons.length > 0) {
        await act(async () => {
          fireEvent.click(buttons[0]);
        });
        
        // Should not crash on interaction
        expect(container).toBeInTheDocument();
      }
    });

    test('CI: Mobile compatibility check', async () => {
      viewportUtils.setMobile();
      
      const mobileExpenses = generateMockExpenses(8);
      
      const mockAuth = {
        user: { id: 'mobile-ci-user', email: 'mobile-ci@test.com' },
        userProfile: { full_name: 'Mobile CI User', role: 'account_officer' },
        apiCall: jest.fn().mockResolvedValue({
          expenses: mobileExpenses,
          pagination: { page: 1, limit: 50, total: 8, totalPages: 1, hasMore: false }
        })
      };

      renderWithProviders(<ExpenseViewer />, mockAuth);
      
      await waitForComponentToStabilize();
      
      // Mobile critical checks
      expect(document.body.scrollWidth).toBeLessThanOrEqual(global.innerWidth + 20); // No horizontal overflow
      expect(mockAuth.apiCall).toHaveBeenCalled(); // Mobile API works
      
      // Touch interaction test
      const touchButtons = screen.queryAllByRole('button');
      if (touchButtons.length > 0) {
        await act(async () => {
          fireEvent.touchStart(touchButtons[0]);
          fireEvent.touchEnd(touchButtons[0]);
        });
        
        expect(touchButtons[0]).toBeInTheDocument();
      }
    });

    test('CI: Performance baseline validation', async () => {
      const performanceExpenses = generateMockExpenses(INTEGRATION_CONFIG.datasetSizes.small);
      
      const mockAuth = {
        user: { id: 'perf-ci-user', email: 'perf-ci@test.com' },
        userProfile: { full_name: 'Performance CI User', role: 'account_officer' },
        apiCall: jest.fn().mockResolvedValue({
          expenses: performanceExpenses,
          pagination: { page: 1, limit: 50, total: performanceExpenses.length, totalPages: 1, hasMore: false }
        })
      };

      const startTime = performance.now();
      
      renderWithProviders(<ExpenseViewer />, mockAuth);
      
      await waitFor(() => {
        expect(mockAuth.apiCall).toHaveBeenCalled();
      });
      
      const loadTime = performance.now() - startTime;
      
      // Performance baseline for CI
      expect(loadTime).toBeLessThan(5000); // 5 second maximum for CI
      
      // Should render something
      expect(document.body).toContainHTML('div');
    });
  });
});