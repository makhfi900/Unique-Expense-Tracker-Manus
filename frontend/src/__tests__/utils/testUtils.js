/**
 * Enhanced Test Utilities for TDD Test Suite
 * 
 * Provides comprehensive mocking, rendering, and assertion utilities
 * for testing the expense tracker application with focus on:
 * - Sorting and pagination functionality
 * - Mobile UI interactions  
 * - API call mocking
 * - Performance testing
 * - Accessibility validation
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Context providers
import { SupabaseAuthProvider } from '../../context/SupabaseAuthContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { TimeRangeProvider } from '../../context/TimeRangeContext';
import { DemoProvider } from '../../context/DemoContext';

/**
 * Enhanced wrapper for rendering components with all necessary providers
 */
export const renderWithProviders = (
  ui, 
  { 
    auth = null, 
    theme = 'light', 
    demo = false,
    initialEntries = ['/'],
    ...renderOptions 
  } = {}
) => {
  // Default auth mock if none provided
  const defaultAuth = {
    user: { id: 'test-user-id', email: 'test@example.com' },
    userProfile: { full_name: 'Test User', role: 'account_officer' },
    isAdmin: false,
    isAccountOfficer: true,
    isAuthenticated: true,
    loading: false,
    apiCall: jest.fn().mockResolvedValue({ expenses: [] }),
    login: jest.fn(),
    logout: jest.fn(),
    refreshSession: jest.fn(),
  };

  const authValue = auth || defaultAuth;

  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <SupabaseAuthProvider value={authValue}>
        <ThemeProvider defaultTheme={theme}>
          <TimeRangeProvider>
            <DemoProvider isDemoMode={demo}>
              {children}
            </DemoProvider>
          </TimeRangeProvider>
        </ThemeProvider>
      </SupabaseAuthProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Generate mock expense data for testing
 */
export const generateMockExpenses = (count = 10) => {
  const categories = [
    { name: 'Food', color: '#FF6B6B' },
    { name: 'Travel', color: '#4ECDC4' },
    { name: 'Office', color: '#45B7D1' },
    { name: 'Equipment', color: '#96CEB4' },
    { name: 'Supplies', color: '#FFEAA7' },
  ];

  const descriptions = [
    'Coffee Shop', 'Restaurant Lunch', 'Gas Station', 'Office Supplies',
    'Software License', 'Hotel Booking', 'Taxi Fare', 'Printer Paper',
    'Team Lunch', 'Conference Fee', 'Equipment Purchase', 'Training Course'
  ];

  return Array.from({ length: count }, (_, index) => {
    const category = categories[index % categories.length];
    const baseDate = new Date('2024-01-01');
    const randomDays = Math.floor(Math.random() * 365);
    const expenseDate = new Date(baseDate.getTime() + randomDays * 24 * 60 * 60 * 1000);

    return {
      id: `expense-${index + 1}`,
      amount: parseFloat((Math.random() * 1000 + 10).toFixed(2)),
      description: `${descriptions[index % descriptions.length]} ${index + 1}`,
      expense_date: expenseDate.toISOString().split('T')[0],
      category: {
        id: `category-${index % categories.length + 1}`,
        ...category
      },
      created_by: 'test-user-id',
      created_at: expenseDate.toISOString(),
      updated_at: expenseDate.toISOString(),
      notes: index % 3 === 0 ? `Notes for expense ${index + 1}` : null,
      receipt_url: index % 5 === 0 ? `https://example.com/receipt-${index + 1}.pdf` : null,
    };
  });
};

/**
 * Mock API call function with realistic response simulation
 */
export const mockApiCall = (expenses = [], options = {}) => {
  const {
    delay = 100,
    shouldFail = false,
    errorMessage = 'API Error',
    paginationEnabled = true,
    defaultLimit = 50,
  } = options;

  return jest.fn().mockImplementation(async (endpoint, requestOptions = {}) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, delay));

    if (shouldFail) {
      throw new Error(errorMessage);
    }

    // Parse URL parameters for sorting and pagination
    const url = new URL(`http://example.com${endpoint}`);
    const params = url.searchParams;
    
    const page = parseInt(params.get('page')) || 1;
    const limit = parseInt(params.get('limit')) || defaultLimit;
    const sortBy = params.get('sort_by') || 'expense_date';
    const sortOrder = params.get('sort_order') || 'desc';
    const search = params.get('search');
    const category = params.get('category');

    let filteredExpenses = [...expenses];

    // Apply search filter
    if (search) {
      filteredExpenses = filteredExpenses.filter(expense =>
        expense.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply category filter
    if (category && category !== 'all') {
      filteredExpenses = filteredExpenses.filter(expense =>
        expense.category?.id === category
      );
    }

    // Apply sorting
    filteredExpenses.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle different data types
      if (sortBy === 'amount') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else if (sortBy === 'expense_date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedExpenses = paginationEnabled 
      ? filteredExpenses.slice(offset, offset + limit)
      : filteredExpenses;

    // Determine response based on request method
    if (requestOptions.method === 'POST') {
      // Create expense
      const newExpense = JSON.parse(requestOptions.body);
      return { 
        expense: { 
          id: `new-expense-${Date.now()}`, 
          ...newExpense,
          created_at: new Date().toISOString()
        } 
      };
    }

    if (requestOptions.method === 'PUT') {
      // Update expense
      const updatedExpense = JSON.parse(requestOptions.body);
      return { 
        expense: { 
          ...updatedExpense,
          updated_at: new Date().toISOString()
        } 
      };
    }

    if (requestOptions.method === 'DELETE') {
      // Delete expense
      return { success: true };
    }

    // Default GET response with pagination metadata
    return {
      expenses: paginatedExpenses,
      pagination: paginationEnabled ? {
        page,
        limit,
        total: filteredExpenses.length,
        totalPages: Math.ceil(filteredExpenses.length / limit),
        hasMore: page * limit < filteredExpenses.length
      } : undefined
    };
  });
};

/**
 * Viewport utilities for mobile testing
 */
export const viewportUtils = {
  setMobileViewport: (width = 375, height = 667) => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: width });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: height });
    
    // Mock matchMedia for mobile queries
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query) => ({
        matches: query.includes('max-width: 768px') || query.includes(`max-width: ${width}px`),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      }),
    });

    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
  },

  setTabletViewport: (width = 768, height = 1024) => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: width });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: height });
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query) => ({
        matches: query.includes('min-width: 768px') && query.includes('max-width: 1024px'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      }),
    });

    window.dispatchEvent(new Event('resize'));
  },

  setDesktopViewport: (width = 1024, height = 768) => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: width });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: height });
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query) => ({
        matches: query.includes('min-width: 1024px'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      }),
    });

    window.dispatchEvent(new Event('resize'));
  },

  resetViewport: () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 768 });
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      }),
    });

    window.dispatchEvent(new Event('resize'));
  }
};

/**
 * Performance testing utilities
 */
export const performanceUtils = {
  measureRenderTime: async (renderFunction) => {
    const start = performance.now();
    await renderFunction();
    const end = performance.now();
    return end - start;
  },

  measureApiResponseTime: async (apiCall, ...args) => {
    const start = performance.now();
    const result = await apiCall(...args);
    const end = performance.now();
    return { result, time: end - start };
  },

  mockPerformanceObserver: () => {
    const entries = [];
    
    global.PerformanceObserver = jest.fn().mockImplementation((callback) => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
      takeRecords: jest.fn(() => entries),
    }));

    return {
      addEntry: (entry) => entries.push(entry),
      getEntries: () => entries,
    };
  }
};

/**
 * Accessibility testing utilities
 */
export const accessibilityUtils = {
  findByRole: (role, options = {}) => {
    try {
      return screen.getByRole(role, options);
    } catch (error) {
      console.error(`Element with role "${role}" not found`, { options, error });
      throw error;
    }
  },

  checkTouchTargetSize: (element, minSize = 44) => {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    
    const actualWidth = Math.max(rect.width, parseFloat(computedStyle.minWidth) || 0);
    const actualHeight = Math.max(rect.height, parseFloat(computedStyle.minHeight) || 0);
    
    return {
      width: actualWidth,
      height: actualHeight,
      meetsRequirement: actualWidth >= minSize && actualHeight >= minSize,
      minSize
    };
  },

  checkColorContrast: (element) => {
    const computedStyle = window.getComputedStyle(element);
    const color = computedStyle.color;
    const backgroundColor = computedStyle.backgroundColor;
    
    // Simple contrast check (in real implementation, use proper WCAG contrast calculation)
    return {
      color,
      backgroundColor,
      hasContrast: color !== backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)'
    };
  }
};

/**
 * Custom test assertions
 */
export const customAssertions = {
  expectApiCallWith: (mockFn, expectedUrl, expectedOptions = {}) => {
    expect(mockFn).toHaveBeenCalledWith(
      expect.stringContaining(expectedUrl),
      expect.objectContaining(expectedOptions)
    );
  },

  expectSortedExpenses: (expenseElements, sortBy, sortOrder) => {
    const values = expenseElements.map(el => {
      const text = el.textContent;
      if (sortBy === 'amount') {
        const match = text.match(/[\$]?([\d,]+\.?\d*)/);
        return match ? parseFloat(match[1].replace(',', '')) : 0;
      } else if (sortBy === 'expense_date') {
        const match = text.match(/\d{4}-\d{2}-\d{2}/);
        return match ? new Date(match[0]) : new Date();
      } else {
        return text;
      }
    });

    const sortedValues = [...values].sort((a, b) => {
      if (typeof a === 'number') {
        return sortOrder === 'asc' ? a - b : b - a;
      } else if (a instanceof Date) {
        return sortOrder === 'asc' ? a - b : b - a;
      } else {
        const result = a.toString().localeCompare(b.toString());
        return sortOrder === 'asc' ? result : -result;
      }
    });

    expect(values).toEqual(sortedValues);
  },

  expectNoDuplicateElements: (selector) => {
    const elements = document.querySelectorAll(selector);
    const texts = Array.from(elements).map(el => el.textContent);
    const uniqueTexts = [...new Set(texts)];
    
    expect(texts.length).toBe(uniqueTexts.length);
  }
};

/**
 * Test data factories
 */
export const testDataFactory = {
  createUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'account_officer',
    created_at: '2024-01-01T00:00:00Z',
    is_active: true,
    ...overrides
  }),

  createCategory: (overrides = {}) => ({
    id: 'test-category-id',
    name: 'Test Category',
    color: '#FF6B6B',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides
  }),

  createExpense: (overrides = {}) => ({
    id: 'test-expense-id',
    amount: 100.50,
    description: 'Test Expense',
    expense_date: '2024-01-15',
    category: testDataFactory.createCategory(),
    created_by: 'test-user-id',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    is_active: true,
    notes: null,
    receipt_url: null,
    ...overrides
  })
};

/**
 * Wait for element utilities
 */
export const waitForUtils = {
  waitForApiCall: async (mockFn, timeout = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (mockFn.mock.calls.length > 0) {
        return mockFn.mock.calls[mockFn.mock.calls.length - 1];
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error(`API call not made within ${timeout}ms`);
  },

  waitForElementCount: async (testId, expectedCount, timeout = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const elements = screen.queryAllByTestId(testId);
      if (elements.length === expectedCount) {
        return elements;
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error(`Expected ${expectedCount} elements with testId "${testId}", but found ${screen.queryAllByTestId(testId).length}`);
  }
};

// Export all utilities as default
export default {
  renderWithProviders,
  generateMockExpenses,
  mockApiCall,
  viewportUtils,
  performanceUtils,
  accessibilityUtils,
  customAssertions,
  testDataFactory,
  waitForUtils,
};