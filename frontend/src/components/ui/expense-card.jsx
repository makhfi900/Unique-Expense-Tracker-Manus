import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/currency';
import { cn } from '../../lib/utils';
import { colors, components, utils } from './design-system';
import { Button } from './button';
import { Badge } from './badge';
import { 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash2, 
  FileText,
  Calendar,
  Tag,
  CreditCard,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Star,
  StarOff
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog';

/**
 * Modern Expense Card Component
 * Features:
 * - Smart responsive layout (mobile/desktop optimized)
 * - Gesture support (swipe actions)
 * - Smooth micro-interactions
 * - Semantic color coding
 * - Accessible design
 * - Loading states
 * - Touch-friendly (44px+ targets)
 */

const ExpenseCard = forwardRef(({
  expense,
  isSelected = false,
  isLoading = false,
  isFavorite = false,
  variant = 'default', // 'default', 'compact', 'detailed', 'minimal'
  layout = 'mobile', // 'mobile', 'desktop', 'auto'
  enableSwipeActions = true,
  enableExpandToggle = true,
  showCategory = true,
  showReceipt = true,
  showActions = true,
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
  const [swipeDirection, setSwipeDirection] = useState(null);

  // Determine amount styling based on value
  const getAmountStyling = (amount) => {
    if (amount >= 1000) return 'text-2xl font-bold text-red-600';
    if (amount >= 500) return 'text-xl font-semibold text-orange-600';
    if (amount >= 100) return 'text-lg font-semibold text-yellow-600';
    return 'text-base font-medium text-green-600';
  };

  // Get category color
  const getCategoryColor = (category) => {
    const categoryKey = category?.toLowerCase().replace(/\s+/g, '_');
    return colors.categories[categoryKey] || colors.categories.other;
  };

  // Card variants
  const cardVariants = {
    default: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, x: swipeDirection === 'left' ? -100 : 100 },
      whileHover: { y: -2, boxShadow: components.card.shadow.hover },
      whileTap: { scale: 0.98 }
    },
    compact: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 }
    }
  };

  // Swipe gesture handlers
  const handleSwipe = (event, info) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      setSwipeDirection('right');
      onEdit?.(expense);
    } else if (info.offset.x < -threshold) {
      setSwipeDirection('left');
      onDelete?.(expense.id);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className={cn(
        "animate-pulse bg-neutral-100 rounded-lg",
        variant === 'compact' ? 'h-16' : 'h-32',
        className
      )}>
        <div className="p-4 space-y-3">
          <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
          {variant !== 'compact' && (
            <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
          )}
        </div>
      </div>
    );
  }

  // Compact variant for list views
  if (variant === 'compact') {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200",
          isSelected && "border-blue-500 bg-blue-50",
          className
        )}
        variants={cardVariants.compact}
        initial="initial"
        animate="animate"
        exit="exit"
        {...props}
      >
        {/* Left section - Description & Date */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(expense.id, e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {expense.description}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(expense.expense_date).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Right section - Amount & Actions */}
        <div className="flex items-center space-x-2">
          <span className={cn("font-semibold", getAmountStyling(expense.amount))}>
            {formatCurrency(expense.amount)}
          </span>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(expense)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate?.(expense)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                {expense.receipt_url && showReceipt && (
                  <DropdownMenuItem onClick={() => onViewReceipt?.(expense.receipt_url)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Receipt
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete?.(expense.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </motion.div>
    );
  }

  // Main card component (default/detailed variants)
  return (
    <motion.div
      ref={ref}
      className={cn(
        "relative bg-white rounded-xl border shadow-sm overflow-hidden",
        "transition-all duration-200 hover:shadow-md",
        isSelected && "border-blue-500 bg-blue-50 shadow-blue-100",
        variant === 'minimal' && "shadow-none border-gray-100",
        className
      )}
      variants={cardVariants.default}
      initial="initial"
      animate="animate"
      exit="exit"
      drag={enableSwipeActions ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleSwipe}
      {...props}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
      )}

      {/* Card Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between">
          {/* Left section - Checkbox & Content */}
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(expense.id, e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                style={{ minWidth: '16px' }}
              />
            )}
            
            <div className="flex-1 min-w-0">
              {/* Description */}
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-base font-semibold text-gray-900 leading-tight">
                  {expense.description}
                </h3>
                {isFavorite && (
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                )}
              </div>

              {/* Date & Device Info */}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
                </div>
                {expense.device_info && (
                  <div className="flex items-center space-x-1">
                    {expense.device_info.includes('Mobile') ? (
                      <Smartphone className="h-3 w-3" />
                    ) : (
                      <CreditCard className="h-3 w-3" />
                    )}
                    <span className="text-xs">
                      {expense.device_info.includes('Mobile') ? 'Mobile' : 'Desktop'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right section - Amount */}
          <div className="text-right ml-4">
            <div className={cn("leading-tight mb-1", getAmountStyling(expense.amount))}>
              {formatCurrency(expense.amount)}
            </div>
            {expense.payment_method && (
              <div className="text-xs text-gray-400">
                {expense.payment_method}
              </div>
            )}
          </div>
        </div>

        {/* Category & Tags */}
        {showCategory && (expense.category || expense.tags) && (
          <div className="mt-3 flex items-center space-x-2">
            {expense.category && (
              <Badge 
                variant="secondary" 
                className="text-xs"
                style={{ 
                  backgroundColor: `${getCategoryColor(expense.category)}15`,
                  color: getCategoryColor(expense.category),
                  borderColor: `${getCategoryColor(expense.category)}25`
                }}
              >
                <Tag className="h-3 w-3 mr-1" />
                {expense.category}
              </Badge>
            )}
            {expense.tags?.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && variant === 'detailed' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100 px-4 py-3 bg-gray-50"
          >
            {expense.notes && (
              <p className="text-sm text-gray-600 mb-2">{expense.notes}</p>
            )}
            {expense.receipt_url && showReceipt && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onViewReceipt?.(expense.receipt_url)}
                className="mr-2"
              >
                <FileText className="h-4 w-4 mr-1" />
                View Receipt
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Footer */}
      <div className="px-4 pb-4 flex items-center justify-between">
        {/* Left side - Expand toggle */}
        <div className="flex items-center space-x-2">
          {enableExpandToggle && variant === 'detailed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {onToggleFavorite && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleFavorite(expense.id)}
              className="text-gray-400 hover:text-yellow-500 p-1"
            >
              {isFavorite ? (
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Right side - Action menu */}
        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(expense)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(expense)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              {expense.receipt_url && showReceipt && (
                <DropdownMenuItem onClick={() => onViewReceipt?.(expense.receipt_url)}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Receipt
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 hover:text-red-700">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{expense.description}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete?.(expense.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.div>
  );
});

ExpenseCard.displayName = 'ExpenseCard';

export default ExpenseCard;