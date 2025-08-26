import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { components, colors, utils } from './design-system';
import { Button } from './button';
import { 
  Plus, 
  X, 
  Upload, 
  Camera, 
  Receipt, 
  Calculator,
  Zap,
  Download,
  Settings,
  Filter
} from 'lucide-react';

/**
 * Modern Floating Action Button (FAB) Component
 * Features:
 * - Multiple size variants
 * - Expandable action menu
 * - Contextual quick actions
 * - Smooth animations
 * - Touch-friendly (56px default)
 * - Smart positioning
 * - Accessibility support
 */

const FloatingActionButton = forwardRef(({
  variant = 'primary',     // 'primary', 'secondary', 'success', 'warning', 'error'
  size = 'default',        // 'sm', 'default', 'lg'
  position = 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left', 'center'
  expandable = false,      // Enable expandable menu
  expandDirection = 'up',  // 'up', 'down', 'left', 'right', 'radial'
  icon = Plus,
  label,
  actions = [],           // Array of action objects for expandable menu
  disabled = false,
  className,
  onClick,
  ...props
}, ref) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: { size: '48px', iconSize: 16, padding: '12px' },
    default: { size: '56px', iconSize: 20, padding: '16px' },
    lg: { size: '64px', iconSize: 24, padding: '20px' },
  };

  // Variant configurations
  const variantConfig = {
    primary: {
      bg: colors.brand.primary,
      hover: colors.brand.primaryHover,
      text: colors.brand.primaryForeground,
      shadow: colors.primaryGlow,
    },
    secondary: {
      bg: colors.neutral[600],
      hover: colors.neutral[700],
      text: 'white',
      shadow: `0 0 20px ${colors.neutral[600]}40`,
    },
    success: {
      bg: colors.success.DEFAULT,
      hover: colors.success.hover,
      text: colors.success.foreground,
      shadow: `0 0 20px ${colors.success.DEFAULT}40`,
    },
    warning: {
      bg: colors.warning.DEFAULT,
      hover: colors.warning.hover,
      text: colors.warning.foreground,
      shadow: `0 0 20px ${colors.warning.DEFAULT}40`,
    },
    error: {
      bg: colors.error.DEFAULT,
      hover: colors.error.hover,
      text: colors.error.foreground,
      shadow: `0 0 20px ${colors.error.DEFAULT}40`,
    },
  };

  // Position configurations
  const positionConfig = {
    'bottom-right': 'fixed bottom-6 right-6 z-50',
    'bottom-left': 'fixed bottom-6 left-6 z-50',
    'top-right': 'fixed top-6 right-6 z-50',
    'top-left': 'fixed top-6 left-6 z-50',
    'center': 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50',
  };

  const config = sizeConfig[size];
  const variantStyles = variantConfig[variant];

  // Animation variants
  const fabVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20
      }
    },
    hover: {
      scale: 1.1,
      boxShadow: variantStyles.shadow,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.95,
      transition: { duration: 0.1 }
    }
  };

  const iconVariants = {
    initial: { rotate: 0 },
    expanded: { rotate: isExpanded ? 45 : 0 },
  };

  // Get action positions for different expand directions
  const getActionPosition = (index, total) => {
    const spacing = 70; // Space between actions
    const offset = (index + 1) * spacing;

    switch (expandDirection) {
      case 'up':
        return { bottom: offset, left: 0 };
      case 'down':
        return { top: offset, left: 0 };
      case 'left':
        return { left: -offset, top: 0 };
      case 'right':
        return { right: -offset, top: 0 };
      case 'radial':
        const angle = (index / total) * 360;
        const radius = 80;
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;
        return { 
          left: `calc(50% + ${x}px)`, 
          top: `calc(50% + ${y}px)`,
          transform: 'translate(-50%, -50%)'
        };
      default:
        return { bottom: offset, left: 0 };
    }
  };

  const handleClick = () => {
    if (expandable) {
      setIsExpanded(!isExpanded);
    } else {
      onClick?.();
    }
  };

  const handleActionClick = (action) => {
    action.onClick?.();
    setIsExpanded(false);
  };

  return (
    <div className={cn(positionConfig[position], className)}>
      {/* Main FAB */}
      <motion.button
        ref={ref}
        className={cn(
          "relative rounded-full shadow-lg focus:outline-none focus:ring-4 focus:ring-opacity-50",
          "transition-all duration-200",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        style={{
          width: config.size,
          height: config.size,
          backgroundColor: variantStyles.bg,
          color: variantStyles.text,
          focusRingColor: `${variantStyles.bg}40`,
        }}
        variants={fabVariants}
        initial="initial"
        animate="animate"
        whileHover={!disabled ? "hover" : undefined}
        whileTap={!disabled ? "tap" : undefined}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={disabled}
        aria-label={label || (expandable ? "Open actions menu" : "Add item")}
        {...props}
      >
        {/* Icon */}
        <motion.div
          variants={iconVariants}
          animate={expandable ? "expanded" : "initial"}
          className="flex items-center justify-center w-full h-full"
        >
          {React.createElement(expandable && isExpanded ? X : icon, {
            size: config.iconSize,
            className: "drop-shadow-sm"
          })}
        </motion.div>

        {/* Ripple effect on click */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: `${variantStyles.text}20` }}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 0, opacity: 0.8 }}
          whileTap={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>

      {/* Label tooltip */}
      {label && isHovered && !isExpanded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={cn(
            "absolute bg-gray-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg",
            "whitespace-nowrap pointer-events-none",
            position.includes('right') ? 'right-full mr-3 top-1/2 -translate-y-1/2' :
            position.includes('left') ? 'left-full ml-3 top-1/2 -translate-y-1/2' :
            'bottom-full mb-3 left-1/2 -translate-x-1/2'
          )}
        >
          {label}
          {/* Arrow */}
          <div className={cn(
            "absolute w-2 h-2 bg-gray-800 rotate-45",
            position.includes('right') ? 'right-0 top-1/2 -translate-y-1/2 translate-x-1' :
            position.includes('left') ? 'left-0 top-1/2 -translate-y-1/2 -translate-x-1' :
            'top-full left-1/2 -translate-x-1/2 -translate-y-1'
          )} />
        </motion.div>
      )}

      {/* Expandable Actions */}
      <AnimatePresence>
        {expandable && isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-20 -z-10"
              onClick={() => setIsExpanded(false)}
            />
            
            {/* Action Buttons */}
            {actions.map((action, index) => (
              <motion.button
                key={action.key || index}
                className={cn(
                  "absolute rounded-full shadow-lg bg-white text-gray-700",
                  "hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-blue-300",
                  "transition-all duration-200"
                )}
                style={{
                  width: '48px',
                  height: '48px',
                  ...getActionPosition(index, actions.length)
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  transition: { delay: index * 0.05 }
                }}
                exit={{ 
                  scale: 0, 
                  opacity: 0,
                  transition: { delay: (actions.length - index - 1) * 0.05 }
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleActionClick(action)}
                aria-label={action.label}
              >
                <div className="flex items-center justify-center w-full h-full">
                  {React.createElement(action.icon, { size: 20 })}
                </div>
              </motion.button>
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
});

FloatingActionButton.displayName = 'FloatingActionButton';

// Pre-configured FAB variants for common use cases
export const AddExpenseFAB = (props) => (
  <FloatingActionButton
    variant="primary"
    label="Add Expense"
    expandable
    actions={[
      {
        key: 'manual',
        icon: Calculator,
        label: 'Manual Entry',
        onClick: props.onManualEntry,
      },
      {
        key: 'camera',
        icon: Camera,
        label: 'Take Photo',
        onClick: props.onCameraCapture,
      },
      {
        key: 'receipt',
        icon: Receipt,
        label: 'Upload Receipt',
        onClick: props.onReceiptUpload,
      },
      {
        key: 'quick',
        icon: Zap,
        label: 'Quick Add',
        onClick: props.onQuickAdd,
      },
    ]}
    {...props}
  />
);

export const UtilityFAB = (props) => (
  <FloatingActionButton
    variant="secondary"
    position="bottom-left"
    label="Utilities"
    expandable
    actions={[
      {
        key: 'export',
        icon: Download,
        label: 'Export Data',
        onClick: props.onExport,
      },
      {
        key: 'import',
        icon: Upload,
        label: 'Import Data',
        onClick: props.onImport,
      },
      {
        key: 'filter',
        icon: Filter,
        label: 'Advanced Filter',
        onClick: props.onFilter,
      },
      {
        key: 'settings',
        icon: Settings,
        label: 'Settings',
        onClick: props.onSettings,
      },
    ]}
    {...props}
  />
);

export default FloatingActionButton;