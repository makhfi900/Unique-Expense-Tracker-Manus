import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { formatCurrency } from '../utils/currency';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { 
  Edit, 
  Trash2, 
  Copy, 
  FileText, 
  Calendar, 
  User, 
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Eye,
  CreditCard
} from 'lucide-react';

const MobileExpenseCard = ({ 
  expense, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onToggleSelect,
  isSelected = false,
  isAdmin = false,
  className = "" 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeAction, setSwipeAction] = useState(null);
  
  // Motion values for swipe gestures
  const x = useMotionValue(0);
  const dragRef = useRef(null);
  
  // Transform x position to reveal actions
  const editOpacity = useTransform(x, [60, 120], [0, 1]);
  const deleteOpacity = useTransform(x, [-120, -60], [0, 1]);
  const editScale = useTransform(x, [60, 120], [0.8, 1]);
  const deleteScale = useTransform(x, [-120, -60], [0.8, 1]);
  
  // Haptic feedback (if supported)
  const triggerHaptic = (type = 'light') => {
    if (window.navigator?.vibrate) {
      switch(type) {
        case 'light':
          window.navigator.vibrate(10);
          break;
        case 'medium':
          window.navigator.vibrate(30);
          break;
        case 'heavy':
          window.navigator.vibrate([50, 10, 50]);
          break;
      }
    }
  };

  // Handle swipe gestures
  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    const swipeThreshold = 80;
    const velocity = info.velocity.x;
    
    if (Math.abs(velocity) > 500 || Math.abs(info.offset.x) > swipeThreshold) {
      if (info.offset.x > 0) {
        // Swipe right - Edit action
        triggerHaptic('medium');
        setSwipeAction('edit');
        setTimeout(() => {
          onEdit(expense);
          x.set(0);
          setSwipeAction(null);
        }, 150);
      } else {
        // Swipe left - Delete action
        triggerHaptic('heavy');
        setSwipeAction('delete');
        setTimeout(() => {
          onDelete(expense.id);
          x.set(0);
          setSwipeAction(null);
        }, 150);
      }
    } else {
      // Snap back
      x.set(0);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
    triggerHaptic('light');
  };

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
    triggerHaptic('light');
  };

  const handleCardTap = (event) => {
    // Only toggle selection on main card tap, not on action buttons
    if (event.target.closest('button')) return;
    if (onToggleSelect) {
      onToggleSelect(expense.id, !isSelected);
      triggerHaptic('light');
    }
  };

  return (
    <div className={`relative mb-3 ${className}`}>
      {/* Background Action Indicators */}
      <div className="absolute inset-0 flex items-center justify-between px-4 rounded-xl overflow-hidden">
        {/* Edit Action (Right swipe) */}
        <motion.div
          className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg"
          style={{ opacity: editOpacity, scale: editScale }}
        >
          <Edit className="w-6 h-6 text-white" />
        </motion.div>
        
        {/* Delete Action (Left swipe) */}
        <motion.div
          className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg"
          style={{ opacity: deleteOpacity, scale: deleteScale }}
        >
          <Trash2 className="w-6 h-6 text-white" />
        </motion.div>
      </div>

      {/* Main Card */}
      <motion.div
        ref={dragRef}
        drag="x"
        dragElastic={0.2}
        dragConstraints={{ left: -120, right: 120 }}
        style={{ x }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.98 }}
        animate={{ 
          scale: swipeAction ? 0.95 : 1,
          rotateZ: isDragging ? (x.get() > 0 ? 1 : -1) : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={handleCardTap}
        className={`
          relative cursor-pointer touch-manipulation select-none
          ${isDragging ? 'z-10' : 'z-0'}
        `}
      >
        <Card className={`
          border-2 transition-all duration-200 backdrop-blur-sm rounded-2xl
          ${isSelected 
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20' 
            : 'border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
          }
          ${isDragging ? 'shadow-2xl scale-[1.02] rotate-1' : ''}
        `}>
          <CardContent className="p-5 space-y-4">
            {/* Header Row with Improved Touch Targets */}
            <div className="flex items-start justify-between gap-4">
              {/* Left side - Main info */}
              <div className="flex-1 min-w-0">
                {/* Amount - Most prominent with better spacing */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mr-2">
                      <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                  {isSelected && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300 px-2 py-1">
                      Selected
                    </Badge>
                  )}
                </div>

                {/* Description with better typography */}
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg leading-tight mb-3 truncate pr-2">
                  {expense.description}
                </h3>

                {/* Date and Category Row with improved spacing */}
                <div className="flex items-center gap-4 text-sm mb-2">
                  <div className="flex items-center text-gray-600 dark:text-gray-400 min-w-0">
                    <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center mr-2 flex-shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">
                      {new Date(expense.expense_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center min-w-0 flex-1">
                    <div 
                      className="w-4 h-4 rounded-full mr-2 flex-shrink-0"
                      style={{ backgroundColor: expense.category?.color || '#6B7280' }}
                    />
                    <span className="text-gray-600 dark:text-gray-400 font-medium truncate">
                      {expense.category?.name || 'Uncategorized'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right side - Larger Touch Targets */}
              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                {/* Primary Quick Actions with 44px touch targets */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(expense);
                      triggerHaptic('light');
                    }}
                    className="w-11 h-11 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-all duration-200"
                    title="Duplicate expense"
                  >
                    <Copy className="w-4 h-4 text-blue-600" />
                  </Button>
                  
                  {expense.receipt_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(expense.receipt_url, '_blank');
                        triggerHaptic('light');
                      }}
                      className="w-11 h-11 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl transition-all duration-200"
                      title="View receipt"
                    >
                      <FileText className="w-4 h-4 text-emerald-600" />
                    </Button>
                  )}
                </div>

                {/* Expand Toggle with better visibility */}
                {(expense.notes || (isAdmin && expense.created_by_user)) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpansion();
                    }}
                    className="w-11 h-11 p-0 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
                    title={isExpanded ? 'Hide details' : 'Show details'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Expanded Details */}
            <motion.div
              initial={false}
              animate={{
                height: isExpanded ? 'auto' : 0,
                opacity: isExpanded ? 1 : 0
              }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
                {/* Notes */}
                {expense.notes && (
                  <div>
                    <div className="flex items-center mb-2">
                      <Eye className="w-3.5 h-3.5 text-gray-500 mr-1.5" />
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Notes
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-5">
                      {expense.notes}
                    </p>
                  </div>
                )}

                {/* User Info (Admin only) */}
                {isAdmin && expense.created_by_user && (
                  <div>
                    <div className="flex items-center mb-2">
                      <User className="w-3.5 h-3.5 text-gray-500 mr-1.5" />
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Created By
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 pl-5">
                      {expense.created_by_user.full_name || 'Unknown User'}
                    </p>
                  </div>
                )}

                {/* Enhanced Action Buttons with Better Touch Targets */}
                <div className="flex items-center gap-3 pt-3">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(expense);
                      triggerHaptic('medium');
                    }}
                    className="flex-1 min-h-[44px] border-blue-200 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl font-medium transition-all duration-200"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete "${expense.description}"?`)) {
                        onDelete(expense.id);
                        triggerHaptic('heavy');
                      }
                    }}
                    className="flex-1 min-h-[44px] border-red-200 text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Swipe Hint */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isDragging ? 1 : 0, y: isDragging ? 0 : 10 }}
              className="absolute bottom-2 left-1/2 transform -translate-x-1/2"
            >
              <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                {x.get() > 0 ? '← Edit' : x.get() < 0 ? 'Delete →' : 'Swipe for actions'}
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default MobileExpenseCard;