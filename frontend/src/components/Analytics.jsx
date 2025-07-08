import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
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
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  PieChart as PieChartIcon, 
  BarChart3, 
  Calendar,
  DollarSign,
  Loader2
} from 'lucide-react';

const Analytics = () => {
  const { apiCall } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Spending trends data
  const [trendsData, setTrendsData] = useState([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  // Category breakdown data
  const [categoryData, setCategoryData] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryDateRange, setCategoryDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of current year
    end_date: new Date().toISOString().split('T')[0], // Today
  });

  // Summary stats
  const [summaryStats, setSummaryStats] = useState({
    totalExpenses: 0,
    monthlyAverage: 0,
    topCategory: '',
    totalCategories: 0,
  });

  useEffect(() => {
    fetchSpendingTrends();
    fetchCategoryBreakdown();
  }, []);

  useEffect(() => {
    fetchSpendingTrends();
  }, [selectedPeriod, selectedYear]);

  useEffect(() => {
    fetchCategoryBreakdown();
  }, [categoryDateRange]);

  const fetchSpendingTrends = async () => {
    try {
      setTrendsLoading(true);
      const data = await apiCall(`/analytics/spending-trends?period=${selectedPeriod}&year=${selectedYear}`);
      
      // Transform data for charts
      const trends = data.trends || {};
      const chartData = Object.entries(trends).map(([period, amount]) => ({
        period,
        amount: parseFloat(amount),
        formattedAmount: formatCurrency(amount),
      })).sort((a, b) => a.period.localeCompare(b.period));

      setTrendsData(chartData);
      
      // Calculate summary stats
      const totalExpenses = chartData.reduce((sum, item) => sum + item.amount, 0);
      const monthlyAverage = selectedPeriod === 'monthly' ? totalExpenses / Math.max(chartData.length, 1) : totalExpenses / 12;
      
      setSummaryStats(prev => ({
        ...prev,
        totalExpenses,
        monthlyAverage,
      }));

    } catch (err) {
      setError(err.message);
    } finally {
      setTrendsLoading(false);
      setLoading(false);
    }
  };

  const fetchCategoryBreakdown = async () => {
    try {
      setCategoryLoading(true);
      const queryParams = new URLSearchParams(categoryDateRange);
      const data = await apiCall(`/analytics/category-breakdown?${queryParams}`);
      
      // Transform data for charts
      const breakdown = data.breakdown || {};
      const chartData = Object.entries(breakdown).map(([category, data]) => ({
        category,
        amount: parseFloat(data.total),
        count: data.count,
        color: data.color,
        formattedAmount: formatCurrency(data.total),
      })).sort((a, b) => b.amount - a.amount);

      setCategoryData(chartData);
      
      // Update summary stats
      const topCategory = chartData.length > 0 ? chartData[0].category : '';
      setSummaryStats(prev => ({
        ...prev,
        topCategory,
        totalCategories: chartData.length,
      }));

    } catch (err) {
      setError(err.message);
    } finally {
      setCategoryLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPeriod = (period) => {
    if (selectedPeriod === 'monthly') {
      const [year, month] = period.split('-');
      return new Date(year, month - 1).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
    }
    return period;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{formatPeriod(label)}</p>
          <p className="text-blue-600">
            Amount: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CategoryTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.category}</p>
          <p className="text-blue-600">Amount: {data.formattedAmount}</p>
          <p className="text-gray-600">Transactions: {data.count}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold">{formatCurrency(summaryStats.totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Average</p>
                <p className="text-2xl font-bold">{formatCurrency(summaryStats.monthlyAverage)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <PieChartIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Top Category</p>
                <p className="text-lg font-bold truncate">{summaryStats.topCategory || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold">{summaryStats.totalCategories}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spending Trends Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Spending Trends
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              
              {selectedPeriod === 'monthly' && (
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : trendsData.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No spending data available for the selected period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period" 
                  tickFormatter={formatPeriod}
                />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChartIcon className="h-5 w-5 mr-2" />
              Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : categoryData.length === 0 ? (
              <div className="text-center py-8">
                <PieChartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No category data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="amount"
                    label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CategoryTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Category Amounts
              </CardTitle>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={categoryDateRange.start_date}
                  onChange={(e) => setCategoryDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                  className="px-2 py-1 border rounded text-sm"
                />
                <span className="text-sm text-gray-500">to</span>
                <input
                  type="date"
                  value={categoryDateRange.end_date}
                  onChange={(e) => setCategoryDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                  className="px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {categoryLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : categoryData.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No category data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                  <YAxis type="category" dataKey="category" width={100} />
                  <Tooltip content={<CategoryTooltip />} />
                  <Bar dataKey="amount" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;

