import { useState, useEffect } from 'react';
import { 
  isPWA, 
  isOnline, 
  getConnectionStatus,
  showInstallPrompt,
  requestPersistentStorage,
  clearAppCaches,
  updateServiceWorker
} from '../utils/pwaUtils.js';

/**
 * Custom React hook for PWA functionality
 */
export function usePWA() {
  const [isAppPWA, setIsAppPWA] = useState(false);
  const [isAppOnline, setIsAppOnline] = useState(true);
  const [connectionInfo, setConnectionInfo] = useState({});
  const [installPrompt, setInstallPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    setIsAppPWA(isPWA());
    
    // Check initial online status
    setIsAppOnline(isOnline());
    setConnectionInfo(getConnectionStatus());

    // Listen for connection changes
    const handleConnectionChange = (event) => {
      setIsAppOnline(event.detail.isOnline);
      setConnectionInfo(getConnectionStatus());
    };

    // Listen for install prompt availability
    const handleInstallPrompt = (event) => {
      setInstallPrompt(event.detail.prompt);
      setCanInstall(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setCanInstall(false);
      setInstallPrompt(null);
      setIsAppPWA(true);
    };

    // Add event listeners
    window.addEventListener('connectionchange', handleConnectionChange);
    window.addEventListener('pwainstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('connectionchange', handleConnectionChange);
      window.removeEventListener('pwainstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Install the PWA
  const installPWA = async () => {
    if (canInstall && installPrompt) {
      const accepted = await showInstallPrompt();
      if (accepted) {
        setCanInstall(false);
        setInstallPrompt(null);
      }
      return accepted;
    }
    return false;
  };

  // Request persistent storage
  const requestStorage = async () => {
    return await requestPersistentStorage();
  };

  // Clear all caches
  const clearCaches = async () => {
    return await clearAppCaches();
  };

  // Update the service worker
  const updateApp = async () => {
    return await updateServiceWorker();
  };

  return {
    // Status
    isPWA: isAppPWA,
    isOnline: isAppOnline,
    canInstall,
    connectionInfo,

    // Actions
    installPWA,
    requestStorage,
    clearCaches,
    updateApp,

    // Utilities
    getNetworkType: () => connectionInfo.effectiveType || 'unknown',
    isSlowConnection: () => {
      const type = connectionInfo.effectiveType;
      return type === 'slow-2g' || type === '2g';
    },
    isFastConnection: () => {
      const type = connectionInfo.effectiveType;
      return type === '4g' || type === '5g';
    }
  };
}

/**
 * Custom hook for offline functionality
 */
export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOffline,
    isOnline: !isOffline
  };
}

/**
 * Custom hook for service worker updates
 */
export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration()
        .then((reg) => {
          if (reg) {
            setRegistration(reg);
            
            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    setUpdateAvailable(true);
                  }
                });
              }
            });
          }
        });
    }
  }, []);

  const applyUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return {
    updateAvailable,
    applyUpdate
  };
}