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
import BudgetConfiguration from './BudgetConfiguration';
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
  RefreshCw
} from 'lucide-react';

const EnhancedAnalytics = () => {
  const { apiCall, user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  // Budget and threshold settings
  const [budgetSettings, setBudgetSettings] = useState({
    monthlyBudget: 50000, // Default budget of Rs. 50,000
    warningThreshold: 0.8, // 80% warning threshold
    emergencyThreshold: 0.95 // 95% emergency threshold
  });

  // Fetch user's budget settings
  const fetchBudgetSettings = async () => {
    try {
      const response = await apiCall('/budget/settings');
      if (response.settings) {
        setBudgetSettings({
          monthlyBudget: response.settings.monthly_budget || 50000,
          warningThreshold: response.settings.warning_threshold || 0.8,
          emergencyThreshold: response.settings.emergency_threshold || 0.95
        });
      }
    } catch (err) {
      console.error('Failed to fetch budget settings:', err);
      // Keep default settings if API fails
    }
  };

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
    fetchBudgetSettings();
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
      // Use API calls instead of direct Supabase queries for proper authentication
      
      // 1. Fetch spending trends - Use consistent date range with category breakdown
      const startYear = new Date(dateRange.startDate).getFullYear();
      const endYear = new Date(dateRange.endDate).getFullYear();
      
      // For spending trends, we'll get data for the year range and filter client-side if needed
      const trendsResponse = await apiCall(`/analytics/spending-trends?period=monthly&year=${startYear}&start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`);
      
      if (trendsResponse.trends) {
        const trendsArray = Object.entries(trendsResponse.trends).map(([month, amount]) => ({
          month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          amount: parseFloat(amount)
        }));
        setTrendsData(trendsArray);
      }

      // 2. Fetch category breakdown
      const categoryResponse = await apiCall(`/analytics/category-breakdown?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`);
      
      if (categoryResponse.breakdown) {
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

  const handlePresetChange = (preset) => {
    setSelectedPreset(preset);
    if (preset !== 'custom') {
      setDateRange({
        startDate: datePresets[preset].startDate,
        endDate: datePresets[preset].endDate
      });
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

  const handleBudgetUpdate = (newBudgetSettings) => {
    setBudgetSettings(newBudgetSettings);
    // Refresh analytics data to reflect new budget calculations
    fetchAnalyticsData();
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
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview & Trends</TabsTrigger>
          <TabsTrigger value="yearly">Yearly Analysis</TabsTrigger>
          <TabsTrigger value="comparison">Year Comparison</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab - Original Analytics */}
        <TabsContent value="overview" className="space-y-6">
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
              <BudgetConfiguration onBudgetUpdate={handleBudgetUpdate} />
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
            {/* Enhanced Spending Trends with Thresholds */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Monthly Spending Trends
                  <div className="text-sm text-muted-foreground">
                    Budget: {formatCurrency(budgetSettings.monthlyBudget)}/month
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trendsData && trendsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart 
                      data={trendsData.map(item => ({
                        ...item,
                        status: item.amount > budgetSettings.monthlyBudget * budgetSettings.emergencyThreshold ? 'emergency' :
                                 item.amount > budgetSettings.monthlyBudget * budgetSettings.warningThreshold ? 'warning' : 'normal'
                      }))}
                    >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const value = data.amount;
                          const percentage = (value / budgetSettings.monthlyBudget * 100).toFixed(1);
                          const status = value > budgetSettings.monthlyBudget * budgetSettings.emergencyThreshold ? 'Over Budget!' :
                                        value > budgetSettings.monthlyBudget * budgetSettings.warningThreshold ? 'Warning Level' : 'Within Budget';
                          
                          return (
                            <div className="bg-white p-3 border rounded shadow-lg">
                              <p className="font-semibold">{`Month: ${label}`}</p>
                              <p className="text-blue-600">{`Spending: ${formatCurrency(value)}`}</p>
                              <p className="text-gray-600">{`${percentage}% of budget`}</p>
                              <p className={`font-medium ${
                                status === 'Over Budget!' ? 'text-red-600' :
                                status === 'Warning Level' ? 'text-amber-600' : 'text-green-600'
                              }`}>{status}</p>
                              <div className="mt-2 text-sm text-gray-500">
                                <div>Budget: {formatCurrency(budgetSettings.monthlyBudget)}</div>
                                <div>Warning: {formatCurrency(budgetSettings.monthlyBudget * budgetSettings.warningThreshold)}</div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    
                    {/* Reference lines for budget thresholds */}
                    <ReferenceLine 
                      y={budgetSettings.monthlyBudget} 
                      stroke="#10B981" 
                      strokeDasharray="5 5" 
                      strokeWidth={2}
                      label={{ value: "Budget", position: "topRight" }}
                    />
                    <ReferenceLine 
                      y={budgetSettings.monthlyBudget * budgetSettings.warningThreshold} 
                      stroke="#F59E0B" 
                      strokeDasharray="3 3" 
                      strokeWidth={2}
                      label={{ value: "Warning", position: "topRight" }}
                    />
                    <ReferenceLine 
                      y={budgetSettings.monthlyBudget * budgetSettings.emergencyThreshold} 
                      stroke="#EF4444" 
                      strokeDasharray="2 2" 
                      strokeWidth={2}
                      label={{ value: "Emergency", position: "topRight" }}
                    />
                    
                    {/* Actual spending bars */}
                    <Bar 
                      dataKey="amount" 
                      name="Spending"
                    >
                      {trendsData.map((entry, index) => {
                        const value = entry.amount;
                        let fillColor = '#10B981'; // green for normal
                        if (value > budgetSettings.monthlyBudget * budgetSettings.emergencyThreshold) {
                          fillColor = '#EF4444'; // red for emergency
                        } else if (value > budgetSettings.monthlyBudget * budgetSettings.warningThreshold) {
                          fillColor = '#F59E0B'; // amber for warning
                        }
                        return <Cell key={`cell-${index}`} fill={fillColor} />;
                      })}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No spending data available for the selected period</p>
                    </div>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Within Budget</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded"></div>
                    <span>Warning (80%+)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Over Budget (95%+)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryBreakdown && categoryBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No category data available for the selected period</p>
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