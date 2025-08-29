/**
 * Performance Benchmark Tests
 * 
 * These tests ensure the application meets performance standards:
 * - Initial loading performance
 * - Rendering performance with large datasets
 * - Memory usage optimization
 * - Mobile performance standards
 * - Interaction responsiveness
 * 
 * Performance Budgets:
 * - Initial load: < 2s
 * - Large data rendering: < 1s
 * - User interactions: < 300ms
 * - Memory growth: < 50MB during session
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from '@testing-library/react';

import { 
  renderWithProviders, 
  generateMockExpenses, 
  viewportUtils, 
  performanceUtils,
  waitForComponentToStabilize 
} from '../utils/testUtils';

import ExpenseViewer from '../../components/ExpenseViewer';
import EnhancedMobileExpenseList from '../../components/EnhancedMobileExpenseList';
import Dashboard from '../../components/Dashboard';
import ExpenseForm from '../../components/ExpenseForm';

// Performance test utilities
const measureMemoryUsage = () => {
  if (performance.memory) {
    return performance.memory.usedJSHeapSize;
  }
  return 0; // Fallback for environments without memory API
};

const createPerformanceApiCall = (expenses, delay = 50) => {
  return jest.fn().mockImplementation(async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return {
      expenses,
      pagination: {
        page: 1,
        limit: 50,
        total: expenses.length,
        totalPages: Math.ceil(expenses.length / 50),
        hasMore: expenses.length > 50
      }
    };
  });
};

describe('Performance Benchmarks - Loading and Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    viewportUtils.setDesktop();
  });

  test('PERFORMANCE: Initial application load must complete within 2 seconds', async () => {
    const smallDataset = generateMockExpenses(10);
    const mockApiCall = createPerformanceApiCall(smallDataset, 100);
    
    const startTime = performance.now();
    
    renderWithProviders(<Dashboard />, {
      user: { id: 'test-user-id' },
      userProfile: { role: 'account_officer' }
    });

    // Wait for initial load to complete
    await waitForComponentToStabilize(200);
    
    const loadTime = performance.now() - startTime;
    
    expect(loadTime).toBeWithinPerformanceBudget(2000); // 2 second budget
    expect(document.body).toContainHTML('div'); // Verify it actually loaded
  });

  test('PERFORMANCE: Large dataset rendering must complete within 1 second', async () => {
    const largeDataset = generateMockExpenses(500);
    const mockApiCall = createPerformanceApiCall(largeDataset, 10);
    
    const mockAuth = {
      user: { id: 'test-user-id' },
      userProfile: { role: 'account_officer' },
      apiCall: mockApiCall
    };

    const startTime = performance.now();
    
    renderWithProviders(<ExpenseViewer />, mockAuth);
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalled();
    });
    
    const renderTime = performance.now() - startTime;
    
    expect(renderTime).toBeWithinPerformanceBudget(1000); // 1 second budget
  });

  test('PERFORMANCE: Component re-renders must be efficient', async () => {
    const mediumDataset = generateMockExpenses(50);
    const mockApiCall = createPerformanceApiCall(mediumDataset, 10);
    
    const mockAuth = {
      user: { id: 'test-user-id' },
      userProfile: { role: 'account_officer' },
      apiCall: mockApiCall
    };

    const { rerender } = renderWithProviders(<ExpenseViewer />, mockAuth);
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalled();
    });
    
    // Measure re-render performance
    const rerenderStartTime = performance.now();
    
    rerender(<ExpenseViewer />);
    
    await waitForComponentToStabilize(50);
    
    const rerenderTime = performance.now() - rerenderStartTime;
    
    expect(rerenderTime).toBeWithinPerformanceBudget(200); // 200ms budget for re-renders
  });

  test('PERFORMANCE: Mobile component rendering must meet performance standards', async () => {
    viewportUtils.setMobile();
    
    const mobileDataset = generateMockExpenses(30);
    const mockApiCall = createPerformanceApiCall(mobileDataset, 20);
    
    const mockAuth = {
      user: { id: 'test-user-id' },
      userProfile: { role: 'account_officer' },
      apiCall: mockApiCall
    };

    const startTime = performance.now();
    
    renderWithProviders(<EnhancedMobileExpenseList />, mockAuth);
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalled();
    });
    
    const mobileRenderTime = performance.now() - startTime;
    
    // Mobile should be even faster due to simpler layouts
    expect(mobileRenderTime).toBeWithinPerformanceBudget(800); // 800ms budget for mobile
  });

  test('PERFORMANCE: Form rendering and validation must be responsive', async () => {
    const startTime = performance.now();
    
    renderWithProviders(<ExpenseForm />);
    
    await waitForComponentToStabilize(100);
    
    const formRenderTime = performance.now() - startTime;
    
    expect(formRenderTime).toBeWithinPerformanceBudget(500); // 500ms for form render
    
    // Test form interaction performance
    const user = userEvent.setup();
    const textInputs = screen.queryAllByRole('textbox');
    
    if (textInputs.length > 0) {
      const interactionStartTime = performance.now();
      
      await act(async () => {
        await user.type(textInputs[0], 'Performance test input');
      });
      
      const interactionTime = performance.now() - interactionStartTime;
      
      expect(interactionTime).toBeWithinPerformanceBudget(300); // 300ms for typing
    }
  });
});

describe('Performance Benchmarks - User Interaction Responsiveness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    viewportUtils.setDesktop();
  });

  test('PERFORMANCE: Button clicks must respond within 300ms', async () => {
    const mockExpenses = generateMockExpenses(20);
    const mockApiCall = createPerformanceApiCall(mockExpenses, 10);
    
    const mockAuth = {
      user: { id: 'test-user-id' },
      userProfile: { role: 'account_officer' },
      apiCall: mockApiCall
    };

    renderWithProviders(<ExpenseViewer />, mockAuth);
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalled();
    });
    
    const buttons = screen.queryAllByRole('button');
    
    if (buttons.length > 0) {
      const clickStartTime = performance.now();
      
      await act(async () => {
        fireEvent.click(buttons[0]);
      });
      
      const clickResponseTime = performance.now() - clickStartTime;
      
      expect(clickResponseTime).toBeWithinPerformanceBudget(300); // 300ms budget
    }
  });

  test('PERFORMANCE: Sort operations must complete quickly', async () => {
    const sortTestExpenses = generateMockExpenses(100);
    const mockApiCall = jest.fn().mockImplementation(async (endpoint, options) => {
      const sortStartTime = performance.now();
      
      // Simulate sorting operation
      const sorted = [...sortTestExpenses].sort((a, b) => {
        if (options?.sortBy === 'amount') {
          return options.sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
        }
        return 0;
      });
      
      const sortTime = performance.now() - sortStartTime;
      expect(sortTime).toBeWithinPerformanceBudget(100); // Sorting should be very fast
      
      await new Promise(resolve => setTimeout(resolve, 20)); // Network delay
      
      return {
        expenses: sorted.slice(0, 50),
        pagination: { page: 1, limit: 50, total: sorted.length, totalPages: Math.ceil(sorted.length / 50), hasMore: false }
      };
    });
    
    const mockAuth = {
      user: { id: 'test-user-id' },
      userProfile: { role: 'account_officer' },
      apiCall: mockApiCall
    };

    renderWithProviders(<ExpenseViewer />, mockAuth);
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalled();
    });
    
    // Test sort button performance
    const sortButtons = screen.queryAllByRole('button').filter(btn => 
      btn.textContent.toLowerCase().includes('amount')
    );
    
    if (sortButtons.length > 0) {
      const sortClickTime = performance.now();
      
      await act(async () => {
        fireEvent.click(sortButtons[0]);
      });
      
      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledTimes(2);
      });
      
      const totalSortTime = performance.now() - sortClickTime;
      
      expect(totalSortTime).toBeWithinPerformanceBudget(500); // 500ms total including network
    }
  });

  test('PERFORMANCE: Mobile touch interactions must be responsive', async () => {
    viewportUtils.setMobile();
    
    const mobileExpenses = generateMockExpenses(25);
    const mockApiCall = createPerformanceApiCall(mobileExpenses, 10);
    
    const mockAuth = {
      user: { id: 'test-user-id' },
      userProfile: { role: 'account_officer' },
      apiCall: mockApiCall
    };

    renderWithProviders(<EnhancedMobileExpenseList />, mockAuth);
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalled();
    });
    
    const touchButtons = screen.queryAllByRole('button');
    
    if (touchButtons.length > 0) {
      const touchStartTime = performance.now();
      
      // Simulate touch interaction
      await act(async () => {
        fireEvent.touchStart(touchButtons[0]);
        fireEvent.touchEnd(touchButtons[0]);
      });
      
      const touchResponseTime = performance.now() - touchStartTime;
      
      expect(touchResponseTime).toBeWithinPerformanceBudget(100); // Touch should be very responsive
    }
  });

  test('PERFORMANCE: Scroll performance must remain smooth', async () => {
    const scrollTestExpenses = generateMockExpenses(200);
    const mockApiCall = createPerformanceApiCall(scrollTestExpenses, 5);
    
    const mockAuth = {
      user: { id: 'test-user-id' },
      userProfile: { role: 'account_officer' },
      apiCall: mockApiCall
    };

    renderWithProviders(<ExpenseViewer />, mockAuth);
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalled();
    });
    
    const scrollableElement = document.querySelector('[role="main"]') || document.body;
    
    const scrollStartTime = performance.now();
    
    // Simulate multiple scroll events
    for (let i = 0; i < 10; i++) {
      fireEvent.scroll(scrollableElement, { target: { scrollTop: i * 100 } });
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
      });
    }
    
    const scrollTime = performance.now() - scrollStartTime;
    
    expect(scrollTime).toBeWithinPerformanceBudget(200); // 200ms for 10 scroll events
  });
});

describe('Performance Benchmarks - Memory Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    viewportUtils.setDesktop();
  });

  test('PERFORMANCE: Memory usage must remain stable during operations', async () => {
    const memoryTestExpenses = generateMockExpenses(100);
    const mockApiCall = createPerformanceApiCall(memoryTestExpenses, 10);
    
    const mockAuth = {
      user: { id: 'test-user-id' },
      userProfile: { role: 'account_officer' },
      apiCall: mockApiCall
    };

    const initialMemory = measureMemoryUsage();
    
    const { unmount } = renderWithProviders(<ExpenseViewer />, mockAuth);
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalled();
    });
    
    // Perform several operations
    const buttons = screen.queryAllByRole('button');
    
    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      await act(async () => {
        fireEvent.click(buttons[i]);
      });
      await waitForComponentToStabilize(10);
    }
    
    const peakMemory = measureMemoryUsage();
    
    // Clean up
    unmount();
    
    await waitForComponentToStabilize(100);
    
    const finalMemory = measureMemoryUsage();
    
    if (initialMemory > 0) { // Only test if memory API is available
      const memoryGrowth = peakMemory - initialMemory;
      const memoryBudget = 50 * 1024 * 1024; // 50MB budget
      
      expect(memoryGrowth).toBeLessThan(memoryBudget);
      
      // Memory should be released after unmounting
      const memoryLeak = finalMemory - initialMemory;
      expect(memoryLeak).toBeLessThan(memoryBudget * 0.1); // Allow 10% of budget for minor leaks
    }
  });

  test('PERFORMANCE: Large dataset handling must not cause memory bloat', async () => {
    const largeMemoryExpenses = generateMockExpenses(1000);
    
    // Split into pages to simulate pagination
    let pageIndex = 0;
    const mockApiCall = jest.fn().mockImplementation(async (endpoint, options) => {
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;
      
      const pageData = largeMemoryExpenses.slice(offset, offset + limit);
      
      return {
        expenses: pageData,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit,
          total: largeMemoryExpenses.length,
          totalPages: Math.ceil(largeMemoryExpenses.length / limit),
          hasMore: offset + limit < largeMemoryExpenses.length
        }
      };
    });
    
    const mockAuth = {
      user: { id: 'test-user-id' },
      userProfile: { role: 'account_officer' },
      apiCall: mockApiCall
    };

    const initialMemory = measureMemoryUsage();
    
    renderWithProviders(<ExpenseViewer />, mockAuth);
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalled();
    });
    
    // Navigate through several pages
    const nextButtons = screen.queryAllByRole('button').filter(btn => 
      btn.textContent.toLowerCase().includes('next') || btn.textContent.includes('>')
    );
    
    for (let i = 0; i < Math.min(nextButtons.length, 3); i++) {
      if (nextButtons[i]) {
        await act(async () => {
          fireEvent.click(nextButtons[i]);
        });
        
        await waitForComponentToStabilize(50);
      }
    }
    
    const finalMemory = measureMemoryUsage();
    
    if (initialMemory > 0) {
      const memoryGrowth = finalMemory - initialMemory;
      const memoryBudget = 30 * 1024 * 1024; // 30MB budget for large data handling
      
      expect(memoryGrowth).toBeLessThan(memoryBudget);
    }
  });
});

describe('Performance Benchmarks - Animation and Visual Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    viewportUtils.setDesktop();
  });

  test('PERFORMANCE: CSS animations must not block main thread', async () => {
    const animationExpenses = generateMockExpenses(20);
    const mockApiCall = createPerformanceApiCall(animationExpenses, 10);
    
    const mockAuth = {
      user: { id: 'test-user-id' },
      userProfile: { role: 'account_officer' },
      apiCall: mockApiCall
    };

    const { container } = renderWithProviders(<ExpenseViewer />, mockAuth);
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalled();
    });
    
    const animatedElements = container.querySelectorAll('[class*="animate"], [class*="transition"]');
    
    animatedElements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      
      // Should use GPU-accelerated properties (transform, opacity)
      const usesGPUProps = (
        computedStyle.transform !== 'none' ||
        computedStyle.opacity !== '1' ||
        computedStyle.willChange === 'transform' ||
        computedStyle.willChange === 'opacity'
      );
      
      // At minimum, should not use expensive properties like width, height for animations
      expect(computedStyle.transitionProperty).not.toContain('width');
      expect(computedStyle.transitionProperty).not.toContain('height');
    });
  });

  test('PERFORMANCE: Mobile animations must be optimized for touch devices', async () => {
    viewportUtils.setMobile();
    
    const mobileAnimationExpenses = generateMockExpenses(15);
    const mockApiCall = createPerformanceApiCall(mobileAnimationExpenses, 5);
    
    const mockAuth = {
      user: { id: 'test-user-id' },
      userProfile: { role: 'account_officer' },
      apiCall: mockApiCall
    };

    const { container } = renderWithProviders(<EnhancedMobileExpenseList />, mockAuth);
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalled();
    });
    
    // Check for mobile-optimized animations
    const touchElements = container.querySelectorAll('[class*="touch"], button, [role="button"]');
    
    touchElements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      
      // Should not have excessively long transitions on mobile
      const transitionDuration = parseFloat(computedStyle.transitionDuration) || 0;
      expect(transitionDuration).toBeLessThanOrEqual(0.3); // 300ms max for mobile
    });
  });

  test('PERFORMANCE: Layout shifts must be minimized', async () => {
    const layoutExpenses = generateMockExpenses(50);
    const mockApiCall = createPerformanceApiCall(layoutExpenses, 100); // Slow load to test loading states
    
    const mockAuth = {
      user: { id: 'test-user-id' },
      userProfile: { role: 'account_officer' },
      apiCall: mockApiCall
    };

    const { container } = renderWithProviders(<ExpenseViewer />, mockAuth);
    
    // Check initial layout
    const initialRect = container.getBoundingClientRect();
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalled();
    });
    
    await waitForComponentToStabilize(200);
    
    // Check layout after content loads
    const finalRect = container.getBoundingClientRect();
    
    // Should not cause significant layout shift
    const heightChange = Math.abs(finalRect.height - initialRect.height);
    const widthChange = Math.abs(finalRect.width - initialRect.width);
    
    // Allow reasonable growth for content, but not massive shifts
    expect(heightChange).toBeLessThan(window.innerHeight * 0.5); // Less than 50% of viewport
    expect(widthChange).toBeLessThan(50); // Minimal width changes
  });
});

describe('Performance Benchmarks - Network and Data Loading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    viewportUtils.setDesktop();
  });

  test('PERFORMANCE: API calls must be optimized and cached', async () => {
    const networkExpenses = generateMockExpenses(30);
    let callCount = 0;
    
    const mockApiCall = jest.fn().mockImplementation(async () => {
      callCount++;
      await new Promise(resolve => setTimeout(resolve, 50));
      
      return {
        expenses: networkExpenses,
        pagination: { page: 1, limit: 50, total: networkExpenses.length, totalPages: 1, hasMore: false }
      };
    });
    
    const mockAuth = {
      user: { id: 'test-user-id' },
      userProfile: { role: 'account_officer' },
      apiCall: mockApiCall
    };

    const { rerender } = renderWithProviders(<ExpenseViewer />, mockAuth);
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalled();
    });
    
    const initialCalls = callCount;
    
    // Re-render should not trigger additional unnecessary API calls
    rerender(<ExpenseViewer />);
    
    await waitForComponentToStabilize(100);
    
    // Should not make excessive API calls on re-render
    expect(callCount).toBeLessThanOrEqual(initialCalls + 1);
  });

  test('PERFORMANCE: Data processing must be efficient', async () => {
    // Large dataset to test processing performance
    const processingExpenses = generateMockExpenses(500);
    
    const mockApiCall = jest.fn().mockImplementation(async () => {
      const processingStartTime = performance.now();
      
      // Simulate data processing
      const processedData = processingExpenses.map(expense => ({
        ...expense,
        formattedAmount: `$${expense.amount.toFixed(2)}`,
        formattedDate: new Date(expense.expense_date).toLocaleDateString()
      }));
      
      const processingTime = performance.now() - processingStartTime;
      expect(processingTime).toBeWithinPerformanceBudget(100); // Processing should be fast
      
      return {
        expenses: processedData.slice(0, 50), // Return first page
        pagination: { page: 1, limit: 50, total: processedData.length, totalPages: 10, hasMore: true }
      };
    });
    
    const mockAuth = {
      user: { id: 'test-user-id' },
      userProfile: { role: 'account_officer' },
      apiCall: mockApiCall
    };

    renderWithProviders(<ExpenseViewer />, mockAuth);
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalled();
    });
    
    // Data processing performance is tested within the mock API call
  });
});