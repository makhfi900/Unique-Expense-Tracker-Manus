/**
 * Jest Setup File - Global Test Configuration
 * Configures testing environment for React + Supabase + Mobile testing
 */

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { expect, afterEach, beforeEach } from '@jest/globals';
// import 'jest-performance-testing';

// Configure React Testing Library
configure({ 
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  // Optimize for mobile testing
  computedStyleSupportsPseudoElements: true
});

// Global test environment setup
beforeEach(() => {
  // Mock window.matchMedia for responsive design testing
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

  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock performance API for performance testing
  Object.defineProperty(window, 'performance', {
    writable: true,
    value: {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByName: jest.fn(() => []),
      getEntriesByType: jest.fn(() => []),
    }
  });

  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

  // Mock fetch for API calls
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    })
  );

  // Mock console methods to reduce noise in tests
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});

  // Setup default viewport for consistent testing
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });
});

// Cleanup after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  jest.restoreAllMocks();

  // Reset document body
  document.body.innerHTML = '';
  
  // Reset DOM to clean state
  document.head.innerHTML = '<meta charset="utf-8" />';
  
  // Clear any remaining timers
  jest.clearAllTimers();
});

// Custom matchers for mobile testing
expect.extend({
  toHaveMinimumTouchTarget(element, minSize = 44) {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    
    const actualWidth = Math.max(rect.width, parseFloat(computedStyle.minWidth) || 0);
    const actualHeight = Math.max(rect.height, parseFloat(computedStyle.minHeight) || 0);
    
    const pass = actualWidth >= minSize - 4 && actualHeight >= minSize - 4; // 4px tolerance
    
    return {
      message: () => `Expected element to have minimum touch target size of ${minSize}px, got ${actualWidth}x${actualHeight}px`,
      pass,
    };
  },

  toBeWithinPerformanceBudget(actualTime, budgetMs) {
    const pass = actualTime <= budgetMs;
    return {
      message: () => `Expected performance time ${actualTime}ms to be within budget of ${budgetMs}ms`,
      pass,
    };
  },

  toRenderWithoutLayoutShift(element) {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    
    const hasLayoutShift = (
      rect.width > window.innerWidth ||
      computedStyle.overflowX === 'scroll' ||
      element.scrollWidth > window.innerWidth + 10
    );
    
    return {
      message: () => `Expected element to render without layout shift`,
      pass: !hasLayoutShift,
    };
  }
});

// Setup global error handling for unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection in test:', reason);
});

// Increase test timeout for integration tests
jest.setTimeout(10000);

export { configure };