import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { RefreshCw, ArrowDown, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const PullToRefresh = ({ 
  onRefresh, 
  children, 
  disabled = false,
  threshold = 80,
  className = "" 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState('idle'); // idle, pulling, triggered, refreshing, completed
  const containerRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  
  // Motion values
  const pullDistance = useMotionValue(0);
  const pullProgress = useTransform(pullDistance, [0, threshold], [0, 1]);
  const headerOpacity = useTransform(pullDistance, [0, threshold * 0.5], [0, 1]);
  const iconRotation = useTransform(pullDistance, [0, threshold], [0, 180]);

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

  const handleTouchStart = useCallback((e) => {
    if (disabled || isRefreshing) return;
    
    const touch = e.touches[0];
    startY.current = touch.clientY;
    currentY.current = touch.clientY;
    
    // Only allow pull-to-refresh when at the top of the page
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > 0) return;
    
    setRefreshStatus('pulling');
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e) => {
    if (disabled || isRefreshing || refreshStatus !== 'pulling') return;
    
    const touch = e.touches[0];
    currentY.current = touch.clientY;
    const deltaY = currentY.current - startY.current;
    
    // Only allow downward pull
    if (deltaY < 0) return;
    
    // Check if we're still at the top
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > 0) {
      resetPull();
      return;
    }
    
    // Apply resistance curve
    const resistance = Math.min(deltaY * 0.5, threshold * 1.5);
    pullDistance.set(resistance);
    
    // Trigger haptic feedback at threshold
    if (resistance >= threshold && refreshStatus === 'pulling') {
      setRefreshStatus('triggered');
      triggerHaptic('medium');
    } else if (resistance < threshold && refreshStatus === 'triggered') {
      setRefreshStatus('pulling');
      triggerHaptic('light');
    }
    
    // Prevent default scrolling
    if (deltaY > 0) {
      e.preventDefault();
    }
  }, [disabled, isRefreshing, refreshStatus, threshold, pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;
    
    const currentPullDistance = pullDistance.get();
    
    if (refreshStatus === 'triggered' && currentPullDistance >= threshold) {
      // Trigger refresh
      setIsRefreshing(true);
      setRefreshStatus('refreshing');
      triggerHaptic('heavy');
      
      // Snap to refresh position
      pullDistance.set(threshold);
      
      try {
        await onRefresh();
        setRefreshStatus('completed');
        triggerHaptic('light');
        
        // Show completion state briefly
        setTimeout(() => {
          resetPull();
        }, 500);
      } catch (error) {
        console.error('Refresh failed:', error);
        resetPull();
      }
    } else {
      // Snap back
      resetPull();
    }
  }, [disabled, isRefreshing, refreshStatus, threshold, pullDistance, onRefresh]);

  const resetPull = useCallback(() => {
    pullDistance.set(0);
    setRefreshStatus('idle');
    setIsRefreshing(false);
  }, [pullDistance]);

  // Add touch event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const getStatusMessage = () => {
    switch (refreshStatus) {
      case 'pulling':
        return 'Pull down to refresh';
      case 'triggered':
        return 'Release to refresh';
      case 'refreshing':
        return 'Refreshing...';
      case 'completed':
        return 'Refreshed!';
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    switch (refreshStatus) {
      case 'pulling':
      case 'triggered':
        return <motion.div style={{ rotate: iconRotation }}><ArrowDown className="w-5 h-5" /></motion.div>;
      case 'refreshing':
        return <RefreshCw className="w-5 h-5 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <ArrowDown className="w-5 h-5" />;
    }
  };

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Enhanced Pull-to-refresh header */}
      <motion.div
        style={{ 
          y: pullDistance,
          opacity: headerOpacity
        }}
        className="absolute top-0 left-0 right-0 z-50 pointer-events-none"
      >
        <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-b from-white/90 to-white/70 dark:from-gray-900/90 dark:to-gray-900/70 backdrop-blur-md shadow-lg">
          {/* Enhanced Progress Ring with better visual feedback */}
          <div className="relative mb-3">
            <motion.div
              className="w-12 h-12 rounded-full border-3 border-gray-300 dark:border-gray-600"
              style={{
                borderTopColor: pullProgress.get() >= 1 ? '#10B981' : '#3B82F6',
                borderTopWidth: '3px',
                transform: `rotate(${pullProgress.get() * 360}deg)`
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{
                  scale: refreshStatus === 'completed' ? [1, 1.3, 1] : refreshStatus === 'triggered' ? [1, 1.1, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
                className={`
                  ${refreshStatus === 'triggered' || refreshStatus === 'refreshing' ? 'text-blue-600' : 'text-gray-500'}
                  ${refreshStatus === 'completed' ? 'text-green-600' : ''}
                `}
              >
                {getStatusIcon()}
              </motion.div>
            </div>
            
            {/* Pulse effect for active states */}
            {(refreshStatus === 'triggered' || refreshStatus === 'refreshing') && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-blue-400"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </div>

          {/* Enhanced Status Text with better typography */}
          <motion.p
            animate={{ 
              scale: refreshStatus === 'triggered' ? [1, 1.05, 1] : 1,
            }}
            transition={{ duration: 0.2 }}
            className={cn(
              "text-sm font-semibold tracking-wide",
              refreshStatus === 'triggered' ? 'text-blue-600' : 
              refreshStatus === 'completed' ? 'text-green-600' : 
              'text-gray-600'
            )}
          >
            {getStatusMessage()}
          </motion.p>

          {/* Enhanced Progress Bar with gradient */}
          <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-3 overflow-hidden shadow-inner">
            <motion.div
              style={{
                scaleX: pullProgress,
                originX: 0
              }}
              className={cn(
                "h-full rounded-full transition-all duration-300",
                refreshStatus === 'completed' ? 'bg-gradient-to-r from-green-400 to-green-500' : 
                refreshStatus === 'triggered' || refreshStatus === 'refreshing' ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'
              )}
            />
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ y: pullDistance }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;