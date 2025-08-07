import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/SupabaseAuthContext';
import { formatCurrency } from '../utils/currency';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import YearSelector from './YearSelector';
import MonthlyYearlyView from './MonthlyYearlyView';
import YearComparisonView from './YearComparisonView';
import InsightsDashboard from './InsightsDashboard';
import TimeRangeSlider from './TimeRangeSlider';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Loader2,
  Filter,
  Target,
  RefreshCw,
  Settings,
  ToggleLeft,
  ToggleRight,
  Play,
  Pause
} from 'lucide-react';

const EnhancedAnalytics = () => {
  const { apiCall, user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Chart display preferences
  const [categoryChartType, setCategoryChartType] = useState('donut'); // 'bar' or 'donut' for category breakdown

  // Date range filtering - Set to "All Time" by default to show all existing data
  const [dateRange, setDateRange] = useState({
    startDate: '2000-01-01',
    endDate: new Date().toISOString().split('T')[0]
  });

  // Quick presets - Set to "All Time" by default to show all existing data  
  const [selectedPreset, setSelectedPreset] = useState('all_time');

  // Category-specific analysis
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categoryAnalysis, setCategoryAnalysis] = useState(null);

  // Analytics data
  const [kpiData, setKpiData] = useState({
    totalSpent: 0,
    totalExpenses: 0,
    averageExpense: 0,
    topCategory: null,
    categoriesUsed: 0,
    totalCategories: 0
  });


  const [trendsData, setTrendsData] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);

  // Phase 2: Yearly Analysis State
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Date presets
  const datePresets = {
    today: {
      label: 'Today',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    this_week: {
      label: 'This Week',
      startDate: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    this_month: {
      label: 'This Month',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    last_month: {
      label: 'Last Month',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]
    },
    last_30_days: {
      label: 'Last 30 Days',
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    last_90_days: {
      label: 'Last 90 Days',
      startDate: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    this_year: {
      label: 'This Year',
      startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    all_time: {
      label: 'All Time',
      startDate: '2000-01-01',
      endDate: new Date().toISOString().split('T')[0]
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []); // Only run once on mount

  useEffect(() => {
    if (categories.length > 0) { // Only fetch analytics after categories are loaded
      fetchAnalyticsData();
    }
  }, [dateRange, selectedCategory, categories.length]); // Properly trigger on date/category changes

  const fetchCategories = async () => {
    try {
      const response = await apiCall('/categories');
      if (response.categories) {
        setCategories(response.categories);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError('');
    try {
      // Use Promise.all for parallel requests to improve performance
      const requests = [];
      
      // 1. Fetch spending trends
      const startYear = new Date(dateRange.startDate).getFullYear();
      requests.push(
        apiCall(`/analytics/spending-trends?period=monthly&year=${startYear}&start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`)
          .catch(err => ({ error: err.message, type: 'trends' }))
      );
      
      // 2. Fetch category breakdown
      requests.push(
        apiCall(`/analytics/category-breakdown?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`)
          .catch(err => ({ error: err.message, type: 'categories' }))
      );

      // Execute all requests in parallel
      const [trendsResponse, categoryResponse] = await Promise.all(requests);
      
      // Handle trends data
      if (trendsResponse.trends && !trendsResponse.error) {
        const trendsArray = Object.entries(trendsResponse.trends).map(([month, amount]) => ({
          month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          amount: parseFloat(amount)
        }));
        setTrendsData(trendsArray);
      } else if (trendsResponse.error) {
        console.warn('Trends data failed:', trendsResponse.error);
        setTrendsData([]);
      }

      // Handle category breakdown
      if (categoryResponse.breakdown && !categoryResponse.error) {
        const breakdownArray = Object.entries(categoryResponse.breakdown).map(([name, data]) => ({
          name,
          value: parseFloat(data.total),
          count: data.count,
          color: data.color
        }));
        setCategoryBreakdown(breakdownArray);
        
        // Calculate KPIs from category data
        const totalSpent = breakdownArray.reduce((sum, cat) => sum + cat.value, 0);
        const totalExpenses = breakdownArray.reduce((sum, cat) => sum + cat.count, 0);
        const averageExpense = totalExpenses > 0 ? totalSpent / totalExpenses : 0;
        
        // Find top category
        const topCategory = breakdownArray.length > 0 
          ? breakdownArray.reduce((max, cat) => cat.value > max.value ? cat : max)
          : null;

        setKpiData({
          totalSpent,
          totalExpenses,
          averageExpense,
          topCategory: topCategory ? { name: topCategory.name, amount: topCategory.value } : null,
          categoriesUsed: breakdownArray.length,
          totalCategories: categories.length
        });
      } else if (categoryResponse.error) {
        console.warn('Category data failed:', categoryResponse.error);
        setCategoryBreakdown([]);
      }

      // 3. If specific category is selected, fetch category-specific analysis
      if (selectedCategory !== 'all') {
        await fetchCategoryAnalysis(selectedCategory);
      } else {
        setCategoryAnalysis(null);
      }

    } catch (err) {
      setError('Failed to fetch analytics data: ' + err.message);
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryAnalysis = async (categoryId) => {
    try {
      // Fetch expenses for the specific category via API
      const expensesResponse = await apiCall(`/expenses?category_id=${categoryId}&start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`);
      
      if (expensesResponse.expenses) {
        const expenses = expensesResponse.expenses;
        
        // Group by month for trend analysis
        const monthlyData = {};
        expenses.forEach(expense => {
          const month = expense.expense_date.slice(0, 7);
          monthlyData[month] = (monthlyData[month] || 0) + parseFloat(expense.amount);
        });

        const monthlyTrend = Object.entries(monthlyData).map(([month, amount]) => ({
          month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          amount: amount
        }));

        const categoryInfo = categories.find(cat => cat.id === categoryId);
        const totalSpent = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
        const totalExpenses = expenses.length;

        setCategoryAnalysis({
          category: categoryInfo,
          totalSpent,
          totalExpenses,
          averageExpense: totalExpenses > 0 ? totalSpent / totalExpenses : 0,
          monthlyTrend,
          recentExpenses: expenses.slice(0, 5) // Show recent 5 expenses
        });
      }

    } catch (err) {
      console.error('Failed to fetch category analysis:', err);
    }
  };

  const handlePresetChange = (preset, customRange = null) => {
    setSelectedPreset(preset);
    if (preset !== 'custom' && !customRange) {
      setDateRange({
        startDate: datePresets[preset].startDate,
        endDate: datePresets[preset].endDate
      });
    } else if (customRange) {
      setDateRange(customRange);
    }
  };

  const handleDateRangeChange = (field, value) => {
    setSelectedPreset('custom');
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const refreshData = async () => {
    setError('');
    try {
      await fetchAnalyticsData();
    } catch (err) {
      setError('Failed to refresh data: ' + err.message);
    }
  };


  if (!isAdmin) {
    return (
      <Alert>
        <AlertDescription>
          Access denied. Enhanced analytics are only available to administrators.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview & Trends</TabsTrigger>
          <TabsTrigger value="yearly">Yearly Analysis</TabsTrigger>
          <TabsTrigger value="comparison">Year Comparison</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab - Original Analytics */}
        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Time Range Control */}
          <TimeRangeSlider
            onDateRangeChange={handlePresetChange}
            selectedPreset={selectedPreset}
            dateRange={dateRange}
          />

          {/* Date Range Filtering */}
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Analytics Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="preset">Quick Presets</Label>
              <Select value={selectedPreset} onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select preset" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(datePresets).map(([key, preset]) => (
                    <SelectItem key={key} value={key}>
                      {preset.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={refreshData} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Category-Specific Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Category Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="category-select">Select Category for Detailed Analysis</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {categoryAnalysis && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: categoryAnalysis.category?.color }}
                      />
                      <h3 className="font-semibold">{categoryAnalysis.category?.name}</h3>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(categoryAnalysis.totalSpent)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">Expenses Count</h3>
                    <p className="text-2xl font-bold">{categoryAnalysis.totalExpenses}</p>
                    <p className="text-sm text-muted-foreground">Total Transactions</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">Average Expense</h3>
                    <p className="text-2xl font-bold">{formatCurrency(categoryAnalysis.averageExpense)}</p>
                    <p className="text-sm text-muted-foreground">Per Transaction</p>
                  </CardContent>
                </Card>
              </div>

              {categoryAnalysis.monthlyTrend.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Trend - {categoryAnalysis.category?.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={categoryAnalysis.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => {
                            const avgSpending = categoryAnalysis.totalSpent / categoryAnalysis.monthlyTrend.length;
                            const isAboveAverage = value > avgSpending;
                            return [
                              formatCurrency(value),
                              `${isAboveAverage ? 'Above' : 'Below'} Average (${formatCurrency(avgSpending)})`
                            ];
                          }}
                        />
                        <Bar
                          dataKey="amount"
                          fill={categoryAnalysis.category?.color || '#3B82F6'}
                          name={categoryAnalysis.category?.name}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading analytics...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Enhanced KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold">{formatCurrency(kpiData.totalSpent)}</p>
                    <p className="text-xs text-muted-foreground">
                      {dateRange.startDate} to {dateRange.endDate}
                    </p>
                  </div>
                  <div className="h-8 w-8 text-green-600 flex items-center justify-center">
                    <span className="text-green-600 font-bold text-lg">Rs</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold">{kpiData.totalExpenses}</p>
                    <p className="text-xs text-muted-foreground">
                      Avg: {formatCurrency(kpiData.averageExpense)}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Top Category</p>
                    <p className="text-lg font-bold">
                      {kpiData.topCategory ? kpiData.topCategory.name : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {kpiData.topCategory ? formatCurrency(kpiData.topCategory.amount) : ''}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Categories Used</p>
                    <p className="text-2xl font-bold">
                      {kpiData.categoriesUsed} of {kpiData.totalCategories}
                    </p>
                    <p className="text-xs text-muted-foreground">Available</p>
                  </div>
                  <PieChartIcon className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Simplified Spending Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Spending Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {trendsData && trendsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={trendsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const value = payload[0].value;
                            return (
                              <div className="bg-popover p-3 border rounded shadow-lg text-popover-foreground">
                                <p className="font-semibold">{`Month: ${label}`}</p>
                                <p className="text-blue-600">{`Spending: ${formatCurrency(value)}`}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                        itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                      />
                      <Legend />
                      <Bar dataKey="amount" name="Monthly Spending" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No spending data available for the selected period</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Category Breakdown with Chart Toggle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Category Breakdown</span>
                  {/* Chart Type Toggle */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant={categoryChartType === 'donut' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCategoryChartType('donut')}
                      className="flex items-center gap-1 text-xs"
                    >
                      <PieChartIcon className="h-3 w-3" />
                      Donut
                    </Button>
                    <Button
                      variant={categoryChartType === 'bar' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCategoryChartType('bar')}
                      className="flex items-center gap-1 text-xs"
                    >
                      <BarChart3 className="h-3 w-3" />
                      Bar
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryBreakdown && categoryBreakdown.length > 0 ? (
                  <>
                    {/* Toggle between Donut Chart and Bar Chart */}
                    {categoryChartType === 'donut' ? (
                      /* Donut Chart View */
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="relative">
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={categoryBreakdown}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={false}
                                outerRadius={100}
                                innerRadius={60}
                                fill="#8884d8"
                                dataKey="value"
                                stroke="none"
                              >
                                {categoryBreakdown.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value, name, props) => [
                                  formatCurrency(value), 
                                  props.payload.name
                                ]}
                                labelFormatter={() => ''}
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--popover))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  padding: '12px',
                                  color: 'hsl(var(--popover-foreground))',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                                itemStyle={{
                                  color: 'hsl(var(--popover-foreground))'
                                }}
                                labelStyle={{
                                  color: 'hsl(var(--popover-foreground))'
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          
                          {/* Center Total Display */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                              <div className="text-sm font-medium text-muted-foreground">Total Expenses</div>
                              <div className="text-2xl font-bold text-foreground">
                                {formatCurrency(kpiData.totalSpent)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Legend */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm text-foreground mb-4">Categories</h4>
                          <div className="space-y-2 max-h-[250px] overflow-y-auto">
                            {categoryBreakdown
                              .sort((a, b) => b.value - a.value)
                              .map((category, index) => {
                                const percentage = kpiData.totalSpent > 0 ? (category.value / kpiData.totalSpent * 100) : 0;
                                return (
                                  <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className="w-4 h-4 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: category.color }}
                                      />
                                      <div>
                                        <div className="font-medium text-sm text-foreground truncate max-w-[120px]">
                                          {category.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {category.count} transaction{category.count !== 1 ? 's' : ''}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <div className="font-semibold text-sm text-foreground">
                                        {formatCurrency(category.value)}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {percentage.toFixed(1)}%
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            }
                          </div>
                          
                          {/* Summary Stats */}
                          <div className="mt-4 pt-3 border-t border-border">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{categoryBreakdown.length} categories</span>
                              <span>{kpiData.totalExpenses} total transactions</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Bar Chart View */
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart 
                          data={categoryBreakdown.sort((a, b) => b.value - a.value)}
                          layout="horizontal"
                          margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            width={100}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value, name) => [formatCurrency(value), 'Amount']}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--popover))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              padding: '12px',
                              color: 'hsl(var(--popover-foreground))'
                            }}
                            itemStyle={{
                              color: 'hsl(var(--popover-foreground))'
                            }}
                            labelStyle={{
                              color: 'hsl(var(--popover-foreground))'
                            }}
                          />
                          <Bar dataKey="value" name="Category Spending">
                            {categoryBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No category data available for the selected period</p>
                      <p className="text-xs mt-2">Try selecting a different date range or add some expenses</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
        </TabsContent>

        {/* Yearly Analysis Tab */}
        <TabsContent value="yearly" className="space-y-6">
          <YearSelector 
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          />
          <MonthlyYearlyView selectedYear={selectedYear} />
        </TabsContent>

        {/* Year Comparison Tab - Phase 3 */}
        <TabsContent value="comparison" className="space-y-6">
          <YearComparisonView />
        </TabsContent>

        {/* AI Insights Tab - Phase 4 */}
        <TabsContent value="insights" className="space-y-6">
          <InsightsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedAnalytics;