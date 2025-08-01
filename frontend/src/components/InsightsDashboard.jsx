import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Brain,
  AlertTriangle,
  AlertCircle,
  Info,
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  Lightbulb,
  RefreshCw,
  Loader2,
  Shield,
  Star
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';

const InsightsDashboard = () => {
  const { apiCall, user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [insightsData, setInsightsData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    
    try {
      const response = await apiCall(`/analytics/insights?limit=20${forceRefresh ? '&refresh=true' : ''}`);
      if (response.insights) {
        setInsightsData(response);
      }
    } catch (err) {
      setError('Failed to fetch insights data');
      console.error('Insights error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchInsights(true);
  };

  const getSeverityIcon = (severity) => {
    const iconProps = { className: "h-5 w-5" };
    switch (severity) {
      case 'critical':
        return <AlertTriangle {...iconProps} className="h-5 w-5 text-red-600" />;
      case 'alert':
        return <AlertCircle {...iconProps} className="h-5 w-5 text-orange-600" />;
      case 'warning':
        return <Info {...iconProps} className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Lightbulb {...iconProps} className="h-5 w-5 text-blue-600" />;
      default:
        return <Info {...iconProps} className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'alert':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getInsightTypeIcon = (insightType) => {
    const iconProps = { className: "h-4 w-4" };
    switch (insightType) {
      case 'spending_trend':
        return <TrendingUp {...iconProps} />;
      case 'category_dominance':
        return <Target {...iconProps} />;
      case 'unusual_spike':
        return <BarChart3 {...iconProps} />;
      case 'budget_recommendation':
        return <DollarSign {...iconProps} />;
      case 'system_overview':
        return <Shield {...iconProps} />;
      default:
        return <Brain {...iconProps} />;
    }
  };

  const InsightCard = ({ insight, showMetadata = false }) => (
    <Card className={`transition-all duration-300 hover:shadow-md ${getSeverityColor(insight.severity)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getSeverityIcon(insight.severity)}
            <CardTitle className="text-base font-semibold">
              {insight.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {getInsightTypeIcon(insight.insight_type)}
              <span className="ml-1">{insight.insight_category?.replace('_', ' ')}</span>
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Star className="h-3 w-3 mr-1" />
              {(insight.confidence_score * 100).toFixed(0)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed mb-3">
          {insight.description}
        </p>
        
        {showMetadata && insight.metadata && (
          <div className="mt-3 p-3 bg-white/50 rounded-lg">
            <p className="text-xs font-medium text-gray-600 mb-2">Additional Details:</p>
            <div className="space-y-1">
              {Object.entries(insight.metadata).map(([key, value]) => {
                if (key === 'user_id') return null;
                return (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-gray-600 capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="font-medium">
                      {typeof value === 'number' && key.includes('amount') 
                        ? formatCurrency(value)
                        : typeof value === 'number' && key.includes('percentage')
                        ? `${value.toFixed(1)}%`
                        : value?.toString() || 'N/A'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-current/20">
          <span className="text-xs text-current/70">
            {new Date(insight.created_at).toLocaleDateString()} at{' '}
            {new Date(insight.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading intelligent insights...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!insightsData) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>No insights data available.</AlertDescription>
      </Alert>
    );
  }

  const { insights, summary } = insightsData;

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-purple-600" />
              <div>
                <CardTitle className="text-xl">Intelligent Insights</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  AI-powered analysis of your spending patterns and recommendations
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Analyzing...' : 'Refresh Insights'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{summary.totalInsights}</div>
              <div className="text-xs text-muted-foreground">Total Insights</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.criticalCount}</div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{summary.alertCount}</div>
              <div className="text-xs text-muted-foreground">Alerts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summary.warningCount}</div>
              <div className="text-xs text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.recommendationCount}</div>
              <div className="text-xs text-muted-foreground">Tips</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(summary.avgConfidenceScore * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">Avg Confidence</div>
            </div>
          </div>
          
          {summary.lastUpdated && (
            <div className="mt-4 text-xs text-muted-foreground text-center">
              Last updated: {new Date(summary.lastUpdated).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights Content */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            All ({summary.totalInsights})
          </TabsTrigger>
          <TabsTrigger value="critical">
            Critical ({summary.criticalCount})
          </TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts ({summary.alertCount})
          </TabsTrigger>
          <TabsTrigger value="warnings">
            Warnings ({summary.warningCount})
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            Tips ({summary.recommendationCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {summary.totalInsights === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Insights Available</h3>
                <p className="text-sm text-gray-500">
                  Add more expenses to get personalized insights and recommendations.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[...insights.critical, ...insights.alerts, ...insights.warnings, ...insights.recommendations]
                .sort((a, b) => {
                  const severityOrder = { critical: 1, alert: 2, warning: 3, info: 4 };
                  if (severityOrder[a.severity] !== severityOrder[b.severity]) {
                    return severityOrder[a.severity] - severityOrder[b.severity];
                  }
                  return b.confidence_score - a.confidence_score;
                })
                .map((insight) => (
                  <InsightCard key={insight.id} insight={insight} showMetadata={true} />
                ))
              }
            </div>
          )}
        </TabsContent>

        <TabsContent value="critical" className="space-y-4">
          {insights.critical.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Critical Issues</h3>
                <p className="text-sm text-gray-500">Great! No critical spending issues detected.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {insights.critical.map((insight) => (
                <InsightCard key={insight.id} insight={insight} showMetadata={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {insights.alerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Alerts</h3>
                <p className="text-sm text-gray-500">No spending alerts at this time.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {insights.alerts.map((insight) => (
                <InsightCard key={insight.id} insight={insight} showMetadata={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="warnings" className="space-y-4">
          {insights.warnings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Warnings</h3>
                <p className="text-sm text-gray-500">Your spending patterns look good!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {insights.warnings.map((insight) => (
                <InsightCard key={insight.id} insight={insight} showMetadata={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {insights.recommendations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Recommendations</h3>
                <p className="text-sm text-gray-500">Check back later for personalized tips.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {insights.recommendations.map((insight) => (
                <InsightCard key={insight.id} insight={insight} showMetadata={true} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* System-wide Insights for Admins */}
      {isAdmin && insights.systemwide && insights.systemwide.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              System Overview (Admin)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {insights.systemwide.map((insight) => (
                <InsightCard key={insight.id} insight={insight} showMetadata={true} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InsightsDashboard;