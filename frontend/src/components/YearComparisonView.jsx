import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import AnalyticsErrorFallback from './AnalyticsErrorFallback';
import ChartErrorBoundary from './ChartErrorBoundary';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  ComposedChart,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowUpDown,
  Calendar,
  Target,
  Award,
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';

const YearComparisonView = React.memo(() => {
  const { apiCall } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);
  
  // FIXED: Initialize with explicit state to avoid blank page on mount
  const currentYear = new Date().getFullYear();
  const [baseYear, setBaseYear] = useState(currentYear - 1);
  const [compareYear, setCompareYear] = useState(currentYear);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const initializeComponent = async () => {
      await fetchAvailableYears();
      setHasInitialized(true);
    };
    initializeComponent();
  }, []);

  useEffect(() => {
    // FIXED: Auto-fetch data when component initializes with valid default years
    if (hasInitialized && baseYear && compareYear && baseYear !== compareYear) {
      fetchComparisonData();
    }
  }, [baseYear, compareYear, hasInitialized]);

  const fetchAvailableYears = async () => {
    try {
      console.log('Fetching available years...');
      const response = await apiCall('/analytics/available-years');
      if (response.years) {
        setAvailableYears(response.years);
        console.log('Available years loaded:', response.years.length);
      } else {
        console.warn('No years data in response:', response);
        // Set a default year range if no data
        const currentYear = new Date().getFullYear();
        setAvailableYears([
          { year: currentYear - 1, total_amount: 0 },
          { year: currentYear, total_amount: 0 }
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch available years:', err);
      // Fallback: provide current and previous year
      const currentYear = new Date().getFullYear();
      setAvailableYears([
        { year: currentYear - 1, total_amount: 0 },
        { year: currentYear, total_amount: 0 }
      ]);
      // Don't set error state here to allow component to work with fallback data
    }
  };

  const fetchComparisonData = async () => {
    if (!baseYear || !compareYear || baseYear === compareYear) {
      console.log('Skipping fetch: invalid year selection');
      return;
    }
    
    console.log(`Fetching comparison data: ${baseYear} vs ${compareYear}`);
    setLoading(true);
    setError('');
    try {
      const response = await apiCall(`/analytics/year-comparison?base_year=${baseYear}&compare_year=${compareYear}`);
      if (response && response.monthlyComparison) {
        console.log('Comparison data loaded successfully');
        setComparisonData(response);
      } else {
        // Fallback: fetch data for both years separately
        console.warn('Year comparison function not available, using fallback...');
        await fetchComparisonFallback();
      }
    } catch (err) {
      console.error('Primary API failed:', err);
      // Try fallback approach
      try {
        console.warn('Trying fallback approach...');
        await fetchComparisonFallback();
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        setError(`Unable to load year comparison data. This may indicate missing database functions. Error: ${err.message || err}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchComparisonFallback = async () => {
    // Fetch expenses for both years
    const [baseYearResponse, compareYearResponse] = await Promise.all([
      apiCall(`/expenses?start_date=${baseYear}-01-01&end_date=${baseYear}-12-31`),
      apiCall(`/expenses?start_date=${compareYear}-01-01&end_date=${compareYear}-12-31`)
    ]);

    if (baseYearResponse.expenses || compareYearResponse.expenses) {
      const baseExpenses = baseYearResponse.expenses || [];
      const compareExpenses = compareYearResponse.expenses || [];

      const monthlyComparisonData = generateComparisonFallback(baseExpenses, compareExpenses);

      // Calculate comprehensive summary data
      const baseYearTotal = baseExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const compareYearTotal = compareExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const totalDifference = compareYearTotal - baseYearTotal;
      const totalPercentageChange = baseYearTotal > 0 ? (totalDifference / baseYearTotal) * 100 : 0;

      // Calculate monthly averages (only for months with data)
      const baseMonthsWithData = monthlyComparisonData.filter(m => m.base_year_amount > 0).length;
      const compareMonthsWithData = monthlyComparisonData.filter(m => m.compare_year_amount > 0).length;
      const baseAvgMonthly = baseMonthsWithData > 0 ? baseYearTotal / baseMonthsWithData : 0;
      const compareAvgMonthly = compareMonthsWithData > 0 ? compareYearTotal / compareMonthsWithData : 0;

      // Find biggest increase and decrease
      let biggestIncrease = { month: '', amount: 0 };
      let biggestDecrease = { month: '', amount: 0 };
      let monthsWithIncreases = 0;
      let monthsWithDecreases = 0;

      monthlyComparisonData.forEach(month => {
        const diff = month.amount_difference;
        if (diff > 0) {
          monthsWithIncreases++;
          if (diff > biggestIncrease.amount) {
            biggestIncrease = { month: month.month_name, amount: diff };
          }
        } else if (diff < 0) {
          monthsWithDecreases++;
          if (diff < biggestDecrease.amount) {
            biggestDecrease = { month: month.month_name, amount: diff };
          }
        }
      });

      // Determine trend pattern
      let mostConsistentTrend = 'mixed';
      if (monthsWithIncreases > monthsWithDecreases * 2) {
        mostConsistentTrend = 'increasing';
      } else if (monthsWithDecreases > monthsWithIncreases * 2) {
        mostConsistentTrend = 'decreasing';
      } else if (monthsWithIncreases === 0 && monthsWithDecreases === 0) {
        mostConsistentTrend = 'unchanged';
      }

      setComparisonData({
        monthlyComparison: monthlyComparisonData,
        summary: {
          baseYearTotal,
          compareYearTotal,
          total_difference: totalDifference,
          total_percentage_change: totalPercentageChange,
          base_avg_monthly: baseAvgMonthly,
          compare_avg_monthly: compareAvgMonthly,
          months_with_increases: monthsWithIncreases,
          months_with_decreases: monthsWithDecreases,
          most_consistent_trend: mostConsistentTrend,
          biggest_increase_month: biggestIncrease.month,
          biggest_increase_amount: biggestIncrease.amount,
          biggest_decrease_month: biggestDecrease.month,
          biggest_decrease_amount: biggestDecrease.amount
        }
      });
      setError(''); // Clear error since fallback worked
    } else {
      setError(`No data available for ${baseYear} or ${compareYear}`);
    }
  };

  const generateComparisonFallback = (baseExpenses, compareExpenses) => {
    const baseMonthly = groupExpensesByMonth(baseExpenses);
    const compareMonthly = groupExpensesByMonth(compareExpenses);
    
    const comparison = [];
    
    for (let month = 1; month <= 12; month++) {
      const baseAmount = baseMonthly[month] || 0;
      const compareAmount = compareMonthly[month] || 0;
      const difference = compareAmount - baseAmount;
      const percentageChange = baseAmount > 0 ? (difference / baseAmount) * 100 : 0;
      
      comparison.push({
        month,
        month_name: new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'long' }),
        month_short: new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'short' }),
        base_year_amount: baseAmount,
        compare_year_amount: compareAmount,
        amount_difference: difference,
        amount_percentage_change: percentageChange,
        status: difference > 0 ? 'increased' : difference < 0 ? 'decreased' : 'unchanged',
        trend_direction: percentageChange > 10 ? 'up' : percentageChange < -10 ? 'down' : 'stable'
      });
    }
    
    return comparison;
  };

  const groupExpensesByMonth = (expenses) => {
    const monthly = {};
    expenses.forEach(expense => {
      const month = new Date(expense.expense_date).getMonth() + 1;
      monthly[month] = (monthly[month] || 0) + parseFloat(expense.amount);
    });
    return monthly;
  };

  const handleRefresh = () => {
    fetchComparisonData();
  };

  // Debug: Add console logging to help identify blank page issues
  React.useEffect(() => {
    console.log('YearComparisonView Debug:', {
      loading,
      error,
      comparisonData: !!comparisonData,
      availableYears: availableYears.length,
      baseYear,
      compareYear,
      hasInitialized,
      willFetchData: hasInitialized && baseYear && compareYear && baseYear !== compareYear
    });
  }, [loading, error, comparisonData, availableYears, baseYear, compareYear, hasInitialized]);

  // FIXED: ALL HOOKS MUST BE CALLED BEFORE CONDITIONAL RETURNS
  // Prepare chart data with memoization - moved to top to fix hooks order
  const chartData = useMemo(() => {
    if (!comparisonData || !comparisonData.monthlyComparison) return [];
    return comparisonData.monthlyComparison.map(month => ({
      month: month.month_short,
      baseYear: parseFloat(month.base_year_amount || 0),
      compareYear: parseFloat(month.compare_year_amount || 0),
      difference: parseFloat(month.amount_difference || 0),
      percentageChange: parseFloat(month.amount_percentage_change || 0),
      significance: month.significance_level,
      trend: month.trend_direction,
      status: month.status
    }));
  }, [comparisonData]);

  // Custom tooltip for comparison chart - memoized - moved to top
  const ComparisonTooltip = useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-semibold text-lg">{label}</p>
          <div className="space-y-2 mt-2">
            <p className="text-blue-600">
              <span className="font-medium">{baseYear}:</span> {formatCurrency(data.baseYear)}
            </p>
            <p className="text-green-600">
              <span className="font-medium">{compareYear}:</span> {formatCurrency(data.compareYear)}
            </p>
            <p className={`font-semibold ${data.difference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              <span className="font-medium">Difference:</span> {data.difference >= 0 ? '+' : ''}{formatCurrency(data.difference)}
            </p>
            <p className={`${Math.abs(data.percentageChange) > 10 ? 'font-bold' : ''} ${data.percentageChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              <span className="font-medium">Change:</span> {data.percentageChange >= 0 ? '+' : ''}{data.percentageChange.toFixed(1)}%
            </p>
            <Badge variant={
              data.significance === 'very_high' ? 'destructive' :
              data.significance === 'high' ? 'destructive' :
              data.significance === 'medium' ? 'default' : 'secondary'
            }>
              {data.significance?.replace('_', ' ')} significance
            </Badge>
          </div>
        </div>
      );
    }
    return null;
  }, [baseYear, compareYear]);

  // FIXED: Define YearSelector component BEFORE it's used to avoid hoisting error
  const YearSelector = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Year Comparison Settings
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Base Year</label>
            <Select value={baseYear.toString()} onValueChange={(value) => setBaseYear(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select base year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((yearData) => (
                  <SelectItem key={`base-${yearData.year}`} value={yearData.year.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{yearData.year}</span>
                      <span className="text-sm text-muted-foreground ml-4">
                        {formatCurrency(yearData.total_amount)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Compare Year</label>
            <Select value={compareYear.toString()} onValueChange={(value) => setCompareYear(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select compare year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((yearData) => (
                  <SelectItem key={`compare-${yearData.year}`} value={yearData.year.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{yearData.year}</span>
                      <span className="text-sm text-muted-foreground ml-4">
                        {formatCurrency(yearData.total_amount)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {baseYear === compareYear && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please select two different years for comparison.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  // Early return conditions after YearSelector is defined
  // FIXED: Only show "select years" message if years are the same, not when data is loading
  if (baseYear === compareYear) {
    return (
      <div className="space-y-6">
        <YearSelector />
        <Alert>
          <AlertDescription>
            Please select two different years to view comparison analysis.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <YearSelector />
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading comparison data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('Rendering error state:', error);
    return (
      <div className="space-y-6">
        <YearSelector />
        <AnalyticsErrorFallback
          error={{ message: error }}
          onRetry={fetchComparisonData}
          componentName="Year Comparison"
          showDatabaseSetupHelp={true}
        />
      </div>
    );
  }

  // FIXED: Provide better feedback when no comparison data is available
  if (!comparisonData) {
    return (
      <div className="space-y-6">
        <YearSelector />
        <Alert>
          <AlertDescription>
            No comparison data available for {baseYear} vs {compareYear}. 
            Try selecting different years or ensure you have expense data for both years.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Data destructuring after hooks are called
  const { monthlyComparison, summary, categoryComparison } = comparisonData || {};

  return (
    <div className="space-y-6">
      <YearSelector />

      {/* Summary Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Change</p>
                <p className={`text-2xl font-bold ${
                  summary.total_difference >= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {summary.total_difference >= 0 ? '+' : ''}{formatCurrency(summary.total_difference || 0)}
                </p>
                <p className={`text-xs ${
                  summary.total_percentage_change >= 0 ? 'text-red-500' : 'text-green-500'
                }`}>
                  {summary.total_percentage_change >= 0 ? '+' : ''}{(summary.total_percentage_change || 0).toFixed(1)}% change
                </p>
              </div>
              {summary.total_difference >= 0 ? 
                <TrendingUp className="h-8 w-8 text-red-600" /> :
                <TrendingDown className="h-8 w-8 text-green-600" />
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Average</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(summary.compare_avg_monthly || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  vs {formatCurrency(summary.base_avg_monthly || 0)} in {baseYear}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trend Pattern</p>
                <p className="text-lg font-bold text-purple-600">
                  {summary.most_consistent_trend?.replace('_', ' ') || 'Mixed'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.months_with_increases || 0} ↑ / {summary.months_with_decreases || 0} ↓
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Biggest Change</p>
                <p className="text-sm font-bold text-orange-600">
                  {summary.biggest_increase_amount > Math.abs(summary.biggest_decrease_amount || 0) ?
                    `${summary.biggest_increase_month} (+${formatCurrency(summary.biggest_increase_amount || 0)})` :
                    `${summary.biggest_decrease_month} (${formatCurrency(summary.biggest_decrease_amount || 0)})`
                  }
                </p>
                <p className="text-xs text-muted-foreground">Most significant</p>
              </div>
              <Award className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartErrorBoundary chartName="Monthly Spending Comparison" onRetry={fetchComparisonData}>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={<ComparisonTooltip />} />
                <Legend />

                <Bar
                  dataKey="baseYear"
                  name={`${baseYear} Spending`}
                  fill="#3B82F6"
                  opacity={0.7}
                  yAxisId="left"
                />
                <Bar
                  dataKey="compareYear"
                  name={`${compareYear} Spending`}
                  fill="#10B981"
                  opacity={0.7}
                  yAxisId="left"
                />

                <Line
                  type="monotone"
                  dataKey="difference"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  name="Difference"
                  yAxisId="right"
                  dot={{ r: 6 }}
                />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </CardContent>
        </Card>

        {/* Variance Analysis Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Percentage Change Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartErrorBoundary chartName="Percentage Change Analysis" onRetry={fetchComparisonData}>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value > 0 ? '+' : ''}${value.toFixed(1)}%`,
                    'Change'
                  ]}
                />
                <Legend />
                
                <Bar dataKey="percentageChange" name="% Change">
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.percentageChange > 25 ? '#EF4444' :
                        entry.percentageChange > 10 ? '#F59E0B' :
                        entry.percentageChange > -10 ? '#64748B' :
                        entry.percentageChange > -25 ? '#10B981' : '#059669'
                      } 
                    />
                  ))}
                </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </CardContent>
        </Card>
      </div>

      {/* Category Comparison */}
      {categoryComparison && categoryComparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Category-wise Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Category</th>
                    <th className="text-right p-2">{baseYear}</th>
                    <th className="text-right p-2">{compareYear}</th>
                    <th className="text-right p-2">Change</th>
                    <th className="text-right p-2">% Change</th>
                    <th className="text-center p-2">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryComparison.slice(0, 10).map((category) => (
                    <tr key={category.category_id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.category_color }}
                          />
                          <span className="font-medium truncate max-w-24">
                            {category.category_name}
                          </span>
                        </div>
                      </td>
                      <td className="p-2 text-right">
                        {formatCurrency(category.base_year_amount || 0)}
                      </td>
                      <td className="p-2 text-right">
                        {formatCurrency(category.compare_year_amount || 0)}
                      </td>
                      <td className={`p-2 text-right font-semibold ${
                        category.amount_difference >= 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {category.amount_difference >= 0 ? '+' : ''}{formatCurrency(category.amount_difference || 0)}
                      </td>
                      <td className={`p-2 text-right ${
                        category.percentage_change >= 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {category.percentage_change >= 0 ? '+' : ''}{(category.percentage_change || 0).toFixed(1)}%
                      </td>
                      <td className="p-2 text-center">
                        <Badge variant={
                          category.trend_status === 'increased' ? 'destructive' :
                          category.trend_status === 'decreased' ? 'default' : 'secondary'
                        }>
                          {category.trend_status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

export default YearComparisonView;