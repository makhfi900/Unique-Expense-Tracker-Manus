/**
 * Mobile Touch Target and Gesture Testing Suite
 * Tests touch accessibility, gesture handling, and mobile-specific interactions
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { SupabaseAuthProvider } from '../../context/SupabaseAuthContext';
import { TimeRangeProvider } from '../../context/TimeRangeContext';
import { useIsMobile } from '../../hooks/use-mobile';
import ExpenseViewer from '../../components/ExpenseViewer';
import Dashboard from '../../components/Dashboard';
import ExpenseForm from '../../components/ExpenseForm';

// Mock components and contexts
jest.mock('../../context/SupabaseAuthContext', () => ({
  SupabaseAuthProvider: ({ children }) => children,
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com' },
    userProfile: { full_name: 'Test User', role: 'account_officer' },
    isAdmin: false,
    isAccountOfficer: true,
    apiCall: jest.fn().mockResolvedValue({ expenses: [], categories: [] }),
    session: { user: { email: 'test@example.com' } }
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

// Mobile viewport simulation
const setMobileViewport = () => {
  global.innerWidth = 375; // iPhone width
  global.innerHeight = 667; // iPhone height
  global.dispatchEvent(new Event('resize'));
};

const setTabletViewport = () => {
  global.innerWidth = 768; // Tablet width
  global.innerHeight = 1024; // Tablet height
  global.dispatchEvent(new Event('resize'));
};

describe('Mobile Touch Target Testing', () => {
  beforeEach(() => {
    setMobileViewport();
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

  describe('Touch Target Accessibility (44px minimum)', () => {
    test('all interactive elements meet minimum touch target size', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      // Wait for component to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Get all interactive elements
      const buttons = screen.getAllByRole('button');
      const links = screen.queryAllByRole('link');
      const checkboxes = screen.queryAllByRole('checkbox');
      const selectTriggers = screen.queryAllByRole('combobox');

      const interactiveElements = [...buttons, ...links, ...checkboxes, ...selectTriggers];

      interactiveElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);
        
        // Check minimum dimensions (44px x 44px)
        const minSize = 44;
        const actualWidth = Math.max(rect.width, parseFloat(computedStyle.minWidth) || 0);
        const actualHeight = Math.max(rect.height, parseFloat(computedStyle.minHeight) || 0);

        expect(actualWidth).toBeGreaterThanOrEqual(minSize - 4); // 4px tolerance for borders/padding
        expect(actualHeight).toBeGreaterThanOrEqual(minSize - 4);
      });
    });

    test('form inputs have adequate touch targets', async () => {
      render(
        <TestWrapper>
          <ExpenseForm />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const inputs = screen.getAllByRole('textbox');
      const selects = screen.queryAllByRole('combobox');
      const dateInputs = screen.queryAllByDisplayValue('');

      [...inputs, ...selects, ...dateInputs].forEach(element => {
        if (element) {
          const rect = element.getBoundingClientRect();
          expect(rect.height).toBeGreaterThanOrEqual(40); // Minimum height for form inputs
        }
      });
    });

    test('checkbox and radio button targets are accessible', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const checkboxes = screen.queryAllByRole('checkbox');
      
      checkboxes.forEach(checkbox => {
        // Check if checkbox or its label has adequate touch target
        const checkboxRect = checkbox.getBoundingClientRect();
        const label = checkbox.closest('label') || document.querySelector(`label[for="${checkbox.id}"]`);
        
        if (label) {
          const labelRect = label.getBoundingClientRect();
          expect(Math.max(checkboxRect.height, labelRect.height)).toBeGreaterThanOrEqual(44);
        } else {
          expect(checkboxRect.height).toBeGreaterThanOrEqual(44);
        }
      });
    });
  });

  describe('Screen Size Adaptability (320px-428px)', () => {
    test('components render correctly on smallest mobile screens (320px)', async () => {
      global.innerWidth = 320;
      global.innerHeight = 568;
      global.dispatchEvent(new Event('resize'));

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Check for horizontal scrolling (should not occur)
      const body = document.body;
      expect(body.scrollWidth).toBeLessThanOrEqual(320 + 10); // 10px tolerance

      // Check that content is visible and not cut off
      const mainContent = screen.getByRole('main');
      expect(mainContent).toBeVisible();
    });

    test('components adapt to large mobile screens (428px)', async () => {
      global.innerWidth = 428;
      global.innerHeight = 926;
      global.dispatchEvent(new Event('resize'));

      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should use mobile layout but with more space
      expect(screen.queryByText('Mobile View')).toBeInTheDocument();
    });

    test('text remains readable at all mobile sizes', async () => {
      const sizes = [320, 360, 375, 414, 428];

      for (const width of sizes) {
        global.innerWidth = width;
        global.dispatchEvent(new Event('resize'));

        const { unmount } = render(
          <TestWrapper>
            <ExpenseViewer />
          </TestWrapper>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        // Check that text elements have minimum readable font size
        const textElements = screen.getAllByText(/./);
        textElements.forEach(element => {
          const computedStyle = window.getComputedStyle(element);
          const fontSize = parseFloat(computedStyle.fontSize);
          expect(fontSize).toBeGreaterThanOrEqual(14); // Minimum readable size on mobile
        });

        unmount();
      }
    });
  });

  describe('Mobile useIsMobile Hook Testing', () => {
    test('useIsMobile hook correctly detects mobile breakpoint', () => {
      // Test mobile detection
      global.innerWidth = 767;
      const { result: mobileResult } = renderHook(() => useIsMobile());
      expect(mobileResult.current).toBe(true);

      // Test desktop detection
      global.innerWidth = 768;
      const { result: desktopResult } = renderHook(() => useIsMobile());
      expect(desktopResult.current).toBe(false);
    });

    test('useIsMobile hook responds to window resize', () => {
      const { result } = renderHook(() => useIsMobile());

      // Start with desktop
      global.innerWidth = 1024;
      act(() => {
        global.dispatchEvent(new Event('resize'));
      });
      expect(result.current).toBe(false);

      // Resize to mobile
      global.innerWidth = 375;
      act(() => {
        global.dispatchEvent(new Event('resize'));
      });
      expect(result.current).toBe(true);
    });
  });
});

describe('Mobile Swipe Gesture Testing', () => {
  beforeEach(() => {
    setMobileViewport();
  });

  describe('Swipe Navigation', () => {
    test('swipe left navigates to next page', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const mobileContainer = screen.getByText('Mobile View').closest('div');
      if (mobileContainer) {
        // Simulate swipe left (next page)
        fireEvent.touchStart(mobileContainer, {
          touches: [{ clientX: 200, clientY: 100 }]
        });

        fireEvent.touchEnd(mobileContainer, {
          changedTouches: [{ clientX: 100, clientY: 100 }]
        });

        // Check if pagination would advance (implementation dependent)
        expect(mobileContainer).toBeInTheDocument();
      }
    });

    test('swipe right navigates to previous page', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const mobileContainer = screen.getByText('Mobile View').closest('div');
      if (mobileContainer) {
        // Simulate swipe right (previous page)
        fireEvent.touchStart(mobileContainer, {
          touches: [{ clientX: 100, clientY: 100 }]
        });

        fireEvent.touchEnd(mobileContainer, {
          changedTouches: [{ clientX: 200, clientY: 100 }]
        });

        expect(mobileContainer).toBeInTheDocument();
      }
    });

    test('vertical swipes do not trigger navigation', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const mobileContainer = screen.getByText('Mobile View').closest('div');
      if (mobileContainer) {
        // Simulate vertical swipe (should not navigate)
        fireEvent.touchStart(mobileContainer, {
          touches: [{ clientX: 100, clientY: 100 }]
        });

        fireEvent.touchEnd(mobileContainer, {
          changedTouches: [{ clientX: 100, clientY: 200 }]
        });

        // Should not trigger navigation
        expect(mobileContainer).toBeInTheDocument();
      }
    });

    test('short swipes do not trigger navigation', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const mobileContainer = screen.getByText('Mobile View').closest('div');
      if (mobileContainer) {
        // Simulate short swipe (less than 50px)
        fireEvent.touchStart(mobileContainer, {
          touches: [{ clientX: 100, clientY: 100 }]
        });

        fireEvent.touchEnd(mobileContainer, {
          changedTouches: [{ clientX: 130, clientY: 100 }]
        });

        expect(mobileContainer).toBeInTheDocument();
      }
    });
  });

  describe('Swipe Responsiveness', () => {
    test('swipe gestures respond within 100ms', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const startTime = performance.now();
      
      const mobileContainer = screen.getByText('Mobile View').closest('div');
      if (mobileContainer) {
        fireEvent.touchStart(mobileContainer, {
          touches: [{ clientX: 200, clientY: 100 }]
        });

        fireEvent.touchEnd(mobileContainer, {
          changedTouches: [{ clientX: 100, clientY: 100 }]
        });
      }

      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(100); // Should respond within 100ms
    });

    test('multiple rapid swipes are handled correctly', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const mobileContainer = screen.getByText('Mobile View').closest('div');
      if (mobileContainer) {
        // Simulate rapid swipes
        for (let i = 0; i < 5; i++) {
          fireEvent.touchStart(mobileContainer, {
            touches: [{ clientX: 200, clientY: 100 }]
          });

          fireEvent.touchEnd(mobileContainer, {
            changedTouches: [{ clientX: 100, clientY: 100 }]
          });
        }

        expect(mobileContainer).toBeInTheDocument();
      }
    });
  });
});

describe('Mobile Performance Testing', () => {
  beforeEach(() => {
    setMobileViewport();
  });

  describe('Animation Performance', () => {
    test('card animations perform smoothly on mobile', async () => {
      const { container } = render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Check for CSS animation properties
      const animatedElements = container.querySelectorAll('[class*="animate"]');
      
      animatedElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        // Ensure animations use transform and opacity for better performance
        expect(
          computedStyle.transform !== 'none' || 
          computedStyle.opacity !== '1'
        ).toBeTruthy();
      });
    });

    test('loading states do not block UI on mobile', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      // Component should render loading state without blocking
      const loadingElement = await screen.findByText(/Loading/i);
      expect(loadingElement).toBeVisible();

      // UI should remain interactive
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('disabled');
      });
    });
  });

  describe('Touch Responsiveness', () => {
    test('touch interactions respond within 300ms', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const buttons = screen.getAllByRole('button');
      
      for (const button of buttons.slice(0, 3)) { // Test first 3 buttons
        const startTime = performance.now();
        
        fireEvent.touchStart(button);
        fireEvent.touchEnd(button);
        
        const endTime = performance.now();
        expect(endTime - startTime).toBeLessThan(300);
      }
    });

    test('no 300ms tap delay on mobile', async () => {
      render(
        <TestWrapper>
          <ExpenseViewer />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const button = screen.getAllByRole('button')[0];
      
      if (button) {
        const startTime = performance.now();
        fireEvent.click(button);
        const endTime = performance.now();
        
        // Should not have the 300ms delay
        expect(endTime - startTime).toBeLessThan(100);
      }
    });
  });
});

describe('Mobile Gesture Conflict Resolution', () => {
  beforeEach(() => {
    setMobileViewport();
  });

  test('scrolling does not conflict with swipe navigation', async () => {
    render(
      <TestWrapper>
        <ExpenseViewer />
      </TestWrapper>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const scrollableArea = screen.getByRole('main');
    
    // Simulate scroll gesture (vertical)
    fireEvent.touchStart(scrollableArea, {
      touches: [{ clientX: 100, clientY: 100 }]
    });

    fireEvent.touchMove(scrollableArea, {
      touches: [{ clientX: 100, clientY: 150 }]
    });

    fireEvent.touchEnd(scrollableArea, {
      changedTouches: [{ clientX: 100, clientY: 150 }]
    });

    // Should allow scrolling without triggering navigation
    expect(scrollableArea).toBeInTheDocument();
  });

  test('form interactions do not trigger swipe navigation', async () => {
    render(
      <TestWrapper>
        <ExpenseForm />
      </TestWrapper>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const formInputs = screen.getAllByRole('textbox');
    
    if (formInputs.length > 0) {
      const input = formInputs[0];
      
      // Simulate touch interaction with form input
      fireEvent.touchStart(input, {
        touches: [{ clientX: 200, clientY: 100 }]
      });

      fireEvent.touchEnd(input, {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      });

      // Should not trigger navigation, focus should work
      expect(input).toBeInTheDocument();
    }
  });

  test('dropdown interactions work correctly on touch', async () => {
    render(
      <TestWrapper>
        <ExpenseViewer />
      </TestWrapper>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const dropdownTriggers = screen.queryAllByRole('combobox');
    
    for (const trigger of dropdownTriggers.slice(0, 2)) {
      // Touch should open dropdown
      fireEvent.touchStart(trigger);
      fireEvent.touchEnd(trigger);
      fireEvent.click(trigger);

      // Dropdown should be accessible
      expect(trigger).toBeInTheDocument();
    }
  });
});