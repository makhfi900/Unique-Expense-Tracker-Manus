import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { colors, spacing, borderRadius, shadows, typography, touchTargets } from '../design-system';
import { 
  Edit, 
  Trash2, 
  Copy, 
  FileText, 
  Calendar, 
  User, 
  ChevronDown,
  ChevronUp,
  CreditCard,
  Star,
  Archive,
  Eye,
  MoreHorizontal
} from 'lucide-react';

/**
 * MOBILE EXPENSE CARD TEMPLATE
 * 
 * Professional, spacious mobile-first expense card with:
 * - Clean visual hierarchy with generous spacing
 * - Touch-friendly interactions (48px+ targets)
 * - Smooth gesture-based actions
 * - Accessible design patterns
 * - Responsive typography scaling
 * - Professional elevation and shadows
 * 
 * Design Principles:
 * - Mobile-first approach with desktop enhancement
 * - Minimum 44px touch targets (Apple HIG)
 * - 16px base spacing with consistent rhythm
 * - Clear information architecture
 * - Subtle but effective visual feedback
 */

const MobileExpenseCardTemplate = ({ 
  expense, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onToggleSelect,
  onViewDetails,
  isSelected = false,
  isAdmin = false,
  showUserInfo = false,
  className = "",
  // Template customization props
  variant = 'default', // 'default', 'compact', 'detailed'
  swipeEnabled = true,
  expandable = true,
  ...props
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  
  // Motion values for smooth swipe interactions
  const x = useMotionValue(0);
  const dragRef = useRef(null);
  
  // Smooth transform animations for swipe reveals
  const editReveal = useTransform(x, [40, 120], [0, 1]);
  const deleteReveal = useTransform(x, [-120, -40], [1, 0]);
  const cardScale = useTransform(x, [-40, 0, 40], [0.98, 1, 0.98]);

  // Haptic feedback utility
  const triggerHaptic = (intensity = 'light') => {
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      const patterns = {
        light: 10,
        medium: 30,
        strong: [40, 20, 40]
      };
      window.navigator.vibrate(patterns[intensity]);
    }
  };

  // Swipe gesture handlers
  const handleDragStart = () => {
    if (!swipeEnabled) return;
    setIsDragging(true);
    triggerHaptic('light');
  };

  const handleDragEnd = (event, info) => {
    if (!swipeEnabled) return;
    
    setIsDragging(false);
    const threshold = 80;
    const velocity = Math.abs(info.velocity.x);
    const offset = info.offset.x;
    
    if (velocity > 500 || Math.abs(offset) > threshold) {
      if (offset > 0) {
        // Right swipe - Edit
        triggerHaptic('medium');
        setSwipeDirection('edit');
        setTimeout(() => {
          onEdit?.(expense);
          x.set(0);
          setSwipeDirection(null);
        }, 200);
      } else {
        // Left swipe - Delete
        triggerHaptic('strong');
        setSwipeDirection('delete');
        setTimeout(() => {
          onDelete?.(expense.id);
          x.set(0);
          setSwipeDirection(null);
        }, 200);
      }
    } else {
      // Snap back to center
      x.set(0);
      setSwipeDirection(null);
    }
  };

  // Toggle expansion with smooth animation
  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
    triggerHaptic('light');
  };

  // Handle card tap for selection
  const handleCardTap = (event) => {
    if (event.target.closest('button')) return;
    onToggleSelect?.(expense.id, !isSelected);
    triggerHaptic('light');
  };

  // Format currency with proper spacing
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date with mobile-friendly format
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  // Variant-specific styling
  const variantStyles = {
    default: {
      padding: spacing[6], // 24px
      minHeight: '120px',
      borderRadius: borderRadius.xl,
    },
    compact: {
      padding: spacing[4], // 16px
      minHeight: '80px',
      borderRadius: borderRadius.lg,
    },
    detailed: {
      padding: spacing[8], // 32px
      minHeight: '140px',
      borderRadius: borderRadius['2xl'],
    }
  };

  const currentVariant = variantStyles[variant];

  return (
    <div className={cn("relative mb-4", className)} {...props}>
      {/* Swipe Action Background Indicators */}
      {swipeEnabled && (
        <>
          {/* Edit Action (Right Swipe) */}
          <motion.div
            className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl"
            style={{ 
              opacity: editReveal,
              scale: useTransform(editReveal, [0, 1], [0.8, 1])
            }}
          >
            <Edit className="w-6 h-6 text-white drop-shadow-sm" />
          </motion.div>

          {/* Delete Action (Left Swipe) */}
          <motion.div
            className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-20 bg-gradient-to-l from-red-500 to-red-600 rounded-xl"
            style={{ 
              opacity: deleteReveal,
              scale: useTransform(deleteReveal, [0, 1], [0.8, 1])
            }}
          >
            <Trash2 className="w-6 h-6 text-white drop-shadow-sm" />
          </motion.div>
        </>
      )}

      {/* Main Card Container */}
      <motion.div
        ref={dragRef}
        drag={swipeEnabled ? "x" : false}
        dragElastic={0.1}
        dragConstraints={{ left: -140, right: 140 }}
        style={{ 
          x,
          scale: cardScale
        }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.98 }}
        animate={{
          rotateZ: swipeDirection ? (swipeDirection === 'edit' ? 1 : -1) : 0,
          scale: swipeDirection ? 0.95 : 1
        }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 30,
          duration: 0.2
        }}
        onClick={handleCardTap}
        className={cn(
          "relative cursor-pointer touch-manipulation select-none",
          "bg-white dark:bg-gray-800",
          "border-2 transition-all duration-300",
          "backdrop-blur-sm",
          isDragging && "z-10 shadow-2xl",
          isSelected 
            ? "border-blue-500 bg-blue-50/80 dark:bg-blue-900/20 shadow-lg shadow-blue-500/25" 
            : "border-gray-200/60 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md"
        )}
        style={{
          padding: currentVariant.padding,
          minHeight: currentVariant.minHeight,
          borderRadius: currentVariant.borderRadius,
          boxShadow: isDragging ? shadows.xl : shadows.sm,
        }}
      >
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          {/* Primary Information */}
          <div className="flex-1 min-w-0 pr-4">
            {/* Amount - Hero Element */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30",
                  "flex items-center justify-center mr-3"
                )}>
                  <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div 
                    className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 font-mono tracking-tight"
                    style={{ 
                      fontSize: typography.fontSize['2xl'].size,
                      lineHeight: typography.fontSize['2xl'].lineHeight
                    }}
                  >
                    {formatAmount(expense.amount)}
                  </div>
                  {isSelected && (
                    <div className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full border border-blue-300 dark:border-blue-600 mt-1">
                      Selected
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <h3 
              className="font-semibold text-gray-900 dark:text-gray-100 leading-tight mb-3 truncate"
              style={{
                fontSize: typography.fontSize.lg.size,
                lineHeight: typography.fontSize.lg.lineHeight,
                fontWeight: typography.fontWeight.semibold
              }}
            >
              {expense.description}
            </h3>

            {/* Metadata Row */}
            <div className="flex items-center gap-6 text-sm">
              {/* Date */}
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="font-medium">
                  {formatDate(expense.expense_date)}
                </span>
              </div>
              
              {/* Category */}
              <div className="flex items-center min-w-0">
                <div 
                  className="w-4 h-4 rounded-full mr-2 flex-shrink-0"
                  style={{ backgroundColor: expense.category?.color || colors.neutral[400] }}
                />
                <span className="text-gray-600 dark:text-gray-400 font-medium truncate">
                  {expense.category?.name || 'Uncategorized'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {/* Primary Actions */}
            <div className="flex items-center gap-2">
              {/* Quick Duplicate */}
              <motion.button
                className={cn(
                  "rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50",
                  "border border-blue-200 dark:border-blue-700",
                  "text-blue-600 dark:text-blue-400",
                  "transition-colors duration-200",
                  "flex items-center justify-center"
                )}
                style={{
                  width: touchTargets.minimum,
                  height: touchTargets.minimum
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate?.(expense);
                  triggerHaptic('light');
                }}
                aria-label="Duplicate expense"
              >
                <Copy className="w-4 h-4" />
              </motion.button>
              
              {/* Receipt Viewer */}
              {expense.receipt_url && (
                <motion.button
                  className={cn(
                    "rounded-lg bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50",
                    "border border-emerald-200 dark:border-emerald-700",
                    "text-emerald-600 dark:text-emerald-400",
                    "transition-colors duration-200",
                    "flex items-center justify-center"
                  )}
                  style={{
                    width: touchTargets.minimum,
                    height: touchTargets.minimum
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(expense.receipt_url, '_blank');
                    triggerHaptic('light');
                  }}
                  aria-label="View receipt"
                >
                  <FileText className="w-4 h-4" />
                </motion.button>
              )}
            </div>

            {/* Expand Toggle */}
            {expandable && (expense.notes || (showUserInfo && expense.created_by_user)) && (
              <motion.button
                className={cn(
                  "rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700",
                  "border border-gray-200 dark:border-gray-600",
                  "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
                  "transition-colors duration-200",
                  "flex items-center justify-center"
                )}
                style={{
                  width: touchTargets.minimum,
                  height: touchTargets.minimum
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpansion();
                }}
                aria-label={isExpanded ? "Collapse details" : "Expand details"}
                aria-expanded={isExpanded}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </motion.button>
            )}
          </div>
        </div>

        {/* Expandable Details Section */}
        {expandable && (
          <motion.div
            initial={false}
            animate={{
              height: isExpanded ? 'auto' : 0,
              opacity: isExpanded ? 1 : 0
            }}
            transition={{ 
              duration: 0.3,
              ease: "easeInOut"
            }}
            className="overflow-hidden"
          >
            <div 
              className="border-t border-gray-200/60 dark:border-gray-700/60"
              style={{ paddingTop: spacing[4], marginTop: spacing[4] }}
            >
              <div className="space-y-4">
                {/* Notes Section */}
                {expense.notes && (
                  <div>
                    <div className="flex items-center mb-2">
                      <Eye className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Notes
                      </span>
                    </div>
                    <p 
                      className="text-gray-700 dark:text-gray-300 leading-relaxed"
                      style={{ 
                        fontSize: typography.fontSize.sm.size,
                        lineHeight: typography.fontSize.sm.lineHeight,
                        paddingLeft: spacing[6]
                      }}
                    >
                      {expense.notes}
                    </p>
                  </div>
                )}

                {/* User Information (Admin/Shared contexts) */}
                {showUserInfo && expense.created_by_user && (
                  <div>
                    <div className="flex items-center mb-2">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Created By
                      </span>
                    </div>
                    <p 
                      className="text-gray-700 dark:text-gray-300"
                      style={{ 
                        fontSize: typography.fontSize.sm.size,
                        paddingLeft: spacing[6]
                      }}
                    >
                      {expense.created_by_user.full_name || 'Unknown User'}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <motion.button
                    className={cn(
                      "flex-1 rounded-lg border border-blue-200 dark:border-blue-700",
                      "bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50",
                      "text-blue-700 dark:text-blue-300 font-medium",
                      "flex items-center justify-center gap-2",
                      "transition-colors duration-200"
                    )}
                    style={{ 
                      height: touchTargets.comfortable,
                      fontSize: typography.fontSize.sm.size
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(expense);
                      triggerHaptic('medium');
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </motion.button>
                  
                  <motion.button
                    className={cn(
                      "flex-1 rounded-lg border border-red-200 dark:border-red-700",
                      "bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50",
                      "text-red-700 dark:text-red-300 font-medium",
                      "flex items-center justify-center gap-2",
                      "transition-colors duration-200"
                    )}
                    style={{ 
                      height: touchTargets.comfortable,
                      fontSize: typography.fontSize.sm.size
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete "${expense.description}"?`)) {
                        onDelete?.(expense.id);
                        triggerHaptic('strong');
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Swipe Guidance Overlay */}
        {swipeEnabled && isDragging && (
          <motion.div
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 8 }}
            style={{ zIndex: 1000 }}
          >
            <div className="bg-black/80 text-white text-xs px-3 py-2 rounded-full backdrop-blur-sm font-medium">
              {x.get() > 20 ? '← Swipe to Edit' : x.get() < -20 ? 'Swipe to Delete →' : 'Keep swiping'}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

// Export with display name for debugging
MobileExpenseCardTemplate.displayName = 'MobileExpenseCardTemplate';

export default MobileExpenseCardTemplate;

/**
 * USAGE EXAMPLES:
 * 
 * // Basic usage
 * <MobileExpenseCardTemplate
 *   expense={expense}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onDuplicate={handleDuplicate}
 *   onToggleSelect={handleSelect}
 * />
 * 
 * // Compact variant for dense lists
 * <MobileExpenseCardTemplate
 *   expense={expense}
 *   variant="compact"
 *   swipeEnabled={false}
 *   expandable={false}
 *   {...handlers}
 * />
 * 
 * // Detailed variant for single expense view
 * <MobileExpenseCardTemplate
 *   expense={expense}
 *   variant="detailed"
 *   showUserInfo={true}
 *   isSelected={true}
 *   {...handlers}
 * />
 */