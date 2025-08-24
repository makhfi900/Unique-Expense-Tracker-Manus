import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useAuth } from '../context/SupabaseAuthContext';
import { useTimeRange } from '../context/TimeRangeContext';
import { useIsMobile } from '../hooks/use-mobile';
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
import TimeRangeSlider from './TimeRangeSlider';
import ExpenseViewer from './ExpenseViewer';
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
  Pause,
  List
} from 'lucide-react';

const EnhancedAnalytics = memo(() => {
  const { apiCall, isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Chart display preferences - restored chart toggle functionality
  const [categoryChartType, setCategoryChartType] = useState('donut');
  const [monthlyChartType, setMonthlyChartType] = useState('donut'); // Toggle for monthly spending chart - donut is primary display
  
  // No additional filtering states needed - ExpenseViewer handles its own filtering

  // Use shared time range context
  const { dateRange, selectedPreset, handlePresetChange, handleDateRangeChange } = useTimeRange();

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

  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  
  // New state for combined monthly-category data
  const [monthlyCategoryData, setMonthlyCategoryData] = useState([]);
  const [categoryColors, setCategoryColors] = useState({});
  const [categoryList, setCategoryList] = useState([]);

  // Memoized expensive calculations - after state declarations
  const memoizedCategoryBreakdown = useMemo(() => {
    if (!categoryBreakdown || categoryBreakdown.length === 0) return [];
    return categoryBreakdown.sort((a, b) => b.value - a.value);
  }, [categoryBreakdown]);
  
  const memoizedChartData = useMemo(() => {
    if (!monthlyCategoryData || monthlyCategoryData.length === 0) return [];
    return monthlyCategoryData.map(data => ({
      ...data,
      total: Object.values(data).filter(val => typeof val === 'number').reduce((sum, val) => sum + val, 0)
    }));
  }, [monthlyCategoryData]);

  // Phase 2: Yearly Analysis State
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Dynamic chart heights based on screen size
  const getChartHeight = (baseHeight) => {
    return isMobile ? Math.max(baseHeight - 50, 200) : baseHeight;
  };

  // Dynamic chart margins for mobile optimization
  const getChartMargins = () => {
    return isMobile 
      ? { top: 10, right: 10, left: 10, bottom: 40 }
      : { top: 20, right: 30, left: 20, bottom: 5 };
  };

  // Legend positioning based on screen size
  const getLegendProps = () => {
    return isMobile 
      ? { verticalAlign: 'bottom', align: 'center', layout: 'horizontal', wrapperStyle: { paddingTop: '10px', fontSize: '12px' } }
      : { wrapperStyle: { paddingTop: '20px' }, iconType: 'rect' };
  };

  // Legacy date presets for the existing select filter (can be removed in future)
  const legacyDatePresets = {
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
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiCall('/categories');
      if (response.categories) {
        setCategories(response.categories);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, [apiCall]);

  // Cache for analytics data to prevent unnecessary API calls
  const [analyticsCache, setAnalyticsCache] = useState(new Map());
  
  // Memoized cache key generation
  const cacheKey = useMemo(() => {
    return `${dateRange.startDate}-${dateRange.endDate}`;
  }, [dateRange.startDate, dateRange.endDate]);

  const fetchAnalyticsData = useCallback(async () => {
    // Check cache first
    if (analyticsCache.has(cacheKey)) {
      const cachedData = analyticsCache.get(cacheKey);
      setCategoryBreakdown(cachedData.categoryBreakdown);
      setMonthlyCategoryData(cachedData.monthlyCategoryData);
      setCategoryColors(cachedData.categoryColors);
      setCategoryList(cachedData.categoryList);
      setKpiData(cachedData.kpiData);
      return;
    }
    
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
      
      // 3. Fetch combined monthly-category breakdown for stacked chart
      requests.push(
        apiCall(`/analytics/monthly-category-breakdown?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`)
          .catch(err => ({ error: err.message, type: 'monthly-category' }))
      );

      // Execute all requests in parallel
      const [trendsResponse, categoryResponse, monthlyCategoryResponse] = await Promise.all(requests);
      
      // Handle trends data - now only used for logging, main chart uses monthlyCategoryData
      if (trendsResponse.error) {
        console.warn('Trends data failed:', trendsResponse.error);
      }

      // Handle category breakdown
      if (categoryResponse.breakdown && !categoryResponse.error) {
        const breakdownArray = Object.entries(categoryResponse.breakdown).map(([name, data]) => ({
          name,
          value: parseFloat(data.total),
          count: data.count,
          color: data.color || '#3B82F6' // Default color if none provided
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

        const newKpiData = {
          totalSpent,
          totalExpenses,
          averageExpense,
          topCategory: topCategory ? { name: topCategory.name, amount: topCategory.value } : null,
          categoriesUsed: breakdownArray.length,
          totalCategories: categories.length
        };
        setKpiData(newKpiData);
        
        // Cache the results
        const cacheData = {
          categoryBreakdown: breakdownArray,
          monthlyCategoryData: monthlyCategoryResponse.breakdown || [],
          categoryColors: monthlyCategoryResponse.categoryColors || {},
          categoryList: monthlyCategoryResponse.categoryList || [],
          kpiData: newKpiData
        };
        setAnalyticsCache(prev => {
          const newCache = new Map(prev);
          newCache.set(cacheKey, cacheData);
          // Keep only last 5 cache entries to prevent memory leak
          if (newCache.size > 5) {
            const firstKey = newCache.keys().next().value;
            newCache.delete(firstKey);
          }
          return newCache;
        });
      } else if (categoryResponse.error) {
        console.warn('Category data failed:', categoryResponse.error);
        // Try fallback: fetch expenses directly and create category breakdown
        await fetchCategoryFallback();
      }

      // Handle combined monthly-category data
      if (monthlyCategoryResponse.breakdown && !monthlyCategoryResponse.error) {
        setMonthlyCategoryData(monthlyCategoryResponse.breakdown);
        setCategoryColors(monthlyCategoryResponse.categoryColors || {});
        setCategoryList(monthlyCategoryResponse.categoryList || []);
      } else if (monthlyCategoryResponse.error) {
        console.warn('Monthly category data failed:', monthlyCategoryResponse.error);
        setMonthlyCategoryData([]);
      }


    } catch (err) {
      setError('Failed to fetch analytics data: ' + err.message);
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiCall, dateRange.startDate, dateRange.endDate, categories.length, analyticsCache, cacheKey]);

  // Legacy preset handler for backward compatibility with existing filter - memoized
  const handleLegacyPresetChange = useCallback((preset) => {
    if (legacyDatePresets[preset]) {
      handlePresetChange('custom', {
        startDate: legacyDatePresets[preset].startDate,
        endDate: legacyDatePresets[preset].endDate
      });
    }
  }, [handlePresetChange]);

  const fetchCategoryFallback = useCallback(async () => {
    try {
      console.log('Using category fallback approach...');
      // Fetch expenses directly
      const expensesResponse = await apiCall(
        `/expenses?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}${
          selectedCategory !== 'all' ? `&category_id=${selectedCategory}` : ''
        }`
      );

      if (expensesResponse.expenses && expensesResponse.expenses.length > 0) {
        // Group expenses by category
        const categoryTotals = {};
        const categoryCounts = {};
        
        expensesResponse.expenses.forEach(expense => {
          const categoryName = expense.category_name || 'Uncategorized';
          const amount = parseFloat(expense.amount) || 0;
          
          categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + amount;
          categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
        });

        // Create breakdown array
        const breakdownArray = Object.entries(categoryTotals).map(([name, total], index) => {
          // Find category color from categories list
          const category = categories.find(cat => cat.name === name);
          const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
          
          return {
            name,
            value: total,
            count: categoryCounts[name],
            color: category?.color || colors[index % colors.length]
          };
        });

        setCategoryBreakdown(breakdownArray);
        
        // Calculate KPIs from fallback data
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
        
        setError(''); // Clear error since fallback worked
        console.log('Category fallback successful:', breakdownArray);
      } else {
        setCategoryBreakdown([]);
        console.warn('No expenses found for category fallback');
      }
    } catch (err) {
      console.error('Category fallback failed:', err);
      setCategoryBreakdown([]);
    }
  }, [apiCall, dateRange.startDate, dateRange.endDate, selectedCategory, categories]);

  const fetchCategoryAnalysis = useCallback(async (categoryId) => {
    try {
      // SWARM FIX: Add type validation and handle 'all' category properly
      if (!categoryId || categoryId === 'all') {
        console.log('🚫 Category Analysis: Skipping - categoryId is "all" or empty');
        setCategoryAnalysis(null);
        return;
      }
      
      // Convert to string and validate for API parameter
      const validCategoryId = String(categoryId);
      if (!validCategoryId || validCategoryId === 'undefined' || validCategoryId === 'null') {
        console.error('❌ Invalid category ID for analysis:', categoryId);
        setCategoryAnalysis(null);
        return;
      }
      
      console.log('🔍 Fetching Category Analysis for ID:', validCategoryId, '(type:', typeof validCategoryId, ')');
      
      // Fetch expenses for the specific category via API with proper parameter validation
      const expensesResponse = await apiCall(`/expenses?category_id=${validCategoryId}&start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`);
      
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
  }, [apiCall, dateRange.startDate, dateRange.endDate, categories]);


  // useEffect hooks - must come after useCallback definitions
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]); // Only run once on mount

  useEffect(() => {
    if (categories.length > 0) { // Only fetch analytics after categories are loaded
      fetchAnalyticsData();
    }
  }, [categories.length, dateRange.startDate, dateRange.endDate, fetchAnalyticsData]); // Stabilized dependencies

  // Separate useEffect for category-specific analysis to prevent infinite loop - optimized
  useEffect(() => {
    if (selectedCategory !== 'all' && categories.length > 0) {
      fetchCategoryAnalysis(selectedCategory);
    } else {
      setCategoryAnalysis(null);
    }
  }, [selectedCategory, dateRange.startDate, dateRange.endDate, categories.length, fetchCategoryAnalysis]); // Stabilized with useCallback


  const refreshData = useCallback(async () => {
    // Clear cache to force fresh data
    setAnalyticsCache(new Map());
    setError('');
    try {
      await fetchAnalyticsData();
    } catch (err) {
      setError('Failed to refresh data: ' + err.message);
    }
  }, [fetchAnalyticsData]);


  // Both admin and account officers see the full analytics dashboard with role-based tab differences

  return (
    <div className="space-y-6">
      {/* Main Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`
          flex flex-col sm:grid w-full 
          ${isAdmin 
            ? 'sm:grid-cols-3 lg:grid-cols-3' 
            : 'sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4'
          }
          gap-1 sm:gap-0 p-1 sm:p-1
        `}>
          <TabsTrigger 
            value="overview" 
            className="min-h-11 text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis px-2 sm:px-3"
          >
            <span className="block sm:hidden">Overview</span>
            <span className="hidden sm:block">Overview & Trends</span>
          </TabsTrigger>
          {!isAdmin && (
            <TabsTrigger 
              value="expenses" 
              className="min-h-11 text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis px-2 sm:px-3"
            >
              <span className="block sm:hidden">Expenses</span>
              <span className="hidden sm:block">View Expenses</span>
            </TabsTrigger>
          )}
          <TabsTrigger 
            value="yearly" 
            className="min-h-11 text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis px-2 sm:px-3"
          >
            <span className="block sm:hidden">Yearly</span>
            <span className="hidden sm:block">Yearly Analysis</span>
          </TabsTrigger>
          <TabsTrigger 
            value="comparison" 
            className="min-h-11 text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis px-2 sm:px-3"
          >
            <span className="block sm:hidden">Compare</span>
            <span className="hidden sm:block">Year Comparison</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Original Analytics */}
        <TabsContent value="overview" className="space-y-6">

          {/* Loading State for Analytics */}
          {loading && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                  <span className="ml-3 text-lg font-medium text-gray-600 dark:text-gray-400">Loading analytics data...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analytics Filters - Available for All Users */}
          {!loading && (
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
              <Label htmlFor="preset">Legacy Presets</Label>
              <Select onValueChange={handleLegacyPresetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select preset" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(legacyDatePresets).map(([key, preset]) => (
                    <SelectItem key={key} value={key}>
                      {preset.label}
                    </SelectItem>
                  ))}
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
          )}


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
                    <ResponsiveContainer width="100%" height={getChartHeight(300)}>
                      <BarChart data={categoryAnalysis.monthlyTrend} margin={getChartMargins()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: isMobile ? 10 : 12 }}
                          angle={isMobile ? -45 : 0}
                          textAnchor={isMobile ? "end" : "middle"}
                          height={isMobile ? 50 : 30}
                        />
                        <YAxis 
                          tick={{ fontSize: isMobile ? 10 : 12 }}
                          tickFormatter={(value) => isMobile ? `${(value / 1000).toFixed(0)}K` : formatCurrency(value)}
                        />
                        <Tooltip 
                          formatter={(value) => {
                            const avgSpending = categoryAnalysis.totalSpent / categoryAnalysis.monthlyTrend.length;
                            const isAboveAverage = value > avgSpending;
                            return [
                              isMobile ? `Rs ${(value / 1000).toFixed(1)}K` : formatCurrency(value),
                              `${isAboveAverage ? 'Above' : 'Below'} Average${isMobile ? '' : ` (${formatCurrency(avgSpending)})`}`
                            ];
                          }}
                          contentStyle={{
                            fontSize: isMobile ? '12px' : '14px',
                            padding: isMobile ? '6px' : '8px',
                            maxWidth: isMobile ? '150px' : '200px'
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

      {/* Error Display - Enhanced */}
      {error && (
        <Alert variant="destructive" className="border-red-200 dark:border-red-800">
          <AlertDescription className="text-red-800 dark:text-red-200">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading analytics...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Empty State Check */}
          {categoryBreakdown.length === 0 && !loading && (
            <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No Data Available</h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md">
                      No expenses found for the selected time period. Try selecting "This Year" or a different date range to see meaningful analytics.
                    </p>
                  </div>
                  <Button 
                    onClick={() => handlePresetChange('this_year')} 
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Show This Year's Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced KPI Cards - Only show if data exists */}
          {categoryBreakdown.length > 0 && (
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
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
          )}

          {/* Charts - Only show if data exists */}
          {categoryBreakdown.length > 0 && (
          <div className="space-y-6">
            {/* Combined Monthly Spending with Category Breakdown - Stacked Bar Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Monthly Spending by Category
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {monthlyChartType === 'donut' 
                        ? 'Monthly spending data displayed as donut charts with category breakdown'
                        : 'Each bar shows the total monthly spending with category breakdown'
                      }
                    </p>
                  </div>
                  {/* Chart Type Toggle - DONUT is now primary, STACKED is secondary */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant={monthlyChartType === 'donut' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMonthlyChartType('donut')}
                      className="flex items-center gap-2"
                    >
                      <PieChartIcon className="h-4 w-4" />
                      DONUT
                    </Button>
                    <Button
                      variant={monthlyChartType === 'stacked' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMonthlyChartType('stacked')}
                      className="flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      STACKED
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {monthlyCategoryData && monthlyCategoryData.length > 0 && categoryList.length > 0 ? (
                  <>
                    {monthlyChartType === 'stacked' ? (
                      /* Stacked Bar Chart View */
                      <ResponsiveContainer width="100%" height={getChartHeight(400)}>
                        <BarChart data={memoizedChartData} margin={getChartMargins()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: isMobile ? 10 : 12 }}
                            angle={isMobile ? -60 : -45}
                            textAnchor="end"
                            height={isMobile ? 80 : 60}
                            interval={isMobile ? 'preserveStartEnd' : 0}
                          />
                          <YAxis 
                            tick={{ fontSize: isMobile ? 10 : 12 }}
                            tickFormatter={(value) => `Rs ${(value / 1000).toFixed(0)}K`}
                          />
                          <Tooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const monthData = memoizedChartData.find(data => data.month === label);
                                return (
                                  <div className={`bg-popover border rounded shadow-lg text-popover-foreground ${isMobile ? 'p-2 max-w-[200px]' : 'p-4 max-w-sm'}`}>
                                    <p className={`font-semibold mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>{`Month: ${label}`}</p>
                                    <p className={`font-medium mb-2 text-green-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                      {`Total: ${isMobile ? `Rs ${(monthData?.total / 1000).toFixed(0)}K` : formatCurrency(monthData?.total || 0)}`}
                                    </p>
                                    <div className="space-y-1">
                                      {payload.slice(0, isMobile ? 3 : payload.length).map((entry, index) => (
                                        <p key={index} style={{ color: entry.color }} className={isMobile ? 'text-[10px]' : 'text-sm'}>
                                          {`${entry.dataKey}: ${isMobile ? `${(entry.value / 1000).toFixed(0)}K` : formatCurrency(entry.value)}`}
                                        </p>
                                      ))}
                                      {isMobile && payload.length > 3 && (
                                        <p className="text-[10px] text-muted-foreground">
                                          +{payload.length - 3} more
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend {...getLegendProps()} />
                          {/* Dynamic bars for each category */}
                          {categoryList.map((category, index) => (
                            <Bar
                              key={category}
                              dataKey={category}
                              stackId="spending"
                              fill={categoryColors[category] || `hsl(${(index * 137) % 360}, 70%, 50%)`}
                              name={category}
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      /* Category Breakdown Donut Chart */
                      memoizedCategoryBreakdown && memoizedCategoryBreakdown.length > 0 ? (
                        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                          <div className="relative">
                            <ResponsiveContainer width="100%" height={getChartHeight(300)}>
                              <PieChart>
                                <Pie
                                  data={memoizedCategoryBreakdown}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={false}
                                  outerRadius={isMobile ? 70 : 100}
                                  innerRadius={isMobile ? 40 : 60}
                                  fill="#8884d8"
                                  dataKey="value"
                                  stroke="none"
                                >
                                  {memoizedCategoryBreakdown.map((entry, index) => (
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
                                    padding: isMobile ? '8px' : '12px',
                                    color: 'hsl(var(--popover-foreground))',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    fontSize: isMobile ? '12px' : '14px',
                                    maxWidth: isMobile ? '200px' : '300px'
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
                                <div className={`font-medium text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>Total Expenses</div>
                                <div className={`font-bold text-foreground ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                                  {isMobile ? `Rs ${(kpiData.totalSpent / 1000).toFixed(0)}K` : formatCurrency(kpiData.totalSpent)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Enhanced Legend */}
                          <div className="space-y-3">
                            <h4 className={`font-semibold text-foreground mb-4 ${isMobile ? 'text-xs' : 'text-sm'}`}>Categories</h4>
                            <div className={`space-y-2 overflow-y-auto ${isMobile ? 'max-h-[200px]' : 'max-h-[250px]'}`}>
                              {memoizedCategoryBreakdown
                                .map((category, index) => {
                                  const percentage = kpiData.totalSpent > 0 ? (category.value / kpiData.totalSpent * 100) : 0;
                                  return (
                                    <div key={index} className={`flex items-center justify-between rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors ${isMobile ? 'py-1.5 px-2' : 'py-2 px-3'}`}>
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`rounded-full flex-shrink-0 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`}
                                          style={{ backgroundColor: category.color }}
                                        />
                                        <div>
                                          <div className={`font-medium text-foreground truncate ${isMobile ? 'text-xs max-w-[80px]' : 'text-sm max-w-[120px]'}`}>
                                            {category.name}
                                          </div>
                                          <div className={`text-muted-foreground ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                                            {category.count} transaction{category.count !== 1 ? 's' : ''}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        <div className={`font-semibold text-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                          {isMobile ? `Rs ${(category.value / 1000).toFixed(0)}K` : formatCurrency(category.value)}
                                        </div>
                                        <div className={`text-muted-foreground ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                                          {percentage.toFixed(1)}%
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              }
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                          <div className="text-center">
                            <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No category data available for the selected period</p>
                          </div>
                        </div>
                      )
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No spending data available for the selected period</p>
                      <p className="text-xs mt-2">Try selecting a different date range or add some expenses</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ExpenseViewer Component - Only for Admins under charts */}
            {isAdmin && <ExpenseViewer selectedCategory={selectedCategory} />}

          </div>
          )}
        </div>
      )}
        </TabsContent>

        {/* View Expenses Tab - Only for Account Officers */}
        {!isAdmin && (
          <TabsContent value="expenses" className="space-y-6">
            {/* Enhanced Time Range Slider for Account Officers */}
            <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Account Officer - Expense View Controls
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  This section provides essential date filtering controls specifically designed for account officers to manage and view expense records effectively.
                </p>
              </CardHeader>
              <CardContent>
                <TimeRangeSlider />
                <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-300 dark:border-green-700">
                  <div className="flex items-start gap-2 text-sm">
                    <Info className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">Account Officer Features</p>
                      <p className="text-green-700 dark:text-green-300 mt-1">
                        Use the time range controls above, then scroll down to access detailed expense filtering with start/end date pickers, 
                        category filters, search functionality, and export capabilities.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <ExpenseViewer />
          </TabsContent>
        )}

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

      </Tabs>
    </div>
  );
});

EnhancedAnalytics.displayName = 'EnhancedAnalytics';

export default EnhancedAnalytics;