import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { colors, spacing, borderRadius, shadows, typography, touchTargets } from '../design-system';
import { 
  Home, 
  PlusCircle, 
  BarChart3, 
  Settings, 
  Menu,
  X,
  ChevronLeft,
  Search,
  Filter,
  Bell,
  User,
  Calendar,
  Wallet,
  TrendingUp,
  List,
  Grid,
  ArrowUp
} from 'lucide-react';

/**
 * MOBILE NAVIGATION PATTERN TEMPLATES
 * 
 * Complete navigation patterns optimized for mobile interfaces:
 * - Bottom Tab Navigation (iOS/Android style)
 * - Slide-out drawer navigation
 * - Collapsible header navigation
 * - Floating tab bar with smooth animations
 * - Gesture-based navigation controls
 * - Smart auto-hide navigation
 * 
 * Features:
 * - Native-like animations and physics
 * - Touch-friendly interactions (48px+ targets)
 * - Smooth scroll-based behaviors
 * - Accessibility compliant
 * - Performance optimized
 * - Customizable styling and behaviors
 */

/**
 * BOTTOM TAB NAVIGATION TEMPLATE
 * Native iOS/Android style bottom navigation
 */
export const BottomTabNavigationTemplate = ({
  tabs = [],
  activeTab,
  onTabChange,
  variant = 'ios', // 'ios', 'android', 'custom'
  showLabels = true,
  showBadges = true,
  hideOnScroll = false,
  className,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);

  // Auto-hide logic based on scroll direction
  useEffect(() => {
    if (!hideOnScroll) return;

    const unsubscribe = scrollY.onChange((latest) => {
      const direction = latest > lastScrollY.current ? 'down' : 'up';
      lastScrollY.current = latest;
      
      if (direction === 'down' && latest > 100) {
        setIsVisible(false);
      } else if (direction === 'up') {
        setIsVisible(true);
      }
    });

    return () => unsubscribe();
  }, [scrollY, hideOnScroll]);

  const triggerHaptic = useCallback(() => {
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }
  }, []);

  const handleTabPress = (tab, index) => {
    triggerHaptic();
    onTabChange?.(tab, index);
  };

  const variantStyles = {
    ios: {
      height: '84px', // 56px + safe area
      background: 'rgba(255, 255, 255, 0.95)',
      borderTop: '1px solid rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    },
    android: {
      height: '72px',
      background: colors.neutral[50],
      borderTop: 'none',
      elevation: '8px',
      boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.15)',
    },
    custom: {
      height: '80px',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(247,250,252,0.95) 100%)',
      borderTop: `2px solid ${colors.neutral[200]}`,
      backdropFilter: 'blur(12px)',
    }
  };

  const currentStyle = variantStyles[variant];

  return (
    <motion.div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "flex items-center justify-around",
        className
      )}
      style={{
        ...currentStyle,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      initial={{ y: 0 }}
      animate={{ 
        y: isVisible ? 0 : currentStyle.height,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30
        }
      }}
      {...props}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.key;
        
        return (
          <motion.button
            key={tab.key}
            className={cn(
              "flex flex-col items-center justify-center relative",
              "transition-colors duration-200",
              "outline-none focus:outline-none"
            )}
            style={{
              minWidth: touchTargets.comfortable,
              minHeight: touchTargets.comfortable,
              padding: spacing[2],
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTabPress(tab, index)}
            aria-label={tab.label}
            aria-selected={isActive}
          >
            {/* Icon Container */}
            <motion.div
              className={cn(
                "relative rounded-full transition-all duration-300",
                variant === 'android' && isActive && "bg-blue-100"
              )}
              style={{
                padding: variant === 'android' && isActive ? spacing[2] : 0,
              }}
              animate={{
                scale: isActive ? 1.1 : 1,
                y: isActive && variant === 'ios' ? -2 : 0,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {React.createElement(tab.icon, {
                size: 24,
                className: cn(
                  "transition-colors duration-200",
                  isActive 
                    ? "text-blue-600" 
                    : "text-gray-500 dark:text-gray-400"
                ),
                strokeWidth: isActive ? 2.5 : 2
              })}
              
              {/* Active Indicator Dot (iOS style) */}
              {isActive && variant === 'ios' && (
                <motion.div
                  className="absolute -bottom-1 left-1/2 transform -translate-x-1/2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="w-1 h-1 bg-blue-600 rounded-full" />
                </motion.div>
              )}
              
              {/* Badge */}
              {showBadges && tab.badge && (
                <motion.div
                  className={cn(
                    "absolute -top-1 -right-1 min-w-5 h-5 rounded-full",
                    "bg-red-500 text-white text-xs font-bold",
                    "flex items-center justify-center"
                  )}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </motion.div>
              )}
            </motion.div>

            {/* Label */}
            {showLabels && (
              <motion.span
                className={cn(
                  "text-xs font-medium transition-colors duration-200 mt-1",
                  isActive 
                    ? "text-blue-600" 
                    : "text-gray-500 dark:text-gray-400"
                )}
                animate={{
                  opacity: isActive ? 1 : 0.8,
                  scale: isActive ? 1.05 : 1,
                }}
                style={{
                  fontSize: typography.fontSize.xs.size,
                  fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.medium
                }}
              >
                {tab.label}
              </motion.span>
            )}

            {/* Ripple Effect (Android style) */}
            {variant === 'android' && (
              <motion.div
                className="absolute inset-0 rounded-full bg-blue-500 opacity-20"
                initial={{ scale: 0 }}
                whileTap={{ scale: 1.5, opacity: [0.2, 0] }}
                transition={{ duration: 0.3 }}
              />
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
};

/**
 * SLIDE-OUT DRAWER NAVIGATION TEMPLATE
 * Side navigation drawer with smooth animations
 */
export const DrawerNavigationTemplate = ({
  isOpen,
  onClose,
  children,
  width = '280px',
  position = 'left', // 'left', 'right'
  variant = 'overlay', // 'overlay', 'push'
  showBackdrop = true,
  className,
  ...props
}) => {
  const triggerHaptic = useCallback(() => {
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }
  }, []);

  const handleClose = () => {
    triggerHaptic();
    onClose?.();
  };

  const drawerVariants = {
    closed: {
      x: position === 'left' ? `-${width}` : width,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const backdropVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          {showBackdrop && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              variants={backdropVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={handleClose}
            />
          )}

          {/* Drawer */}
          <motion.div
            className={cn(
              "fixed top-0 bottom-0 z-50",
              "bg-white dark:bg-gray-900",
              "shadow-2xl overflow-hidden",
              position === 'left' ? 'left-0' : 'right-0',
              className
            )}
            style={{
              width: width,
            }}
            variants={drawerVariants}
            initial="closed"
            animate="open"
            exit="closed"
            {...props}
          >
            {/* Close Button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Menu</h3>
                </div>
              </div>
              <motion.button
                className={cn(
                  "rounded-full bg-gray-100 dark:bg-gray-800",
                  "text-gray-500 dark:text-gray-400",
                  "hover:bg-gray-200 dark:hover:bg-gray-700",
                  "transition-colors duration-200"
                )}
                style={{
                  width: touchTargets.minimum,
                  height: touchTargets.minimum
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * COLLAPSIBLE HEADER NAVIGATION TEMPLATE
 * Header that collapses/expands based on scroll
 */
export const CollapsibleHeaderTemplate = ({
  title,
  subtitle,
  actions = [],
  showBackButton = false,
  onBack,
  collapseThreshold = 100,
  className,
  children,
  ...props
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { scrollY } = useScroll();

  // Monitor scroll to collapse/expand header
  useEffect(() => {
    const unsubscribe = scrollY.onChange((latest) => {
      setIsCollapsed(latest > collapseThreshold);
    });
    return () => unsubscribe();
  }, [scrollY, collapseThreshold]);

  const triggerHaptic = useCallback(() => {
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }
  }, []);

  const headerHeight = useTransform(scrollY, [0, collapseThreshold], ['120px', '64px']);
  const titleOpacity = useTransform(scrollY, [0, collapseThreshold * 0.5], [1, 0]);
  const subtitleOpacity = useTransform(scrollY, [0, collapseThreshold * 0.3], [1, 0]);

  return (
    <motion.header
      className={cn(
        "fixed top-0 left-0 right-0 z-40",
        "bg-white/95 dark:bg-gray-900/95",
        "backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60",
        className
      )}
      style={{
        height: headerHeight,
        paddingTop: 'env(safe-area-inset-top)',
      }}
      {...props}
    >
      <div className="h-full flex items-end pb-3 px-4">
        <div className="flex items-center justify-between w-full">
          {/* Left Section */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Back Button */}
            {showBackButton && (
              <motion.button
                className={cn(
                  "rounded-full bg-gray-100 dark:bg-gray-800",
                  "text-gray-700 dark:text-gray-300",
                  "hover:bg-gray-200 dark:hover:bg-gray-700",
                  "transition-colors duration-200"
                )}
                style={{
                  width: touchTargets.minimum,
                  height: touchTargets.minimum
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  triggerHaptic();
                  onBack?.();
                }}
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
            )}

            {/* Title Section */}
            <div className="flex-1 min-w-0">
              <motion.h1
                className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate"
                style={{ opacity: isCollapsed ? 1 : titleOpacity }}
                animate={{
                  fontSize: isCollapsed ? '1.125rem' : '1.5rem',
                  transition: { duration: 0.3 }
                }}
              >
                {title}
              </motion.h1>
              
              {subtitle && (
                <motion.p
                  className="text-sm text-gray-600 dark:text-gray-400 truncate"
                  style={{ opacity: subtitleOpacity }}
                >
                  {subtitle}
                </motion.p>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {actions.map((action, index) => (
              <motion.button
                key={action.key || index}
                className={cn(
                  "rounded-full bg-gray-100 dark:bg-gray-800",
                  "text-gray-700 dark:text-gray-300",
                  "hover:bg-gray-200 dark:hover:bg-gray-700",
                  "transition-colors duration-200",
                  "flex items-center justify-center",
                  action.className
                )}
                style={{
                  width: touchTargets.minimum,
                  height: touchTargets.minimum
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  triggerHaptic();
                  action.onClick?.();
                }}
                aria-label={action.label}
              >
                {React.createElement(action.icon, { size: 20 })}
                {action.badge && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Additional Content */}
      {children}
    </motion.header>
  );
};

/**
 * FLOATING TAB BAR TEMPLATE
 * Modern floating tab bar with smooth animations
 */
export const FloatingTabBarTemplate = ({
  tabs = [],
  activeTab,
  onTabChange,
  position = 'bottom', // 'top', 'bottom'
  variant = 'pill', // 'pill', 'rounded', 'square'
  showIndicator = true,
  className,
  ...props
}) => {
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabRefs = useRef([]);

  const triggerHaptic = useCallback(() => {
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }
  }, []);

  // Update indicator position
  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.key === activeTab);
    if (activeIndex >= 0 && tabRefs.current[activeIndex]) {
      const tab = tabRefs.current[activeIndex];
      const { offsetLeft, offsetWidth } = tab;
      setIndicatorStyle({
        left: offsetLeft,
        width: offsetWidth,
      });
    }
  }, [activeTab, tabs]);

  const variantStyles = {
    pill: { borderRadius: borderRadius.full },
    rounded: { borderRadius: borderRadius.xl },
    square: { borderRadius: borderRadius.md },
  };

  const positionStyles = {
    top: "top-4 left-1/2 transform -translate-x-1/2",
    bottom: "bottom-4 left-1/2 transform -translate-x-1/2",
  };

  return (
    <motion.div
      className={cn(
        "fixed z-50 flex items-center",
        "bg-white/90 dark:bg-gray-900/90",
        "backdrop-blur-md shadow-lg border border-gray-200/60 dark:border-gray-700/60",
        positionStyles[position],
        className
      )}
      style={{
        padding: spacing[1],
        ...variantStyles[variant],
      }}
      initial={{ y: position === 'bottom' ? 100 : -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      {...props}
    >
      {/* Background Indicator */}
      {showIndicator && (
        <motion.div
          className="absolute bg-blue-500/20 dark:bg-blue-400/20"
          style={{
            height: 'calc(100% - 8px)',
            top: '4px',
            borderRadius: variantStyles[variant].borderRadius,
            ...indicatorStyle,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}

      {/* Tabs */}
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.key;
        
        return (
          <motion.button
            key={tab.key}
            ref={el => tabRefs.current[index] = el}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 z-10",
              "text-sm font-medium transition-colors duration-200",
              "outline-none focus:outline-none",
              isActive 
                ? "text-blue-600 dark:text-blue-400" 
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            )}
            style={{
              minHeight: touchTargets.minimum,
              borderRadius: variantStyles[variant].borderRadius,
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerHaptic();
              onTabChange?.(tab, index);
            }}
            aria-selected={isActive}
          >
            {React.createElement(tab.icon, {
              size: 18,
              className: cn(
                "transition-colors duration-200",
                isActive && "text-blue-600 dark:text-blue-400"
              )
            })}
            <span>{tab.label}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
};

// Pre-configured navigation sets for common app patterns
export const expenseAppTabs = [
  { key: 'home', icon: Home, label: 'Home' },
  { key: 'add', icon: PlusCircle, label: 'Add' },
  { key: 'analytics', icon: BarChart3, label: 'Analytics' },
  { key: 'settings', icon: Settings, label: 'Settings' },
];

export const expenseHeaderActions = [
  { key: 'search', icon: Search, onClick: () => {}, label: 'Search' },
  { key: 'filter', icon: Filter, onClick: () => {}, label: 'Filter' },
  { key: 'notifications', icon: Bell, onClick: () => {}, label: 'Notifications', badge: 3 },
];

export default {
  BottomTabNavigationTemplate,
  DrawerNavigationTemplate,
  CollapsibleHeaderTemplate,
  FloatingTabBarTemplate,
  expenseAppTabs,
  expenseHeaderActions,
};

/**
 * USAGE EXAMPLES:
 * 
 * // Bottom Tab Navigation
 * <BottomTabNavigationTemplate
 *   tabs={expenseAppTabs}
 *   activeTab={currentTab}
 *   onTabChange={(tab) => setCurrentTab(tab.key)}
 *   variant="ios"
 *   hideOnScroll={true}
 * />
 * 
 * // Drawer Navigation
 * <DrawerNavigationTemplate
 *   isOpen={isDrawerOpen}
 *   onClose={() => setIsDrawerOpen(false)}
 *   width="300px"
 *   position="left"
 * >
 *   <NavigationMenu />
 * </DrawerNavigationTemplate>
 * 
 * // Collapsible Header
 * <CollapsibleHeaderTemplate
 *   title="Expenses"
 *   subtitle="Track your spending"
 *   actions={expenseHeaderActions}
 *   showBackButton={true}
 *   onBack={() => history.back()}
 * />
 * 
 * // Floating Tab Bar
 * <FloatingTabBarTemplate
 *   tabs={[
 *     { key: 'list', icon: List, label: 'List' },
 *     { key: 'grid', icon: Grid, label: 'Grid' },
 *     { key: 'chart', icon: TrendingUp, label: 'Chart' }
 *   ]}
 *   activeTab={viewMode}
 *   onTabChange={(tab) => setViewMode(tab.key)}
 *   variant="pill"
 * />
 */