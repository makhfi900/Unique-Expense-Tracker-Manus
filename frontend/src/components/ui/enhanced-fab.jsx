import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';
import { Badge } from './badge';
import {
  Plus,
  Upload,
  BarChart3,
  X,
  Sparkles,
  Receipt,
  Filter,
  Download,
  CreditCard,
  Calculator
} from 'lucide-react';

const EnhancedFloatingActionButton = ({
  onAddExpense,
  onImportData,
  onViewAnalytics,
  onShowFilters,
  onBulkExport,
  isAdmin = false,
  selectedCount = 0,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Haptic feedback
  const triggerHaptic = useCallback((type = 'light') => {
    if (window.navigator?.vibrate) {
      switch(type) {
        case 'light': window.navigator.vibrate(10); break;
        case 'medium': window.navigator.vibrate(30); break;
        case 'heavy': window.navigator.vibrate([50, 10, 50]); break;
      }
    }
  }, []);

  const toggleOpen = useCallback(() => {
    setIsOpen(!isOpen);
    triggerHaptic(isOpen ? 'light' : 'medium');
  }, [isOpen, triggerHaptic]);

  const handleAction = useCallback((action, callback) => {
    triggerHaptic('medium');
    setIsOpen(false);
    callback?.();
  }, [triggerHaptic]);

  // Action items configuration
  const actionItems = [
    {
      id: 'add',
      label: 'Add Expense',
      icon: Plus,
      color: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white',
      action: () => handleAction('add', onAddExpense),
      primary: true
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      color: 'bg-green-600 hover:bg-green-700',
      textColor: 'text-white',
      action: () => handleAction('analytics', onViewAnalytics)
    },
    {
      id: 'import',
      label: 'Import Data',
      icon: Upload,
      color: 'bg-purple-600 hover:bg-purple-700',
      textColor: 'text-white',
      action: () => handleAction('import', onImportData),
      adminOnly: true
    },
    {
      id: 'filters',
      label: 'Filters',
      icon: Filter,
      color: 'bg-orange-600 hover:bg-orange-700',
      textColor: 'text-white',
      action: () => handleAction('filters', onShowFilters)
    },
    ...(selectedCount > 0 ? [{
      id: 'export',
      label: `Export (${selectedCount})`,
      icon: Download,
      color: 'bg-gray-600 hover:bg-gray-700',
      textColor: 'text-white',
      action: () => handleAction('export', onBulkExport),
      badge: selectedCount
    }] : [])
  ].filter(item => !item.adminOnly || isAdmin);

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Action Items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute bottom-20 right-0 space-y-3 mb-2"
          >
            {actionItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 50, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: 50, y: 20 }}
                transition={{ 
                  delay: index * 0.05,
                  type: "spring", 
                  stiffness: 400, 
                  damping: 25 
                }}
                className="flex items-center gap-3"
              >
                {/* Action Label */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700"
                >
                  <span className="text-sm font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                </motion.div>

                {/* Action Button */}
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    onClick={item.action}
                    className={`
                      relative w-14 h-14 rounded-full shadow-lg border-0 
                      ${item.color} ${item.textColor}
                      transition-all duration-200
                    `}
                    size="icon"
                    aria-label={item.label}
                  >
                    <item.icon className="w-6 h-6" />
                    {item.badge && (
                      <Badge className="absolute -top-2 -right-2 w-6 h-6 p-0 flex items-center justify-center bg-red-600 text-white text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Button
          onClick={toggleOpen}
          className={`
            relative w-16 h-16 rounded-full shadow-2xl border-0 
            transition-all duration-300
            ${isOpen 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
            }
          `}
          size="icon"
          aria-label={isOpen ? "Close actions menu" : "Open actions menu"}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 45 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-7 h-7" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ scale: 0, rotate: 45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: -45 }}
                transition={{ duration: 0.15 }}
                className="relative"
              >
                <Plus className="w-7 h-7" />
                {selectedCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-3 -right-3"
                  >
                    <Badge className="w-6 h-6 p-0 flex items-center justify-center bg-red-600 text-white text-xs">
                      {selectedCount}
                    </Badge>
                  </motion.div>
                )}
                
                {/* Sparkle effect for emphasis */}
                <motion.div
                  className="absolute -inset-2 pointer-events-none"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <Sparkles className="w-20 h-20 text-blue-200 opacity-20" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedFloatingActionButton;