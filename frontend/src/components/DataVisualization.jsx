import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { formatCurrency } from '../utils/currency';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Tag,
  Target,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

// Mini Chart Components
const MiniBarChart = ({ data, color = "#3b82f6" }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="flex items-end justify-between h-12 gap-1">
      {data.map((item, index) => (
        <motion.div
          key={index}
          initial={{ height: 0 }}
          animate={{ height: `${(item.value / maxValue) * 100}%` }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          className="flex-1 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity"
          style={{ backgroundColor: color, minHeight: '2px' }}
          title={`${item.label}: ${formatCurrency(item.value)}`}
        />
      ))}
    </div>
  );
};

const MiniPieChart = ({ data, size = 60 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 2}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const strokeDasharray = `${percentage} ${100 - percentage}`;
          const strokeDashoffset = -cumulativePercentage;
          cumulativePercentage += percentage;

          return (
            <motion.circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={size / 2 - 2}
              fill="none"
              stroke={colors[index] || colors[0]}
              strokeWidth="4"
              strokeDasharray={`${percentage} ${100 - percentage}`}
              strokeDashoffset={strokeDashoffset}
              initial={{ strokeDasharray: '0 100' }}
              animate={{ strokeDasharray, strokeDashoffset }}
              transition={{ delay: index * 0.2, duration: 0.8 }}
              className="hover:stroke-[6px] transition-all"
            />
          );
        })}
      </svg>
    </div>
  );
};

const TrendIndicator = ({ current, previous, formatValue = (v) => v }) => {
  const change = current - previous;
  const changePercent = previous ? ((change / previous) * 100) : 0;
  
  const isPositive = change > 0;
  const isNeutral = change === 0;
  
  return (
    <div className={`flex items-center gap-1 text-sm ${
      isNeutral ? 'text-muted-foreground' :
      isPositive ? 'text-green-600' : 'text-red-600'
    }`}>
      {isNeutral ? (
        <Minus className="h-3 w-3" />
      ) : isPositive ? (
        <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowDown className="h-3 w-3" />
      )}
      <span className="font-medium">
        {Math.abs(changePercent).toFixed(1)}%
      </span>
      <span className="text-xs text-muted-foreground">
        vs last period
      </span>
    </div>
  );
};

const MetricCard = ({ 
  title, 
  value, 
  previousValue, 
  icon: Icon, 
  color = "blue", 
  formatValue = (v) => v,
  description,
  chart
}) => {
  const colorClasses = {
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800',
    green: 'from-green-500/10 to-green-600/5 border-green-200 dark:border-green-800',
    orange: 'from-orange-500/10 to-orange-600/5 border-orange-200 dark:border-orange-800',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800',
    red: 'from-red-500/10 to-red-600/5 border-red-200 dark:border-red-800'
  };

  const iconColors = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    orange: 'text-orange-600 dark:text-orange-400',
    purple: 'text-purple-600 dark:text-purple-400',
    red: 'text-red-600 dark:text-red-400'
  };

  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color]} border-2 hover:shadow-lg transition-all duration-300`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <motion.p 
              className="text-2xl font-bold"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {formatValue(value)}
            </motion.p>
            {previousValue !== undefined && (
              <TrendIndicator 
                current={value} 
                previous={previousValue} 
                formatValue={formatValue}
              />
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-2">{description}</p>
            )}
          </div>
          <Icon className={`h-8 w-8 ${iconColors[color]}`} />
        </div>
        {chart && (
          <div className="mt-4">
            {chart}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const CategoryBreakdown = ({ expenses, categories }) => {
  const categoryData = useMemo(() => {
    const categoryTotals = {};
    
    expenses.forEach(expense => {
      const categoryId = expense.category_id || 'uncategorized';
      const category = categories.find(cat => cat.id === categoryId);
      const categoryName = category?.name || 'Uncategorized';
      const categoryColor = category?.color || '#64748b';
      
      if (!categoryTotals[categoryId]) {
        categoryTotals[categoryId] = {
          name: categoryName,
          color: categoryColor,
          total: 0,
          count: 0
        };
      }
      
      categoryTotals[categoryId].total += parseFloat(expense.amount || 0);
      categoryTotals[categoryId].count += 1;
    });
    
    return Object.values(categoryTotals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // Top 8 categories
  }, [expenses, categories]);

  const total = categoryData.reduce((sum, cat) => sum + cat.total, 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <PieChart className="h-5 w-5 text-purple-600" />
          Category Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center mb-4">
          <MiniPieChart 
            data={categoryData.map(cat => ({ value: cat.total, label: cat.name }))} 
            size={120}
          />
        </div>
        
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categoryData.map((category, index) => {
            const percentage = total > 0 ? (category.total / total) * 100 : 0;
            
            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm font-medium truncate">{category.name}</span>
                  <Badge variant="outline" className="text-xs ml-auto">
                    {category.count}
                  </Badge>
                </div>
                <div className="text-right ml-2">
                  <div className="text-sm font-semibold">
                    {formatCurrency(category.total)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const SpendingTrend = ({ expenses }) => {
  const trendData = useMemo(() => {
    const dailyTotals = {};
    
    expenses.forEach(expense => {
      const date = expense.expense_date.split('T')[0]; // Get YYYY-MM-DD
      if (!dailyTotals[date]) {
        dailyTotals[date] = 0;
      }
      dailyTotals[date] += parseFloat(expense.amount || 0);
    });
    
    // Get last 7 days of data
    const sortedDates = Object.keys(dailyTotals).sort();
    const last7Days = sortedDates.slice(-7);
    
    return last7Days.map(date => ({
      label: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
      value: dailyTotals[date],
      date
    }));
  }, [expenses]);

  const totalSpending = trendData.reduce((sum, day) => sum + day.value, 0);
  const avgDaily = totalSpending / Math.max(trendData.length, 1);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          7-Day Spending Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(totalSpending)}
          </div>
          <div className="text-sm text-muted-foreground">
            Avg: {formatCurrency(avgDaily)}/day
          </div>
        </div>
        
        <MiniBarChart data={trendData} color="#3b82f6" />
        
        <div className="grid grid-cols-7 gap-1 text-xs text-center text-muted-foreground mt-2">
          {trendData.map((day, index) => (
            <div key={index}>{day.label}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const DataVisualization = ({ 
  expenses = [], 
  categories = [], 
  previousPeriodData = {},
  className = "" 
}) => {
  const stats = useMemo(() => {
    const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const expenseCount = expenses.length;
    const uniqueCategories = new Set(expenses.map(exp => exp.category_id)).size;
    const avgAmount = expenseCount > 0 ? totalAmount / expenseCount : 0;
    
    // Calculate this month vs last month
    const now = new Date();
    const thisMonth = expenses.filter(exp => {
      const expDate = new Date(exp.expense_date);
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    });
    
    const lastMonth = expenses.filter(exp => {
      const expDate = new Date(exp.expense_date);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return expDate.getMonth() === lastMonthDate.getMonth() && expDate.getFullYear() === lastMonthDate.getFullYear();
    });

    return {
      totalAmount,
      expenseCount,
      uniqueCategories,
      avgAmount,
      thisMonthTotal: thisMonth.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0),
      lastMonthTotal: lastMonth.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0),
      thisMonthCount: thisMonth.length,
      lastMonthCount: lastMonth.length
    };
  }, [expenses]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Spending"
          value={stats.totalAmount}
          previousValue={previousPeriodData.totalAmount}
          icon={DollarSign}
          color="blue"
          formatValue={formatCurrency}
          description="All time total expenses"
        />
        
        <MetricCard
          title="Average Amount"
          value={stats.avgAmount}
          previousValue={previousPeriodData.avgAmount}
          icon={Target}
          color="green"
          formatValue={formatCurrency}
          description="Average per expense"
        />
        
        <MetricCard
          title="Total Expenses"
          value={stats.expenseCount}
          previousValue={previousPeriodData.expenseCount}
          icon={Activity}
          color="orange"
          description="Number of transactions"
        />
        
        <MetricCard
          title="Categories Used"
          value={stats.uniqueCategories}
          previousValue={previousPeriodData.uniqueCategories}
          icon={Tag}
          color="purple"
          description="Different expense types"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryBreakdown expenses={expenses} categories={categories} />
        <SpendingTrend expenses={expenses} />
      </div>

      {/* Monthly Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="This Month"
          value={stats.thisMonthTotal}
          previousValue={stats.lastMonthTotal}
          icon={Calendar}
          color="blue"
          formatValue={formatCurrency}
          description={`${stats.thisMonthCount} expenses this month`}
          chart={
            <div className="text-xs text-muted-foreground">
              {stats.thisMonthCount} transactions
            </div>
          }
        />
        
        <MetricCard
          title="Monthly Growth"
          value={stats.thisMonthTotal - stats.lastMonthTotal}
          icon={TrendingUp}
          color={stats.thisMonthTotal > stats.lastMonthTotal ? 'red' : 'green'}
          formatValue={(v) => `${v >= 0 ? '+' : ''}${formatCurrency(v)}`}
          description="Change from last month"
          chart={
            <div className="text-xs text-muted-foreground">
              {stats.thisMonthCount - stats.lastMonthCount >= 0 ? '+' : ''}{stats.thisMonthCount - stats.lastMonthCount} transactions
            </div>
          }
        />
      </div>
    </div>
  );
};

export default DataVisualization;