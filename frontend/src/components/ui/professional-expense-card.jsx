import React, { useState, forwardRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { formatCurrency } from '../../utils/currency';
import { cn } from '../../lib/utils';
import { colors, components, utils, typography, spacing, shadows } from './design-system';
import { Button } from './button';
import { Badge } from './badge';
import { 
  Edit2, 
  Trash2, 
  Copy, 
  FileText, 
  Calendar, 
  User, 
  ChevronDown,
  ChevronUp,
  CreditCard,
  Smartphone,
  Star,
  Clock,
  MapPin,
  Tag
} from 'lucide-react';

/**
 * Professional Expense Card Component
 * Features professional mobile-first design with:
 * - Smart iconography to reduce text redundancy
 * - Gesture-friendly interactions with haptic feedback
 * - Professional color system and typography
 * - Sleek micro-animations and touch feedback
 * - Enhanced visual hierarchy
 */

const ProfessionalExpenseCard = forwardRef(({
  expense,
  isSelected = false,
  isLoading = false,
  variant = 'default', // 'default', 'compact', 'detailed'
  enableSwipeActions = true,
  enableExpandToggle = true,
  showDetails = true,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onViewReceipt,
  className,
  ...props
}, ref) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Motion values for gesture interactions
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0, 100], [0.8, 1, 0.8]);
  const scale = useTransform(x, [-100, 0, 100], [0.95, 1, 0.95]);

  // Haptic feedback (progressive enhancement)
  const triggerHaptic = (intensity = 'medium') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: 10,
        medium: 25,
        strong: [50, 25, 50],
      };
      navigator.vibrate(patterns[intensity] || patterns.medium);
    }
  };

  // Category color utility
  const categoryColor = utils.getCategoryColor(expense?.category?.name);
  const amountStyling = utils.getAmountStyling(expense?.amount || 0);

  // Gesture handlers
  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    const threshold = 80;
    const velocity = Math.abs(info.velocity.x);
    
    if (velocity > 500 || Math.abs(info.offset.x) > threshold) {
      if (info.offset.x > 0) {
        // Swipe right - Edit
        triggerHaptic('medium');
        setTimeout(() => {
          onEdit?.(expense);
          x.set(0);
        }, 150);
      } else {
        // Swipe left - Delete
        triggerHaptic('strong');
        setTimeout(() => {
          onDelete?.(expense.id);
          x.set(0);
        }, 150);
      }
    } else {
      x.set(0);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
    triggerHaptic('light');
  };

  // Animation variants
  const cardVariants = {
    initial: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95 
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn(
        "rounded-2xl overflow-hidden",
        "bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100",
        "animate-pulse",
        className
      )}
      style={{
        height: variant === 'compact' ? '80px' : '120px',
        ...utils.skeleton()
      }}>
        <div className="p-5 space-y-3">
          <div className="h-4 bg-neutral-200 rounded-full w-3/4"></div>
          <div className="h-6 bg-neutral-200 rounded-full w-1/2"></div>
          {variant !== 'compact' && (
            <div className="h-3 bg-neutral-200 rounded-full w-1/4"></div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Swipe Action Backgrounds */}
      {enableSwipeActions && (
        <>
          {/* Edit Action - Right */}
          <div 
            className="absolute inset-y-0 left-0 flex items-center justify-start pl-6"
            style={{ 
              width: '80px',
              background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.primaryHover})`
            }}
          >
            <motion.div
              style={{ 
                opacity: useTransform(x, [0, 60], [0, 1]),
                scale: useTransform(x, [0, 60], [0.8, 1])
              }}
              className="text-white"
            >
              <Edit2 size={20} />
            </motion.div>
          </div>
          
          {/* Delete Action - Left */}
          <div 
            className="absolute inset-y-0 right-0 flex items-center justify-end pr-6"
            style={{ 
              width: '80px',
              background: `linear-gradient(225deg, ${colors.error.DEFAULT}, ${colors.error.hover})`
            }}
          >
            <motion.div
              style={{ 
                opacity: useTransform(x, [-60, 0], [1, 0]),
                scale: useTransform(x, [-60, 0], [1, 0.8])
              }}
              className="text-white"
            >
              <Trash2 size={20} />
            </motion.div>
          </div>
        </>
      )}

      {/* Main Card */}
      <motion.div
        ref={ref}
        className={cn(
          "relative overflow-hidden touch-manipulation",
          "transition-all duration-200",
          className
        )}
        style={{
          borderRadius: components.card.borderRadius.DEFAULT,
          backgroundColor: colors.neutral[0],
          border: `1px solid ${isSelected ? colors.brand.primary : colors.neutral[200]}`,
          boxShadow: isSelected 
            ? components.card.shadow.selected
            : isDragging 
              ? components.card.shadow.hover 
              : components.card.shadow.DEFAULT,
          x,
          opacity,
          scale
        }}
        variants={cardVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        drag={enableSwipeActions ? "x" : false}
        dragConstraints={{ left: -100, right: 100 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelect?.(expense.id, !isSelected)}
        {...props}
      >
        {/* Selection Indicator */}
        {isSelected && (
          <div 
            className="absolute top-0 left-0 w-full h-1"
            style={{ 
              background: `linear-gradient(90deg, ${colors.brand.primary}, ${colors.brand.primaryHover})`
            }}
          />
        )}

        {/* Card Content */}
        <div 
          className="p-5"
          style={{ 
            paddingTop: isSelected ? spacing[4] : spacing[5]
          }}
        >
          {/* Header Row */}
          <div className="flex items-start justify-between mb-3">
            {/* Left Column - Main Info */}
            <div className="flex-1 min-w-0 pr-4">
              {/* Amount - Most prominent */}
              <div className="flex items-center mb-2">
                <div className="flex items-baseline">
                  <CreditCard 
                    size={16} 
                    style={{ color: categoryColor.color }}
                    className="mr-2 flex-shrink-0"
                  />
                  <span 
                    className="font-mono leading-tight"
                    style={{
                      fontSize: amountStyling.fontSize,
                      fontWeight: amountStyling.fontWeight,
                      color: amountStyling.color,
                      letterSpacing: typography.letterSpacing.tight
                    }}
                  >
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
              </div>

              {/* Description */}
              <h3 
                className="leading-tight mb-2"
                style={{
                  fontSize: typography.fontSize.lg.size,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.neutral[900],
                  ...utils.truncate(2)
                }}
              >
                {expense.description}
              </h3>

              {/* Meta Row with Smart Icons */}
              <div className="flex items-center space-x-4">
                {/* Date */}
                <div className="flex items-center">
                  <Calendar 
                    size={12} 
                    style={{ color: colors.neutral[500] }}
                    className="mr-1.5"
                  />
                  <span 
                    className="leading-tight"
                    style={{
                      fontSize: typography.fontSize.xs.size,
                      color: colors.neutral[600],
                      fontWeight: typography.fontWeight.medium
                    }}
                  >
                    {new Date(expense.expense_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                {/* Category */}
                <div className="flex items-center">
                  <div 
                    className="w-2.5 h-2.5 rounded-full mr-1.5"
                    style={{ backgroundColor: categoryColor.color }}
                  />
                  <span 
                    className="leading-tight"
                    style={{
                      fontSize: typography.fontSize.xs.size,
                      color: colors.neutral[600],
                      fontWeight: typography.fontWeight.medium,
                      ...utils.truncate(1)
                    }}
                  >
                    {expense.category?.name || 'Other'}
                  </span>
                </div>

                {/* Device indicator */}
                {expense.device_info && (
                  <div className="flex items-center">
                    {expense.device_info.includes('Mobile') ? (
                      <Smartphone size={12} style={{ color: colors.neutral[400] }} />
                    ) : (
                      <CreditCard size={12} style={{ color: colors.neutral[400] }} />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Actions */}
            <div className="flex flex-col items-end space-y-2">
              {/* Quick Actions */}
              <div className="flex items-center space-x-1">
                {expense.receipt_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewReceipt?.(expense.receipt_url);
                      triggerHaptic('light');
                    }}
                    className="w-8 h-8 p-0 rounded-full"
                    style={{ 
                      color: colors.success.DEFAULT,
                      ...utils.touchFeedback()
                    }}
                  >
                    <FileText size={14} />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate?.(expense);
                    triggerHaptic('light');
                  }}
                  className="w-8 h-8 p-0 rounded-full"
                  style={{ 
                    color: colors.brand.primary,
                    ...utils.touchFeedback()
                  }}
                >
                  <Copy size={14} />
                </Button>
              </div>

              {/* Expand Toggle */}
              {enableExpandToggle && showDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                    triggerHaptic('light');
                  }}
                  className="w-8 h-8 p-0 rounded-full"
                  style={{ 
                    color: colors.neutral[500],
                    ...utils.touchFeedback()
                  }}
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </Button>
              )}
            </div>
          </div>

          {/* Expandable Details */}
          {enableExpandToggle && showDetails && (
            <motion.div
              initial={false}
              animate={{
                height: isExpanded ? 'auto' : 0,
                opacity: isExpanded ? 1 : 0
              }}
              transition={{ 
                duration: 0.3,
                ease: 'easeInOut'
              }}
              className="overflow-hidden"
            >
              <div 
                className="pt-3 space-y-3"
                style={{ 
                  borderTop: `1px solid ${colors.neutral[200]}`,
                  marginTop: spacing[3]
                }}
              >
                {/* Notes */}
                {expense.notes && (
                  <div>
                    <div className="flex items-center mb-2">
                      <FileText 
                        size={12} 
                        style={{ color: colors.neutral[500] }}
                        className="mr-2"
                      />
                      <span 
                        className="uppercase tracking-wide"
                        style={{
                          fontSize: typography.fontSize.xs.size,
                          fontWeight: typography.fontWeight.semibold,
                          color: colors.neutral[500]
                        }}
                      >
                        Notes
                      </span>
                    </div>
                    <p 
                      className="leading-relaxed"
                      style={{
                        fontSize: typography.fontSize.sm.size,
                        color: colors.neutral[700],
                        paddingLeft: spacing[5]
                      }}
                    >
                      {expense.notes}
                    </p>
                  </div>
                )}

                {/* User Info (if admin view) */}
                {expense.created_by_user && (
                  <div>
                    <div className="flex items-center mb-2">
                      <User 
                        size={12} 
                        style={{ color: colors.neutral[500] }}
                        className="mr-2"
                      />
                      <span 
                        className="uppercase tracking-wide"
                        style={{
                          fontSize: typography.fontSize.xs.size,
                          fontWeight: typography.fontWeight.semibold,
                          color: colors.neutral[500]
                        }}
                      >
                        Created By
                      </span>
                    </div>
                    <p 
                      className="leading-relaxed"
                      style={{
                        fontSize: typography.fontSize.sm.size,
                        color: colors.neutral[700],
                        paddingLeft: spacing[5]
                      }}
                    >
                      {expense.created_by_user.full_name || 'Unknown User'}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(expense);
                      triggerHaptic('medium');
                    }}
                    className="flex-1"
                    style={{
                      borderColor: colors.brand.primary + '40',
                      color: colors.brand.primary,
                      ...utils.touchFeedback()
                    }}
                  >
                    <Edit2 size={14} className="mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete "${expense.description}"?`)) {
                        onDelete?.(expense.id);
                        triggerHaptic('strong');
                      }
                    }}
                    className="flex-1"
                    style={{
                      borderColor: colors.error.DEFAULT + '40',
                      color: colors.error.DEFAULT,
                      ...utils.touchFeedback()
                    }}
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Drag Hint */}
          {isDragging && enableSwipeActions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-2 left-1/2 transform -translate-x-1/2"
            >
              <div 
                className="px-3 py-1 rounded-full text-xs font-medium text-white backdrop-blur-sm"
                style={{ backgroundColor: colors.neutral[800] + '90' }}
              >
                {x.get() > 0 ? '← Edit' : x.get() < 0 ? 'Delete →' : 'Swipe for actions'}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
});

ProfessionalExpenseCard.displayName = 'ProfessionalExpenseCard';

export default ProfessionalExpenseCard;