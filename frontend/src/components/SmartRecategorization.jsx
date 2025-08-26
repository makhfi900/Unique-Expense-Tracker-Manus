import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/SupabaseAuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { 
  Brain, 
  Zap, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Play,
  BarChart3,
  Loader2,
  RefreshCw,
  Sparkles
} from 'lucide-react';

const SmartRecategorization = () => {
  const { apiCall, user, isAdmin } = useAuth();
  const [analysisData, setAnalysisData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Configuration state
  const [config, setConfig] = useState({
    minConfidence: 0.7,
    maxUpdates: 500,
    categoryFilter: '',
    dryRun: true
  });

  // Analysis results state
  const [selectedSuggestions, setSelectedSuggestions] = useState(new Set());
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchReport();
    }
  }, [isAdmin]);

  const fetchAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError('');
      
      const params = new URLSearchParams({
        min_confidence: config.minConfidence.toString(),
        limit: config.maxUpdates.toString()
      });

      if (config.categoryFilter) {
        params.append('category_filter', config.categoryFilter);
      }

      const data = await apiCall(`/recategorization/analyze?${params}`);
      setAnalysisData(data.data);
      setSuccess(`Analysis complete! Found ${data.data.highConfidenceCount} high-confidence suggestions.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/recategorization/report?limit=20');
      setReportData(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyBulkRecategorization = async () => {
    if (!window.confirm(`This will update up to ${config.maxUpdates} expenses with confidence >= ${config.minConfidence}. Continue?`)) {
      return;
    }

    try {
      setApplying(true);
      setError('');

      const requestBody = {
        min_confidence: config.minConfidence,
        max_updates: config.maxUpdates,
        category_filter: config.categoryFilter || null
      };

      const data = await apiCall('/recategorization/bulk-apply', {
        method: 'POST',
        body: requestBody
      });

      setSuccess(`Successfully recategorized ${data.data.highConfidenceCount} expenses!`);
      
      // Refresh analysis and report
      await fetchAnalysis();
      await fetchReport();
    } catch (err) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  };

  const testSingleExpense = async (description, amount = 1000) => {
    try {
      const data = await apiCall('/recategorization/single', {
        method: 'POST',
        body: { description, amount }
      });
      return data.data.suggestion;
    } catch (err) {
      console.error('Test single expense error:', err);
      return null;
    }
  };

  const ConfidenceBar = ({ confidence }) => {
    const percentage = Math.round(confidence * 100);
    const getColor = () => {
      if (percentage >= 80) return 'bg-green-500';
      if (percentage >= 60) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    return (
      <div className="flex items-center space-x-2">
        <div className="w-20 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${getColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium">{percentage}%</span>
      </div>
    );
  };

  const CategoryBadge = ({ category, confidence }) => (
    <Badge 
      variant={confidence >= 0.8 ? "default" : confidence >= 0.6 ? "secondary" : "outline"}
      className="flex items-center space-x-1"
    >
      <Target className="h-3 w-3" />
      <span>{category}</span>
    </Badge>
  );

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Admin access is required to use the Smart Recategorization system.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <span>Smart Recategorization</span>
            <Sparkles className="h-5 w-5 text-yellow-500" />
          </h2>
          <p className="text-muted-foreground">
            AI-powered expense categorization with Pakistani context awareness
          </p>
        </div>
        <Button onClick={fetchReport} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analyze">Analyze</TabsTrigger>
          <TabsTrigger value="apply">Apply</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  System Accuracy
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData?.statistics?.accuracy || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on recent categorizations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Needs Review
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData?.statistics?.needsRecategorization || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Expenses needing recategorization
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Confidence
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round((reportData?.statistics?.averageConfidence || 0) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  System confidence level
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Categorization Analysis</CardTitle>
              <CardDescription>
                Latest expenses analyzed by the ML engine
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Current</TableHead>
                      <TableHead>Suggested</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reportData?.report || []).slice(0, 10).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium max-w-xs truncate">
                          {item.description}
                        </TableCell>
                        <TableCell>Rs. {item.amount}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.currentCategory}</Badge>
                        </TableCell>
                        <TableCell>
                          <CategoryBadge 
                            category={item.suggestedCategory}
                            confidence={item.confidence}
                          />
                        </TableCell>
                        <TableCell>
                          <ConfidenceBar confidence={item.confidence} />
                        </TableCell>
                        <TableCell>
                          {item.isCorrect ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analyze" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Analyze Expenses</span>
              </CardTitle>
              <CardDescription>
                Run analysis to identify categorization opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minConfidence">Minimum Confidence</Label>
                  <Input
                    id="minConfidence"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.minConfidence}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      minConfidence: parseFloat(e.target.value)
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUpdates">Max Analysis Limit</Label>
                  <Input
                    id="maxUpdates"
                    type="number"
                    min="50"
                    max="2000"
                    step="50"
                    value={config.maxUpdates}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      maxUpdates: parseInt(e.target.value)
                    }))}
                  />
                </div>
              </div>
              
              <Button 
                onClick={fetchAnalysis} 
                disabled={analyzing}
                className="w-full"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Run Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {analysisData && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analysisData.processedCount}</div>
                    <div className="text-sm text-muted-foreground">Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{analysisData.highConfidenceCount}</div>
                    <div className="text-sm text-muted-foreground">High Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{Math.round(analysisData.averageConfidence * 100)}%</div>
                    <div className="text-sm text-muted-foreground">Avg Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analysisData.suggestions.length}</div>
                    <div className="text-sm text-muted-foreground">Suggestions</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Top Suggestions:</h4>
                  {analysisData.suggestions.slice(0, 5).map((suggestion, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium truncate max-w-xs">
                          {suggestion.expense.description}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Rs. {suggestion.expense.amount} • {suggestion.reasoning}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CategoryBadge 
                          category={suggestion.suggestedCategoryName}
                          confidence={suggestion.confidence}
                        />
                        <ConfidenceBar confidence={suggestion.confidence} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="apply" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Apply Recategorization</span>
              </CardTitle>
              <CardDescription>
                Apply AI-powered categorization to your expenses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will permanently update expense categories. Make sure to review the analysis first.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="applyMinConfidence">Minimum Confidence</Label>
                  <Input
                    id="applyMinConfidence"
                    type="number"
                    min="0.7"
                    max="0.95"
                    step="0.05"
                    value={config.minConfidence}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      minConfidence: parseFloat(e.target.value)
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values = more conservative updates
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="applyMaxUpdates">Max Updates</Label>
                  <Input
                    id="applyMaxUpdates"
                    type="number"
                    min="50"
                    max="1000"
                    step="50"
                    value={config.maxUpdates}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      maxUpdates: parseInt(e.target.value)
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of expenses to update
                  </p>
                </div>
              </div>

              <Button 
                onClick={applyBulkRecategorization}
                disabled={applying}
                className="w-full"
                variant="default"
              >
                {applying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Applying Changes...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Apply Recategorization
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Categorization Report</CardTitle>
              <CardDescription>
                Comprehensive analysis of categorization accuracy
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Current Category</TableHead>
                      <TableHead>AI Suggestion</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Reasoning</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reportData?.report || []).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium max-w-xs">
                          <div className="truncate" title={item.description}>
                            {item.description}
                          </div>
                        </TableCell>
                        <TableCell>Rs. {item.amount}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.currentCategory}</Badge>
                        </TableCell>
                        <TableCell>
                          <CategoryBadge 
                            category={item.suggestedCategory}
                            confidence={item.confidence}
                          />
                        </TableCell>
                        <TableCell>
                          <ConfidenceBar confidence={item.confidence} />
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate text-xs" title={item.reasoning}>
                            {item.reasoning}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.isCorrect ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Correct
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-500 text-white">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Review
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartRecategorization;