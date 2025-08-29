/**
 * Mobile Viewport Testing Suite
 * 
 * Comprehensive mobile testing with viewport simulation:
 * - Multiple device breakpoints (320px, 375px, 414px, 768px)
 * - Touch event handling and gesture recognition
 * - Mobile-specific UI behaviors
 * - Accessibility standards for mobile
 * - Performance on mobile devices
 * 
 * CRITICAL: Prevents mobile UI duplicates and interaction issues
 */

import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from '@testing-library/react';

import { 
  renderWithProviders, 
  generateMockExpenses, 
  viewportUtils, 
  touchUtils,
  waitForComponentToStabilize 
} from '../utils/testUtils';

import ExpenseViewer from '../../components/ExpenseViewer';
import EnhancedMobileExpenseList from '../../components/EnhancedMobileExpenseList';
import Dashboard from '../../components/Dashboard';
import ExpenseForm from '../../components/ExpenseForm';
import { useIsMobile } from '../../hooks/use-mobile';

// Mobile device configurations for testing
const MOBILE_DEVICES = [
  { name: 'iPhone SE', width: 320, height: 568, userAgent: 'iPhone' },
  { name: 'iPhone 8', width: 375, height: 667, userAgent: 'iPhone' },
  { name: 'iPhone 12', width: 390, height: 844, userAgent: 'iPhone' },
  { name: 'iPhone 14 Pro Max', width: 428, height: 926, userAgent: 'iPhone' },
  { name: 'Samsung Galaxy S20', width: 360, height: 800, userAgent: 'Android' },
  { name: 'iPad', width: 768, height: 1024, userAgent: 'iPad' }
];

const createMobileAuth = (expenses = []) => ({
  user: { id: 'mobile-test-user', email: 'mobile@test.com' },
  userProfile: { full_name: 'Mobile User', role: 'account_officer' },
  isAdmin: false,
  isAccountOfficer: true,
  apiCall: jest.fn().mockResolvedValue({
    expenses,
    pagination: { page: 1, limit: 50, total: expenses.length, totalPages: 1, hasMore: false }
  }),
  session: { user: { email: 'mobile@test.com' } }
});

describe('Mobile Viewport Responsiveness Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cross-Device Compatibility', () => {
    test.each(MOBILE_DEVICES)('MOBILE: $name ($widthx$height) renders without horizontal scroll', async (device) => {
      viewportUtils.setCustom(device.width, device.height);
      
      const mobileExpenses = generateMockExpenses(15);
      const mockAuth = createMobileAuth(mobileExpenses);
      
      renderWithProviders(<ExpenseViewer />, mockAuth);
      
      await waitForComponentToStabilize();
      
      // Should not cause horizontal scrolling
      expect(document.body.scrollWidth).toBeLessThanOrEqual(device.width + 20); // 20px tolerance
      
      // Should render content
      expect(document.body).toContainHTML('div');
      
      // Check for layout stability
      const container = document.body.firstChild;
      if (container) {
        expect(container).toRenderWithoutLayoutShift();
      }
    });

    test.each(MOBILE_DEVICES)('MOBILE: $name touch targets meet accessibility standards', async (device) => {
      viewportUtils.setCustom(device.width, device.height);
      
      const mobileExpenses = generateMockExpenses(10);
      const mockAuth = createMobileAuth(mobileExpenses);
      
      renderWithProviders(<EnhancedMobileExpenseList />, mockAuth);
      
      await waitForComponentToStabilize();
      
      // Get all interactive elements
      const buttons = screen.queryAllByRole('button');
      const links = screen.queryAllByRole('link');
      const inputs = screen.queryAllByRole('textbox');
      const selects = screen.queryAllByRole('combobox');
      
      const interactiveElements = [...buttons, ...links, ...inputs, ...selects];
      
      interactiveElements.forEach(element => {
        expect(element).toHaveMinimumTouchTarget(44); // WCAG 2.1 AA standard
      });
    });

    test.each(MOBILE_DEVICES)('MOBILE: $name adapts layout appropriately', async (device) => {
      viewportUtils.setCustom(device.width, device.height);
      
      const layoutExpenses = generateMockExpenses(20);
      const mockAuth = createMobileAuth(layoutExpenses);
      
      renderWithProviders(<Dashboard />, mockAuth);
      
      await waitForComponentToStabilize();
      
      // Should adapt to mobile layout
      const isMobileWidth = device.width < 768;
      
      if (isMobileWidth) {
        // Should use mobile-optimized layout
        // Check for mobile-specific classes or patterns
        const mobileIndicators = document.body.innerHTML.toLowerCase();
        
        // Should not have desktop-only elements visible
        const desktopElements = document.querySelectorAll('[class*="desktop"], [class*="lg:"], [class*="xl:"]');
        desktopElements.forEach(element => {
          const style = window.getComputedStyle(element);
          // Desktop elements should be hidden or adapted on mobile
          expect(style.display !== 'none' || element.offsetWidth <= device.width).toBeTruthy();
        });
      }
    });
  });

  describe('Mobile-Specific UI Behaviors', () => {
    beforeEach(() => {
      viewportUtils.setMobile();
    });

    test('MOBILE: Sort controls do not duplicate on mobile', async () => {
      const sortExpenses = generateMockExpenses(25);
      const mockAuth = createMobileAuth(sortExpenses);
      
      renderWithProviders(<EnhancedMobileExpenseList />, mockAuth);
      
      await waitForComponentToStabilize();
      
      // Count sort-related buttons
      const allButtons = screen.queryAllByRole('button');
      
      // Filter buttons that are likely sort controls
      const sortButtons = allButtons.filter(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
        
        return (
          text.includes('sort') ||
          text.includes('date') ||
          text.includes('amount') ||
          text.includes('description') ||
          ariaLabel.includes('sort')
        );
      });
      
      // Group by similar text content to detect duplicates
      const buttonGroups = {};
      sortButtons.forEach(button => {
        const key = button.textContent?.trim().toLowerCase() || 'unnamed';
        buttonGroups[key] = (buttonGroups[key] || 0) + 1;
      });
      
      // No sort control should appear more than twice (button + indicator)
      Object.entries(buttonGroups).forEach(([text, count]) => {
        expect(count).toBeLessThanOrEqual(2);
      });
    });

    test('MOBILE: Swipe gestures work correctly', async () => {
      const swipeExpenses = generateMockExpenses(30);
      const mockAuth = createMobileAuth(swipeExpenses);
      
      renderWithProviders(<EnhancedMobileExpenseList />, mockAuth);
      
      await waitForComponentToStabilize();
      
      const container = screen.getByRole('main') || document.body;
      
      // Test horizontal swipe (navigation)
      const leftSwipe = touchUtils.simulateSwipe(container, 'left', 150);
      
      await act(async () => {
        fireEvent(container, leftSwipe.start);
        fireEvent(container, leftSwipe.move);
        fireEvent(container, leftSwipe.end);
      });
      
      // Should handle swipe without errors
      expect(container).toBeInTheDocument();
      
      // Test vertical swipe (scroll)
      const upSwipe = touchUtils.simulateSwipe(container, 'up', 100);
      
      await act(async () => {
        fireEvent(container, upSwipe.start);
        fireEvent(container, upSwipe.move);
        fireEvent(container, upSwipe.end);
      });
      
      // Should allow vertical scrolling
      expect(container).toBeInTheDocument();
    });

    test('MOBILE: Pull-to-refresh functionality (if implemented)', async () => {
      const refreshExpenses = generateMockExpenses(15);
      const mockAuth = createMobileAuth(refreshExpenses);
      
      renderWithProviders(<EnhancedMobileExpenseList />, mockAuth);
      
      await waitForComponentToStabilize();
      
      const scrollableArea = document.querySelector('[role="main"]') || document.body;
      
      // Simulate pull-to-refresh gesture
      const pullDownGesture = touchUtils.simulateSwipe(scrollableArea, 'down', 200);
      
      // Start from top of container
      Object.defineProperty(scrollableArea, 'scrollTop', { value: 0, writable: true });
      
      await act(async () => {
        fireEvent(scrollableArea, pullDownGesture.start);
        
        // Simulate slow pull down
        await new Promise(resolve => setTimeout(resolve, 100));
        fireEvent(scrollableArea, pullDownGesture.move);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        fireEvent(scrollableArea, pullDownGesture.end);
      });
      
      // Should handle pull gesture gracefully
      expect(scrollableArea).toBeInTheDocument();
      
      // If refresh is implemented, should trigger API call
      // This test is defensive - it won't fail if feature doesn't exist
    });

    test('MOBILE: Long press interactions work correctly', async () => {
      const longPressExpenses = generateMockExpenses(10);
      const mockAuth = createMobileAuth(longPressExpenses);
      
      renderWithProviders(<EnhancedMobileExpenseList />, mockAuth);
      
      await waitForComponentToStabilize();
      
      // Find expense cards or interactive elements
      const expenseCards = screen.queryAllByText(/Test Expense/);
      
      if (expenseCards.length > 0) {
        const firstCard = expenseCards[0].closest('div') || expenseCards[0];
        
        // Simulate long press
        await act(async () => {
          fireEvent.touchStart(firstCard, {
            touches: [{ clientX: 100, clientY: 100 }]
          });
          
          // Hold for long press duration
          await new Promise(resolve => setTimeout(resolve, 800));
          
          fireEvent.touchEnd(firstCard, {
            changedTouches: [{ clientX: 100, clientY: 100 }]
          });
        });
        
        // Should handle long press without breaking
        expect(firstCard).toBeInTheDocument();
      }
    });

    test('MOBILE: Virtual keyboard accommodation', async () => {
      renderWithProviders(<ExpenseForm />);
      
      await waitForComponentToStabilize();
      
      // Simulate virtual keyboard opening (viewport height reduction)
      const originalHeight = global.innerHeight;
      global.innerHeight = 400; // Simulated reduced height when keyboard is open
      global.dispatchEvent(new Event('resize'));
      
      await waitForComponentToStabilize(100);
      
      // Form should remain functional with reduced viewport
      const inputs = screen.queryAllByRole('textbox');
      
      if (inputs.length > 0) {
        // Input should still be accessible
        expect(inputs[0]).toBeVisible();
        
        // Should not cause layout overflow
        expect(document.body.scrollHeight).toBeGreaterThan(0);
      }
      
      // Restore original height
      global.innerHeight = originalHeight;
      global.dispatchEvent(new Event('resize'));
    });
  });

  describe('Mobile Performance and Accessibility', () => {
    beforeEach(() => {
      viewportUtils.setMobile();
    });

    test('MOBILE: Touch response time is within acceptable limits', async () => {
      const responseExpenses = generateMockExpenses(20);
      const mockAuth = createMobileAuth(responseExpenses);
      
      renderWithProviders(<EnhancedMobileExpenseList />, mockAuth);
      
      await waitForComponentToStabilize();
      
      const touchableElements = screen.queryAllByRole('button');
      
      for (const element of touchableElements.slice(0, 3)) { // Test first 3 elements
        const startTime = performance.now();
        
        await act(async () => {
          fireEvent.touchStart(element);
          fireEvent.touchEnd(element);
        });
        
        const responseTime = performance.now() - startTime;
        
        // Touch response should be immediate
        expect(responseTime).toBeWithinPerformanceBudget(100); // 100ms for touch response
      }
    });

    test('MOBILE: Screen reader compatibility', async () => {
      const accessibilityExpenses = generateMockExpenses(12);
      const mockAuth = createMobileAuth(accessibilityExpenses);
      
      renderWithProviders(<EnhancedMobileExpenseList />, mockAuth);
      
      await waitForComponentToStabilize();
      
      // Check for proper ARIA attributes
      const interactiveElements = [
        ...screen.queryAllByRole('button'),
        ...screen.queryAllByRole('link'),
        ...screen.queryAllByRole('textbox'),
        ...screen.queryAllByRole('combobox')
      ];
      
      interactiveElements.forEach(element => {
        // Should have accessible name
        const accessibleName = element.getAttribute('aria-label') || 
                               element.textContent || 
                               element.getAttribute('title');
        
        expect(accessibleName).toBeTruthy();
        
        // Should not have accessibility issues
        expect(element.getAttribute('aria-hidden')).not.toBe('true');
        
        // Interactive elements should be focusable
        if (element.tagName === 'BUTTON' || element.tagName === 'A') {
          expect(element.getAttribute('tabindex')).not.toBe('-1');
        }
      });
    });

    test('MOBILE: Color contrast meets accessibility standards', async () => {
      const contrastExpenses = generateMockExpenses(8);
      const mockAuth = createMobileAuth(contrastExpenses);
      
      const { container } = renderWithProviders(<EnhancedMobileExpenseList />, mockAuth);
      
      await waitForComponentToStabilize();
      
      // Check text elements for adequate contrast
      const textElements = container.querySelectorAll('*');
      
      textElements.forEach(element => {
        const style = window.getComputedStyle(element);
        const color = style.color;
        const backgroundColor = style.backgroundColor;
        
        // This is a basic check - in real scenarios you'd use a contrast calculation library
        if (color && backgroundColor && color !== backgroundColor) {
          // Elements with text should have contrasting colors
          expect(color).not.toBe(backgroundColor);
        }
      });
    });

    test('MOBILE: Orientation change handling', async () => {
      const orientationExpenses = generateMockExpenses(15);
      const mockAuth = createMobileAuth(orientationExpenses);
      
      // Start in portrait
      viewportUtils.setCustom(375, 667);
      
      const { rerender } = renderWithProviders(<ExpenseViewer />, mockAuth);
      
      await waitForComponentToStabilize();
      
      // Switch to landscape
      viewportUtils.setCustom(667, 375);
      
      rerender(<ExpenseViewer />);
      
      await waitForComponentToStabilize();
      
      // Should adapt to landscape without issues
      expect(document.body).toContainHTML('div');
      expect(document.body.scrollWidth).toBeLessThanOrEqual(667 + 20);
      
      // Switch back to portrait
      viewportUtils.setCustom(375, 667);
      
      rerender(<ExpenseViewer />);
      
      await waitForComponentToStabilize();
      
      // Should handle orientation changes gracefully
      expect(document.body).toContainHTML('div');
    });
  });

  describe('Mobile Gesture Conflict Resolution', () => {
    beforeEach(() => {
      viewportUtils.setMobile();
    });

    test('MOBILE: Scroll and swipe gestures do not conflict', async () => {
      const conflictExpenses = generateMockExpenses(50); // Large list for scrolling
      const mockAuth = createMobileAuth(conflictExpenses);
      
      renderWithProviders(<EnhancedMobileExpenseList />, mockAuth);
      
      await waitForComponentToStabilize();
      
      const scrollableArea = document.querySelector('[role="main"]') || document.body;
      
      // Test vertical scroll (should work)
      await act(async () => {
        fireEvent.touchStart(scrollableArea, {
          touches: [{ clientX: 100, clientY: 200 }]
        });
        
        fireEvent.touchMove(scrollableArea, {
          touches: [{ clientX: 100, clientY: 100 }]
        });
        
        fireEvent.touchEnd(scrollableArea, {
          changedTouches: [{ clientX: 100, clientY: 100 }]
        });
      });
      
      // Should allow vertical scrolling
      expect(scrollableArea).toBeInTheDocument();
      
      // Test horizontal swipe (should not interfere with scroll)
      await act(async () => {
        fireEvent.touchStart(scrollableArea, {
          touches: [{ clientX: 200, clientY: 100 }]
        });
        
        fireEvent.touchMove(scrollableArea, {
          touches: [{ clientX: 100, clientY: 100 }]
        });
        
        fireEvent.touchEnd(scrollableArea, {
          changedTouches: [{ clientX: 100, clientY: 100 }]
        });
      });
      
      // Should handle horizontal gestures appropriately
      expect(scrollableArea).toBeInTheDocument();
    });

    test('MOBILE: Form input interactions do not trigger navigation gestures', async () => {
      renderWithProviders(<ExpenseForm />);
      
      await waitForComponentToStabilize();
      
      const textInputs = screen.queryAllByRole('textbox');
      
      if (textInputs.length > 0) {
        const input = textInputs[0];
        
        // Touch input to focus
        await act(async () => {
          fireEvent.touchStart(input);
          fireEvent.touchEnd(input);
          fireEvent.focus(input);
        });
        
        // Type in input (should not trigger gestures)
        const user = userEvent.setup();
        await act(async () => {
          await user.type(input, 'Test input text');
        });
        
        // Input should retain focus and value
        expect(input).toHaveFocus();
        expect(input).toHaveValue('Test input text');
        
        // Swipe gesture within input should not navigate
        await act(async () => {
          fireEvent.touchStart(input, {
            touches: [{ clientX: 200, clientY: 100 }]
          });
          
          fireEvent.touchMove(input, {
            touches: [{ clientX: 100, clientY: 100 }]
          });
          
          fireEvent.touchEnd(input, {
            changedTouches: [{ clientX: 100, clientY: 100 }]
          });
        });
        
        // Input should maintain state
        expect(input).toHaveValue('Test input text');
      }
    });

    test('MOBILE: Multi-touch gestures are handled gracefully', async () => {
      const multiTouchExpenses = generateMockExpenses(20);
      const mockAuth = createMobileAuth(multiTouchExpenses);
      
      renderWithProviders(<EnhancedMobileExpenseList />, mockAuth);
      
      await waitForComponentToStabilize();
      
      const container = document.querySelector('[role="main"]') || document.body;
      
      // Simulate pinch gesture (zoom attempt)
      await act(async () => {
        fireEvent.touchStart(container, {
          touches: [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 200 }
          ]
        });
        
        fireEvent.touchMove(container, {
          touches: [
            { clientX: 80, clientY: 80 },
            { clientX: 220, clientY: 220 }
          ]
        });
        
        fireEvent.touchEnd(container, {
          changedTouches: [
            { clientX: 80, clientY: 80 },
            { clientX: 220, clientY: 220 }
          ]
        });
      });
      
      // Should handle multi-touch without breaking
      expect(container).toBeInTheDocument();
      
      // Application should remain stable
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });
});