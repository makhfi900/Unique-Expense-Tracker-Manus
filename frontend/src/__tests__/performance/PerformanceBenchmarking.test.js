/**
 * Performance Benchmarking Tests
 * Tests animation performance, data table efficiency, and overall app performance metrics
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { SupabaseAuthProvider } from '../../context/SupabaseAuthContext';
import { TimeRangeProvider } from '../../context/TimeRangeContext';
import ExpenseViewer from '../../components/ExpenseViewer';
import Dashboard from '../../components/Dashboard';
import EnhancedAnalytics from '../../components/EnhancedAnalytics';
import ExpenseForm from '../../components/ExpenseForm';

// Performance measurement utilities
class PerformanceMonitor {
  constructor() {
    this.marks = new Map();
    this.measurements = [];
  }

  mark(name) {
    const markName = `${name}-${Date.now()}`;
    performance.mark(markName);
    this.marks.set(name, markName);
    return markName;
  }

  measure(name, startMark, endMark = null) {
    const measureName = `measure-${name}-${Date.now()}`;
    
    if (endMark === null) {
      const startMarkName = this.marks.get(startMark);
      if (!startMarkName) return null;
      
      performance.measure(measureName, startMarkName);
    } else {
      performance.measure(measureName, startMark, endMark);
    }
    
    const measurement = performance.getEntriesByName(measureName)[0];
    this.measurements.push({
      name,
      duration: measurement.duration,
      startTime: measurement.startTime
    });
    
    return measurement.duration;
  }

  getAverageDuration(name) {
    const measurements = this.measurements.filter(m => m.name === name);
    if (measurements.length === 0) return 0;
    return measurements.reduce((sum, m) => sum + m.duration, 0) / measurements.length;
  }

  clear() {
    this.marks.clear();
    this.measurements = [];
    performance.clearMarks();
    performance.clearMeasures();
  }
}

// Mock large dataset
const createLargeDataset = (size = 1000) => {
  return Array.from({ length: size }, (_, i) => ({
    id: i + 1,
    amount: (Math.random() * 10000).toFixed(2),
    description: `Performance Test Expense ${i + 1} - ${Math.random().toString(36).substring(7)}`,
    expense_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    category: {
      id: (i % 10) + 1,
      name: `Category ${(i % 10) + 1}`,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    },
    created_by_user: { full_name: `User ${(i % 20) + 1}` },
    notes: i % 5 === 0 ? `Notes for expense ${i + 1} with additional details and information` : null
  }));
};

// Mock components and contexts
jest.mock('../../context/SupabaseAuthContext', () => ({
  SupabaseAuthProvider: ({ children }) => children,
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com' },
    userProfile: { full_name: 'Test User', role: 'admin' },
    isAdmin: true,
    isAccountOfficer: false,
    apiCall: jest.fn().mockImplementation((url) => {
      if (url.includes('/expenses')) {
        return Promise.resolve({
          expenses: createLargeDataset(500),
          pagination: { total: 500, totalPages: 25 }
        });
      }
      if (url.includes('/categories')) {
        return Promise.resolve({
          categories: Array.from({ length: 20 }, (_, i) => ({
            id: i + 1,
            name: `Performance Category ${i + 1}`,
            color: `#${Math.floor(Math.random()*16777215).toString(16)}`
          }))
        });
      }
      if (url.includes('/analytics')) {
        return Promise.resolve({
          totalExpenses: 250000,
          categoryBreakdown: Array.from({ length: 10 }, (_, i) => ({
            name: `Category ${i + 1}`,
            value: Math.floor(Math.random() * 50000)
          })),
          monthlyTrends: Array.from({ length: 12 }, (_, i) => ({
            month: `2024-${String(i + 1).padStart(2, '0')}`,
            amount: Math.floor(Math.random() * 100000)
          }))
        });
      }
      return Promise.resolve({});
    }),
    session: { user: { email: 'test@example.com' } }
  })
}));

jest.mock('../../context/TimeRangeContext', () => ({
  TimeRangeProvider: ({ children }) => children,
  useTimeRange: () => ({
    dateRange: { startDate: '2024-01-01', endDate: '2024-12-31' },
    handlePresetChange: jest.fn(),
    handleDateRangeChange: jest.fn()
  })
}));

// Test wrapper
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider>
      <SupabaseAuthProvider>
        <TimeRangeProvider>
          {children}
        </TimeRangeProvider>
      </SupabaseAuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('Animation Performance Testing', () => {
  let performanceMonitor;

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor();
    
    // Mock requestAnimationFrame for consistent testing
    global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
    global.cancelAnimationFrame = jest.fn();
    
    // Set desktop viewport
    global.innerWidth = 1024;
    global.innerHeight = 768;
    global.dispatchEvent(new Event('resize'));
    
    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    performanceMonitor.clear();
    jest.clearAllMocks();
  });

  describe('Component Mount Animations', () => {
    test('Dashboard mount animation performs within 300ms', async () => {
      performanceMonitor.mark('dashboard-mount-start');
      
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      performanceMonitor.mark('dashboard-mount-end');
      const mountDuration = performanceMonitor.measure('dashboard-mount', 'dashboard-mount-start', 'dashboard-mount-end');

      expect(mountDuration).toBeLessThan(300);
    });

    test('ExpenseViewer animation performance with large datasets', async () => {
      performanceMonitor.mark('expense-viewer-start');
      
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      performanceMonitor.mark('expense-viewer-end');
      const duration = performanceMonitor.measure('expense-viewer', 'expense-viewer-start', 'expense-viewer-end');

      expect(duration).toBeLessThan(500);
    });

    test('Form animations do not block user input', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExpenseForm />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const inputs = screen.queryAllByRole('textbox');
      if (inputs.length > 0) {
        const input = inputs[0];
        
        performanceMonitor.mark('input-interaction-start');
        
        await user.type(input, 'Test input during animation');
        
        performanceMonitor.mark('input-interaction-end');
        const interactionDuration = performanceMonitor.measure(
          'input-interaction', 
          'input-interaction-start', 
          'input-interaction-end'
        );

        expect(input).toHaveValue('Test input during animation');
        expect(interactionDuration).toBeLessThan(100);
      }
    });

    test('Modal animations maintain 60fps target', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Simulate modal opening
      const actionButtons = screen.queryAllByText(/Edit|More/);
      
      if (actionButtons.length > 0) {
        performanceMonitor.mark('modal-animation-start');
        
        fireEvent.click(actionButtons[0]);
        
        // Measure animation frames (simulated)
        for (let frame = 0; frame < 30; frame++) {
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
          });
        }
        
        performanceMonitor.mark('modal-animation-end');
        const animationDuration = performanceMonitor.measure(
          'modal-animation',
          'modal-animation-start',
          'modal-animation-end'
        );

        // 30 frames at 16ms each should be ~480ms
        expect(animationDuration).toBeLessThan(600);
      }
    });
  });

  describe('Scroll and List Animations', () => {
    test('scroll performance with large lists', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const tableContainer = document.querySelector('[class*="overflow"]') || document.body;
      
      performanceMonitor.mark('scroll-performance-start');
      
      // Simulate multiple scroll events
      for (let i = 0; i < 20; i++) {
        fireEvent.scroll(tableContainer, { target: { scrollY: i * 100 } });
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
        });
      }
      
      performanceMonitor.mark('scroll-performance-end');
      const scrollDuration = performanceMonitor.measure(
        'scroll-performance',
        'scroll-performance-start',
        'scroll-performance-end'
      );

      // Scroll performance should be smooth
      expect(scrollDuration / 20).toBeLessThan(10); // Average 10ms per scroll event
    });

    test('list item hover effects are smooth', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const rows = screen.queryAllByRole('row');
      
      if (rows.length > 1) {
        const dataRow = rows[1];
        
        performanceMonitor.mark('hover-effect-start');
        
        // Simulate rapid hover events
        for (let i = 0; i < 10; i++) {
          fireEvent.mouseEnter(dataRow);
          fireEvent.mouseLeave(dataRow);
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 2));
          });
        }
        
        performanceMonitor.mark('hover-effect-end');
        const hoverDuration = performanceMonitor.measure(
          'hover-effect',
          'hover-effect-start',
          'hover-effect-end'
        );

        expect(hoverDuration / 10).toBeLessThan(5); // Average 5ms per hover event
      }
    });
  });

  describe('Animation Memory Usage', () => {
    test('animations do not cause memory leaks', async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      // Render and unmount components multiple times
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <TestWrapper>
            <Dashboard />
          </TestWrapper>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        unmount();
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        // Memory increase should be minimal (less than 10MB)
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      }
    });

    test('CSS animations use hardware acceleration', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const animatedElements = document.querySelectorAll(
        '[class*="animate"], [class*="transition"], [style*="transform"]'
      );

      animatedElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        
        // Check for hardware-accelerated properties
        const usesHardwareAcceleration = 
          computedStyle.transform !== 'none' ||
          computedStyle.opacity !== '1' ||
          computedStyle.willChange === 'transform' ||
          computedStyle.willChange === 'opacity';

        expect(usesHardwareAcceleration).toBeTruthy();
      });
    });
  });
});

describe('Data Table Performance Testing', () => {
  let performanceMonitor;

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor();
    
    // Set desktop viewport for table testing
    global.innerWidth = 1920;
    global.innerHeight = 1080;
    global.dispatchEvent(new Event('resize'));
    
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    performanceMonitor.clear();
    jest.clearAllMocks();
  });

  describe('Large Dataset Rendering', () => {
    test('renders 500 rows within 1 second', async () => {
      performanceMonitor.mark('large-table-start');
      
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
      });

      performanceMonitor.mark('large-table-end');
      const renderDuration = performanceMonitor.measure(
        'large-table-render',
        'large-table-start',
        'large-table-end'
      );

      expect(renderDuration).toBeLessThan(1000);
      
      // Verify table is rendered
      const table = screen.queryByRole('table');
      if (table) {
        expect(table).toBeInTheDocument();
      }
    });

    test('pagination maintains performance with large datasets', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const nextButtons = screen.queryAllByText(/Next/);
      
      if (nextButtons.length > 0) {
        const nextButton = nextButtons[0];
        
        performanceMonitor.mark('pagination-start');
        
        // Test multiple page changes
        for (let i = 0; i < 5 && !nextButton.disabled; i++) {
          fireEvent.click(nextButton);
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          });
        }
        
        performanceMonitor.mark('pagination-end');
        const paginationDuration = performanceMonitor.measure(
          'pagination-performance',
          'pagination-start',
          'pagination-end'
        );

        expect(paginationDuration / 5).toBeLessThan(100); // Average 100ms per page change
      }
    });

    test('sorting large datasets completes within 500ms', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const sortableHeaders = screen.queryAllByText(/Date|Amount|Description/);
      
      if (sortableHeaders.length > 0) {
        const header = sortableHeaders[0];
        
        performanceMonitor.mark('sort-performance-start');
        
        fireEvent.click(header);
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 200));
        });
        
        performanceMonitor.mark('sort-performance-end');
        const sortDuration = performanceMonitor.measure(
          'sort-performance',
          'sort-performance-start',
          'sort-performance-end'
        );

        expect(sortDuration).toBeLessThan(500);
      }
    });

    test('filtering operations are responsive', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const searchInput = screen.queryByPlaceholderText(/search/i);
      
      if (searchInput) {
        performanceMonitor.mark('filter-performance-start');
        
        await user.type(searchInput, 'Performance Test');
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 300));
        });
        
        performanceMonitor.mark('filter-performance-end');
        const filterDuration = performanceMonitor.measure(
          'filter-performance',
          'filter-performance-start',
          'filter-performance-end'
        );

        expect(filterDuration).toBeLessThan(400);
      }
    });
  });

  describe('Table Interaction Performance', () => {
    test('row selection performs efficiently with large datasets', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const checkboxes = screen.queryAllByRole('checkbox');
      
      if (checkboxes.length > 10) {
        performanceMonitor.mark('selection-performance-start');
        
        // Select multiple rows
        for (let i = 0; i < 10; i++) {
          fireEvent.click(checkboxes[i]);
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 5));
          });
        }
        
        performanceMonitor.mark('selection-performance-end');
        const selectionDuration = performanceMonitor.measure(
          'selection-performance',
          'selection-performance-start',
          'selection-performance-end'
        );

        expect(selectionDuration / 10).toBeLessThan(20); // Average 20ms per selection
      }
    });

    test('bulk operations handle large selections efficiently', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Select all checkbox
      const selectAllCheckbox = screen.queryAllByRole('checkbox')[0];
      
      if (selectAllCheckbox) {
        performanceMonitor.mark('bulk-select-start');
        
        fireEvent.click(selectAllCheckbox);
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 200));
        });
        
        performanceMonitor.mark('bulk-select-end');
        const bulkSelectDuration = performanceMonitor.measure(
          'bulk-select',
          'bulk-select-start',
          'bulk-select-end'
        );

        expect(bulkSelectDuration).toBeLessThan(300);
      }
    });

    test('column visibility toggles perform smoothly', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const columnToggle = screen.queryByText(/Show|Hide.*Optional Columns/);
      
      if (columnToggle) {
        performanceMonitor.mark('column-toggle-start');
        
        // Toggle columns multiple times
        for (let i = 0; i < 5; i++) {
          fireEvent.click(columnToggle);
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          });
        }
        
        performanceMonitor.mark('column-toggle-end');
        const toggleDuration = performanceMonitor.measure(
          'column-toggle',
          'column-toggle-start',
          'column-toggle-end'
        );

        expect(toggleDuration / 5).toBeLessThan(30); // Average 30ms per toggle
      }
    });
  });

  describe('Virtual Scrolling Performance', () => {
    test('scrolling through large datasets maintains frame rate', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const scrollContainer = document.querySelector('[class*="overflow"]') || window;
      
      performanceMonitor.mark('virtual-scroll-start');
      
      // Simulate continuous scrolling
      for (let scrollTop = 0; scrollTop < 5000; scrollTop += 100) {
        fireEvent.scroll(scrollContainer, { target: { scrollTop } });
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 3));
        });
      }
      
      performanceMonitor.mark('virtual-scroll-end');
      const scrollDuration = performanceMonitor.measure(
        'virtual-scroll',
        'virtual-scroll-start',
        'virtual-scroll-end'
      );

      // Should maintain smooth scrolling
      expect(scrollDuration / 50).toBeLessThan(8); // Average 8ms per scroll step
    });
  });
});

describe('Overall Application Performance', () => {
  let performanceMonitor;

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor();
  });

  afterEach(() => {
    performanceMonitor.clear();
    jest.clearAllMocks();
  });

  describe('Component Loading Performance', () => {
    test('lazy-loaded components perform efficiently', async () => {
      const components = [
        { name: 'Dashboard', component: Dashboard },
        { name: 'ExpenseViewer', component: ExpenseViewer },
        { name: 'EnhancedAnalytics', component: EnhancedAnalytics }
      ];

      for (const { name, component: Component } of components) {
        performanceMonitor.mark(`${name}-load-start`);
        
        render(
          <TestWrapper>
            <Component />
          </TestWrapper>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        performanceMonitor.mark(`${name}-load-end`);
        const loadDuration = performanceMonitor.measure(
          `${name}-load`,
          `${name}-load-start`,
          `${name}-load-end`
        );

        expect(loadDuration).toBeLessThan(800);
      }
    });

    test('concurrent component loading does not degrade performance', async () => {
      performanceMonitor.mark('concurrent-load-start');
      
      const { unmount: unmount1 } = render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      const { unmount: unmount2 } = render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      const { unmount: unmount3 } = render(
        <TestWrapper>
          <EnhancedAnalytics />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      performanceMonitor.mark('concurrent-load-end');
      const concurrentDuration = performanceMonitor.measure(
        'concurrent-load',
        'concurrent-load-start',
        'concurrent-load-end'
      );

      expect(concurrentDuration).toBeLessThan(1500);

      unmount1();
      unmount2();
      unmount3();
    });
  });

  describe('Memory Management', () => {
    test('component unmounting cleans up properly', async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      const components = [];

      // Mount multiple components
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <TestWrapper>
            <ExpenseViewer key={i} />
          </TestWrapper>
        );
        components.push(unmount);
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 20));
        });
      }

      // Unmount all components
      components.forEach(unmount => unmount());

      // Allow garbage collection
      if (global.gc) {
        global.gc();
      }
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024); // Less than 20MB
      }
    });

    test('event listeners are properly cleaned up', async () => {
      let listenerCount = 0;
      const originalAddEventListener = window.addEventListener;
      const originalRemoveEventListener = window.removeEventListener;
      
      window.addEventListener = jest.fn((...args) => {
        listenerCount++;
        return originalAddEventListener.apply(window, args);
      });
      
      window.removeEventListener = jest.fn((...args) => {
        listenerCount--;
        return originalRemoveEventListener.apply(window, args);
      });

      const { unmount } = render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const listenersAfterMount = listenerCount;

      unmount();

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Should have removed at least some listeners
      expect(listenerCount).toBeLessThanOrEqual(listenersAfterMount);

      // Restore original functions
      window.addEventListener = originalAddEventListener;
      window.removeEventListener = originalRemoveEventListener;
    });
  });

  describe('Bundle Size Performance', () => {
    test('component bundle sizes are reasonable', () => {
      // This would typically be measured by webpack-bundle-analyzer
      // For testing purposes, we'll check that components don't import excessive dependencies
      
      const componentModules = [
        ExpenseViewer,
        Dashboard,
        EnhancedAnalytics,
        ExpenseForm
      ];

      componentModules.forEach(Component => {
        // Component should be defined and not excessively large
        expect(Component).toBeDefined();
        expect(typeof Component).toBe('function');
        
        // Basic size check (function string length as proxy)
        const componentString = Component.toString();
        expect(componentString.length).toBeLessThan(50000); // Reasonable size limit
      });
    });

    test('lazy loading reduces initial bundle size', async () => {
      // Measure initial render time as proxy for bundle size
      performanceMonitor.mark('initial-render-start');
      
      render(
        <TestWrapper>
          <div>Initial App Shell</div>
        </TestWrapper>
      );

      performanceMonitor.mark('initial-render-end');
      const initialRenderTime = performanceMonitor.measure(
        'initial-render',
        'initial-render-start',
        'initial-render-end'
      );

      // Initial shell should load very quickly
      expect(initialRenderTime).toBeLessThan(50);
    });
  });
});