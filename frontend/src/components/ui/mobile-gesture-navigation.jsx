import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './card';
import { Button } from './button';
import {
  ChevronLeft,
  ChevronRight,
  Navigation,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Smartphone,
  Hand
} from 'lucide-react';

// Gesture-based navigation component for mobile
const MobileGestureNavigation = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPullToRefresh,
  enableSwipeNavigation = true,
  enablePullToRefresh = true,
  showGestureHints = true,
  refreshThreshold = 100,
  swipeThreshold = 50,
  className = ""
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [showHints, setShowHints] = useState(showGestureHints);
  const [activeGesture, setActiveGesture] = useState(null);
  const containerRef = useRef(null);

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

  // Handle pull to refresh
  const handlePan = useCallback((event, info) => {
    const { offset, velocity } = info;
    const scrollTop = containerRef.current?.scrollTop || 0;
    
    // Only enable pull-to-refresh when at the top
    if (enablePullToRefresh && scrollTop === 0 && offset.y > 0) {
      const distance = Math.min(offset.y, refreshThreshold * 2);
      setPullDistance(distance);
      setActiveGesture('pull-refresh');
      
      if (distance > refreshThreshold * 0.5) {
        triggerHaptic('light');
      }
    }
    
    // Removed horizontal swipes as they were causing navigation issues with 1000+ expenses
    // Focus only on pull-to-refresh functionality for mobile
  }, [enablePullToRefresh, enableSwipeNavigation, refreshThreshold, swipeThreshold, triggerHaptic]);

  // Handle pan end
  const handlePanEnd = useCallback(async (event, info) => {
    const { offset, velocity } = info;
    
    // Pull to refresh logic
    if (activeGesture === 'pull-refresh' && pullDistance > refreshThreshold) {
      setIsRefreshing(true);
      triggerHaptic('medium');
      
      try {
        await onPullToRefresh?.();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    
    // Removed swipe navigation logic to prevent conflicts with scrolling
    // This improves UX for large datasets (1000+ expenses)
    if (false) { // Disabled swipe navigation
      const swipeVelocityThreshold = 500;
      const isHorizontalSwipe = Math.abs(offset.x) > Math.abs(offset.y);
      const isFastSwipe = Math.abs(velocity.x) > swipeVelocityThreshold;
      const isLongSwipe = Math.abs(offset.x) > swipeThreshold;
      
      if (isHorizontalSwipe && (isFastSwipe || isLongSwipe)) {
        triggerHaptic('medium');
        
        if (offset.x > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
      
      // Vertical swipes
      const isVerticalSwipe = Math.abs(offset.y) > Math.abs(offset.x);
      const isFastVerticalSwipe = Math.abs(velocity.y) > swipeVelocityThreshold;
      const isLongVerticalSwipe = Math.abs(offset.y) > swipeThreshold;
      
      if (isVerticalSwipe && (isFastVerticalSwipe || isLongVerticalSwipe)) {
        if (offset.y > 0 && onSwipeDown) {
          triggerHaptic('light');
          onSwipeDown();
        } else if (offset.y < 0 && onSwipeUp) {
          triggerHaptic('light');
          onSwipeUp();
        }
      }
    }
    
    setActiveGesture(null);
  }, [activeGesture, pullDistance, refreshThreshold, enableSwipeNavigation, swipeThreshold, triggerHaptic, onPullToRefresh, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  // Auto-hide hints after delay
  useEffect(() => {
    if (showHints) {
      const timer = setTimeout(() => setShowHints(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showHints]);

  // Pull to refresh indicator
  const PullToRefreshIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ 
        opacity: pullDistance > 10 ? 1 : 0,
        y: pullDistance > 10 ? pullDistance - 50 : -50
      }}
      className="absolute top-0 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none"
    >
      <Card className="px-4 py-2 shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm">
          <motion.div
            animate={{ 
              rotate: pullDistance > refreshThreshold ? 180 : 0,
              scale: isRefreshing ? 1 : pullDistance / refreshThreshold 
            }}
            className="text-blue-600"
          >
            <ArrowDown className="w-4 h-4" />
          </motion.div>
          <span className="text-gray-700 dark:text-gray-300">
            {isRefreshing 
              ? 'Refreshing...' 
              : pullDistance > refreshThreshold 
                ? 'Release to refresh' 
                : 'Pull to refresh'
            }
          </span>
        </div>
      </Card>
    </motion.div>
  );

  // Gesture hints overlay
  const GestureHints = () => (
    <AnimatePresence>
      {showHints && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center"
        >
          <Card className="p-6 mx-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              <Hand className="w-5 h-5 text-blue-600" />
              Gesture Controls
            </div>
            
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              {enableSwipeNavigation && (
                <>
                  <div className="flex items-center gap-3">
                    <ArrowLeft className="w-4 h-4 text-blue-600" />
                    <span>Swipe left for next page</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                    <span>Swipe right for previous page</span>
                  </div>
                </>
              )}
              
              {enablePullToRefresh && (
                <div className="flex items-center gap-3">
                  <ArrowDown className="w-4 h-4 text-green-600" />
                  <span>Pull down to refresh</span>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-purple-600" />
                <span>Tap to dismiss hints</span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Swipe feedback indicators
  const SwipeFeedback = () => (
    <AnimatePresence>
      {activeGesture === 'swipe-left' && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 pointer-events-none"
        >
          <Card className="p-3 shadow-lg bg-blue-600 text-white">
            <ChevronLeft className="w-6 h-6" />
          </Card>
        </motion.div>
      )}
      
      {activeGesture === 'swipe-right' && (
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 pointer-events-none"
        >
          <Card className="p-3 shadow-lg bg-blue-600 text-white">
            <ChevronRight className="w-6 h-6" />
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <motion.div
      ref={containerRef}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.2}
      onPan={handlePan}
      onPanEnd={handlePanEnd}
      className={`relative overflow-hidden ${className}`}
      onClick={() => showHints && setShowHints(false)}
    >
      <PullToRefreshIndicator />
      <SwipeFeedback />
      <GestureHints />
      
      {/* Main content with transform based on pull distance */}
      <motion.div
        animate={{ 
          y: pullDistance * 0.5,
          scale: pullDistance > 0 ? 1 - (pullDistance / refreshThreshold) * 0.05 : 1
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-10"
      >
        {children}
      </motion.div>
      
      {/* Removed non-functional navigation arrows - gestures work properly */}
    </motion.div>
  );
};

export default MobileGestureNavigation;