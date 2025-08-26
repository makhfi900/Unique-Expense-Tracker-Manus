import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useDragControls, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { colors, spacing, borderRadius, touchTargets, animation } from '../design-system';
import { 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Move,
  Hand,
  TouchIcon,
  Vibrate
} from 'lucide-react';

/**
 * MOBILE GESTURE INTERACTION TEMPLATES
 * 
 * Comprehensive gesture handling templates for mobile interfaces:
 * - Swipe to reveal actions
 * - Pull to refresh with visual feedback
 * - Long press with progressive indication
 * - Double tap for quick actions  
 * - Pinch to zoom capabilities
 * - Drag and drop with snap targets
 * - Haptic feedback integration
 * 
 * Features:
 * - Native-like feel with proper physics
 * - Visual feedback for all interactions
 * - Accessibility considerations
 * - Performance optimized
 * - Customizable thresholds and behaviors
 */

/**
 * SWIPE ACTION TEMPLATE
 * Reveals contextual actions on swipe with smooth animations
 */
export const SwipeActionTemplate = ({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 100,
  disabled = false,
  onSwipeStart,
  onSwipeEnd,
  className,
  ...props
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [activeSide, setActiveSide] = useState(null);
  const x = useMotionValue(0);
  const containerRef = useRef(null);

  // Visual feedback transforms
  const leftReveal = useTransform(x, [0, threshold], [0, 1]);
  const rightReveal = useTransform(x, [-threshold, 0], [1, 0]);
  const contentScale = useTransform(x, [-50, 0, 50], [0.98, 1, 0.98]);

  const triggerHaptic = useCallback((type = 'light') => {
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      const patterns = {
        light: 10,
        medium: [20, 10, 20],
        heavy: [40, 20, 40, 20, 40]
      };
      window.navigator.vibrate(patterns[type] || patterns.light);
    }
  }, []);

  const handleDragStart = useCallback(() => {
    if (disabled) return;
    triggerHaptic('light');
    onSwipeStart?.();
  }, [disabled, triggerHaptic, onSwipeStart]);

  const handleDragEnd = useCallback((event, info) => {
    if (disabled) return;

    const velocity = Math.abs(info.velocity.x);
    const offset = info.offset.x;
    const fastSwipe = velocity > 800;
    const thresholdMet = Math.abs(offset) > threshold;

    if (fastSwipe || thresholdMet) {
      const direction = offset > 0 ? 'right' : 'left';
      const actions = direction === 'right' ? leftActions : rightActions;

      if (actions.length > 0) {
        setIsRevealed(true);
        setActiveSide(direction);
        x.set(direction === 'right' ? threshold : -threshold);
        triggerHaptic('medium');
        onSwipeEnd?.(direction, info);
      } else {
        resetPosition();
      }
    } else {
      resetPosition();
    }
  }, [disabled, leftActions, rightActions, threshold, triggerHaptic, onSwipeEnd, x]);

  const resetPosition = useCallback(() => {
    setIsRevealed(false);
    setActiveSide(null);
    x.set(0);
  }, [x]);

  const handleActionClick = useCallback((action, index) => {
    action.onClick?.(index);
    triggerHaptic('light');
    // Delay reset for smooth animation
    setTimeout(resetPosition, 150);
  }, [triggerHaptic, resetPosition]);

  return (
    <div className={cn("relative overflow-hidden", className)} {...props}>
      {/* Left Actions Background */}
      {leftActions.length > 0 && (
        <motion.div 
          className={cn(
            "absolute left-0 top-0 h-full flex items-center justify-start pl-4",
            "bg-gradient-to-r from-blue-500 to-blue-600"
          )}
          style={{
            width: threshold + 40,
            x: useTransform(x, [0, threshold * 1.2], [-threshold - 40, 0]),
            opacity: leftReveal,
            borderRadius: borderRadius.lg
          }}
        >
          <div className="flex items-center gap-3">
            {leftActions.map((action, index) => (
              <motion.button
                key={action.key || index}
                className={cn(
                  "rounded-full bg-white/20 backdrop-blur-sm",
                  "text-white font-medium transition-colors",
                  "flex items-center justify-center",
                  action.className
                )}
                style={{
                  width: touchTargets.minimum,
                  height: touchTargets.minimum,
                  backgroundColor: action.color ? `${action.color}40` : undefined
                }}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.3)' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleActionClick(action, index)}
                initial={{ scale: 0 }}
                animate={{ 
                  scale: leftReveal,
                  transition: { delay: index * 0.05 }
                }}
              >
                {React.createElement(action.icon, { size: 20 })}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Right Actions Background */}
      {rightActions.length > 0 && (
        <motion.div 
          className={cn(
            "absolute right-0 top-0 h-full flex items-center justify-end pr-4",
            "bg-gradient-to-l from-red-500 to-red-600"
          )}
          style={{
            width: threshold + 40,
            x: useTransform(x, [-threshold * 1.2, 0], [0, threshold + 40]),
            opacity: rightReveal,
            borderRadius: borderRadius.lg
          }}
        >
          <div className="flex items-center gap-3">
            {rightActions.map((action, index) => (
              <motion.button
                key={action.key || index}
                className={cn(
                  "rounded-full bg-white/20 backdrop-blur-sm",
                  "text-white font-medium transition-colors",
                  "flex items-center justify-center",
                  action.className
                )}
                style={{
                  width: touchTargets.minimum,
                  height: touchTargets.minimum,
                  backgroundColor: action.color ? `${action.color}40` : undefined
                }}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.3)' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleActionClick(action, index)}
                initial={{ scale: 0 }}
                animate={{ 
                  scale: rightReveal,
                  transition: { delay: index * 0.05 }
                }}
              >
                {React.createElement(action.icon, { size: 20 })}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <motion.div
        ref={containerRef}
        drag="x"
        dragElastic={0.1}
        dragConstraints={{ 
          left: rightActions.length ? -threshold * 1.2 : 0, 
          right: leftActions.length ? threshold * 1.2 : 0 
        }}
        style={{ 
          x,
          scale: contentScale
        }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative z-10 bg-white dark:bg-gray-800",
          "transition-shadow duration-200",
          disabled && "pointer-events-none"
        )}
        style={{
          borderRadius: borderRadius.lg,
          boxShadow: isRevealed ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        {children}
      </motion.div>

      {/* Dismiss Overlay */}
      {isRevealed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-transparent z-5"
          onClick={resetPosition}
        />
      )}
    </div>
  );
};

/**
 * PULL TO REFRESH TEMPLATE
 * Native-style pull-to-refresh with visual progress indicator
 */
export const PullToRefreshTemplate = ({
  children,
  onRefresh,
  threshold = 100,
  disabled = false,
  refreshText = "Pull to refresh",
  releaseText = "Release to refresh",
  refreshingText = "Refreshing...",
  className,
  ...props
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const y = useMotionValue(0);
  const containerRef = useRef(null);

  // Progress and rotation transforms
  const pullProgress = useTransform(y, [0, threshold], [0, 1]);
  const indicatorRotation = useTransform(y, [0, threshold], [0, 180]);
  const indicatorScale = useTransform(y, [0, threshold * 0.5, threshold], [0.5, 0.8, 1]);

  const triggerHaptic = useCallback((type) => {
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      const patterns = { light: 10, success: [20, 10, 20] };
      window.navigator.vibrate(patterns[type] || patterns.light);
    }
  }, []);

  const handleDrag = useCallback((event, info) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (container && container.scrollTop <= 0 && info.offset.y > 0) {
      setIsPulling(true);
      setPullDistance(info.offset.y);
      
      // Haptic feedback at threshold
      if (info.offset.y >= threshold && pullDistance < threshold) {
        triggerHaptic('light');
      }
    } else {
      setIsPulling(false);
      setPullDistance(0);
    }
  }, [disabled, isRefreshing, threshold, pullDistance, triggerHaptic]);

  const handleDragEnd = useCallback(async (event, info) => {
    if (disabled || isRefreshing) return;

    if (isPulling && info.offset.y >= threshold) {
      setIsRefreshing(true);
      setIsPulling(false);
      triggerHaptic('success');
      
      try {
        await onRefresh?.();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        y.set(0);
        setPullDistance(0);
      }
    } else {
      setIsPulling(false);
      setPullDistance(0);
      y.set(0);
    }
  }, [disabled, isRefreshing, isPulling, threshold, onRefresh, triggerHaptic, y]);

  const getCurrentText = () => {
    if (isRefreshing) return refreshingText;
    if (pullDistance >= threshold) return releaseText;
    return refreshText;
  };

  return (
    <div className={cn("relative overflow-hidden", className)} {...props}>
      {/* Pull Indicator */}
      <motion.div
        className="absolute top-0 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none"
        style={{ 
          y: useTransform(y, [0, threshold], [-60, 20]),
          opacity: pullProgress
        }}
      >
        <div 
          className="bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 px-4 py-3 flex items-center gap-3"
          style={{
            minWidth: '140px'
          }}
        >
          {/* Spinner/Arrow Icon */}
          <motion.div style={{ rotate: isRefreshing ? 0 : indicatorRotation, scale: indicatorScale }}>
            {isRefreshing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
              />
            ) : (
              <div className="w-5 h-5 flex items-center justify-center">
                <RotateCw className="w-4 h-4 text-blue-500" />
              </div>
            )}
          </motion.div>
          
          {/* Text */}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {getCurrentText()}
          </span>
        </div>
      </motion.div>

      {/* Content Container */}
      <motion.div
        ref={containerRef}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className={cn(
          "min-h-full overflow-auto",
          (disabled || isRefreshing) && "pointer-events-none"
        )}
      >
        {children}
      </motion.div>
    </div>
  );
};

/**
 * LONG PRESS TEMPLATE
 * Progressive long press with visual feedback
 */
export const LongPressTemplate = ({
  children,
  onLongPress,
  duration = 800,
  disabled = false,
  showProgress = true,
  hapticFeedback = true,
  className,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  const triggerHaptic = useCallback(() => {
    if (hapticFeedback && typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate([30, 10, 30]);
    }
  }, [hapticFeedback]);

  const startPress = useCallback(() => {
    if (disabled) return;
    
    setIsPressed(true);
    setPressProgress(0);
    
    const startTime = Date.now();
    
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setPressProgress(progress);
      
      if (progress >= 1) {
        clearInterval(intervalRef.current);
        triggerHaptic();
        onLongPress?.();
        endPress();
      }
    }, 16); // 60fps updates
    
  }, [disabled, duration, triggerHaptic, onLongPress]);

  const endPress = useCallback(() => {
    setIsPressed(false);
    setPressProgress(0);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <motion.div
      className={cn("relative select-none", className)}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      onPointerCancel={endPress}
      animate={{ 
        scale: isPressed ? 0.95 : 1,
      }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {children}
      
      {/* Progress Ring */}
      {showProgress && isPressed && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ transform: 'rotate(-90deg)' }}
          >
            <rect
              x="2"
              y="2"
              width="calc(100% - 4px)"
              height="calc(100% - 4px)"
              fill="none"
              stroke={colors.brand.primary}
              strokeWidth="3"
              strokeDasharray="100%"
              strokeDashoffset={`${100 - (pressProgress * 100)}%`}
              rx={borderRadius.lg}
              style={{
                transition: `stroke-dashoffset ${animation.duration.fast} linear`,
              }}
            />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
};

/**
 * DOUBLE TAP TEMPLATE
 * Handles double tap with single tap fallback
 */
export const DoubleTapTemplate = ({
  children,
  onSingleTap,
  onDoubleTap,
  delay = 300,
  disabled = false,
  className,
  ...props
}) => {
  const [tapCount, setTapCount] = useState(0);
  const timeoutRef = useRef(null);

  const handleTap = useCallback(() => {
    if (disabled) return;

    setTapCount(prev => prev + 1);

    if (tapCount === 0) {
      // First tap - start timer
      timeoutRef.current = setTimeout(() => {
        onSingleTap?.();
        setTapCount(0);
      }, delay);
    } else {
      // Second tap - trigger double tap
      clearTimeout(timeoutRef.current);
      onDoubleTap?.();
      setTapCount(0);
    }
  }, [disabled, tapCount, delay, onSingleTap, onDoubleTap]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      className={cn("select-none cursor-pointer", className)}
      onTap={handleTap}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default {
  SwipeActionTemplate,
  PullToRefreshTemplate,
  LongPressTemplate,
  DoubleTapTemplate,
};

/**
 * USAGE EXAMPLES:
 * 
 * // Swipe Actions
 * <SwipeActionTemplate
 *   leftActions={[
 *     { icon: Edit, onClick: handleEdit, color: '#3B82F6' },
 *     { icon: Archive, onClick: handleArchive, color: '#6B7280' }
 *   ]}
 *   rightActions={[
 *     { icon: Trash2, onClick: handleDelete, color: '#EF4444' }
 *   ]}
 *   threshold={80}
 * >
 *   <ExpenseCard expense={expense} />
 * </SwipeActionTemplate>
 * 
 * // Pull to Refresh
 * <PullToRefreshTemplate
 *   onRefresh={async () => await fetchLatestData()}
 *   threshold={120}
 * >
 *   <ExpenseList expenses={expenses} />
 * </PullToRefreshTemplate>
 * 
 * // Long Press
 * <LongPressTemplate
 *   onLongPress={() => showContextMenu()}
 *   duration={600}
 *   hapticFeedback={true}
 * >
 *   <ExpenseCard expense={expense} />
 * </LongPressTemplate>
 * 
 * // Double Tap
 * <DoubleTapTemplate
 *   onSingleTap={() => selectExpense()}
 *   onDoubleTap={() => editExpense()}
 * >
 *   <ExpenseCard expense={expense} />
 * </DoubleTapTemplate>
 */