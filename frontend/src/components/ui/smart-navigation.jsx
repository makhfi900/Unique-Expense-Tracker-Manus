import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { colors, components, touchTargets } from './design-system';
import { Button } from './button';
import { Badge } from './badge';
import { 
  Home, 
  BarChart3, 
  Plus, 
  Settings, 
  User, 
  Search,
  Filter,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Bell,
  Download,
  Upload,
  Calendar,
  Tag,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';

/**
 * Smart Navigation Components
 * Features:
 * - Adaptive bottom navigation for mobile
 * - Collapsible sidebar for desktop
 * - Breadcrumb navigation
 * - Tab navigation with badges
 * - Context-aware actions
 * - Touch-friendly design
 * - Smooth transitions
 */

// Bottom Navigation for Mobile
export const BottomNavigation = ({
  items = [],
  activeItem,
  onItemChange,
  className,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: isVisible ? 0 : 100 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40",
        "bg-white border-t border-gray-200 shadow-lg",
        "safe-area-inset-bottom", // For iOS safe area
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => (
          <button
            key={item.key}
            className={cn(
              "flex flex-col items-center justify-center",
              "px-3 py-2 rounded-lg transition-all duration-200",
              "min-w-0 flex-1 relative",
              activeItem === item.key 
                ? "text-blue-600 bg-blue-50" 
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            )}
            style={{ minHeight: touchTargets.minimum }}
            onClick={() => onItemChange?.(item.key)}
            aria-label={item.label}
          >
            <div className="relative mb-1">
              {React.createElement(item.icon, { 
                size: 24, 
                className: cn(
                  "transition-all duration-200",
                  activeItem === item.key && "scale-110"
                )
              })}
              {item.badge && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
                >
                  {item.badge}
                </Badge>
              )}
            </div>
            <span className={cn(
              "text-xs font-medium leading-none",
              "max-w-full truncate"
            )}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </motion.nav>
  );
};

// Sidebar Navigation for Desktop
export const SidebarNavigation = ({
  items = [],
  activeItem,
  onItemChange,
  collapsed = false,
  onToggleCollapse,
  className,
  ...props
}) => {
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const toggleGroup = useCallback((groupKey) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);

  const renderNavItem = (item, depth = 0) => {
    const isActive = activeItem === item.key;
    const hasChildren = item.children && item.children.length > 0;
    const isGroupExpanded = expandedGroups.has(item.key);

    return (
      <div key={item.key}>
        <button
          className={cn(
            "w-full flex items-center justify-between",
            "px-3 py-2 rounded-lg transition-all duration-200",
            "text-left group",
            isActive 
              ? "bg-blue-600 text-white shadow-sm" 
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
            collapsed && !hasChildren && "justify-center",
            depth > 0 && "ml-4"
          )}
          style={{ 
            paddingLeft: collapsed ? '12px' : `${12 + depth * 16}px`,
            minHeight: touchTargets.minimum
          }}
          onClick={() => {
            if (hasChildren) {
              if (!collapsed) toggleGroup(item.key);
            } else {
              onItemChange?.(item.key);
            }
          }}
          aria-expanded={hasChildren ? isGroupExpanded : undefined}
          aria-label={item.label}
        >
          <div className="flex items-center min-w-0">
            <div className="flex-shrink-0">
              {React.createElement(item.icon, { 
                size: 20,
                className: cn(
                  "transition-all duration-200",
                  isActive && "drop-shadow-sm"
                )
              })}
            </div>
            {!collapsed && (
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">
                    {item.label}
                  </span>
                  {item.badge && (
                    <Badge 
                      variant={isActive ? "secondary" : "default"}
                      className="ml-2 text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {item.description}
                  </p>
                )}
              </div>
            )}
          </div>
          
          {hasChildren && !collapsed && (
            <motion.div
              animate={{ rotate: isGroupExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight size={16} />
            </motion.div>
          )}
        </button>

        {/* Submenu */}
        <AnimatePresence>
          {hasChildren && !collapsed && isGroupExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="py-1">
                {item.children.map(child => renderNavItem(child, depth + 1))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? '64px' : '280px' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        "fixed left-0 top-0 h-full z-30",
        "bg-white border-r border-gray-200 shadow-sm",
        "flex flex-col",
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between p-4 border-b border-gray-200",
        collapsed && "justify-center"
      )}>
        {!collapsed && (
          <h2 className="text-lg font-semibold text-gray-900">
            Expense Tracker
          </h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu size={18} />
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="space-y-1">
          {items.map(item => renderNavItem(item))}
        </div>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                John Doe
              </p>
              <p className="text-xs text-gray-500 truncate">
                john@example.com
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
};

// Breadcrumb Navigation
export const BreadcrumbNavigation = ({
  items = [],
  separator = <ChevronRight size={16} className="text-gray-400" />,
  maxItems = 3,
  className,
  ...props
}) => {
  // Show ellipsis for long breadcrumbs
  const displayItems = items.length > maxItems 
    ? [
        items[0],
        { key: 'ellipsis', label: '...', disabled: true },
        ...items.slice(-maxItems + 2)
      ]
    : items;

  return (
    <nav
      className={cn("flex items-center space-x-2 text-sm", className)}
      aria-label="Breadcrumb"
      {...props}
    >
      {displayItems.map((item, index) => (
        <React.Fragment key={item.key || index}>
          {index > 0 && (
            <span className="flex items-center" aria-hidden="true">
              {separator}
            </span>
          )}
          
          {item.disabled || index === displayItems.length - 1 ? (
            <span className={cn(
              "font-medium",
              item.disabled ? "text-gray-400" : "text-gray-900"
            )}>
              {item.label}
            </span>
          ) : (
            <button
              className="text-gray-600 hover:text-gray-900 transition-colors duration-150"
              onClick={() => item.onClick?.()}
            >
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// Tab Navigation with Enhanced Features
export const TabNavigation = ({
  items = [],
  activeTab,
  onTabChange,
  variant = 'default', // 'default', 'pills', 'underline', 'buttons'
  size = 'default', // 'sm', 'default', 'lg'
  className,
  ...props
}) => {
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabRefs = React.useRef({});

  // Update indicator position
  useEffect(() => {
    const activeTabElement = tabRefs.current[activeTab];
    if (activeTabElement && variant === 'underline') {
      setIndicatorStyle({
        width: activeTabElement.offsetWidth,
        left: activeTabElement.offsetLeft,
      });
    }
  }, [activeTab, variant]);

  const getTabClassName = (item, isActive) => {
    const baseClasses = cn(
      "relative inline-flex items-center justify-center",
      "font-medium transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
      size === 'sm' ? "px-3 py-1.5 text-sm" : size === 'lg' ? "px-6 py-3 text-lg" : "px-4 py-2"
    );

    const variantClasses = {
      default: cn(
        "border-b-2 -mb-px",
        isActive 
          ? "border-blue-600 text-blue-600" 
          : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
      ),
      pills: cn(
        "rounded-full",
        isActive 
          ? "bg-blue-600 text-white shadow-sm" 
          : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
      ),
      underline: cn(
        isActive 
          ? "text-blue-600" 
          : "text-gray-600 hover:text-gray-800"
      ),
      buttons: cn(
        "rounded-lg border",
        isActive 
          ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-gray-800"
      )
    };

    return cn(baseClasses, variantClasses[variant]);
  };

  return (
    <div className={cn("relative", className)} {...props}>
      <nav className={cn(
        "flex",
        variant === 'buttons' ? "space-x-2" : "space-x-0",
        variant === 'default' && "border-b border-gray-200"
      )}>
        {items.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              ref={(el) => tabRefs.current[item.key] = el}
              className={getTabClassName(item, isActive)}
              onClick={() => onTabChange?.(item.key)}
              disabled={item.disabled}
              aria-current={isActive ? 'page' : undefined}
              style={{ minHeight: touchTargets.comfortable }}
            >
              <div className="flex items-center space-x-2">
                {item.icon && React.createElement(item.icon, { 
                  size: size === 'lg' ? 20 : 16 
                })}
                <span>{item.label}</span>
                {item.badge && (
                  <Badge 
                    variant={isActive ? "secondary" : "default"}
                    className="text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Animated indicator for underline variant */}
      {variant === 'underline' && (
        <motion.div
          className="absolute bottom-0 h-0.5 bg-blue-600 rounded-full"
          initial={false}
          animate={indicatorStyle}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </div>
  );
};

// Quick Action Bar
export const QuickActionBar = ({
  actions = [],
  className,
  ...props
}) => {
  return (
    <div 
      className={cn(
        "flex items-center space-x-2 p-2",
        "bg-white border border-gray-200 rounded-lg shadow-sm",
        className
      )}
      {...props}
    >
      {actions.map((action, index) => (
        <Button
          key={action.key || index}
          variant={action.variant || "ghost"}
          size="sm"
          onClick={action.onClick}
          disabled={action.disabled}
          className={cn(
            "relative",
            action.className
          )}
        >
          <div className="flex items-center space-x-1">
            {action.icon && React.createElement(action.icon, { size: 16 })}
            {action.label && <span>{action.label}</span>}
          </div>
          {action.badge && (
            <Badge 
              variant="destructive"
              className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs"
            >
              {action.badge}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
};

// Pre-configured navigation sets
export const expenseAppNavigation = {
  mobile: [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: Home,
    },
    {
      key: 'expenses',
      label: 'Expenses',
      icon: BarChart3,
      badge: 12,
    },
    {
      key: 'add',
      label: 'Add',
      icon: Plus,
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: User,
    },
  ],
  desktop: [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Overview of your expenses',
    },
    {
      key: 'expenses',
      label: 'Manage Expenses',
      icon: BarChart3,
      badge: 12,
      children: [
        {
          key: 'all-expenses',
          label: 'All Expenses',
          icon: Eye,
        },
        {
          key: 'categories',
          label: 'Categories',
          icon: Tag,
        },
        {
          key: 'recurring',
          label: 'Recurring',
          icon: Calendar,
        },
      ],
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      description: 'Insights and reports',
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'App preferences',
    },
  ],
  tabs: [
    {
      key: 'overview',
      label: 'Overview',
      icon: Home,
    },
    {
      key: 'trends',
      label: 'Trends',
      icon: TrendingUp,
    },
    {
      key: 'categories',
      label: 'Categories',
      icon: Tag,
      badge: 8,
    },
    {
      key: 'timeline',
      label: 'Timeline',
      icon: Calendar,
    },
  ],
  quickActions: [
    {
      key: 'filter',
      icon: Filter,
      label: 'Filter',
      variant: 'outline',
    },
    {
      key: 'export',
      icon: Download,
      label: 'Export',
      variant: 'outline',
    },
    {
      key: 'import',
      icon: Upload,
      label: 'Import',
      variant: 'outline',
    },
    {
      key: 'notifications',
      icon: Bell,
      badge: 3,
      variant: 'outline',
    },
  ],
};

export default {
  BottomNavigation,
  SidebarNavigation,
  BreadcrumbNavigation,
  TabNavigation,
  QuickActionBar,
  expenseAppNavigation
};