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

// Enhanced mobile gesture navigation with improved touch handling
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
  const [touchStart, setTouchStart] = useState(null);
  const [scrollingAllowed, setScrollingAllowed] = useState(true);
  const containerRef = useRef(null);
  const isScrollingRef = useRef(false);
  const startScrollTop = useRef(0);

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

  // Enhanced touch handling for native scrolling compatibility
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    });
    
    // Get initial scroll position
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    startScrollTop.current = scrollTop;
    isScrollingRef.current = false;
    
    // Allow native scrolling by default
    setScrollingAllowed(true);
  }, []);
  
  const handleTouchMove = useCallback((e) => {
    if (!touchStart || !scrollingAllowed) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    
    // Determine if user is scrolling vs gesturing
    const isVerticalMovement = Math.abs(deltaY) > Math.abs(deltaX);
    const isHorizontalMovement = Math.abs(deltaX) > Math.abs(deltaY);
    
    // Check if user is actually scrolling the content
    const hasScrolled = Math.abs(currentScrollTop - startScrollTop.current) > 5;
    
    if (hasScrolled || (isVerticalMovement && Math.abs(deltaY) > 10)) {
      isScrollingRef.current = true;
      // Allow native scrolling - don't prevent default
      return;
    }
    
    // Only handle pull-to-refresh at the top of the page
    if (enablePullToRefresh && currentScrollTop === 0 && deltaY > 0 && isVerticalMovement) {
      const distance = Math.min(deltaY * 0.5, refreshThreshold * 1.5);
      setPullDistance(distance);
      setActiveGesture('pull-refresh');
      
      if (distance > refreshThreshold * 0.5) {
        triggerHaptic('light');
      }
      
      // Only prevent default when pull-to-refresh is active at the very top
      // But since we switched to passive: true, we can't call preventDefault anyway
      // This allows native scrolling to work properly
    }
  }, [touchStart, scrollingAllowed, enablePullToRefresh, refreshThreshold, triggerHaptic]);

  const handleTouchEnd = useCallback(async (e) => {
    if (!touchStart) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const deltaTime = Date.now() - touchStart.timestamp;
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;
    
    // If user was scrolling, don't process gestures
    if (isScrollingRef.current) {
      setTouchStart(null);
      setPullDistance(0);
      setActiveGesture(null);
      return;
    }
    
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
    
    // Optional: Re-enable swipe navigation with proper touch detection
    // Only trigger if the gesture was intentional (not accidental while scrolling)
    if (enableSwipeNavigation && !isScrollingRef.current && deltaTime < 500) {
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold;
      const isFastSwipe = velocity > 0.5;
      
      if (isHorizontalSwipe || isFastSwipe) {
        if (deltaX > swipeThreshold) {
          triggerHaptic('medium');
          onSwipeRight?.();
        } else if (deltaX < -swipeThreshold) {
          triggerHaptic('medium');
          onSwipeLeft?.();
        }
      }
    }
    
    setTouchStart(null);
    setActiveGesture(null);
  }, [touchStart, activeGesture, pullDistance, refreshThreshold, enableSwipeNavigation, swipeThreshold, triggerHaptic, onPullToRefresh, onSwipeLeft, onSwipeRight]);

  // Add native touch event listeners for better scroll compatibility
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Use passive: true for better scroll performance, only prevent default when necessary
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);
  
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
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onClick={() => showHints && setShowHints(false)}
      style={{
        // Enable native scrolling with proper touch handling
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'auto',
        touchAction: 'auto'
      }}
    >
      <PullToRefreshIndicator />
      <SwipeFeedback />
      <GestureHints />
      
      {/* Main content with transform based on pull distance */}
      <motion.div
        animate={{ 
          y: pullDistance * 0.3,
          scale: pullDistance > 0 ? 1 - (pullDistance / refreshThreshold) * 0.02 : 1
        }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="relative z-10"
        style={{
          // Ensure content can scroll naturally
          minHeight: '100%',
          touchAction: 'auto'
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default MobileGestureNavigation;