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

// Remove old install prompt handler - now handled by React component

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
