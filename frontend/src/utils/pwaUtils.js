/**
 * PWA Utility Functions
 * Handles offline detection, service worker communication, and PWA features
 */

// Offline status management
let isOffline = false;
let offlineIndicator = null;

/**
 * Initialize PWA utilities
 */
export function initializePWAUtils() {
  // Create offline indicator
  createOfflineIndicator();
  
  // Listen for online/offline events
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Check initial connection status
  if (!navigator.onLine) {
    handleOffline();
  }
  
  // Listen for service worker messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
  }
}

/**
 * Create offline indicator element
 */
function createOfflineIndicator() {
  if (!document.getElementById('offline-indicator')) {
    offlineIndicator = document.createElement('div');
    offlineIndicator.id = 'offline-indicator';
    offlineIndicator.className = 'offline-indicator';
    offlineIndicator.innerHTML = '📡 You are offline. Some features may be limited.';
    document.body.appendChild(offlineIndicator);
  }
}

/**
 * Handle online event
 */
function handleOnline() {
  console.log('[PWA] Back online');
  isOffline = false;
  
  if (offlineIndicator) {
    offlineIndicator.classList.remove('show');
  }
  
  // Trigger data sync if needed
  syncOfflineData();
  
  // Notify components about online status
  dispatchConnectionEvent('online');
}

/**
 * Handle offline event
 */
function handleOffline() {
  console.log('[PWA] Gone offline');
  isOffline = true;
  
  if (offlineIndicator) {
    offlineIndicator.classList.add('show');
  }
  
  // Notify components about offline status
  dispatchConnectionEvent('offline');
}

/**
 * Dispatch custom connection event
 */
function dispatchConnectionEvent(status) {
  const event = new CustomEvent('connectionchange', {
    detail: { isOnline: status === 'online', isOffline: status === 'offline' }
  });
  window.dispatchEvent(event);
}

/**
 * Handle service worker messages
 */
function handleServiceWorkerMessage(event) {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'CACHE_UPDATED':
      console.log('[PWA] Cache updated:', payload);
      break;
    case 'SYNC_COMPLETE':
      console.log('[PWA] Background sync completed:', payload);
      showToast('Data synchronized');
      break;
    case 'OFFLINE_DATA':
      console.log('[PWA] Serving offline data:', payload);
      break;
    default:
      console.log('[PWA] Unknown message from service worker:', event.data);
  }
}

/**
 * Sync offline data when back online
 */
async function syncOfflineData() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_REQUEST',
        payload: { timestamp: Date.now() }
      });
    } catch (error) {
      console.error('[PWA] Failed to trigger sync:', error);
    }
  }
}

/**
 * Check if app is running as PWA
 */
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
}

/**
 * Check if device is online
 */
export function isOnline() {
  return navigator.onLine && !isOffline;
}

/**
 * Get connection status
 */
export function getConnectionStatus() {
  return {
    online: navigator.onLine && !isOffline,
    offline: !navigator.onLine || isOffline,
    effectiveType: navigator.connection?.effectiveType || 'unknown',
    downlink: navigator.connection?.downlink || 0,
    rtt: navigator.connection?.rtt || 0
  };
}

/**
 * Show toast notification
 */
function showToast(message, duration = 3000) {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'pwa-toast';
  toast.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 300px;
    word-wrap: break-word;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Animate in
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
  });
  
  // Remove after duration
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

/**
 * Request persistent storage
 */
export async function requestPersistentStorage() {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    try {
      const persistent = await navigator.storage.persist();
      console.log('[PWA] Persistent storage:', persistent);
      return persistent;
    } catch (error) {
      console.error('[PWA] Failed to request persistent storage:', error);
      return false;
    }
  }
  return false;
}

/**
 * Get storage estimate
 */
export async function getStorageEstimate() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      console.log('[PWA] Storage estimate:', estimate);
      return estimate;
    } catch (error) {
      console.error('[PWA] Failed to get storage estimate:', error);
      return null;
    }
  }
  return null;
}

/**
 * Clear app caches
 */
export async function clearAppCaches() {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('[PWA] All caches cleared');
      return true;
    } catch (error) {
      console.error('[PWA] Failed to clear caches:', error);
      return false;
    }
  }
  return false;
}

/**
 * Update service worker
 */
export async function updateServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        console.log('[PWA] Service worker update check completed');
        return true;
      }
    } catch (error) {
      console.error('[PWA] Failed to update service worker:', error);
    }
  }
  return false;
}

/**
 * Add to home screen prompt handling
 */
let deferredPrompt = null;

export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Dispatch custom event for components to handle
    const installEvent = new CustomEvent('pwainstallprompt', {
      detail: { prompt: deferredPrompt }
    });
    window.dispatchEvent(installEvent);
  });
}

export async function showInstallPrompt() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install prompt outcome:', outcome);
    deferredPrompt = null;
    return outcome === 'accepted';
  }
  return false;
}

// Initialize when module is loaded
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initializePWAUtils);
  setupInstallPrompt();
}