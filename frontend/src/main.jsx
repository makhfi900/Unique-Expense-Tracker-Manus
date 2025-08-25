import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.jsx'  // Old custom JWT auth
import SupabaseApp from './SupabaseApp.jsx'  // New Supabase auth
import { initializePWAUtils } from './utils/pwaUtils.js'

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                console.log('New app version available');
                // You could show a toast notification here
                if (confirm('A new version is available. Refresh to update?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// PWA Install Prompt Handler
let deferredPrompt;
let isInstallable = false;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA install prompt available');
  
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  isInstallable = true;
  
  // Update UI to notify the user they can install the PWA
  showInstallPromotion();
});

// Handle PWA installation
window.addEventListener('appinstalled', (evt) => {
  console.log('PWA was installed');
  hideInstallPromotion();
});

// Function to show install promotion
function showInstallPromotion() {
  // Create install button if it doesn't exist
  if (!document.getElementById('pwa-install-button')) {
    const installButton = document.createElement('button');
    installButton.id = 'pwa-install-button';
    installButton.innerHTML = '📱 Install App';
    installButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      padding: 12px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
    `;
    
    installButton.addEventListener('mouseover', () => {
      installButton.style.background = '#2563eb';
      installButton.style.transform = 'translateY(-2px)';
    });
    
    installButton.addEventListener('mouseout', () => {
      installButton.style.background = '#3b82f6';
      installButton.style.transform = 'translateY(0)';
    });
    
    installButton.addEventListener('click', async () => {
      if (deferredPrompt) {
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        
        // Clear the deferredPrompt for next time
        deferredPrompt = null;
        isInstallable = false;
        hideInstallPromotion();
      }
    });
    
    document.body.appendChild(installButton);
  }
}

// Function to hide install promotion
function hideInstallPromotion() {
  const installButton = document.getElementById('pwa-install-button');
  if (installButton) {
    installButton.remove();
  }
}

// Check if app is already installed
window.addEventListener('DOMContentLoaded', () => {
  // Check if running as PWA
  if (window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true) {
    console.log('Running as PWA');
    // Add PWA-specific styles or functionality
    document.body.classList.add('pwa-mode');
  }
});

// Initialize PWA utilities
initializePWAUtils();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SupabaseApp />
  </StrictMode>,
)
