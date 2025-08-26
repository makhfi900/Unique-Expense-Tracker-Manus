import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/currency';
import { Card, CardContent } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Checkbox } from './checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
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
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit,
  FileText,
  MoreHorizontal,
  Tag,
  Trash2,
  User,
  Loader2,
  DollarSign,
  CreditCard,
  Receipt
} from 'lucide-react';

// Professional mobile expense card with enhanced UX
const ProfessionalMobileCard = ({
  expense,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleSelect,
  isSelected = false,
  isAdmin = false,
  deleteLoading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Haptic feedback function
  const triggerHaptic = useCallback((type = 'light') => {
    if (window.navigator?.vibrate) {
      switch(type) {
        case 'light': window.navigator.vibrate(10); break;
        case 'medium': window.navigator.vibrate(30); break;
        case 'heavy': window.navigator.vibrate([50, 10, 50]); break;
      }
    }
  }, []);

  // Handle selection with haptic feedback
  const handleSelection = useCallback((checked) => {
    triggerHaptic('light');
    onToggleSelect?.(expense.id, checked);
  }, [expense.id, onToggleSelect, triggerHaptic]);

  // Handle expansion toggle
  const handleExpansionToggle = useCallback(() => {
    setIsExpanded(!isExpanded);
    triggerHaptic('light');
  }, [isExpanded, triggerHaptic]);

  // Handle delete with feedback
  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    triggerHaptic('heavy');
    try {
      await onDelete?.(expense.id);
    } finally {
      setIsDeleting(false);
    }
  }, [expense.id, onDelete, triggerHaptic]);

  // Swipe gesture handlers
  const [swipePosition, setSwipePosition] = useState(0);
  const swipeThreshold = 100;

  const handleDragEnd = useCallback((event, info) => {
    const { offset, velocity } = info;
    
    if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > 500) {
      if (offset.x > 0) {
        // Swipe right - edit action
        triggerHaptic('medium');
        onEdit?.(expense);
      } else {
        // Swipe left - delete action (with confirmation)
        triggerHaptic('heavy');
        // Trigger delete confirmation
      }
      setSwipePosition(0);
    } else {
      setSwipePosition(0);
    }
  }, [expense, onEdit, triggerHaptic]);

  // Amount formatting with visual hierarchy
  const getAmountColor = (amount) => {
    if (amount < 50) return 'text-green-600 dark:text-green-400';
    if (amount < 200) return 'text-blue-600 dark:text-blue-400';
    if (amount < 500) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Category badge styling
  const getCategoryStyle = (category) => ({
    backgroundColor: category?.color || '#64748B',
    color: category?.color ? '#FFFFFF' : '#000000'
  });

  return (
    <motion.div
      drag="x"
      dragElastic={0.1}
      dragConstraints={{ left: -200, right: 200 }}
      onDragEnd={handleDragEnd}
      animate={{ x: swipePosition }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="relative"
    >
      {/* Swipe Action Background */}
      <div className="absolute inset-0 flex items-center justify-between px-6 rounded-2xl">
        <div className="flex items-center gap-2 text-blue-600">
          <Edit className="w-5 h-5" />
          <span className="text-sm font-medium">Edit</span>
        </div>
        <div className="flex items-center gap-2 text-red-600">
          <Trash2 className="w-5 h-5" />
          <span className="text-sm font-medium">Delete</span>
        </div>
      </div>

      <Card className={`
        relative z-10 border-0 shadow-lg transition-all duration-300
        ${isSelected ? 
          'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 ring-2 ring-blue-500' : 
          'bg-white dark:bg-gray-800 hover:shadow-xl'
        }
        rounded-2xl overflow-hidden
      `}>
        <CardContent className="p-6 space-y-4">
          {/* Header Section */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Selection Checkbox - Enhanced Touch Target */}
              <div className="pt-1">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={handleSelection}
                  className="w-5 h-5 rounded-lg border-2 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  aria-label={`Select expense ${expense.description}`}
                />
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Date and Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">
                      {new Date(expense.expense_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  {expense.receipt_url && (
                    <Badge variant="secondary" className="text-xs px-2 py-1">
                      <Receipt className="w-3 h-3 mr-1" />
                      Receipt
                    </Badge>
                  )}
                </div>

                {/* Amount - Hero Element */}
                <div className="flex items-center justify-between">
                  <div className={`text-2xl font-bold ${getAmountColor(expense.amount)}`}>
                    {formatCurrency(expense.amount)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExpansionToggle}
                      className="h-10 w-10 p-0 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900"
                      aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                    >
                      {isExpanded ? 
                        <ChevronUp className="w-4 h-4" /> : 
                        <ChevronDown className="w-4 h-4" />
                      }
                    </Button>
                  </div>
                </div>

                {/* Description */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                  {expense.description}
                </h3>

                {/* Category Badge */}
                <div className="flex items-center gap-2">
                  <Badge 
                    className="px-3 py-1.5 rounded-full text-xs font-medium border-0"
                    style={getCategoryStyle(expense.category)}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {expense.category?.name || 'Uncategorized'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action Menu - Enhanced Touch Target */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-11 w-11 p-0 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900"
                  title="More actions"
                  aria-label="Open expense actions menu"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => {
                  triggerHaptic('light');
                  onEdit?.(expense);
                }} className="cursor-pointer">
                  <Edit className="mr-3 h-4 w-4 text-blue-600" />
                  <span>Edit Expense</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  triggerHaptic('light');
                  onDuplicate?.(expense);
                }} className="cursor-pointer">
                  <Copy className="mr-3 h-4 w-4 text-green-600" />
                  <span>Duplicate</span>
                </DropdownMenuItem>
                {expense.receipt_url && (
                  <DropdownMenuItem onClick={() => {
                    triggerHaptic('light');
                    window.open(expense.receipt_url, '_blank');
                  }} className="cursor-pointer">
                    <FileText className="mr-3 h-4 w-4 text-purple-600" />
                    <span>View Receipt</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer text-red-600 focus:text-red-600">
                      <Trash2 className="mr-3 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{expense.description}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 rounded-xl"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Deleting...
                          </>
                        ) : (
                          'Delete'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Expandable Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                  {/* Notes */}
                  {expense.notes && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <FileText className="w-4 h-4" />
                        Notes
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {expense.notes}
                      </p>
                    </div>
                  )}
                  
                  {/* User Info (Admin only) */}
                  {isAdmin && expense.created_by_user && (
                    <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                        <User className="w-4 h-4" />
                        Created By
                      </div>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {expense.created_by_user.full_name || 'Unknown User'}
                      </p>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        triggerHaptic('light');
                        onEdit?.(expense);
                      }}
                      className="flex-1 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        triggerHaptic('light');
                        onDuplicate?.(expense);
                      }}
                      className="flex-1 rounded-xl border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProfessionalMobileCard;