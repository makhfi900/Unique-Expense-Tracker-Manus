import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { colors, spacing, borderRadius, shadows, typography, touchTargets } from '../design-system';
import { 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff, 
  Zap, 
  Pause, 
  Play,
  SkipForward,
  SkipBack,
  ChevronRight,
  Info,
  AlertTriangle,
  Check,
  X,
  Settings,
  Accessibility
} from 'lucide-react';

/**
 * ACCESSIBILITY-COMPLIANT MOBILE TEMPLATES
 * 
 * Comprehensive accessibility templates following WCAG 2.1 AA standards:
 * - Screen reader optimized components
 * - Keyboard navigation support
 * - High contrast mode support
 * - Reduced motion preferences
 * - Focus management
 * - ARIA labels and roles
 * - Voice control compatibility
 * - Touch accessibility (44px targets)
 * 
 * Features:
 * - WCAG 2.1 AA compliant
 * - Screen reader tested
 * - Keyboard navigation
 * - High contrast support
 * - Reduced motion support
 * - Voice control ready
 * - Touch-friendly (44px+ targets)
 * - Semantic HTML structure
 */

// Accessibility Context for global settings
const AccessibilityContext = createContext({
  highContrast: false,
  reducedMotion: false,
  screenReader: false,
  fontSize: 'normal',
  soundEnabled: true,
});

export const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    highContrast: false,
    reducedMotion: false,
    screenReader: false,
    fontSize: 'normal',
    soundEnabled: true,
  });

  useEffect(() => {
    // Check system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    setSettings(prev => ({
      ...prev,
      reducedMotion: prefersReducedMotion,
      highContrast: prefersHighContrast,
    }));
  }, []);

  return (
    <AccessibilityContext.Provider value={{ ...settings, setSettings }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => useContext(AccessibilityContext);

/**
 * ACCESSIBLE BUTTON TEMPLATE
 * Fully accessible button with proper ARIA attributes
 */
export const AccessibleButtonTemplate = ({
  children,
  variant = 'primary',
  size = 'default',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  ariaLabel,
  ariaDescribedBy,
  ariaPressed,
  role = 'button',
  fullWidth = false,
  className,
  onClick,
  onFocus,
  onBlur,
  ...props
}) => {
  const { highContrast, reducedMotion, soundEnabled } = useAccessibility();
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef(null);

  const playClickSound = useCallback(() => {
    if (soundEnabled && 'AudioContext' in window) {
      try {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (error) {
        // Fallback for browsers that don't support AudioContext
        console.debug('Audio feedback not available');
      }
    }
  }, [soundEnabled]);

  const handleClick = (event) => {
    if (disabled || loading) return;
    
    setIsPressed(true);
    playClickSound();
    onClick?.(event);
    
    setTimeout(() => setIsPressed(false), 150);
  };

  const handleFocus = (event) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  const handleKeyDown = (event) => {
    // Support Enter and Space for button activation
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(event);
    }
  };

  const sizeConfig = {
    sm: {
      height: touchTargets.minimum,
      minWidth: touchTargets.minimum,
      padding: `${spacing[2]} ${spacing[3]}`,
      fontSize: typography.fontSize.sm.size,
      iconSize: 16,
    },
    default: {
      height: touchTargets.comfortable,
      minWidth: touchTargets.comfortable,
      padding: `${spacing[3]} ${spacing[5]}`,
      fontSize: typography.fontSize.base.size,
      iconSize: 20,
    },
    lg: {
      height: touchTargets.large,
      minWidth: touchTargets.large,
      padding: `${spacing[4]} ${spacing[6]}`,
      fontSize: typography.fontSize.lg.size,
      iconSize: 24,
    },
  };

  const variantConfig = {
    primary: {
      bg: highContrast ? '#0000FF' : colors.brand.primary,
      text: '#FFFFFF',
      border: highContrast ? '3px solid #000000' : 'none',
      focusRing: highContrast ? '4px solid #FFFF00' : `4px solid ${colors.brand.primary}40`,
    },
    secondary: {
      bg: highContrast ? '#FFFFFF' : colors.neutral[100],
      text: highContrast ? '#000000' : colors.neutral[700],
      border: highContrast ? '3px solid #000000' : `2px solid ${colors.neutral[300]}`,
      focusRing: highContrast ? '4px solid #FFFF00' : `4px solid ${colors.neutral[400]}60`,
    },
    danger: {
      bg: highContrast ? '#CC0000' : colors.error.DEFAULT,
      text: '#FFFFFF',
      border: highContrast ? '3px solid #000000' : 'none',
      focusRing: highContrast ? '4px solid #FFFF00' : `4px solid ${colors.error.DEFAULT}40`,
    },
  };

  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];

  return (
    <motion.button
      ref={buttonRef}
      className={cn(
        "relative flex items-center justify-center gap-2",
        "font-medium rounded-lg transition-all",
        "outline-none select-none touch-manipulation",
        "focus-visible:outline-none",
        fullWidth && "w-full",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      style={{
        height: currentSize.height,
        minWidth: fullWidth ? '100%' : currentSize.minWidth,
        padding: currentSize.padding,
        backgroundColor: currentVariant.bg,
        color: currentVariant.text,
        fontSize: currentSize.fontSize,
        fontWeight: typography.fontWeight.medium,
        borderRadius: borderRadius.lg,
        border: currentVariant.border,
        boxShadow: isFocused ? `0 0 0 ${currentVariant.focusRing}` : shadows.sm,
        duration: reducedMotion ? '0s' : '200ms',
      }}
      animate={!reducedMotion ? {
        scale: isPressed ? 0.98 : 1,
        y: isPressed ? 1 : 0,
      } : {}}
      transition={{ duration: reducedMotion ? 0 : 0.1 }}
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-pressed={ariaPressed}
      aria-busy={loading}
      role={role}
      tabIndex={disabled ? -1 : 0}
      {...props}
    >
      {/* Loading Indicator */}
      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <motion.div
            className="border-2 border-current border-t-transparent rounded-full"
            style={{ width: currentSize.iconSize, height: currentSize.iconSize }}
            animate={!reducedMotion ? { rotate: 360 } : {}}
            transition={!reducedMotion ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
          />
        </div>
      )}

      {/* Content */}
      <div 
        className={cn("flex items-center gap-2", loading && "opacity-0")}
        aria-hidden={loading}
      >
        {icon && iconPosition === 'left' && (
          <span aria-hidden="true">
            {React.createElement(icon, { size: currentSize.iconSize })}
          </span>
        )}
        <span>{children}</span>
        {icon && iconPosition === 'right' && (
          <span aria-hidden="true">
            {React.createElement(icon, { size: currentSize.iconSize })}
          </span>
        )}
      </div>

      {/* Screen Reader Loading Announcement */}
      {loading && (
        <span className="sr-only">
          Loading, please wait...
        </span>
      )}
    </motion.button>
  );
};

/**
 * ACCESSIBLE FORM INPUT TEMPLATE
 * Fully accessible form input with proper labeling
 */
export const AccessibleInputTemplate = ({
  type = 'text',
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helperText,
  ariaDescribedBy,
  autoComplete,
  id,
  className,
  ...props
}) => {
  const { highContrast } = useAccessibility();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  const describedByIds = [
    error && errorId,
    helperText && helperId,
    ariaDescribedBy,
  ].filter(Boolean).join(' ');

  const inputStyles = {
    height: touchTargets.comfortable,
    padding: `${spacing[3]} ${spacing[4]}`,
    fontSize: typography.fontSize.base.size,
    backgroundColor: highContrast ? (disabled ? '#F5F5F5' : '#FFFFFF') : undefined,
    color: highContrast ? '#000000' : undefined,
    border: highContrast 
      ? `3px solid ${error ? '#CC0000' : '#000000'}` 
      : `2px solid ${error ? colors.error.DEFAULT : isFocused ? colors.brand.primary : colors.neutral[300]}`,
    borderRadius: borderRadius.lg,
    outline: 'none',
    boxShadow: isFocused 
      ? highContrast 
        ? '0 0 0 4px #FFFF00' 
        : `0 0 0 4px ${error ? colors.error.DEFAULT : colors.brand.primary}40`
      : 'none',
  };

  return (
    <div className={cn("relative", className)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "block text-sm font-medium mb-2",
            error 
              ? highContrast ? "text-red-800" : "text-red-700 dark:text-red-400"
              : highContrast ? "text-black" : "text-gray-700 dark:text-gray-300"
          )}
        >
          {label}
          {required && (
            <span 
              className={highContrast ? "text-red-800" : "text-red-500"}
              aria-label="required"
            >
              *
            </span>
          )}
        </label>
      )}

      {/* Input */}
      <input
        ref={inputRef}
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className={cn(
          "w-full transition-all duration-200",
          "placeholder-gray-500 dark:placeholder-gray-400",
          disabled && "cursor-not-allowed opacity-50"
        )}
        style={inputStyles}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedByIds || undefined}
        aria-required={required}
        {...props}
      />

      {/* Helper Text */}
      {helperText && !error && (
        <p
          id={helperId}
          className={cn(
            "text-sm mt-2",
            highContrast ? "text-gray-800" : "text-gray-600 dark:text-gray-400"
          )}
        >
          {helperText}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <div
          id={errorId}
          className="flex items-center gap-2 mt-2"
          role="alert"
          aria-live="polite"
        >
          <AlertTriangle 
            size={16} 
            className={highContrast ? "text-red-800" : "text-red-600 dark:text-red-400"} 
            aria-hidden="true"
          />
          <p className={cn(
            "text-sm",
            highContrast ? "text-red-800" : "text-red-600 dark:text-red-400"
          )}>
            {error}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * ACCESSIBLE MODAL TEMPLATE
 * Modal with proper focus management and screen reader support
 */
export const AccessibleModalTemplate = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  initialFocus,
  finalFocus,
  className,
  ...props
}) => {
  const { reducedMotion } = useAccessibility();
  const modalRef = useRef(null);
  const previousFocus = useRef(null);
  const closeButtonRef = useRef(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousFocus.current = document.activeElement;
      
      // Focus the modal or specified element
      setTimeout(() => {
        if (initialFocus?.current) {
          initialFocus.current.focus();
        } else if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        } else if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);
    } else if (previousFocus.current) {
      // Return focus to the previously focused element
      if (finalFocus?.current) {
        finalFocus.current.focus();
      } else {
        previousFocus.current.focus();
      }
    }
  }, [isOpen, initialFocus, finalFocus]);

  // Trap focus within modal
  const handleKeyDown = useCallback((event) => {
    if (!isOpen) return;

    if (event.key === 'Escape' && closeOnEscape) {
      event.preventDefault();
      onClose();
    }

    if (event.key === 'Tab') {
      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
      );

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable.focus();
        }
      }
    }
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  const handleOverlayClick = (event) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            onClick={handleOverlayClick}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            aria-describedby={description ? "modal-description" : undefined}
          >
            <motion.div
              ref={modalRef}
              className={cn(
                "bg-white dark:bg-gray-800 rounded-lg shadow-2xl",
                "border border-gray-200 dark:border-gray-700",
                "max-w-md w-full max-h-[90vh] overflow-y-auto",
                "focus:outline-none",
                className
              )}
              initial={!reducedMotion ? { opacity: 0, scale: 0.95, y: 20 } : { opacity: 0 }}
              animate={!reducedMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1 }}
              exit={!reducedMotion ? { opacity: 0, scale: 0.95, y: 20 } : { opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
              tabIndex={-1}
              {...props}
            >
              {/* Header */}
              {(title || onClose) && (
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  {title && (
                    <h2
                      id="modal-title"
                      className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                    >
                      {title}
                    </h2>
                  )}
                  
                  {onClose && (
                    <button
                      ref={closeButtonRef}
                      className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={onClose}
                      aria-label="Close modal"
                      style={{
                        minWidth: touchTargets.minimum,
                        minHeight: touchTargets.minimum,
                      }}
                    >
                      <X size={20} aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}

              {/* Description */}
              {description && (
                <div className="px-6 pt-2">
                  <p
                    id="modal-description"
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    {description}
                  </p>
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * ACCESSIBLE ALERT TEMPLATE
 * Screen reader friendly alerts with proper ARIA attributes
 */
export const AccessibleAlertTemplate = ({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  role = 'alert',
  className,
  ...props
}) => {
  const { highContrast } = useAccessibility();
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const variants = {
    info: {
      icon: Info,
      colors: {
        bg: highContrast ? '#E6F3FF' : colors.brand.primaryLight,
        border: highContrast ? '#0066CC' : colors.brand.primary,
        text: highContrast ? '#003366' : colors.brand.primary,
      },
    },
    success: {
      icon: Check,
      colors: {
        bg: highContrast ? '#E6FFE6' : colors.success.light,
        border: highContrast ? '#009900' : colors.success.DEFAULT,
        text: highContrast ? '#003300' : colors.success.DEFAULT,
      },
    },
    warning: {
      icon: AlertTriangle,
      colors: {
        bg: highContrast ? '#FFF3CD' : colors.warning.light,
        border: highContrast ? '#CC9900' : colors.warning.DEFAULT,
        text: highContrast ? '#663300' : colors.warning.DEFAULT,
      },
    },
    error: {
      icon: X,
      colors: {
        bg: highContrast ? '#FFE6E6' : colors.error.light,
        border: highContrast ? '#CC0000' : colors.error.DEFAULT,
        text: highContrast ? '#660000' : colors.error.DEFAULT,
      },
    },
  };

  const variantConfig = variants[variant];

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border-2",
        className
      )}
      style={{
        backgroundColor: variantConfig.colors.bg,
        borderColor: variantConfig.colors.border,
        color: variantConfig.colors.text,
      }}
      role={role}
      aria-live={role === 'alert' ? 'assertive' : 'polite'}
      {...props}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {React.createElement(variantConfig.icon, {
          size: 20,
          'aria-hidden': 'true',
        })}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-semibold mb-1">
            {title}
          </h4>
        )}
        <div className="text-sm">
          {children}
        </div>
      </div>

      {/* Dismiss Button */}
      {dismissible && (
        <button
          className="flex-shrink-0 rounded-full p-1 hover:bg-black/10 transition-colors"
          onClick={handleDismiss}
          aria-label="Dismiss alert"
          style={{
            minWidth: touchTargets.minimum,
            minHeight: touchTargets.minimum,
          }}
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default {
  AccessibilityProvider,
  useAccessibility,
  AccessibleButtonTemplate,
  AccessibleInputTemplate,
  AccessibleModalTemplate,
  AccessibleAlertTemplate,
};

/**
 * USAGE EXAMPLES:
 * 
 * // Wrap your app with the provider
 * <AccessibilityProvider>
 *   <App />
 * </AccessibilityProvider>
 * 
 * // Accessible Button
 * <AccessibleButtonTemplate
 *   variant="primary"
 *   size="default"
 *   ariaLabel="Add new expense"
 *   onClick={handleAddExpense}
 * >
 *   Add Expense
 * </AccessibleButtonTemplate>
 * 
 * // Accessible Input
 * <AccessibleInputTemplate
 *   id="expense-amount"
 *   type="number"
 *   label="Expense Amount"
 *   value={amount}
 *   onChange={(e) => setAmount(e.target.value)}
 *   required
 *   helperText="Enter the expense amount in USD"
 *   error={amountError}
 * />
 * 
 * // Accessible Modal
 * <AccessibleModalTemplate
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="Delete Expense"
 *   description="This action cannot be undone"
 *   initialFocus={confirmButtonRef}
 * >
 *   <p>Are you sure you want to delete this expense?</p>
 *   <div className="flex gap-3 mt-4">
 *     <AccessibleButtonTemplate
 *       ref={confirmButtonRef}
 *       variant="danger"
 *       onClick={handleDelete}
 *     >
 *       Delete
 *     </AccessibleButtonTemplate>
 *     <AccessibleButtonTemplate
 *       variant="secondary"
 *       onClick={() => setShowModal(false)}
 *     >
 *       Cancel
 *     </AccessibleButtonTemplate>
 *   </div>
 * </AccessibleModalTemplate>
 * 
 * // Accessible Alert
 * <AccessibleAlertTemplate
 *   variant="success"
 *   title="Success"
 *   dismissible
 *   onDismiss={() => setShowAlert(false)}
 * >
 *   Your expense has been added successfully.
 * </AccessibleAlertTemplate>
 */