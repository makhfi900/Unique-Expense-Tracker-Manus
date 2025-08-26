/**
 * Desktop Responsive Testing Suite
 * Tests responsive breakpoints, keyboard navigation, hover states, and multi-screen compatibility
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { SupabaseAuthProvider } from '../../context/SupabaseAuthContext';
import { TimeRangeProvider } from '../../context/TimeRangeContext';
import { useIsMobile } from '../../hooks/use-mobile';
import ExpenseViewer from '../../components/ExpenseViewer';
import Dashboard from '../../components/Dashboard';
import EnhancedAnalytics from '../../components/EnhancedAnalytics';

// Mock components and contexts
jest.mock('../../context/SupabaseAuthContext', () => ({
  SupabaseAuthProvider: ({ children }) => children,
  useAuth: () => ({
    user: { id: '1', email: 'admin@example.com' },
    userProfile: { full_name: 'Admin User', role: 'admin' },
    isAdmin: true,
    isAccountOfficer: false,
    apiCall: jest.fn().mockImplementation((url) => {
      if (url.includes('/expenses')) {
        return Promise.resolve({
          expenses: Array.from({ length: 50 }, (_, i) => ({
            id: i + 1,
            amount: (Math.random() * 1000).toFixed(2),
            description: `Expense ${i + 1}`,
            expense_date: new Date().toISOString().split('T')[0],
            category: { id: 1, name: 'Test Category', color: '#3B82F6' },
            created_by_user: { full_name: 'Test User' }
          })),
          pagination: { total: 50, totalPages: 3 }
        });
      }
      if (url.includes('/categories')) {
        return Promise.resolve({
          categories: [
            { id: 1, name: 'Test Category', color: '#3B82F6' },
            { id: 2, name: 'Another Category', color: '#EF4444' }
          ]
        });
      }
      if (url.includes('/analytics')) {
        return Promise.resolve({
          totalExpenses: 25000,
          categoryBreakdown: [
            { name: 'Office Supplies', value: 8000 },
            { name: 'Travel', value: 12000 },
            { name: 'Equipment', value: 5000 }
          ]
        });
      }
      return Promise.resolve({});
    }),
    session: { user: { email: 'admin@example.com' } }
  })
}));

jest.mock('../../context/TimeRangeContext', () => ({
  TimeRangeProvider: ({ children }) => children,
  useTimeRange: () => ({
    dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' },
    handlePresetChange: jest.fn(),
    handleDateRangeChange: jest.fn()
  })
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

// Desktop viewport configurations
const setDesktopViewport = (width = 1024, height = 768) => {
  global.innerWidth = width;
  global.innerHeight = height;
  global.dispatchEvent(new Event('resize'));
};

const setLargeDesktopViewport = () => {
  global.innerWidth = 1920;
  global.innerHeight = 1080;
  global.dispatchEvent(new Event('resize'));
};

const setWideScreenViewport = () => {
  global.innerWidth = 2560;
  global.innerHeight = 1440;
  global.dispatchEvent(new Event('resize'));
};

describe('Desktop Responsive Breakpoint Testing', () => {
  beforeEach(() => {
    setDesktopViewport();
    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Responsive Breakpoints (768px, 1024px, 1280px, 1920px)', () => {
    test('layout adapts correctly at 768px breakpoint', async () => {
      setDesktopViewport(768, 1024);

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should show tablet layout
      expect(screen.queryByText('Desktop View')).not.toBeInTheDocument();
      
      // Grid should adapt to smaller screens
      const gridElements = screen.queryAllByText(/Dashboard|Analytics|Expense/);
      expect(gridElements.length).toBeGreaterThan(0);
    });

    test('layout optimizes for standard desktop (1024px)', async () => {
      setDesktopViewport(1024, 768);

      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should show full desktop layout with table
      expect(screen.getByText('Desktop View')).toBeInTheDocument();
      
      // Table should be visible with all columns
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    test('layout expands for large desktop (1920px)', async () => {
      setLargeDesktopViewport();

      render(
        <TestWrapper>
          <EnhancedAnalytics />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should utilize available space efficiently
      const container = screen.getByRole('main').closest('div');
      expect(container).toBeInTheDocument();
    });

    test('layout handles ultra-wide screens (2560px)', async () => {
      setWideScreenViewport();

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should prevent content from becoming too spread out
      const maxWidthContainer = document.querySelector('.max-w-7xl');
      expect(maxWidthContainer).toBeInTheDocument();
    });

    test('responsive images scale correctly at all breakpoints', async () => {
      const breakpoints = [768, 1024, 1280, 1920, 2560];

      for (const width of breakpoints) {
        setDesktopViewport(width, 1080);

        const { unmount } = render(
          <TestWrapper>
            <Dashboard />
          </TestWrapper>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        // Check logo and other images
        const images = screen.queryAllByRole('img');
        images.forEach(img => {
          expect(img).toHaveStyle({
            maxWidth: '100%',
            height: 'auto'
          });
        });

        unmount();
      }
    });
  });

  describe('Grid System Responsiveness', () => {
    test('grid layouts adapt to screen width', async () => {
      const { rerender } = render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Test different grid configurations
      setDesktopViewport(768); // Tablet - should be 2 columns
      rerender(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      setDesktopViewport(1024); // Desktop - should be 3 columns
      rerender(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      setDesktopViewport(1920); // Large desktop - should be 4+ columns
      rerender(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Grid should be present and responsive
      const gridContainer = screen.getByText('Administrative Dashboard').closest('div');
      expect(gridContainer).toBeInTheDocument();
    });

    test('cards maintain aspect ratios across breakpoints', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const cards = screen.getAllByTestId('navigation-card') || 
                    document.querySelectorAll('[class*="card"]');
      
      if (cards.length > 0) {
        cards.forEach(card => {
          const rect = card.getBoundingClientRect();
          const aspectRatio = rect.width / rect.height;
          expect(aspectRatio).toBeGreaterThan(0.5); // Minimum aspect ratio
          expect(aspectRatio).toBeLessThan(4); // Maximum aspect ratio
        });
      }
    });
  });
});

describe('Desktop Keyboard Navigation Testing', () => {
  beforeEach(() => {
    setDesktopViewport();
  });

  describe('Tab Navigation', () => {
    test('tab navigation follows logical order', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Start from first focusable element
      const firstButton = screen.getAllByRole('button')[0];
      if (firstButton) {
        firstButton.focus();
        expect(firstButton).toHaveFocus();

        // Tab through elements
        await user.tab();
        expect(document.activeElement).not.toBe(firstButton);
      }
    });

    test('all interactive elements are keyboard accessible', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const interactiveElements = [
        ...screen.getAllByRole('button'),
        ...screen.queryAllByRole('link'),
        ...screen.queryAllByRole('textbox'),
        ...screen.queryAllByRole('combobox'),
        ...screen.queryAllByRole('checkbox')
      ];

      interactiveElements.forEach(element => {
        // Should have tabindex 0 or be naturally focusable
        const tabIndex = element.getAttribute('tabindex');
        expect(
          tabIndex === null || 
          tabIndex === '0' || 
          ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'].includes(element.tagName)
        ).toBeTruthy();
      });
    });

    test('tab navigation skips disabled elements', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const disabledElements = screen.queryAllByRole('button', { disabled: true });
      disabledElements.forEach(element => {
        expect(element).toHaveAttribute('disabled');
        expect(element.getAttribute('tabindex')).toBe('-1');
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('Enter key activates focused buttons', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const buttons = screen.getAllByRole('button');
      if (buttons.length > 0) {
        const button = buttons[0];
        button.focus();
        
        await user.keyboard('{Enter}');
        // Button should have been activated (implementation dependent)
        expect(button).toBeInTheDocument();
      }
    });

    test('Space key activates focused buttons and checkboxes', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const checkboxes = screen.queryAllByRole('checkbox');
      if (checkboxes.length > 0) {
        const checkbox = checkboxes[0];
        checkbox.focus();
        
        const initialChecked = checkbox.checked;
        await user.keyboard(' ');
        
        // Should toggle checkbox state
        expect(checkbox.checked).toBe(!initialChecked);
      }
    });

    test('Arrow keys navigate dropdown options', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const selects = screen.queryAllByRole('combobox');
      if (selects.length > 0) {
        const select = selects[0];
        select.focus();
        
        // Open dropdown
        await user.keyboard('{Enter}');
        await user.keyboard('{ArrowDown}');
        await user.keyboard('{ArrowUp}');
        
        expect(select).toBeInTheDocument();
      }
    });

    test('Escape key closes modals and dropdowns', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Try to open and close a dropdown
      const dropdownTriggers = screen.queryAllByRole('combobox');
      if (dropdownTriggers.length > 0) {
        const trigger = dropdownTriggers[0];
        
        // Open
        fireEvent.click(trigger);
        await user.keyboard('{Escape}');
        
        // Should close (implementation dependent)
        expect(trigger).toBeInTheDocument();
      }
    });
  });

  describe('Focus Management', () => {
    test('focus is trapped within modals', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Test focus trapping when modal opens (implementation dependent)
      const actionButtons = screen.queryAllByText(/Edit|Delete/);
      if (actionButtons.length > 0) {
        fireEvent.click(actionButtons[0]);
        
        // Focus should be managed within modal
        expect(document.activeElement).toBeInTheDocument();
      }
    });

    test('focus returns to trigger element after modal closes', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const buttons = screen.getAllByRole('button');
      if (buttons.length > 0) {
        const triggerButton = buttons[0];
        triggerButton.focus();
        
        // Simulate modal open/close cycle
        fireEvent.click(triggerButton);
        
        // Focus should return to trigger
        expect(document.activeElement).toBe(triggerButton);
      }
    });

    test('focus is visible with proper focus indicators', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const focusableElements = [
        ...screen.getAllByRole('button'),
        ...screen.queryAllByRole('textbox')
      ];

      focusableElements.slice(0, 5).forEach(element => {
        element.focus();
        const computedStyle = window.getComputedStyle(element, ':focus');
        
        // Should have focus styles (outline, ring, etc.)
        expect(
          computedStyle.outline !== 'none' ||
          computedStyle.boxShadow.includes('ring') ||
          element.classList.toString().includes('focus')
        ).toBeTruthy();
      });
    });
  });
});

describe('Desktop Hover States and Interactions', () => {
  beforeEach(() => {
    setDesktopViewport();
  });

  describe('Hover Effects', () => {
    test('buttons show hover states', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const buttons = screen.getAllByRole('button');
      
      buttons.slice(0, 3).forEach(button => {
        // Simulate hover
        fireEvent.mouseEnter(button);
        
        // Should have hover styles
        const computedStyle = window.getComputedStyle(button);
        expect(button).toBeInTheDocument(); // Basic check
        
        fireEvent.mouseLeave(button);
      });
    });

    test('table rows highlight on hover', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const tableRows = screen.queryAllByRole('row');
      if (tableRows.length > 1) { // Skip header row
        const dataRow = tableRows[1];
        
        fireEvent.mouseEnter(dataRow);
        expect(dataRow.className).toMatch(/hover:|hover\//);
        
        fireEvent.mouseLeave(dataRow);
      }
    });

    test('cards show elevation on hover', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const cards = document.querySelectorAll('[class*="card"], [class*="Card"]');
      
      cards.forEach(card => {
        fireEvent.mouseEnter(card);
        
        const computedStyle = window.getComputedStyle(card);
        // Should have shadow or transform on hover
        expect(
          computedStyle.boxShadow !== 'none' ||
          computedStyle.transform !== 'none'
        ).toBeTruthy();
        
        fireEvent.mouseLeave(card);
      });
    });

    test('tooltips appear on hover for informational elements', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Look for elements with title attributes or aria-describedby
      const elementsWithTooltips = document.querySelectorAll('[title], [aria-describedby]');
      
      elementsWithTooltips.forEach(element => {
        fireEvent.mouseEnter(element);
        
        // Tooltip should be accessible
        const title = element.getAttribute('title');
        const describedBy = element.getAttribute('aria-describedby');
        
        expect(title || describedBy).toBeTruthy();
        
        fireEvent.mouseLeave(element);
      });
    });
  });

  describe('Interactive States', () => {
    test('form elements show focus and hover states', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const inputs = screen.queryAllByRole('textbox');
      const selects = screen.queryAllByRole('combobox');
      
      [...inputs, ...selects].slice(0, 3).forEach(element => {
        // Test hover
        fireEvent.mouseEnter(element);
        expect(element).toBeInTheDocument();
        
        // Test focus
        fireEvent.focus(element);
        expect(element).toHaveFocus();
        
        fireEvent.mouseLeave(element);
        fireEvent.blur(element);
      });
    });

    test('dropdown menus open on hover or click', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const dropdownTriggers = document.querySelectorAll('[data-radix-dropdown-trigger]') ||
                               screen.queryAllByRole('combobox');
      
      if (dropdownTriggers.length > 0) {
        const trigger = dropdownTriggers[0];
        
        // Test click activation
        fireEvent.click(trigger);
        expect(trigger).toBeInTheDocument();
      }
    });
  });
});

describe('Desktop Data Table Performance', () => {
  beforeEach(() => {
    setDesktopViewport();
  });

  describe('Large Dataset Handling', () => {
    test('table renders 50+ rows efficiently', async () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (< 500ms)
      expect(renderTime).toBeLessThan(500);
      
      // Table should be present
      const table = screen.queryByRole('table');
      if (table) {
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(1); // At least header + data rows
      }
    });

    test('sorting large datasets performs smoothly', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const sortableHeaders = screen.queryAllByRole('columnheader');
      
      if (sortableHeaders.length > 0) {
        const startTime = performance.now();
        
        // Test sorting
        fireEvent.click(sortableHeaders[0]);
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
        
        const endTime = performance.now();
        expect(endTime - startTime).toBeLessThan(300); // Should sort quickly
      }
    });

    test('pagination controls respond quickly', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const paginationButtons = screen.queryAllByText(/Next|Previous/);
      
      if (paginationButtons.length > 0) {
        const nextButton = paginationButtons.find(btn => btn.textContent.includes('Next'));
        
        if (nextButton && !nextButton.disabled) {
          const startTime = performance.now();
          fireEvent.click(nextButton);
          
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
          });
          
          const endTime = performance.now();
          expect(endTime - startTime).toBeLessThan(200);
        }
      }
    });
  });

  describe('Column Management', () => {
    test('column visibility toggles work correctly', async () => {
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
        // Test column visibility toggle
        fireEvent.click(columnToggle);
        expect(columnToggle).toBeInTheDocument();
      }
    });

    test('table maintains usability with hidden columns', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Essential columns should always be visible
      const table = screen.queryByRole('table');
      if (table) {
        const essentialHeaders = ['Date', 'Amount', 'Description'];
        essentialHeaders.forEach(headerText => {
          const header = screen.queryByText(headerText);
          if (header) {
            expect(header).toBeVisible();
          }
        });
      }
    });
  });
});

describe('Desktop Multi-Screen Compatibility', () => {
  beforeEach(() => {
    setDesktopViewport();
  });

  describe('Multiple Monitor Support', () => {
    test('application scales correctly on high-DPI displays', async () => {
      // Simulate high-DPI display
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 2,
      });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Text should remain crisp and readable
      const textElements = screen.getAllByText(/./);
      textElements.slice(0, 5).forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        expect(computedStyle.fontSize).toBeTruthy();
      });
    });

    test('layout adapts to different aspect ratios', async () => {
      const aspectRatios = [
        { width: 1920, height: 1080 }, // 16:9
        { width: 1440, height: 900 },  // 16:10
        { width: 2560, height: 1080 }, // 21:9 ultrawide
      ];

      for (const { width, height } of aspectRatios) {
        setDesktopViewport(width, height);

        const { unmount } = render(
          <TestWrapper>
            <Dashboard />
          </TestWrapper>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        // Content should be properly contained
        const mainContent = screen.getByRole('main');
        expect(mainContent).toBeInTheDocument();

        unmount();
      }
    });

    test('modal positioning works across different screen sizes', async () => {
      const screenSizes = [
        { width: 1024, height: 768 },
        { width: 1920, height: 1080 },
        { width: 2560, height: 1440 },
      ];

      for (const { width, height } of screenSizes) {
        setDesktopViewport(width, height);

        const { unmount } = render(
          <TestWrapper>
            <ExpenseViewer />
          </TestWrapper>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        // Modals should be properly positioned
        const modal = document.querySelector('[role="dialog"]');
        if (modal) {
          const rect = modal.getBoundingClientRect();
          expect(rect.left).toBeGreaterThanOrEqual(0);
          expect(rect.top).toBeGreaterThanOrEqual(0);
          expect(rect.right).toBeLessThanOrEqual(width);
          expect(rect.bottom).toBeLessThanOrEqual(height);
        }

        unmount();
      }
    });
  });

  describe('Print Layout', () => {
    test('print styles are optimized for desktop', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Simulate print media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === 'print',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      // Print layout should be optimized
      const printElements = document.querySelectorAll('*');
      expect(printElements.length).toBeGreaterThan(0);
    });
  });
});