import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import {
  AlertTriangle,
  Database,
  ExternalLink,
  RefreshCw,
  Info,
  Code,
  Settings
} from 'lucide-react';

const AnalyticsErrorFallback = ({ 
  error, 
  onRetry, 
  componentName = 'Analytics',
  showDatabaseSetupHelp = false 
}) => {
  const isDatabaseError = error?.message?.includes('function') || 
                         error?.message?.includes('does not exist') ||
                         error?.message?.includes('ambiguous');

  const isInsightsError = error?.message?.includes('insights') ||
                         error?.message?.includes('get_user_insights');

  const isYearlyAnalysisError = error?.message?.includes('yearly') ||
                               error?.message?.includes('get_yearly_breakdown');

  const getErrorType = () => {
    if (isInsightsError) return 'AI Insights';
    if (isYearlyAnalysisError) return 'Yearly Analysis';
    return componentName;
  };

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>{getErrorType()} Temporarily Unavailable</strong>
          <br />
          {isDatabaseError 
            ? 'Database functions need to be set up. This feature will work once the database schema is properly configured.'
            : error?.message || 'An unexpected error occurred while loading analytics data.'
          }
        </AlertDescription>
      </Alert>

      {/* Database Setup Help */}
      {isDatabaseError && showDatabaseSetupHelp && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Database className="h-5 w-5" />
              Database Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                To enable advanced analytics features, the following database functions need to be installed:
              </p>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="space-y-1 text-xs font-mono">
                  {isYearlyAnalysisError && (
                    <div>• get_yearly_breakdown()</div>
                  )}
                  {isInsightsError && (
                    <>
                      <div>• get_user_insights()</div>
                      <div>• refresh_insights_cache()</div>
                    </>
                  )}
                  <div>• user_budget_settings table</div>
                  <div>• mv_yearly_monthly_breakdown view</div>
                </div>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>For Developers:</strong> Execute the SQL files in the <code>database/</code> 
                directory in your Supabase SQL Editor to enable these features:
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  <li><code>fix_analytics_functions.sql</code> - Core analytics functions</li>
                  <li><code>phase2_yearly_analysis.sql</code> - Yearly analysis features</li>
                  <li><code>phase4_intelligent_insights.sql</code> - AI insights system</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => window.open('https://supabase.com/docs/guides/database/functions', '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                Supabase Docs
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => window.open('https://app.supabase.com', '_blank')}
              >
                <Settings className="h-4 w-4" />
                Open Supabase
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mock Data Preview for Development */}
      {isDatabaseError && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Code className="h-5 w-5" />
              Development Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              In development, you can continue testing other features. The {getErrorType().toLowerCase()} 
              will automatically work once the database setup is complete.
            </p>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generic Error Fallback */}
      {!isDatabaseError && (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Unable to Load {getErrorType()}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              There was a problem loading the analytics data. Please try again.
            </p>
            <Button onClick={onRetry} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsErrorFallback;