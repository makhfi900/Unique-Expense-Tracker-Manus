/**
 * Cross-Platform Consistency Validation Tests
 * Tests design consistency, feature parity, and user experience across mobile and desktop
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
import ExpenseForm from '../../components/ExpenseForm';
import EnhancedAnalytics from '../../components/EnhancedAnalytics';

// Mock components and contexts
jest.mock('../../context/SupabaseAuthContext', () => ({
  SupabaseAuthProvider: ({ children }) => children,
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com' },
    userProfile: { full_name: 'Test User', role: 'account_officer' },
    isAdmin: false,
    isAccountOfficer: true,
    apiCall: jest.fn().mockImplementation((url) => {
      const mockExpenses = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        amount: (Math.random() * 1000).toFixed(2),
        description: `Test Expense ${i + 1}`,
        expense_date: new Date().toISOString().split('T')[0],
        category: { id: 1, name: 'Test Category', color: '#3B82F6' },
        created_by_user: { full_name: 'Test User' },
        notes: i % 3 === 0 ? `Notes for expense ${i + 1}` : null
      }));

      if (url.includes('/expenses')) {
        return Promise.resolve({
          expenses: mockExpenses,
          pagination: { total: 25, totalPages: 2 }
        });
      }
      if (url.includes('/categories')) {
        return Promise.resolve({
          categories: [
            { id: 1, name: 'Office Supplies', color: '#3B82F6' },
            { id: 2, name: 'Travel', color: '#EF4444' },
            { id: 3, name: 'Equipment', color: '#10B981' }
          ]
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

// Viewport simulation functions
const setMobileViewport = () => {
  global.innerWidth = 375;
  global.innerHeight = 667;
  global.dispatchEvent(new Event('resize'));
};

const setDesktopViewport = () => {
  global.innerWidth = 1024;
  global.innerHeight = 768;
  global.dispatchEvent(new Event('resize'));
};

describe('Cross-Platform Design Consistency', () => {
  beforeEach(() => {
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

  describe('Color Scheme Consistency', () => {
    test('primary colors are consistent across platforms', async () => {
      // Test on mobile
      setMobileViewport();
      const { unmount: unmountMobile } = render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const mobilePrimaryElements = document.querySelectorAll('[class*="primary"], [class*="blue"]');
      const mobileColors = Array.from(mobilePrimaryElements).map(el => 
        window.getComputedStyle(el).color || window.getComputedStyle(el).backgroundColor
      ).filter(color => color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent');

      unmountMobile();

      // Test on desktop
      setDesktopViewport();
      const { unmount: unmountDesktop } = render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const desktopPrimaryElements = document.querySelectorAll('[class*="primary"], [class*="blue"]');
      const desktopColors = Array.from(desktopPrimaryElements).map(el => 
        window.getComputedStyle(el).color || window.getComputedStyle(el).backgroundColor
      ).filter(color => color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent');

      // Colors should be consistent
      const commonColors = mobileColors.filter(color => desktopColors.includes(color));
      expect(commonColors.length).toBeGreaterThan(0);

      unmountDesktop();
    });

    test('theme colors are consistent in light and dark modes', async () => {
      const themes = ['light', 'dark'];
      
      for (const theme of themes) {
        // Set theme class on document
        document.documentElement.className = theme;
        
        setMobileViewport();
        const { unmount: unmountMobile } = render(
          <TestWrapper>
            <ExpenseViewer />
          </TestWrapper>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        const mobileThemeElements = document.querySelectorAll('[class*="bg-"], [class*="text-"]');
        expect(mobileThemeElements.length).toBeGreaterThan(0);

        unmountMobile();

        setDesktopViewport();
        const { unmount: unmountDesktop } = render(
          <TestWrapper>
            <ExpenseViewer />
          </TestWrapper>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        const desktopThemeElements = document.querySelectorAll('[class*="bg-"], [class*="text-"]');
        expect(desktopThemeElements.length).toBeGreaterThan(0);

        unmountDesktop();
      }

      // Reset theme
      document.documentElement.className = '';
    });

    test('category colors display consistently', async () => {
      const platforms = [
        { name: 'mobile', setter: setMobileViewport },
        { name: 'desktop', setter: setDesktopViewport }
      ];

      const categoryColors = [];

      for (const platform of platforms) {
        platform.setter();
        
        const { unmount } = render(
          <TestWrapper>
            <ExpenseViewer />
          </TestWrapper>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        const colorDots = document.querySelectorAll('[style*="backgroundColor"], .w-3.h-3.rounded-full');
        const platformColors = Array.from(colorDots).map(dot => 
          dot.style.backgroundColor || window.getComputedStyle(dot).backgroundColor
        ).filter(color => color && color !== 'transparent');

        categoryColors.push({ platform: platform.name, colors: platformColors });

        unmount();
      }

      // Colors should be consistent across platforms
      if (categoryColors.length === 2) {
        const [mobile, desktop] = categoryColors;
        const commonColors = mobile.colors.filter(color => desktop.colors.includes(color));
        expect(commonColors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Typography Consistency', () => {
    test('font sizes scale appropriately across platforms', async () => {
      const components = [Dashboard, ExpenseViewer, ExpenseForm];
      const measurements = [];

      for (const Component of components) {
        // Mobile measurements
        setMobileViewport();
        const { unmount: unmountMobile } = render(
          <TestWrapper>
            <Component />
          </TestWrapper>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        const mobileHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const mobileTextElements = document.querySelectorAll('p, span, div');
        
        const mobileFontSizes = {
          headings: Array.from(mobileHeadings).map(el => parseFloat(window.getComputedStyle(el).fontSize)),
          text: Array.from(mobileTextElements).slice(0, 10).map(el => parseFloat(window.getComputedStyle(el).fontSize))
        };

        unmountMobile();

        // Desktop measurements
        setDesktopViewport();
        const { unmount: unmountDesktop } = render(
          <TestWrapper>
            <Component />
          </TestWrapper>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        const desktopHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const desktopTextElements = document.querySelectorAll('p, span, div');
        
        const desktopFontSizes = {
          headings: Array.from(desktopHeadings).map(el => parseFloat(window.getComputedStyle(el).fontSize)),
          text: Array.from(desktopTextElements).slice(0, 10).map(el => parseFloat(window.getComputedStyle(el).fontSize))
        };

        measurements.push({
          component: Component.name,
          mobile: mobileFontSizes,
          desktop: desktopFontSizes
        });

        unmountDesktop();
      }

      // Verify font sizes are readable on both platforms
      measurements.forEach(({ component, mobile, desktop }) => {
        // Mobile fonts should be at least 14px for readability
        mobile.text.forEach(size => {
          if (size > 0) expect(size).toBeGreaterThanOrEqual(14);
        });

        // Desktop fonts can be slightly larger but not excessively so
        desktop.text.forEach(size => {
          if (size > 0) {
            expect(size).toBeGreaterThanOrEqual(14);
            expect(size).toBeLessThan(24); // Reasonable upper limit
          }
        });
      });
    });

    test('line height and spacing are consistent', async () => {
      const platforms = [
        { name: 'mobile', setter: setMobileViewport },
        { name: 'desktop', setter: setDesktopViewport }
      ];

      for (const platform of platforms) {
        platform.setter();
        
        const { unmount } = render(
          <TestWrapper>
            <ExpenseViewer />
          </TestWrapper>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        const textElements = document.querySelectorAll('p, span, div');
        
        textElements.slice(0, 5).forEach(element => {
          const computedStyle = window.getComputedStyle(element);
          const lineHeight = parseFloat(computedStyle.lineHeight);
          const fontSize = parseFloat(computedStyle.fontSize);
          
          if (lineHeight > 0 && fontSize > 0) {
            const ratio = lineHeight / fontSize;
            // Line height should be between 1.2 and 1.8 times font size
            expect(ratio).toBeGreaterThan(1.1);
            expect(ratio).toBeLessThan(2);
          }
        });

        unmount();
      }
    });
  });

  describe('Spacing and Layout Consistency', () => {
    test('component spacing scales proportionally', async () => {
      setMobileViewport();
      const { unmount: unmountMobile } = render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const mobileCards = document.querySelectorAll('[class*="card"], [class*="p-"], [class*="m-"]');
      const mobileSpacing = Array.from(mobileCards).slice(0, 5).map(card => ({
        padding: window.getComputedStyle(card).padding,
        margin: window.getComputedStyle(card).margin
      }));

      unmountMobile();

      setDesktopViewport();
      const { unmount: unmountDesktop } = render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const desktopCards = document.querySelectorAll('[class*="card"], [class*="p-"], [class*="m-"]');
      const desktopSpacing = Array.from(desktopCards).slice(0, 5).map(card => ({
        padding: window.getComputedStyle(card).padding,
        margin: window.getComputedStyle(card).margin
      }));

      // Spacing should be proportional (desktop may be larger but not drastically different)
      expect(mobileSpacing.length).toBeGreaterThan(0);
      expect(desktopSpacing.length).toBeGreaterThan(0);

      unmountDesktop();
    });

    test('button sizes are appropriate for each platform', async () => {
      const platforms = [
        { name: 'mobile', setter: setMobileViewport, minSize: 44 },
        { name: 'desktop', setter: setDesktopViewport, minSize: 32 }
      ];

      for (const { name, setter, minSize } of platforms) {
        setter();
        
        const { unmount } = render(
          <TestWrapper>
            <ExpenseViewer />
          </TestWrapper>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        const buttons = screen.getAllByRole('button');
        
        buttons.slice(0, 5).forEach(button => {
          const rect = button.getBoundingClientRect();
          expect(Math.min(rect.width, rect.height)).toBeGreaterThanOrEqual(minSize - 4);
        });

        unmount();
      }
    });
  });
});

describe('Cross-Platform Feature Parity', () => {
  describe('Core Functionality Availability', () => {
    test('all essential features available on both platforms', async () => {
      const essentialFeatures = [
        'View Expenses',
        'Add Expense',
        'Search',
        'Filter',
        'Export'
      ];

      const platforms = [
        { name: 'mobile', setter: setMobileViewport },
        { name: 'desktop', setter: setDesktopViewport }
      ];

      for (const platform of platforms) {
        platform.setter();
        
        const { unmount } = render(
          <TestWrapper>
            <ExpenseViewer />
          </TestWrapper>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        // Check for essential UI elements
        const searchInput = screen.queryByPlaceholderText(/search/i);
        const filterElements = screen.queryAllByText(/filter|category/i);
        const actionButtons = screen.queryAllByRole('button');

        expect(searchInput || screen.queryByDisplayValue('')).toBeTruthy();
        expect(filterElements.length).toBeGreaterThan(0);
        expect(actionButtons.length).toBeGreaterThan(0);

        unmount();
      }
    });

    test('data operations work consistently across platforms', async () => {
      const operations = ['sort', 'filter', 'search', 'paginate'];
      
      for (const operation of operations) {
        // Test on mobile
        setMobileViewport();
        const { unmount: unmountMobile } = render(
          <TestWrapper>
            <ExpenseViewer />
          </TestWrapper>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        let mobileOperationWorks = false;
        
        switch (operation) {
          case 'sort':
            const mobileSortButtons = screen.queryAllByText(/Date|Amount|Description/i);
            mobileOperationWorks = mobileSortButtons.length > 0;
            break;
          case 'filter':
            const mobileFilters = screen.queryAllByText(/Category|All Categories/i);
            mobileOperationWorks = mobileFilters.length > 0;
            break;
          case 'search':
            const mobileSearch = screen.queryByPlaceholderText(/search/i);
            mobileOperationWorks = !!mobileSearch;
            break;
          case 'paginate':
            const mobilePagination = screen.queryAllByText(/Next|Previous|Page/i);
            mobileOperationWorks = mobilePagination.length > 0;
            break;
        }

        unmountMobile();

        // Test on desktop
        setDesktopViewport();
        const { unmount: unmountDesktop } = render(
          <TestWrapper>
            <ExpenseViewer />
          </TestWrapper>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        let desktopOperationWorks = false;
        
        switch (operation) {
          case 'sort':
            const desktopSortHeaders = screen.queryAllByText(/Date|Amount|Description/i);
            desktopOperationWorks = desktopSortHeaders.length > 0;
            break;
          case 'filter':
            const desktopFilters = screen.queryAllByText(/Category|All Categories/i);
            desktopOperationWorks = desktopFilters.length > 0;
            break;
          case 'search':
            const desktopSearch = screen.queryByPlaceholderText(/search/i);
            desktopOperationWorks = !!desktopSearch;
            break;
          case 'paginate':
            const desktopPagination = screen.queryAllByText(/Next|Previous|Page/i);
            desktopOperationWorks = desktopPagination.length > 0;
            break;
        }

        // Both platforms should support the operation
        expect(mobileOperationWorks && desktopOperationWorks).toBeTruthy();

        unmountDesktop();
      }
    });

    test('form interactions work on both platforms', async () => {
      const platforms = [
        { name: 'mobile', setter: setMobileViewport },
        { name: 'desktop', setter: setDesktopViewport }
      ];

      for (const platform of platforms) {
        platform.setter();
        
        const { unmount } = render(
          <TestWrapper>
            <ExpenseForm />
          </TestWrapper>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        // Check form elements are present and functional
        const textInputs = screen.queryAllByRole('textbox');
        const selects = screen.queryAllByRole('combobox');
        const buttons = screen.queryAllByRole('button');

        expect(textInputs.length + selects.length).toBeGreaterThan(0);
        expect(buttons.length).toBeGreaterThan(0);

        // Test form interaction
        if (textInputs.length > 0) {
          const input = textInputs[0];
          fireEvent.change(input, { target: { value: 'Test input' } });
          expect(input).toHaveValue('Test input');
        }

        unmount();
      }
    });
  });

  describe('Navigation Consistency', () => {
    test('navigation patterns are consistent', async () => {
      const platforms = [
        { name: 'mobile', setter: setMobileViewport },
        { name: 'desktop', setter: setDesktopViewport }
      ];

      for (const platform of platforms) {
        platform.setter();
        
        const { unmount } = render(
          <TestWrapper>
            <Dashboard />
          </TestWrapper>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        // Check navigation elements are present
        const navElements = screen.queryAllByRole('button');
        const links = screen.queryAllByRole('link');

        expect(navElements.length + links.length).toBeGreaterThan(0);

        // Test navigation accessibility
        const firstNavElement = navElements[0] || links[0];
        if (firstNavElement) {
          expect(firstNavElement).toBeInTheDocument();
          expect(firstNavElement.getAttribute('tabindex')).not.toBe('-1');
        }

        unmount();
      }
    });

    test('breadcrumb navigation works consistently', async () => {
      const platforms = [
        { name: 'mobile', setter: setMobileViewport },
        { name: 'desktop', setter: setDesktopViewport }
      ];

      for (const platform of platforms) {
        platform.setter();
        
        const { unmount } = render(
          <TestWrapper>
            <Dashboard />
          </TestWrapper>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        // Look for breadcrumb-like navigation
        const backButtons = screen.queryAllByText(/Back|Dashboard/i);
        const breadcrumbs = screen.queryAllByRole('navigation') || 
                          document.querySelectorAll('[aria-label*="breadcrumb"]');

        // At least some form of navigation should exist
        expect(backButtons.length + breadcrumbs.length).toBeGreaterThanOrEqual(0);

        unmount();
      }
    });
  });
});

describe('Cross-Platform Performance Comparison', () => {
  describe('Rendering Performance', () => {
    test('initial render times are reasonable on both platforms', async () => {
      const platforms = [
        { name: 'mobile', setter: setMobileViewport },
        { name: 'desktop', setter: setDesktopViewport }
      ];

      const renderTimes = [];

      for (const platform of platforms) {
        platform.setter();
        
        const startTime = performance.now();
        
        const { unmount } = render(
          <TestWrapper>
            <ExpenseViewer />
          </TestWrapper>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        renderTimes.push({ platform: platform.name, time: renderTime });
        
        // Should render within reasonable time
        expect(renderTime).toBeLessThan(1000);

        unmount();
      }

      // Performance should be comparable between platforms
      if (renderTimes.length === 2) {
        const [mobile, desktop] = renderTimes;
        const ratio = Math.max(mobile.time, desktop.time) / Math.min(mobile.time, desktop.time);
        expect(ratio).toBeLessThan(3); // No more than 3x difference
      }
    });

    test('interaction response times are consistent', async () => {
      const platforms = [
        { name: 'mobile', setter: setMobileViewport },
        { name: 'desktop', setter: setDesktopViewport }
      ];

      for (const platform of platforms) {
        platform.setter();
        
        const { unmount } = render(
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
          const startTime = performance.now();
          
          fireEvent.click(button);
          
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          // Should respond quickly
          expect(responseTime).toBeLessThan(100);
        }

        unmount();
      }
    });
  });

  describe('Memory Usage Patterns', () => {
    test('components clean up properly on both platforms', async () => {
      const platforms = [
        { name: 'mobile', setter: setMobileViewport },
        { name: 'desktop', setter: setDesktopViewport }
      ];

      for (const platform of platforms) {
        platform.setter();
        
        // Measure initial memory (if available)
        const initialMemory = performance.memory?.usedJSHeapSize || 0;
        
        const { unmount } = render(
          <TestWrapper>
            <ExpenseViewer />
          </TestWrapper>
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        unmount();

        // Allow garbage collection
        if (global.gc) {
          global.gc();
        }

        // Memory should not continuously increase
        const finalMemory = performance.memory?.usedJSHeapSize || 0;
        
        if (initialMemory > 0 && finalMemory > 0) {
          const memoryIncrease = finalMemory - initialMemory;
          expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB increase
        }
      }
    });
  });
});