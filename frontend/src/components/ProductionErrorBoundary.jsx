import React from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, RefreshCw, Bug, Wifi, WifiOff } from 'lucide-react';

class ProductionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isNetworkError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Check if it's a network-related error
    const isNetworkError = error.message?.includes('fetch') || 
                          error.message?.includes('NetworkError') ||
                          error.message?.includes('Failed to load') ||
                          error.name === 'TypeError' && error.message?.includes('Failed to fetch');
    
    return { 
      hasError: true, 
      error,
      isNetworkError
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Log to console in development, send to monitoring in production
    if (process.env.NODE_ENV === 'production') {
      // In production, you would send this to your error monitoring service
      console.error('Production Error Boundary:', {
        error: error.toString(),
        errorInfo,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        retryCount: this.state.retryCount
      });
    } else {
      console.error('Development Error Boundary:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
    
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, isNetworkError, retryCount } = this.state;
      const { fallbackComponent: FallbackComponent, componentName = 'Component' } = this.props;

      // If a custom fallback component is provided, use it
      if (FallbackComponent) {
        return (
          <FallbackComponent 
            error={error}
            retry={this.handleRetry}
            reload={this.handleReload}
            retryCount={retryCount}
          />
        );
      }

      return (
        <Card className="border-red-200 bg-red-50 max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              {isNetworkError ? (
                <WifiOff className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
              {isNetworkError ? 'Connection Error' : 'Something went wrong'}
            </CardTitle>
            <CardDescription className="text-red-700">
              {isNetworkError 
                ? 'Unable to connect to the server. Please check your internet connection.'
                : `The ${componentName} encountered an error and couldn't be displayed.`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {process.env.NODE_ENV === 'development' && error && (
              <Alert className="border-orange-200 bg-orange-50">
                <Bug className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800">Development Debug Info</AlertTitle>
                <AlertDescription className="text-orange-700 text-sm">
                  <pre className="mt-2 p-2 bg-orange-100 rounded text-xs overflow-auto">
                    {error.toString()}
                    {this.state.errorInfo?.componentStack && (
                      <>\n\nComponent Stack:{this.state.errorInfo.componentStack}</>
                    )}
                  </pre>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                onClick={this.handleRetry}
                className="border-red-300 text-red-700 hover:bg-red-100"
                disabled={retryCount >= 3}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {retryCount >= 3 ? 'Max retries reached' : `Retry ${retryCount > 0 ? `(${retryCount})` : ''}`}
              </Button>

              {isNetworkError && (
                <Button 
                  variant="outline"
                  onClick={this.handleReload}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Wifi className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
              )}

              {process.env.NODE_ENV === 'production' && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    const subject = encodeURIComponent(`Error Report: ${componentName}`);
                    const body = encodeURIComponent(`Error occurred in ${componentName}\n\nError: ${error?.toString()}\nURL: ${window.location.href}\nTime: ${new Date().toISOString()}`);
                    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
                  }}
                  className="text-gray-600"
                >
                  Report Issue
                </Button>
              )}
            </div>

            {retryCount >= 3 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  The error persists after multiple retries. Please try refreshing the page or contact support if the problem continues.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundaries
export const withProductionErrorBoundary = (Component, componentName, fallbackComponent) => {
  return React.forwardRef((props, ref) => (
    <ProductionErrorBoundary 
      componentName={componentName}
      fallbackComponent={fallbackComponent}
    >
      <Component {...props} ref={ref} />
    </ProductionErrorBoundary>
  ));
};

export default ProductionErrorBoundary;