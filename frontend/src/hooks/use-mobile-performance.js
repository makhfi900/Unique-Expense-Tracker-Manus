/**
 * Mobile Performance Hook
 * Provides utilities for mobile-specific performance optimizations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useIsMobile } from './use-mobile';

export const useMobilePerformance = () => {
  const isMobile = useIsMobile();
  const [performanceMetrics, setPerformanceMetrics] = useState({
    memoryUsage: null,
    connectionType: 'unknown',
    isSlowConnection: false,
    batteryLevel: null,
    isLowPowerMode: false
  });
  
  const abortControllerRef = useRef(null);
  const timeoutRefs = useRef(new Set());

  // Detect connection speed and type
  useEffect(() => {
    if (!isMobile || typeof navigator === 'undefined') return;

    const updateConnectionInfo = () => {
      if ('connection' in navigator) {
        const connection = navigator.connection;
        const isSlowConnection = 
          connection.effectiveType === 'slow-2g' || 
          connection.effectiveType === '2g' ||
          connection.downlink < 1.5;
        
        setPerformanceMetrics(prev => ({
          ...prev,
          connectionType: connection.effectiveType || 'unknown',
          isSlowConnection
        }));
      }
    };

    updateConnectionInfo();
    
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', updateConnectionInfo);
      return () => navigator.connection.removeEventListener('change', updateConnectionInfo);
    }
  }, [isMobile]);

  // Monitor memory usage (if available)
  useEffect(() => {
    if (!isMobile || !('memory' in performance)) return;

    const checkMemory = () => {
      const memInfo = performance.memory;
      const usagePercent = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;
      
      setPerformanceMetrics(prev => ({
        ...prev,
        memoryUsage: {
          used: memInfo.usedJSHeapSize,
          total: memInfo.jsHeapSizeLimit,
          percentage: usagePercent,
          isHigh: usagePercent > 80
        }
      }));
    };

    checkMemory();
    const interval = setInterval(checkMemory, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [isMobile]);

  // Battery API monitoring
  useEffect(() => {
    if (!isMobile || !('getBattery' in navigator)) return;

    navigator.getBattery().then(battery => {
      const updateBatteryInfo = () => {
        setPerformanceMetrics(prev => ({
          ...prev,
          batteryLevel: battery.level,
          isLowPowerMode: battery.level < 0.2 || !battery.charging
        }));
      };

      updateBatteryInfo();
      battery.addEventListener('levelchange', updateBatteryInfo);
      battery.addEventListener('chargingchange', updateBatteryInfo);

      return () => {
        battery.removeEventListener('levelchange', updateBatteryInfo);
        battery.removeEventListener('chargingchange', updateBatteryInfo);
      };
    }).catch(() => {
      // Battery API not supported
    });
  }, [isMobile]);

  // Create mobile-optimized API call with timeout and abort
  const createMobileApiCall = useCallback((apiCall, url, options = {}) => {
    if (!isMobile) {
      return apiCall(url);
    }

    // Clean up previous abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    const timeoutDuration = performanceMetrics.isSlowConnection ? 20000 : 15000;
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }, timeoutDuration);
    
    timeoutRefs.current.add(timeoutId);

    return Promise.race([
      apiCall(url, { 
        ...options, 
        signal: abortControllerRef.current.signal 
      }),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout (${timeoutDuration}ms) - slow mobile connection detected`));
        }, timeoutDuration);
      })
    ]).finally(() => {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(timeoutId);
    });
  }, [isMobile, performanceMetrics.isSlowConnection]);

  // Mobile-specific chart configuration
  const getMobileChartConfig = useCallback((baseConfig = {}) => {
    if (!isMobile) return baseConfig;

    return {
      ...baseConfig,
      height: Math.min(baseConfig.height || 300, 250),
      margin: { top: 5, right: 5, bottom: 20, left: 5 },
      fontSize: 10,
      reducedDataPoints: true,
      animationDuration: performanceMetrics.isSlowConnection ? 0 : 300,
      enableTooltip: !performanceMetrics.memoryUsage?.isHigh,
      maxDataPoints: performanceMetrics.isSlowConnection ? 20 : 50
    };
  }, [isMobile, performanceMetrics.isSlowConnection, performanceMetrics.memoryUsage?.isHigh]);

  // Debounced function for mobile performance
  const debounceForMobile = useCallback((func, delay = 300) => {
    if (!isMobile) return func;
    
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
      timeoutRefs.current.add(timeoutId);
    };
  }, [isMobile]);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Abort any pending API calls
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear all timeouts
    timeoutRefs.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    timeoutRefs.current.clear();

    // Suggest garbage collection on mobile
    if (isMobile && window.gc && performanceMetrics.memoryUsage?.isHigh) {
      try {
        window.gc();
      } catch (e) {
        // GC not available
      }
    }
  }, [isMobile, performanceMetrics.memoryUsage?.isHigh]);

  // Auto cleanup on unmount or mobile state change
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isMobile,
    performanceMetrics,
    createMobileApiCall,
    getMobileChartConfig,
    debounceForMobile,
    cleanup,
    
    // Helper functions
    shouldUseReducedAnimations: performanceMetrics.isSlowConnection || performanceMetrics.memoryUsage?.isHigh,
    shouldLimitDataPoints: performanceMetrics.isSlowConnection || performanceMetrics.isLowPowerMode,
    recommendedChunkSize: performanceMetrics.isSlowConnection ? 10 : 25,
    recommendedCacheSize: performanceMetrics.memoryUsage?.isHigh ? 1 : 3
  };
};

export default useMobilePerformance;