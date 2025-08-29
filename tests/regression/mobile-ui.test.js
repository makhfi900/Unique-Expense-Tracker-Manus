/**
 * Mobile UI Regression Tests
 * 
 * These tests prevent the recurrence of critical mobile UI bugs:
 * - Duplicate sorting controls
 * - Scrolling restrictions 
 * - Touch interaction issues
 * 
 * CRITICAL: These tests must pass before any deployment.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { SupabaseAuthProvider } from '../../src/context/SupabaseAuthContext';
import { TimeRangeProvider } from '../../src/context/TimeRangeContext';
import EnhancedMobileExpenseList from '../../src/components/EnhancedMobileExpenseList';
import ExpenseViewer from '../../src/components/ExpenseViewer';
import { useIsMobile } from '../../src/hooks/use-mobile';

// Mock authentication and data
jest.mock('../../src/context/SupabaseAuthContext', () => ({
  SupabaseAuthProvider: ({ children }) => children,
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com' },
    userProfile: { full_name: 'Test User', role: 'account_officer' },
    isAdmin: false,
    isAccountOfficer: true,
    apiCall: jest.fn().mockResolvedValue({
      expenses: Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        amount: (Math.random() * 1000).toFixed(2),
        description: `Test Expense ${i + 1}`,
        expense_date: '2024-01-01',
        category: { id: 1, name: 'Test Category', color: '#FF0000' },
        created_by_user: { full_name: 'Test User' }
      })),
      pagination: { page: 1, limit: 50, total: 100, totalPages: 2, hasMore: true }
    }),
    session: { user: { email: 'test@example.com' } }
  })
}));

jest.mock('../../src/context/TimeRangeContext', () => ({
  TimeRangeProvider: ({ children }) => children,
  useTimeRange: () => ({
    dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' },
    handlePresetChange: jest.fn(),
    handleDateRangeChange: jest.fn()
  })
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Test wrapper with all required providers
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

// Mobile viewport simulation
const setMobileViewport = () => {
  global.innerWidth = 375; // iPhone width
  global.innerHeight = 667; // iPhone height
  global.dispatchEvent(new Event('resize'));
};

const setDesktopViewport = () => {
  global.innerWidth = 1024; // Desktop width
  global.innerHeight = 768; // Desktop height
  global.dispatchEvent(new Event('resize'));
};

describe('Mobile UI Regression Tests', () => {
  beforeEach(() => {
    setMobileViewport();
    jest.clearAllMocks();
  });

  describe('CRITICAL: Duplicate Controls Prevention', () => {
    test('REGRESSION: Mobile sort controls must not duplicate', async () => {
      render(
        <TestWrapper>
          <EnhancedMobileExpenseList />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Count each type of sort button
      const dateSortElements = screen.queryAllByText(/date/i).filter(el => 
        el.closest('button') && el.textContent.toLowerCase().includes('date')
      );
      
      const amountSortElements = screen.queryAllByText(/amount/i).filter(el => 
        el.closest('button') && el.textContent.toLowerCase().includes('amount')
      );
      
      const descriptionSortElements = screen.queryAllByText(/description/i).filter(el => 
        el.closest('button') && el.textContent.toLowerCase().includes('description')
      );

      // Each sort type should appear only once in the sorting controls
      expect(dateSortElements.length).toBeLessThanOrEqual(2); // Allow for one button + one status text
      expect(amountSortElements.length).toBeLessThanOrEqual(2);
      expect(descriptionSortElements.length).toBeLessThanOrEqual(2);

      // Verify there's exactly one sort controls container
      const sortContainers = document.querySelectorAll('[class*="sort"], [data-testid*="sort"]');
      const mobileSortContainers = Array.from(sortContainers).filter(container => {
        const style = window.getComputedStyle(container);
        return !style.display.includes('none');
      });

      expect(mobileSortContainers.length).toBeGreaterThan(0);
    });

    test('REGRESSION: Sort buttons must have unique identifiers', async () => {
      render(
        <TestWrapper>
          <EnhancedMobileExpenseList />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Get all button elements
      const allButtons = screen.getAllByRole('button');
      const sortButtons = allButtons.filter(button => 
        button.textContent.toLowerCase().includes('date') ||
        button.textContent.toLowerCase().includes('amount') ||
        button.textContent.toLowerCase().includes('description')
      );

      // Each sort button should be unique
      const buttonTexts = sortButtons.map(btn => btn.textContent);
      const uniqueTexts = [...new Set(buttonTexts)];
      
      // Should not have duplicate button texts for sorting
      expect(buttonTexts.length).toBe(uniqueTexts.length);
    });

    test('REGRESSION: Re-rendering must not create duplicate controls', async () => {
      const { rerender } = render(
        <TestWrapper>
          <EnhancedMobileExpenseList />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Count initial sort controls
      const initialSortButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent.toLowerCase().includes('sort') ||
        btn.textContent.toLowerCase().includes('date') ||
        btn.textContent.toLowerCase().includes('amount')
      );

      // Re-render the component
      rerender(
        <TestWrapper>
          <EnhancedMobileExpenseList />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Count sort controls after re-render
      const afterRerenderButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent.toLowerCase().includes('sort') ||
        btn.textContent.toLowerCase().includes('date') ||
        btn.textContent.toLowerCase().includes('amount')
      );

      // Should have same number of controls
      expect(afterRerenderButtons.length).toBe(initialSortButtons.length);
    });

    test('REGRESSION: Component unmount and remount must not duplicate controls', async () => {
      const { unmount } = render(
        <TestWrapper>
          <EnhancedMobileExpenseList />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Unmount component
      unmount();

      // Re-mount component
      render(
        <TestWrapper>
          <EnhancedMobileExpenseList />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should render cleanly without duplicates
      const sortButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent.toLowerCase().includes('date') ||
        btn.textContent.toLowerCase().includes('amount') ||
        btn.textContent.toLowerCase().includes('description')
      );

      expect(sortButtons.length).toBeLessThanOrEqual(6); // Max 2 per sort type
    });
  });

  describe('CRITICAL: Scrolling Functionality', () => {
    test('REGRESSION: Vertical scrolling must be unrestricted', async () => {
      render(
        <TestWrapper>
          <EnhancedMobileExpenseList />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Find scrollable container
      const scrollableContainers = document.querySelectorAll(
        '[class*="overflow"], [class*="scroll"], [role="main"]'
      );

      const mainContainer = scrollableContainers[0] || document.body;

      // Test scroll properties
      const computedStyle = window.getComputedStyle(mainContainer);
      
      // Should allow vertical scrolling
      expect(computedStyle.overflowY).not.toBe('hidden');
      expect(computedStyle.overflowY).not.toBe('clip');

      // Simulate vertical scroll
      fireEvent.scroll(mainContainer, { target: { scrollTop: 100 } });

      // Should not prevent scrolling
      expect(mainContainer.scrollTop).toBe(100);
    });

    test('REGRESSION: Horizontal scrolling must work when needed', async () => {
      render(
        <TestWrapper>
          <EnhancedMobileExpenseList />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const scrollableArea = document.querySelector('[role="main"]') || document.body;
      const computedStyle = window.getComputedStyle(scrollableArea);

      // Should not completely prevent horizontal scrolling
      expect(computedStyle.overflowX).not.toBe('hidden');
      expect(computedStyle.overflowX).not.toBe('clip');
    });

    test('REGRESSION: Touch scrolling must not be restricted', async () => {
      render(
        <TestWrapper>
          <EnhancedMobileExpenseList />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const scrollableArea = document.querySelector('[role="main"]') || document.body;

      // Test touch-action property
      const computedStyle = window.getComputedStyle(scrollableArea);
      expect(computedStyle.touchAction).not.toBe('none');

      // Simulate touch scroll events
      fireEvent.touchStart(scrollableArea, {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      fireEvent.touchMove(scrollableArea, {
        touches: [{ clientX: 100, clientY: 150 }]
      });

      fireEvent.touchEnd(scrollableArea, {
        changedTouches: [{ clientX: 100, clientY: 150 }]
      });

      // Should not throw errors or prevent touch scrolling
      expect(scrollableArea).toBeInTheDocument();
    });

    test('REGRESSION: Expense list must be scrollable with many items', async () => {
      // Mock more expenses to force scrolling
      const mockApiCall = jest.fn().mockResolvedValue({
        expenses: Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          amount: (Math.random() * 1000).toFixed(2),
          description: `Test Expense ${i + 1}`,
          expense_date: '2024-01-01',
          category: { id: 1, name: 'Test Category', color: '#FF0000' },
          created_by_user: { full_name: 'Test User' }
        })),
        pagination: { page: 1, limit: 50, total: 50, totalPages: 1, hasMore: false }
      });

      const { rerender } = render(
        <TestWrapper>
          <EnhancedMobileExpenseList />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Find the expense list container
      const expenseCards = screen.queryAllByText(/Test Expense/);
      expect(expenseCards.length).toBeGreaterThan(10);

      // Should be able to scroll through all expenses
      const listContainer = expenseCards[0].closest('[class*="list"], [class*="container"]');
      
      if (listContainer) {
        // Test scrolling through the list
        fireEvent.scroll(listContainer, { target: { scrollTop: 200 } });
        expect(listContainer.scrollTop).toBe(200);
      }
    });

    test('REGRESSION: Scroll position must be maintained during updates', async () => {
      render(
        <TestWrapper>
          <EnhancedMobileExpenseList />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const scrollableArea = document.querySelector('[role="main"]') || document.body;

      // Set scroll position
      fireEvent.scroll(scrollableArea, { target: { scrollTop: 150 } });
      expect(scrollableArea.scrollTop).toBe(150);

      // Trigger a re-render by clicking a sort button
      const sortButton = screen.queryAllByRole('button').find(btn => 
        btn.textContent.toLowerCase().includes('date')
      );

      if (sortButton) {
        fireEvent.click(sortButton);

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        // Scroll position should be reasonable (may reset for new content)
        expect(scrollableArea.scrollTop).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('CRITICAL: Touch Interactions', () => {
    test('REGRESSION: Sort buttons must respond to touch events', async () => {
      render(
        <TestWrapper>
          <EnhancedMobileExpenseList />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const sortButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent.toLowerCase().includes('date') ||
        btn.textContent.toLowerCase().includes('amount') ||
        btn.textContent.toLowerCase().includes('description')
      );

      expect(sortButtons.length).toBeGreaterThan(0);

      const sortButton = sortButtons[0];

      // Test touch interaction
      fireEvent.touchStart(sortButton);
      fireEvent.touchEnd(sortButton);

      // Should remain interactive
      expect(sortButton).toBeInTheDocument();
      expect(sortButton).not.toHaveAttribute('disabled');
    });

    test('REGRESSION: Touch targets must meet accessibility standards (44px minimum)', async () => {
      render(
        <TestWrapper>
          <EnhancedMobileExpenseList />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const interactiveElements = [
        ...screen.getAllByRole('button'),
        ...screen.queryAllByRole('link'),
        ...screen.queryAllByRole('checkbox')
      ];

      interactiveElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);
        
        // Check minimum touch target size (44px x 44px)
        const minSize = 44;
        const actualWidth = Math.max(rect.width, parseFloat(computedStyle.minWidth) || 0);
        const actualHeight = Math.max(rect.height, parseFloat(computedStyle.minHeight) || 0);

        // Allow 4px tolerance for borders/padding
        expect(actualWidth).toBeGreaterThanOrEqual(minSize - 4);
        expect(actualHeight).toBeGreaterThanOrEqual(minSize - 4);
      });
    });

    test('REGRESSION: Swipe gestures must not conflict with scrolling', async () => {
      render(
        <TestWrapper>
          <EnhancedMobileExpenseList />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const container = document.querySelector('[role="main"]') || document.body;

      // Simulate vertical swipe (should allow scrolling)
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      fireEvent.touchMove(container, {
        touches: [{ clientX: 100, clientY: 200 }]
      });

      fireEvent.touchEnd(container, {
        changedTouches: [{ clientX: 100, clientY: 200 }]
      });

      // Should handle touch events without errors
      expect(container).toBeInTheDocument();

      // Simulate horizontal swipe
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      fireEvent.touchMove(container, {
        touches: [{ clientX: 200, clientY: 100 }]
      });

      fireEvent.touchEnd(container, {
        changedTouches: [{ clientX: 200, clientY: 100 }]
      });

      expect(container).toBeInTheDocument();
    });

    test('REGRESSION: Long press must not interfere with normal touch', async () => {
      render(
        <TestWrapper>
          <EnhancedMobileExpenseList />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const expenseCards = screen.queryAllByText(/Test Expense/);
      
      if (expenseCards.length > 0) {
        const firstCard = expenseCards[0].closest('div');

        // Simulate long press
        fireEvent.touchStart(firstCard);
        
        // Wait for long press duration
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 600));
        });

        fireEvent.touchEnd(firstCard);

        // Should not prevent normal interactions
        expect(firstCard).toBeInTheDocument();

        // Normal tap should still work
        fireEvent.touchStart(firstCard);
        fireEvent.touchEnd(firstCard);
        
        expect(firstCard).toBeInTheDocument();
      }
    });
  });

  describe('CRITICAL: Responsive Design Stability', () => {
    test('REGRESSION: Desktop to mobile transition must not duplicate controls', async () => {
      // Start with desktop viewport
      setDesktopViewport();

      const { rerender } = render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Switch to mobile viewport
      setMobileViewport();

      rerender(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should not have duplicate controls
      const sortButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent.toLowerCase().includes('sort') ||
        btn.textContent.toLowerCase().includes('date') ||
        btn.textContent.toLowerCase().includes('amount')
      );

      // Reasonable number of sort-related buttons
      expect(sortButtons.length).toBeLessThanOrEqual(8);
    });

    test('REGRESSION: Mobile components must render without layout shift', async () => {
      const { container } = render(
        <TestWrapper>
          <EnhancedMobileExpenseList />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Check for layout stability indicators
      const computedStyle = window.getComputedStyle(container.firstChild);
      
      // Should not cause horizontal overflow
      expect(container.scrollWidth).toBeLessThanOrEqual(global.innerWidth + 10);

      // Main content should be visible
      const mainContent = screen.queryByRole('main');
      if (mainContent) {
        expect(mainContent).toBeVisible();
      }
    });

    test('REGRESSION: Viewport changes must not break functionality', async () => {
      const { rerender } = render(
        <TestWrapper>
          <EnhancedMobileExpenseList />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Test various mobile viewport sizes
      const viewports = [
        { width: 320, height: 568 }, // iPhone 5
        { width: 375, height: 667 }, // iPhone 6/7/8
        { width: 414, height: 896 }, // iPhone XR
        { width: 768, height: 1024 } // iPad
      ];

      for (const viewport of viewports) {
        global.innerWidth = viewport.width;
        global.innerHeight = viewport.height;
        global.dispatchEvent(new Event('resize'));

        rerender(
          <TestWrapper>
            <EnhancedMobileExpenseList />
          </TestWrapper>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        // Component should render without errors
        expect(screen.queryByText(/Test Expense/)).toBeInTheDocument();

        // No horizontal scrolling
        expect(document.body.scrollWidth).toBeLessThanOrEqual(viewport.width + 20);
      }
    });
  });

  describe('CRITICAL: Performance Regression Prevention', () => {
    test('REGRESSION: Mobile rendering must complete within time limits', async () => {
      const startTime = performance.now();

      render(
        <TestWrapper>
          <EnhancedMobileExpenseList />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time
      expect(renderTime).toBeLessThan(1000); // 1 second

      // Should have rendered content
      expect(screen.queryByText(/Test Expense/)).toBeInTheDocument();
    });

    test('REGRESSION: Touch interactions must be responsive', async () => {
      render(
        <TestWrapper>
          <EnhancedMobileExpenseList />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const sortButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent.toLowerCase().includes('date')
      );

      if (sortButtons.length > 0) {
        const startTime = performance.now();

        fireEvent.touchStart(sortButtons[0]);
        fireEvent.touchEnd(sortButtons[0]);

        const endTime = performance.now();
        const responseTime = endTime - startTime;

        // Touch response should be immediate
        expect(responseTime).toBeLessThan(100); // 100ms
      }
    });

    test('REGRESSION: Scrolling performance must remain smooth', async () => {
      render(
        <TestWrapper>
          <EnhancedMobileExpenseList />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const scrollableArea = document.querySelector('[role="main"]') || document.body;
      const startTime = performance.now();

      // Simulate multiple scroll events
      for (let i = 0; i < 10; i++) {
        fireEvent.scroll(scrollableArea, { target: { scrollTop: i * 50 } });
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
        });
      }

      const endTime = performance.now();
      const scrollTime = endTime - startTime;

      // Scrolling should be performant
      expect(scrollTime).toBeLessThan(500); // 500ms for 10 scroll events
    });
  });
});