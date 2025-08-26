import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { colors, spacing, borderRadius, shadows, typography, touchTargets } from '../design-system';
import { 
  Check,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Search,
  X,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  Star,
  Heart,
  ThumbsUp,
  Share,
  Bookmark,
  MoreHorizontal,
  Info
} from 'lucide-react';

/**
 * TOUCH-FRIENDLY UI ELEMENT TEMPLATES
 * 
 * Professional mobile UI elements optimized for touch interactions:
 * - Large touch targets (44px minimum)
 * - Clear visual feedback
 * - Appropriate spacing and padding
 * - Gesture-friendly interactions
 * - Accessibility compliant
 * - Consistent design language
 * 
 * Features:
 * - Apple Human Interface Guidelines compliant
 * - Material Design touch targets
 * - Smooth haptic feedback
 * - Progressive enhancement
 * - Responsive typography
 * - Dark mode support
 */

/**
 * TOUCH-FRIENDLY BUTTON TEMPLATE
 * Large, accessible buttons with proper touch targets
 */
export const TouchButtonTemplate = ({
  children,
  variant = 'primary',
  size = 'default',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  hapticFeedback = true,
  className,
  onClick,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const triggerHaptic = useCallback(() => {
    if (hapticFeedback && typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }
  }, [hapticFeedback]);

  const handlePress = () => {
    if (disabled || loading) return;
    setIsPressed(true);
    triggerHaptic();
    setTimeout(() => setIsPressed(false), 150);
    onClick?.();
  };

  const sizeConfig = {
    sm: {
      height: '40px',
      minWidth: touchTargets.minimum,
      padding: `${spacing[2]} ${spacing[3]}`,
      fontSize: typography.fontSize.sm.size,
      iconSize: 16,
    },
    default: {
      height: touchTargets.comfortable,
      minWidth: touchTargets.large,
      padding: `${spacing[3]} ${spacing[5]}`,
      fontSize: typography.fontSize.base.size,
      iconSize: 20,
    },
    lg: {
      height: touchTargets.large,
      minWidth: '72px',
      padding: `${spacing[4]} ${spacing[6]}`,
      fontSize: typography.fontSize.lg.size,
      iconSize: 24,
    },
  };

  const variantConfig = {
    primary: {
      bg: colors.brand.primary,
      text: colors.brand.primaryForeground,
      hover: colors.brand.primaryHover,
      shadow: shadows.primaryGlow,
    },
    secondary: {
      bg: colors.neutral[100],
      text: colors.neutral[700],
      hover: colors.neutral[200],
      border: `2px solid ${colors.neutral[300]}`,
    },
    success: {
      bg: colors.success.DEFAULT,
      text: colors.success.foreground,
      hover: colors.success.hover,
      shadow: shadows.successGlow,
    },
    danger: {
      bg: colors.error.DEFAULT,
      text: colors.error.foreground,
      hover: colors.error.hover,
      shadow: shadows.errorGlow,
    },
    ghost: {
      bg: 'transparent',
      text: colors.neutral[700],
      hover: colors.neutral[100],
      border: `2px solid transparent`,
    },
  };

  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];

  return (
    <motion.button
      className={cn(
        "relative flex items-center justify-center gap-2",
        "font-medium rounded-lg transition-all duration-200",
        "outline-none focus:outline-none",
        "select-none touch-manipulation",
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
        border: currentVariant.border || 'none',
        boxShadow: isPressed && !disabled ? currentVariant.shadow : shadows.sm,
      }}
      whileHover={!disabled ? {
        backgroundColor: currentVariant.hover,
        scale: 1.02,
        boxShadow: currentVariant.shadow,
        transition: { duration: 0.2 }
      } : undefined}
      whileTap={!disabled ? {
        scale: 0.98,
        transition: { duration: 0.1 }
      } : undefined}
      onClick={handlePress}
      disabled={disabled || loading}
      {...props}
    >
      {/* Loading Spinner */}
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div
            className="border-2 border-current border-t-transparent rounded-full animate-spin"
            style={{ width: currentSize.iconSize, height: currentSize.iconSize }}
          />
        </motion.div>
      )}

      {/* Content */}
      <div className={cn("flex items-center gap-2", loading && "opacity-0")}>
        {icon && iconPosition === 'left' && (
          React.createElement(icon, { size: currentSize.iconSize })
        )}
        {children}
        {icon && iconPosition === 'right' && (
          React.createElement(icon, { size: currentSize.iconSize })
        )}
      </div>

      {/* Ripple Effect */}
      <motion.div
        className="absolute inset-0 rounded-lg bg-white/20 pointer-events-none"
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 0, opacity: 0.8 }}
        whileTap={{
          scale: 2,
          opacity: 0,
          transition: { duration: 0.4 }
        }}
      />
    </motion.button>
  );
};

/**
 * TOUCH-FRIENDLY INPUT TEMPLATE
 * Large, accessible form inputs
 */
export const TouchInputTemplate = ({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  icon,
  iconPosition = 'left',
  showPasswordToggle = false,
  autoComplete,
  className,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef(null);

  const triggerHaptic = useCallback(() => {
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate(5);
    }
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    triggerHaptic();
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    triggerHaptic();
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={cn("relative", className)}>
      {/* Label */}
      {label && (
        <label
          className={cn(
            "block text-sm font-medium mb-2 transition-colors duration-200",
            error ? "text-red-700 dark:text-red-400" : "text-gray-700 dark:text-gray-300"
          )}
          htmlFor={props.id}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            {React.createElement(icon, {
              size: 20,
              className: cn(
                "transition-colors duration-200",
                isFocused ? "text-blue-500" : "text-gray-400"
              )
            })}
          </div>
        )}

        {/* Input Field */}
        <motion.input
          ref={inputRef}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={cn(
            "w-full bg-white dark:bg-gray-800 rounded-lg",
            "border-2 transition-all duration-200",
            "text-gray-900 dark:text-gray-100",
            "placeholder-gray-500 dark:placeholder-gray-400",
            "focus:outline-none",
            // Padding adjustments for icons
            icon && iconPosition === 'left' && "pl-12",
            (showPasswordToggle || (icon && iconPosition === 'right')) && "pr-12",
            // State-specific styling
            error 
              ? "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-2 focus:ring-red-200"
              : isFocused
                ? "border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
            disabled && "bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-50"
          )}
          style={{
            height: touchTargets.comfortable,
            padding: icon && iconPosition === 'left' 
              ? `${spacing[3]} ${spacing[12]} ${spacing[3]} ${spacing[12]}` 
              : `${spacing[3]} ${spacing[4]}`,
            fontSize: typography.fontSize.base.size,
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          whileFocus={{
            scale: 1.01,
            transition: { duration: 0.2 }
          }}
          {...props}
        />

        {/* Right Icon / Password Toggle */}
        {(showPasswordToggle && type === 'password') || (icon && iconPosition === 'right') && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {showPasswordToggle && type === 'password' ? (
              <motion.button
                type="button"
                className={cn(
                  "rounded-full p-1 transition-colors duration-200",
                  "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                )}
                whileTap={{ scale: 0.95 }}
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </motion.button>
            ) : icon && iconPosition === 'right' ? (
              React.createElement(icon, {
                size: 20,
                className: cn(
                  "transition-colors duration-200",
                  isFocused ? "text-blue-500" : "text-gray-400"
                )
              })
            ) : null}
          </div>
        )}

        {/* Focus Ring */}
        {isFocused && !error && (
          <motion.div
            className="absolute inset-0 rounded-lg border-2 border-blue-500 pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <motion.p
          className="text-red-600 dark:text-red-400 text-sm mt-2 flex items-center gap-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Info size={14} />
          {error}
        </motion.p>
      )}
    </div>
  );
};

/**
 * TOUCH-FRIENDLY SWITCH TEMPLATE
 * Large toggle switch with smooth animations
 */
export const TouchSwitchTemplate = ({
  checked = false,
  onChange,
  disabled = false,
  label,
  description,
  size = 'default',
  color = 'primary',
  hapticFeedback = true,
  className,
  ...props
}) => {
  const triggerHaptic = useCallback(() => {
    if (hapticFeedback && typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate(15);
    }
  }, [hapticFeedback]);

  const handleToggle = () => {
    if (disabled) return;
    triggerHaptic();
    onChange?.(!checked);
  };

  const sizeConfig = {
    sm: { width: '40px', height: '24px', thumb: '20px', translate: '16px' },
    default: { width: '52px', height: '32px', thumb: '28px', translate: '20px' },
    lg: { width: '64px', height: '40px', thumb: '36px', translate: '24px' },
  };

  const colorConfig = {
    primary: colors.brand.primary,
    success: colors.success.DEFAULT,
    warning: colors.warning.DEFAULT,
    error: colors.error.DEFAULT,
  };

  const currentSize = sizeConfig[size];
  const activeColor = colorConfig[color];

  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      {/* Switch */}
      <motion.button
        className={cn(
          "relative rounded-full transition-all duration-300",
          "focus:outline-none focus:ring-4 focus:ring-opacity-50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        style={{
          width: currentSize.width,
          height: currentSize.height,
          backgroundColor: checked ? activeColor : colors.neutral[300],
          focusRingColor: `${activeColor}40`,
        }}
        whileTap={!disabled ? { scale: 0.95 } : undefined}
        onClick={handleToggle}
        disabled={disabled}
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        {/* Thumb */}
        <motion.div
          className="absolute top-1/2 transform -translate-y-1/2 bg-white rounded-full shadow-md"
          style={{
            width: currentSize.thumb,
            height: currentSize.thumb,
          }}
          animate={{
            x: checked ? currentSize.translate : '2px',
            transition: { type: "spring", stiffness: 500, damping: 30 }
          }}
        />

        {/* Background Pattern (optional) */}
        {checked && (
          <motion.div
            className="absolute inset-0 rounded-full opacity-20"
            style={{ backgroundColor: 'white' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.button>

      {/* Label and Description */}
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <div 
              className="text-gray-900 dark:text-gray-100 font-medium cursor-pointer"
              onClick={handleToggle}
              style={{ fontSize: typography.fontSize.base.size }}
            >
              {label}
            </div>
          )}
          {description && (
            <div 
              className="text-gray-600 dark:text-gray-400 mt-1"
              style={{ fontSize: typography.fontSize.sm.size }}
            >
              {description}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * TOUCH-FRIENDLY STEPPER TEMPLATE
 * Numeric stepper with large touch targets
 */
export const TouchStepperTemplate = ({
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  disabled = false,
  size = 'default',
  showValue = true,
  hapticFeedback = true,
  className,
  ...props
}) => {
  const triggerHaptic = useCallback(() => {
    if (hapticFeedback && typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }
  }, [hapticFeedback]);

  const handleIncrement = () => {
    if (disabled || value >= max) return;
    triggerHaptic();
    onChange?.(Math.min(value + step, max));
  };

  const handleDecrement = () => {
    if (disabled || value <= min) return;
    triggerHaptic();
    onChange?.(Math.max(value - step, min));
  };

  const sizeConfig = {
    sm: { height: '32px', iconSize: 16 },
    default: { height: touchTargets.comfortable, iconSize: 20 },
    lg: { height: touchTargets.large, iconSize: 24 },
  };

  const currentSize = sizeConfig[size];
  const canDecrement = value > min && !disabled;
  const canIncrement = value < max && !disabled;

  return (
    <div 
      className={cn("flex items-center rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800", className)}
      style={{ height: currentSize.height }}
      {...props}
    >
      {/* Decrement Button */}
      <motion.button
        className={cn(
          "flex items-center justify-center rounded-l-lg",
          "transition-colors duration-200",
          canDecrement 
            ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" 
            : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
        )}
        style={{
          width: currentSize.height,
          height: '100%',
        }}
        whileTap={canDecrement ? { scale: 0.95 } : undefined}
        onClick={handleDecrement}
        disabled={!canDecrement}
        aria-label="Decrease value"
      >
        <Minus size={currentSize.iconSize} />
      </motion.button>

      {/* Value Display */}
      {showValue && (
        <div 
          className="flex-1 flex items-center justify-center font-mono font-medium text-gray-900 dark:text-gray-100 border-x border-gray-300 dark:border-gray-600"
          style={{ fontSize: typography.fontSize.base.size }}
        >
          {value}
        </div>
      )}

      {/* Increment Button */}
      <motion.button
        className={cn(
          "flex items-center justify-center rounded-r-lg",
          "transition-colors duration-200",
          canIncrement 
            ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" 
            : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
        )}
        style={{
          width: currentSize.height,
          height: '100%',
        }}
        whileTap={canIncrement ? { scale: 0.95 } : undefined}
        onClick={handleIncrement}
        disabled={!canIncrement}
        aria-label="Increase value"
      >
        <Plus size={currentSize.iconSize} />
      </motion.button>
    </div>
  );
};

/**
 * TOUCH-FRIENDLY ACTION SHEET TEMPLATE
 * Bottom sheet with large touch targets for actions
 */
export const TouchActionSheetTemplate = ({
  isOpen,
  onClose,
  title,
  description,
  actions = [],
  showCancel = true,
  cancelText = "Cancel",
  className,
  ...props
}) => {
  const triggerHaptic = useCallback(() => {
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate(15);
    }
  }, []);

  const handleActionClick = (action) => {
    triggerHaptic();
    action.onClick?.();
    onClose?.();
  };

  const handleCancel = () => {
    triggerHaptic();
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
          />

          {/* Action Sheet */}
          <motion.div
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "bg-white dark:bg-gray-900 rounded-t-3xl",
              "shadow-2xl border-t border-gray-200 dark:border-gray-700",
              "max-h-[80vh] overflow-hidden",
              className
            )}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            {...props}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            {(title || description) && (
              <div className="px-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                {title && (
                  <h3 
                    className="font-semibold text-gray-900 dark:text-gray-100 text-center"
                    style={{ fontSize: typography.fontSize.lg.size }}
                  >
                    {title}
                  </h3>
                )}
                {description && (
                  <p 
                    className="text-gray-600 dark:text-gray-400 text-center mt-1"
                    style={{ fontSize: typography.fontSize.sm.size }}
                  >
                    {description}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="py-4">
              {actions.map((action, index) => (
                <motion.button
                  key={action.key || index}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 px-6",
                    "text-left transition-colors duration-200",
                    "border-b border-gray-100 dark:border-gray-800 last:border-b-0",
                    action.destructive 
                      ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      : "text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                  style={{
                    height: touchTargets.large,
                    fontSize: typography.fontSize.base.size,
                    fontWeight: typography.fontWeight.medium,
                  }}
                  whileTap={{ scale: 0.98, backgroundColor: 'rgba(0,0,0,0.05)' }}
                  onClick={() => handleActionClick(action)}
                >
                  {action.icon && React.createElement(action.icon, { size: 20 })}
                  <span>{action.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Cancel Button */}
            {showCancel && (
              <>
                <div className="h-2 bg-gray-100 dark:bg-gray-800" />
                <motion.button
                  className="w-full text-center font-medium text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                  style={{
                    height: touchTargets.large,
                    fontSize: typography.fontSize.base.size,
                    paddingBottom: 'env(safe-area-inset-bottom)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancel}
                >
                  {cancelText}
                </motion.button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default {
  TouchButtonTemplate,
  TouchInputTemplate,
  TouchSwitchTemplate,
  TouchStepperTemplate,
  TouchActionSheetTemplate,
};

/**
 * USAGE EXAMPLES:
 * 
 * // Touch Button
 * <TouchButtonTemplate
 *   variant="primary"
 *   size="default"
 *   icon={Plus}
 *   fullWidth
 *   onClick={handleAdd}
 * >
 *   Add Expense
 * </TouchButtonTemplate>
 * 
 * // Touch Input
 * <TouchInputTemplate
 *   type="text"
 *   label="Expense Description"
 *   placeholder="Enter description..."
 *   value={description}
 *   onChange={(e) => setDescription(e.target.value)}
 *   icon={Search}
 *   required
 * />
 * 
 * // Touch Switch
 * <TouchSwitchTemplate
 *   checked={notifications}
 *   onChange={setNotifications}
 *   label="Push Notifications"
 *   description="Receive alerts for new expenses"
 *   size="default"
 *   color="primary"
 * />
 * 
 * // Touch Stepper
 * <TouchStepperTemplate
 *   value={quantity}
 *   min={1}
 *   max={99}
 *   onChange={setQuantity}
 *   size="default"
 *   showValue
 * />
 * 
 * // Action Sheet
 * <TouchActionSheetTemplate
 *   isOpen={showActions}
 *   onClose={() => setShowActions(false)}
 *   title="Choose Action"
 *   actions={[
 *     { icon: Edit, label: "Edit Expense", onClick: handleEdit },
 *     { icon: Trash2, label: "Delete", destructive: true, onClick: handleDelete }
 *   ]}
 * />
 */