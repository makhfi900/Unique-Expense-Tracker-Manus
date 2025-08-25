import { useState, useEffect } from 'react';

export const useInstallNotification = () => {
  const [showInstallNotification, setShowInstallNotification] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [deviceType, setDeviceType] = useState('desktop');
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect device type
    const detectDeviceType = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      
      if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return 'ios';
      } else if (/android/i.test(userAgent)) {
        return 'android';
      }
      return 'desktop';
    };

    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone ||
                          document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
      return isStandalone;
    };

    // Check if user has dismissed the install notification
    const checkInstallNotificationStatus = () => {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const remindLater = localStorage.getItem('pwa-install-remind-later');
      const currentTime = Date.now();
      
      // If reminded later, show after 24 hours
      if (remindLater) {
        const remindTime = parseInt(remindLater);
        if (currentTime - remindTime < 24 * 60 * 60 * 1000) {
          return false;
        } else {
          localStorage.removeItem('pwa-install-remind-later');
        }
      }
      
      // If permanently dismissed, don't show
      return !dismissed;
    };

    // PWA install prompt for Android/Desktop
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      
      // Show notification if not installed and not dismissed
      const installed = checkInstalled();
      const canShowNotification = checkInstallNotificationStatus();
      
      if (!installed && canShowNotification) {
        setTimeout(() => {
          setShowInstallNotification(true);
        }, 3000); // Show after 3 seconds
      }
    };

    // PWA app installed
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
      setShowInstallNotification(false);
      localStorage.removeItem('pwa-install-dismissed');
      localStorage.removeItem('pwa-install-remind-later');
    };

    const currentDeviceType = detectDeviceType();
    setDeviceType(currentDeviceType);
    
    const installed = checkInstalled();
    
    // For iOS devices, show notification if not installed (no beforeinstallprompt event)
    if (currentDeviceType === 'ios' && !installed && checkInstallNotificationStatus()) {
      setTimeout(() => {
        setShowInstallNotification(true);
      }, 5000); // Show after 5 seconds for iOS
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async () => {
    if (!installPrompt) {
      console.log('No install prompt available');
      return false;
    }

    try {
      const result = await installPrompt.prompt();
      console.log('Install prompt result:', result.outcome);
      
      if (result.outcome === 'accepted') {
        setInstallPrompt(null);
        setShowInstallNotification(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error during PWA installation:', error);
      return false;
    }
  };

  const dismissInstallNotification = () => {
    setShowInstallNotification(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const remindLaterInstallNotification = () => {
    setShowInstallNotification(false);
    localStorage.setItem('pwa-install-remind-later', Date.now().toString());
  };

  const hideInstallNotification = () => {
    setShowInstallNotification(false);
  };

  return {
    showInstallNotification,
    deviceType,
    isInstalled,
    canInstall: !!installPrompt,
    installPWA,
    dismissInstallNotification,
    remindLaterInstallNotification,
    hideInstallNotification
  };
};