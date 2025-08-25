import React from 'react';
import { AuthProvider, useAuth } from './context/SupabaseAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TimeRangeProvider } from './context/TimeRangeContext';
import { DemoProvider, useDemo } from './context/DemoContext';
import SupabaseLogin from './components/SupabaseLogin';
import Dashboard from './components/Dashboard';
import DemoDashboard from './components/DemoDashboard';
import InstallNotification from './components/InstallNotification';
import { useInstallNotification } from './hooks/useInstallNotification';
import { Loader2 } from 'lucide-react';
import './App.css';

function AppContent() {
  const { user, loading } = useAuth();
  const { isDemoMode } = useDemo();
  const {
    showInstallNotification,
    deviceType,
    isInstalled,
    canInstall,
    installPWA,
    dismissInstallNotification,
    remindLaterInstallNotification,
    hideInstallNotification
  } = useInstallNotification();
  
  // Check for demo mode via URL parameters or environment variable
  const urlParams = new URLSearchParams(window.location.search);
  const urlDemoMode = urlParams.get('demo') === 'true' || 
                     urlParams.get('preview') === 'true' || 
                     import.meta.env.VITE_DEMO_MODE === 'true';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-foreground">Loading...</p>
          <p className="text-sm text-muted-foreground mt-2">Initializing Supabase Auth...</p>
        </div>
      </div>
    );
  }

  // Show demo dashboard if in demo mode (from context or URL)
  if (isDemoMode || (urlDemoMode && !user)) {
    return <DemoDashboard />;
  }

  // Otherwise, use normal authentication flow
  return (
    <>
      {user ? <Dashboard /> : <SupabaseLogin />}
      {/* Show install notification if PWA is not installed and conditions are met */}
      <InstallNotification
        isVisible={showInstallNotification && !isInstalled}
        onInstall={installPWA}
        onDismiss={dismissInstallNotification}
        onRemindLater={remindLaterInstallNotification}
        deviceType={deviceType}
      />
    </>
  );
}

function SupabaseApp() {
  return (
    <ThemeProvider>
      <DemoProvider>
        <AuthProvider>
          <TimeRangeProvider>
            <AppContent />
          </TimeRangeProvider>
        </AuthProvider>
      </DemoProvider>
    </ThemeProvider>
  );
}

export default SupabaseApp;