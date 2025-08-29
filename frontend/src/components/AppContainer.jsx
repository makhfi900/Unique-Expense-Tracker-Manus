import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '../context/NavigationContext';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Breadcrumb } from './ui/breadcrumb';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Loader2, ArrowLeft, Shield, Home } from 'lucide-react';

// Lazy load app components
const Dashboard = React.lazy(() => import('./Dashboard'));
const MultiAppNavigation = React.lazy(() => import('./MultiAppNavigation'));
const SettingsConfiguration = React.lazy(() => import('./SettingsConfiguration'));
const ExamManagement = React.lazy(() => import('./ExamManagement'));

const LoadingSpinner = ({ app }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-indigo-950">
    <div className="text-center space-y-4">
      <div className="relative">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
        <div className="absolute inset-0 h-12 w-12 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-pulse"></div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">Loading {app}...</h3>
        <p className="text-sm text-muted-foreground">Please wait while we prepare your application</p>
      </div>
    </div>
  </div>
);

const ErrorBoundaryFallback = ({ error, resetError, appName }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-indigo-950">
    <Card className="max-w-md mx-auto p-6">
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertTitle>Application Error</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>Failed to load {appName}. Please try refreshing the page.</p>
          {error?.message && (
            <details className="text-xs mt-2">
              <summary>Technical Details</summary>
              <code className="block mt-1 p-2 bg-muted rounded text-xs">
                {error.message}
              </code>
            </details>
          )}
        </AlertDescription>
      </Alert>
      <div className="flex space-x-2 mt-4">
        <Button variant="outline" onClick={resetError}>
          Try Again
        </Button>
        <Button onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    </Card>
  </div>
);

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryFallback 
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: null })}
          appName={this.props.appName}
        />
      );
    }

    return this.props.children;
  }
}

const AppContainer = () => {
  const { currentApp, breadcrumb, navigateToApp, apps } = useNavigation();
  const { canAccessApp, isAdministrator } = useRoleBasedAccess();

  // Access control check
  const hasAccess = canAccessApp(currentApp) || currentApp === 'hub';
  
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-indigo-950">
        <Card className="max-w-md mx-auto p-6">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have permission to access this application.
            </AlertDescription>
          </Alert>
          <Button 
            className="mt-4 w-full"
            onClick={() => navigateToApp('hub')}
          >
            <Home className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const renderCurrentApp = () => {
    switch (currentApp) {
      case 'hub':
        return <MultiAppNavigation />;
      
      case 'expenses':
        return <Dashboard />;
      
      case 'exams':
        return <ExamManagement />;
      
      case 'settings':
        return <SettingsConfiguration />;
      
      default:
        return <MultiAppNavigation />;
    }
  };

  const getAppName = () => {
    if (currentApp === 'hub') return 'Dashboard Hub';
    return apps[currentApp]?.name || currentApp;
  };

  const pageTransition = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 1.05 }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      {currentApp !== 'hub' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-800/30 sticky top-0 z-40"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateToApp('hub')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Hub
                </Button>
                
                {/* Breadcrumb Navigation */}
                {breadcrumb.length > 0 && (
                  <nav className="flex items-center space-x-2 text-sm">
                    {breadcrumb.map((item, index) => (
                      <React.Fragment key={index}>
                        {index > 0 && (
                          <span className="text-muted-foreground">/</span>
                        )}
                        <span 
                          className={
                            index === breadcrumb.length - 1 
                              ? "font-medium text-foreground"
                              : "text-muted-foreground hover:text-foreground cursor-pointer"
                          }
                          onClick={() => {
                            if (index < breadcrumb.length - 1) {
                              // Navigate to breadcrumb item
                              navigateToApp(currentApp);
                            }
                          }}
                        >
                          {item.label}
                        </span>
                      </React.Fragment>
                    ))}
                  </nav>
                )}
              </div>

              {/* App Status Indicator */}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">
                  {getAppName()}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* App Content */}
      <AppErrorBoundary appName={getAppName()}>
        <Suspense fallback={<LoadingSpinner app={getAppName()} />}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentApp}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageTransition}
              transition={{ 
                duration: 0.4,
                type: "spring",
                stiffness: 100,
                damping: 20
              }}
            >
              {renderCurrentApp()}
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </AppErrorBoundary>

      {/* Development Mode Indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-xs font-medium border border-yellow-200 dark:border-yellow-800">
            Dev Mode • {currentApp}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppContainer;