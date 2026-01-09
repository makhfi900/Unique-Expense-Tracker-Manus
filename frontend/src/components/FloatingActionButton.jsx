import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { 
  Plus, 
  PlusCircle, 
  Upload, 
  FileText, 
  BarChart3,
  X,
  Zap
} from 'lucide-react';

const FloatingActionButton = ({ onAddExpense, onImportData, onViewAnalytics, isAdmin = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Haptic feedback
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

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
    triggerHaptic(isExpanded ? 'light' : 'medium');
  };

  const handleAction = (action) => {
    triggerHaptic('medium');
    setIsExpanded(false);
    action();
  };

  const actionButtons = [
    {
      icon: PlusCircle,
      label: 'Add Expense',
      action: onAddExpense,
      className: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700',
      show: true
    },
    {
      icon: Upload,
      label: 'Import Data',
      action: onImportData,
      className: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      show: true
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      action: onViewAnalytics,
      className: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      show: isAdmin
    }
  ].filter(button => button.show);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleExpansion}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Action Menu - with safe area support for notched devices */}
      <div className="fixed z-50" style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))', right: 'calc(1.5rem + env(safe-area-inset-right, 0px))' }}>
        <div className="relative">
          {/* Action Buttons */}
          <AnimatePresence>
            {isExpanded && (
              <div className="absolute bottom-16 right-0 space-y-3">
                {actionButtons.map((button, index) => (
                  <motion.div
                    key={button.label}
                    initial={{ 
                      scale: 0,
                      x: 20,
                      opacity: 0
                    }}
                    animate={{ 
                      scale: 1,
                      x: 0,
                      opacity: 1
                    }}
                    exit={{ 
                      scale: 0,
                      x: 20,
                      opacity: 0
                    }}
                    transition={{ 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 200,
                      damping: 20
                    }}
                    className="flex items-center justify-end"
                  >
                    {/* Label */}
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (index * 0.1) + 0.1 }}
                      className="mr-4 px-3 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50"
                    >
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {button.label}
                      </span>
                    </motion.div>

                    {/* Action Button with Better Touch Target */}
                    <Button
                      onClick={() => handleAction(button.action)}
                      className={`
                        w-14 h-14 rounded-full shadow-lg border-0 text-white
                        transform transition-all duration-200 active:scale-95
                        hover:shadow-xl hover:scale-105
                        ${button.className}
                      `}
                      size="default"
                      title={button.label}
                      aria-label={button.label}
                    >
                      <button.icon className="w-5 h-5" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Main FAB */}
          <motion.div
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            {/* Pulsing Ring */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 0, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`
                absolute inset-0 rounded-full 
                ${isExpanded 
                  ? 'bg-red-500/30' 
                  : 'bg-gradient-to-r from-blue-500/30 to-purple-500/30'
                }
              `}
            />

            {/* Main Button with Enhanced Touch Target */}
            <Button
              onClick={toggleExpansion}
              className={`
                relative w-16 h-16 rounded-full shadow-2xl border-0 text-white overflow-hidden
                transition-all duration-300 transform hover:scale-105
                ${isExpanded 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rotate-45' 
                  : 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700'
                }
              `}
              size="lg"
              title={isExpanded ? 'Close menu' : 'Open quick actions'}
              aria-label={isExpanded ? 'Close quick actions menu' : 'Open quick actions menu'}
              aria-expanded={isExpanded}
            >
              {/* Animated Background Effect */}
              <motion.div
                animate={{
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              />

              {/* Icon */}
              <motion.div
                animate={{ rotate: isExpanded ? 45 : 0 }}
                transition={{ duration: 0.2 }}
                className="relative z-10"
              >
                {isExpanded ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Plus className="w-6 h-6" />
                )}
              </motion.div>

              {/* Spark Effects */}
              <AnimatePresence>
                {!isExpanded && (
                  <>
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ delay: 0.1 }}
                      className="absolute top-2 right-2 w-1 h-1 bg-yellow-300 rounded-full"
                    />
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ delay: 0.3 }}
                      className="absolute bottom-3 left-3 w-0.5 h-0.5 bg-yellow-200 rounded-full"
                    />
                  </>
                )}
              </AnimatePresence>
            </Button>

            {/* Notification Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: isExpanded ? 0 : 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <Zap className="w-2.5 h-2.5 text-white" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default FloatingActionButton;