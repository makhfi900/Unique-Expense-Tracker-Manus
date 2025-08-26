import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { colors, spacing, borderRadius, shadows, typography, touchTargets, breakpoints } from '../design-system';

/**
 * RESPONSIVE DESIGN PATTERN TEMPLATES
 * 
 * Comprehensive responsive design patterns for mobile-first development:
 * - Fluid grids and flexible layouts
 * - Responsive typography scaling
 * - Adaptive component sizing
 * - Breakpoint-aware interactions
 * - Touch vs hover state management
 * - Orientation change handling
 * - Container queries support
 * 
 * Features:
 * - Mobile-first approach with progressive enhancement
 * - Smooth transitions between breakpoints
 * - Device capability detection
 * - Performance optimized rendering
 * - Accessibility-first responsive patterns
 * - CSS-in-JS responsive utilities
 */

/**
 * RESPONSIVE CONTAINER TEMPLATE
 * Smart container with adaptive padding and max-width
 */
export const ResponsiveContainerTemplate = ({
  children,
  variant = 'default',
  padding = 'responsive',
  maxWidth = 'responsive',
  className,
  ...props
}) => {
  const variantStyles = {
    default: 'mx-auto',
    full: 'w-full',
    centered: 'mx-auto text-center',
    fluid: 'w-full max-w-none',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    default: 'p-4 md:p-6 lg:p-8',
    responsive: 'px-4 py-6 sm:px-6 md:px-8 lg:px-12 xl:px-16',
    section: 'py-12 px-4 sm:py-16 sm:px-6 md:py-20 md:px-8 lg:py-24 lg:px-12',
  };

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    responsive: 'max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl',
    none: 'max-w-none',
  };

  return (
    <div
      className={cn(
        variantStyles[variant],
        paddingStyles[padding],
        maxWidthStyles[maxWidth],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * RESPONSIVE GRID TEMPLATE
 * Adaptive grid system with breakpoint-aware columns
 */
export const ResponsiveGridTemplate = ({
  children,
  columns = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 },
  gap = 'responsive',
  minItemWidth = '280px',
  autoFit = false,
  className,
  ...props
}) => {
  const gapStyles = {
    none: 'gap-0',
    sm: 'gap-2',
    default: 'gap-4',
    responsive: 'gap-4 sm:gap-6 lg:gap-8',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  const responsiveClasses = [
    columns.xs && gridCols[columns.xs],
    columns.sm && `sm:${gridCols[columns.sm]}`,
    columns.md && `md:${gridCols[columns.md]}`,
    columns.lg && `lg:${gridCols[columns.lg]}`,
    columns.xl && `xl:${gridCols[columns.xl]}`,
  ].filter(Boolean).join(' ');

  const gridStyle = autoFit ? {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`,
    gap: typeof gap === 'string' ? spacing[4] : gap,
  } : {};

  return (
    <div
      className={cn(
        'grid',
        !autoFit && responsiveClasses,
        !autoFit && gapStyles[gap],
        className
      )}
      style={gridStyle}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * RESPONSIVE TYPOGRAPHY TEMPLATE
 * Fluid typography that scales smoothly across breakpoints
 */
export const ResponsiveTypographyTemplate = ({
  children,
  variant = 'body',
  responsive = true,
  className,
  ...props
}) => {
  const typographyVariants = {
    // Headlines
    h1: {
      static: 'text-3xl font-bold',
      responsive: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold',
      lineHeight: 'leading-tight',
    },
    h2: {
      static: 'text-2xl font-bold',
      responsive: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold',
      lineHeight: 'leading-tight',
    },
    h3: {
      static: 'text-xl font-semibold',
      responsive: 'text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold',
      lineHeight: 'leading-snug',
    },
    h4: {
      static: 'text-lg font-semibold',
      responsive: 'text-base sm:text-lg md:text-xl lg:text-2xl font-semibold',
      lineHeight: 'leading-snug',
    },
    
    // Body text
    body: {
      static: 'text-base',
      responsive: 'text-sm sm:text-base lg:text-lg',
      lineHeight: 'leading-relaxed',
    },
    bodyLarge: {
      static: 'text-lg',
      responsive: 'text-base sm:text-lg lg:text-xl',
      lineHeight: 'leading-relaxed',
    },
    bodySmall: {
      static: 'text-sm',
      responsive: 'text-xs sm:text-sm lg:text-base',
      lineHeight: 'leading-normal',
    },
    
    // Specialized
    caption: {
      static: 'text-sm text-gray-600',
      responsive: 'text-xs sm:text-sm lg:text-base text-gray-600',
      lineHeight: 'leading-normal',
    },
    overline: {
      static: 'text-xs font-medium uppercase tracking-wider',
      responsive: 'text-xs sm:text-sm font-medium uppercase tracking-wider',
      lineHeight: 'leading-none',
    },
  };

  const variantConfig = typographyVariants[variant];
  const sizeClass = responsive ? variantConfig.responsive : variantConfig.static;

  return (
    <div
      className={cn(
        sizeClass,
        variantConfig.lineHeight,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * RESPONSIVE CARD TEMPLATE
 * Adaptive card layout that responds to screen size and content
 */
export const ResponsiveCardTemplate = ({
  children,
  variant = 'default',
  orientation = 'auto', // 'auto', 'horizontal', 'vertical'
  padding = 'responsive',
  shadow = 'responsive',
  hover = true,
  className,
  ...props
}) => {
  const [currentOrientation, setCurrentOrientation] = useState(orientation);

  useEffect(() => {
    if (orientation === 'auto') {
      const handleResize = () => {
        setCurrentOrientation(window.innerWidth < 768 ? 'vertical' : 'horizontal');
      };
      
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [orientation]);

  const variantStyles = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 border-0',
    outlined: 'bg-transparent border-2 border-gray-300 dark:border-gray-600',
    filled: 'bg-gray-50 dark:bg-gray-900 border-0',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    default: 'p-4 sm:p-5 lg:p-6',
    responsive: 'p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8',
    lg: 'p-6 sm:p-8',
  };

  const shadowStyles = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    default: 'shadow-md',
    responsive: 'shadow-sm sm:shadow-md lg:shadow-lg',
    lg: 'shadow-lg',
  };

  const orientationClass = currentOrientation === 'horizontal' 
    ? 'md:flex md:flex-row md:items-center'
    : 'flex flex-col';

  return (
    <motion.div
      className={cn(
        'rounded-lg transition-all duration-200',
        variantStyles[variant],
        paddingStyles[padding],
        shadowStyles[shadow],
        orientationClass,
        hover && 'hover:shadow-lg hover:scale-[1.01] cursor-pointer',
        className
      )}
      whileHover={hover ? {
        y: -2,
        transition: { duration: 0.2 }
      } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * RESPONSIVE LAYOUT TEMPLATE
 * Adaptive layout that switches between mobile and desktop patterns
 */
export const ResponsiveLayoutTemplate = ({
  children,
  sidebar,
  header,
  footer,
  sidebarWidth = '280px',
  sidebarBreakpoint = 'lg',
  sidebarCollapsible = true,
  className,
  ...props
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      const breakpointValue = parseInt(breakpoints[sidebarBreakpoint].replace('px', ''));
      setIsMobile(window.innerWidth < breakpointValue);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [sidebarBreakpoint]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900', className)} {...props}>
      {/* Header */}
      {header && (
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {React.cloneElement(header, {
            onMenuClick: sidebarCollapsible ? toggleSidebar : undefined,
            showMenuButton: isMobile && sidebarCollapsible
          })}
        </header>
      )}

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        {sidebar && (
          <>
            {/* Mobile Sidebar Overlay */}
            {isMobile && (
              <>
                {isSidebarOpen && (
                  <motion.div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsSidebarOpen(false)}
                  />
                )}
                <motion.aside
                  className="fixed left-0 top-16 bottom-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 overflow-y-auto"
                  style={{ width: sidebarWidth }}
                  initial={{ x: `-${sidebarWidth}` }}
                  animate={{ x: isSidebarOpen ? 0 : `-${sidebarWidth}` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {sidebar}
                </motion.aside>
              </>
            )}

            {/* Desktop Sidebar */}
            {!isMobile && (
              <aside
                className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto"
                style={{ width: sidebarWidth }}
              >
                {sidebar}
              </aside>
            )}
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      {footer && (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          {footer}
        </footer>
      )}
    </div>
  );
};

/**
 * RESPONSIVE MEDIA QUERIES HOOK
 * Custom hook for responsive breakpoint detection
 */
export const useResponsiveBreakpoints = () => {
  const [breakpoint, setBreakpoint] = useState('xs');
  const [isMobile, setIsMobile] = useState(true);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width < 640) {
        setBreakpoint('xs');
        setIsMobile(true);
        setIsTablet(false);
        setIsDesktop(false);
      } else if (width < 768) {
        setBreakpoint('sm');
        setIsMobile(true);
        setIsTablet(false);
        setIsDesktop(false);
      } else if (width < 1024) {
        setBreakpoint('md');
        setIsMobile(false);
        setIsTablet(true);
        setIsDesktop(false);
      } else if (width < 1280) {
        setBreakpoint('lg');
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      } else {
        setBreakpoint('xl');
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isXs: breakpoint === 'xs',
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
  };
};

/**
 * RESPONSIVE TOUCH DETECTION HOOK
 * Detects touch capability and adapts interactions
 */
export const useTouch = () => {
  const [isTouch, setIsTouch] = useState(false);
  const [hasHover, setHasHover] = useState(true);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
      setHasHover(window.matchMedia('(hover: hover)').matches);
    };

    checkTouch();
    window.addEventListener('resize', checkTouch);
    
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  return { isTouch, hasHover };
};

/**
 * RESPONSIVE UTILITIES
 * Helper functions for responsive design
 */
export const responsiveUtils = {
  // Clamp function for fluid typography
  clamp: (min, preferred, max) => `clamp(${min}, ${preferred}, ${max})`,
  
  // Breakpoint-aware spacing
  spacing: {
    xs: (mobile, desktop) => `${mobile} sm:${desktop}`,
    responsive: (base, sm, md, lg, xl) => [
      base,
      sm && `sm:${sm}`,
      md && `md:${md}`,
      lg && `lg:${lg}`,
      xl && `xl:${xl}`,
    ].filter(Boolean).join(' '),
  },
  
  // Responsive grid helpers
  grid: {
    autoFit: (minWidth = '280px') => ({
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`,
    }),
    autoFill: (minWidth = '280px') => ({
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}, 1fr))`,
    }),
  },
  
  // Container queries (when supported)
  containerQuery: (selector, styles) => ({
    [selector]: styles,
  }),
};

export default {
  ResponsiveContainerTemplate,
  ResponsiveGridTemplate,
  ResponsiveTypographyTemplate,
  ResponsiveCardTemplate,
  ResponsiveLayoutTemplate,
  useResponsiveBreakpoints,
  useTouch,
  responsiveUtils,
};

/**
 * USAGE EXAMPLES:
 * 
 * // Responsive Container
 * <ResponsiveContainerTemplate
 *   variant="default"
 *   padding="responsive"
 *   maxWidth="responsive"
 * >
 *   <ExpenseList />
 * </ResponsiveContainerTemplate>
 * 
 * // Responsive Grid
 * <ResponsiveGridTemplate
 *   columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
 *   gap="responsive"
 *   autoFit={false}
 * >
 *   {expenses.map(expense => (
 *     <ExpenseCard key={expense.id} expense={expense} />
 *   ))}
 * </ResponsiveGridTemplate>
 * 
 * // Responsive Typography
 * <ResponsiveTypographyTemplate variant="h1" responsive>
 *   Your Expenses
 * </ResponsiveTypographyTemplate>
 * 
 * // Responsive Card
 * <ResponsiveCardTemplate
 *   variant="elevated"
 *   orientation="auto"
 *   padding="responsive"
 *   hover
 * >
 *   <ExpenseDetails />
 * </ResponsiveCardTemplate>
 * 
 * // Custom Hook Usage
 * const { isMobile, isTablet, isDesktop } = useResponsiveBreakpoints();
 * const { isTouch, hasHover } = useTouch();
 * 
 * return (
 *   <div>
 *     {isMobile && <MobileLayout />}
 *     {isTablet && <TabletLayout />}
 *     {isDesktop && <DesktopLayout />}
 *   </div>
 * );
 */