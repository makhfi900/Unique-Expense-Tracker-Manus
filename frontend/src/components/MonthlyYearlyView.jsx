import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import {
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
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Award,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';

const MonthlyYearlyView = ({ selectedYear }) => {
  const { apiCall } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [yearlyData, setYearlyData] = useState(null);

  useEffect(() => {
    if (selectedYear) {
      fetchYearlyBreakdown();
    }
  }, [selectedYear]);

  const fetchYearlyBreakdown = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiCall(`/analytics/yearly-breakdown?year=${selectedYear}`);
      if (response.breakdown && response.metrics) {
        setYearlyData(response);
      }
    } catch (err) {
      setError('Failed to fetch yearly breakdown data');
      console.error('Yearly breakdown error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading yearly analysis...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!yearlyData || !yearlyData.breakdown) {
    return (
      <Alert>
        <AlertDescription>No data available for {selectedYear}</AlertDescription>
      </Alert>
    );
  }

  const { breakdown, metrics } = yearlyData;

  // Prepare chart data
  const chartData = breakdown.map(month => ({
    month: month.month_short,
    amount: parseFloat(month.total_amount || 0),
    expenses: month.expense_count,
    avgExpense: parseFloat(month.avg_amount || 0),
    topCategory: month.top_category,
    vsLastMonth: parseFloat(month.vs_previous_month || 0),
    vsLastYear: parseFloat(month.vs_same_month_last_year || 0),
    isHighest: month.is_highest_month,
    isLowest: month.is_lowest_month
  }));

  // Custom tooltip for detailed information
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-semibold text-lg">{label} {selectedYear}</p>
          <div className="space-y-2 mt-2">
            <p className="text-blue-600">
              <span className="font-medium">Total Spending:</span> {formatCurrency(data.amount)}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Expenses:</span> {data.expenses} transactions
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Average per expense:</span> {formatCurrency(data.avgExpense)}
            </p>
            <p className="text-purple-600">
              <span className="font-medium">Top Category:</span> {data.topCategory || 'N/A'}
            </p>
            {data.vsLastMonth !== 0 && (
              <p className={`${data.vsLastMonth > 0 ? 'text-red-600' : 'text-green-600'}`}>
                <span className="font-medium">vs Last Month:</span> {data.vsLastMonth > 0 ? '+' : ''}{formatCurrency(data.vsLastMonth)}
              </p>
            )}
            {data.vsLastYear !== 0 && (
              <p className={`${data.vsLastYear > 0 ? 'text-red-600' : 'text-green-600'}`}>
                <span className="font-medium">vs Last Year:</span> {data.vsLastYear > 0 ? '+' : ''}{formatCurrency(data.vsLastYear)}
              </p>
            )}
            {data.isHighest && <Badge variant="destructive">Highest Month</Badge>}
            {data.isLowest && <Badge variant="secondary">Lowest Month</Badge>}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Yearly Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spending</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(metrics.totalSpending)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Year {selectedYear}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Average</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(metrics.avgMonthlySpending)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {metrics.activeMonths} active months
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Highest Month</p>
                <p className="text-lg font-bold text-red-600">
                  {metrics.highestMonth.month}
                </p>
                <p className="text-sm text-red-500">
                  {formatCurrency(metrics.highestMonth.amount)}
                </p>
              </div>
              <Award className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lowest Month</p>
                <p className="text-lg font-bold text-gray-600">
                  {metrics.lowestMonth.month}
                </p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(metrics.lowestMonth.amount)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Pattern - {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {/* Average spending line */}
                <ReferenceLine 
                  y={metrics.avgMonthlySpending} 
                  stroke="#10B981"
                  strokeDasharray="5 5"
                  label={{ value: "Average", position: "topRight" }}
                />
                
                <Bar dataKey="amount" name="Monthly Spending">
                  {chartData.map((entry, index) => (
                    <Bar 
                      key={`cell-${index}`} 
                      fill={
                        entry.isHighest ? '#EF4444' : 
                        entry.isLowest ? '#64748B' :
                        entry.amount > metrics.avgMonthlySpending ? '#F59E0B' : '#10B981'
                      } 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends & Comparisons</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'amount' ? formatCurrency(value) : value,
                    name === 'amount' ? 'Spending' : 'Expenses'
                  ]}
                />
                <Legend />
                
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  name="Monthly Spending"
                  dot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  name="Number of Expenses"
                  yAxisId="right"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Month</th>
                  <th className="text-right p-2">Total Spending</th>
                  <th className="text-right p-2">Expenses</th>
                  <th className="text-right p-2">Avg per Expense</th>
                  <th className="text-left p-2">Top Category</th>
                  <th className="text-right p-2">vs Prev Month</th>
                  <th className="text-right p-2">vs Last Year</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((month) => (
                  <tr key={month.month} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{month.month_name}</td>
                    <td className="p-2 text-right font-semibold">
                      {formatCurrency(month.total_amount || 0)}
                    </td>
                    <td className="p-2 text-right">{month.expense_count}</td>
                    <td className="p-2 text-right">
                      {formatCurrency(month.avg_amount || 0)}
                    </td>
                    <td className="p-2">
                      <div className="truncate max-w-24">
                        {month.top_category || 'N/A'}
                      </div>
                    </td>
                    <td className={`p-2 text-right ${
                      parseFloat(month.vs_previous_month || 0) > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {month.vs_previous_month ? 
                        `${parseFloat(month.vs_previous_month) > 0 ? '+' : ''}${formatCurrency(month.vs_previous_month)}` : 
                        'N/A'
                      }
                    </td>
                    <td className={`p-2 text-right ${
                      parseFloat(month.vs_same_month_last_year || 0) > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {month.vs_same_month_last_year ? 
                        `${parseFloat(month.vs_same_month_last_year) > 0 ? '+' : ''}${formatCurrency(month.vs_same_month_last_year)}` : 
                        'N/A'
                      }
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex gap-1 justify-center">
                        {month.is_highest_month && (
                          <Badge variant="destructive" className="text-xs">High</Badge>
                        )}
                        {month.is_lowest_month && (
                          <Badge variant="secondary" className="text-xs">Low</Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyYearlyView;