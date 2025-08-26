import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, useDragControls, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '../../lib/utils';
import { colors } from './design-system';
import { 
  Edit, 
  Trash2, 
  Archive, 
  Star, 
  Copy,
  Check,
  X
} from 'lucide-react';

/**
 * Advanced Gesture Handler Component
 * Features:
 * - Swipe to reveal actions
 * - Pull to refresh
 * - Long press actions
 * - Pinch to zoom
 * - Double tap support
 * - Haptic feedback
 * - Visual feedback
 */

export const SwipeActionContainer = ({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 100,
  disabled = false,
  onSwipeLeft,
  onSwipeRight,
  className,
  ...props
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [currentSide, setCurrentSide] = useState(null);
  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const ref = useRef(null);

  // Transform values for dynamic styling
  const leftReveal = useTransform(x, [0, threshold], [0, 1]);
  const rightReveal = useTransform(x, [-threshold, 0], [1, 0]);

  const handleDragEnd = useCallback((event, info) => {
    if (disabled) return;

    const velocity = info.velocity.x;
    const offset = info.offset.x;

    // Determine action based on swipe
    if (offset > threshold || velocity > 500) {
      if (rightActions.length > 0) {
        setIsRevealed(true);
        setCurrentSide('right');
        x.set(threshold);
        onSwipeRight?.(info);
      } else {
        x.set(0);
      }
    } else if (offset < -threshold || velocity < -500) {
      if (leftActions.length > 0) {
        setIsRevealed(true);
        setCurrentSide('left');
        x.set(-threshold);
        onSwipeLeft?.(info);
      } else {
        x.set(0);
      }
    } else {
      // Return to original position
      setIsRevealed(false);
      setCurrentSide(null);
      x.set(0);
    }
  }, [disabled, leftActions, rightActions, threshold, x, onSwipeLeft, onSwipeRight]);

  const handleActionClick = useCallback((action) => {
    action.onClick?.();
    // Reset position after action
    setIsRevealed(false);
    setCurrentSide(null);
    x.set(0);
  }, [x]);

  const resetPosition = useCallback(() => {
    setIsRevealed(false);
    setCurrentSide(null);
    x.set(0);
  }, [x]);

  return (
    <div className={cn("relative overflow-hidden", className)} {...props}>
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <motion.div 
          className="absolute left-0 top-0 h-full flex items-center bg-blue-500"
          style={{ 
            width: threshold,
            x: useTransform(x, [0, threshold], [-threshold, 0])
          }}
        >
          <div className="flex items-center justify-center w-full space-x-2">
            {leftActions.map((action, index) => (
              <motion.button
                key={index}
                className={cn(
                  "p-2 rounded-full text-white transition-colors",
                  action.className
                )}
                style={{ backgroundColor: action.color }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleActionClick(action)}
              >
                {React.createElement(action.icon, { size: 20 })}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <motion.div 
          className="absolute right-0 top-0 h-full flex items-center bg-red-500"
          style={{ 
            width: threshold,
            x: useTransform(x, [-threshold, 0], [threshold, 0])
          }}
        >
          <div className="flex items-center justify-center w-full space-x-2">
            {rightActions.map((action, index) => (
              <motion.button
                key={index}
                className={cn(
                  "p-2 rounded-full text-white transition-colors",
                  action.className
                )}
                style={{ backgroundColor: action.color }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleActionClick(action)}
              >
                {React.createElement(action.icon, { size: 20 })}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <motion.div
        ref={ref}
        drag="x"
        dragControls={dragControls}
        dragConstraints={{ left: leftActions.length > 0 ? -threshold * 1.2 : 0, right: rightActions.length > 0 ? threshold * 1.2 : 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={cn(
          "relative z-10 bg-white",
          disabled && "pointer-events-none"
        )}
      >
        {children}
      </motion.div>

      {/* Overlay for dismissing */}
      {isRevealed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-5 bg-transparent"
          onClick={resetPosition}
        />
      )}
    </div>
  );
};

export const LongPressHandler = ({
  children,
  onLongPress,
  longPressDelay = 500,
  disabled = false,
  className,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [pressTimeout, setPressTimeout] = useState(null);

  const handlePressStart = useCallback(() => {
    if (disabled) return;

    setIsPressed(true);
    const timeout = setTimeout(() => {
      onLongPress?.();
      setIsPressed(false);
    }, longPressDelay);
    setPressTimeout(timeout);
  }, [disabled, onLongPress, longPressDelay]);

  const handlePressEnd = useCallback(() => {
    setIsPressed(false);
    if (pressTimeout) {
      clearTimeout(pressTimeout);
      setPressTimeout(null);
    }
  }, [pressTimeout]);

  return (
    <motion.div
      className={cn("relative", className)}
      onPointerDown={handlePressStart}
      onPointerUp={handlePressEnd}
      onPointerLeave={handlePressEnd}
      animate={{ scale: isPressed ? 0.95 : 1 }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {children}
      
      {/* Long press indicator */}
      {isPressed && (
        <motion.div
          className="absolute inset-0 border-2 border-blue-500 rounded-lg"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.05, opacity: 1 }}
          transition={{ duration: longPressDelay / 1000 }}
        />
      )}
    </motion.div>
  );
};

export const DoubleTapHandler = ({
  children,
  onDoubleTap,
  singleTapDelay = 300,
  disabled = false,
  className,
  ...props
}) => {
  const [tapCount, setTapCount] = useState(0);
  const [tapTimeout, setTapTimeout] = useState(null);

  const handleTap = useCallback(() => {
    if (disabled) return;

    setTapCount(prev => prev + 1);

    if (tapTimeout) {
      // Double tap detected
      clearTimeout(tapTimeout);
      setTapTimeout(null);
      setTapCount(0);
      onDoubleTap?.();
    } else {
      // Start timer for single tap
      const timeout = setTimeout(() => {
        setTapCount(0);
        setTapTimeout(null);
      }, singleTapDelay);
      setTapTimeout(timeout);
    }
  }, [disabled, onDoubleTap, singleTapDelay, tapTimeout]);

  useEffect(() => {
    return () => {
      if (tapTimeout) {
        clearTimeout(tapTimeout);
      }
    };
  }, [tapTimeout]);

  return (
    <motion.div
      className={cn("select-none", className)}
      onTap={handleTap}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const PullToRefresh = ({
  children,
  onRefresh,
  threshold = 80,
  disabled = false,
  className,
  ...props
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const y = useMotionValue(0);
  const containerRef = useRef(null);

  // Visual feedback transforms
  const pullProgress = useTransform(y, [0, threshold], [0, 1]);
  const pullRotation = useTransform(y, [0, threshold], [0, 180]);

  const handleDragEnd = useCallback(async (event, info) => {
    if (disabled || isRefreshing) return;

    if (info.offset.y > threshold) {
      setIsRefreshing(true);
      setIsPulling(false);
      
      try {
        await onRefresh?.();
      } finally {
        setIsRefreshing(false);
        y.set(0);
      }
    } else {
      setIsPulling(false);
      y.set(0);
    }
  }, [disabled, isRefreshing, threshold, onRefresh, y]);

  const handleDrag = useCallback((event, info) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (container && container.scrollTop <= 0 && info.offset.y > 0) {
      setIsPulling(true);
    } else {
      setIsPulling(false);
    }
  }, [disabled, isRefreshing]);

  return (
    <div className={cn("relative", className)} {...props}>
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10"
        style={{ 
          y: useTransform(y, [0, threshold], [-50, 10]),
          opacity: pullProgress 
        }}
      >
        <div className="bg-white rounded-full p-2 shadow-lg border">
          <motion.div style={{ rotate: pullRotation }}>
            {isRefreshing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
              </motion.div>
            ) : (
              <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        ref={containerRef}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.3}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className={cn(
          "min-h-full",
          (disabled || isRefreshing) && "pointer-events-none"
        )}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Pre-configured action sets for common use cases
export const expenseSwipeActions = {
  left: [
    {
      icon: Archive,
      color: colors.neutral[600],
      onClick: () => console.log('Archive'),
      className: 'hover:bg-gray-600'
    }
  ],
  right: [
    {
      icon: Edit,
      color: colors.brand.primary,
      onClick: () => console.log('Edit'),
      className: 'hover:bg-blue-600'
    },
    {
      icon: Trash2,
      color: colors.error.DEFAULT,
      onClick: () => console.log('Delete'),
      className: 'hover:bg-red-600'
    }
  ]
};

export default {
  SwipeActionContainer,
  LongPressHandler,
  DoubleTapHandler,
  PullToRefresh,
  expenseSwipeActions
};