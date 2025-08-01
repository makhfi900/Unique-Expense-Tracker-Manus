import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/SupabaseAuthContext';
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
  Calendar,
  Loader2,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';

const YearSelector = ({ onYearChange, selectedYear }) => {
  const { apiCall } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    fetchAvailableYears();
  }, []);

  const fetchAvailableYears = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiCall('/analytics/available-years');
      if (response.years) {
        setAvailableYears(response.years);
        // Set current year as default if not already set
        if (!selectedYear && response.years.length > 0) {
          const currentYear = new Date().getFullYear();
          const yearExists = response.years.find(y => y.year === currentYear);
          onYearChange(yearExists ? currentYear : response.years[0].year);
        }
      }
    } catch (err) {
      setError('Failed to fetch available years');
      console.error('Available years error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAvailableYears();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading available years...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const currentYearData = availableYears.find(y => y.year === selectedYear);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Year Selection
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="year-select" className="block text-sm font-medium mb-2">
              Select Year for Analysis
            </label>
            <Select value={selectedYear?.toString()} onValueChange={(value) => onYearChange(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((yearData) => (
                  <SelectItem key={yearData.year} value={yearData.year.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{yearData.year}</span>
                      <span className="text-sm text-muted-foreground ml-4">
                        {formatCurrency(yearData.total_amount)} ({yearData.expense_count} expenses)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentYearData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Total Spending</span>
                </div>
                <p className="text-lg font-bold text-blue-700">
                  {formatCurrency(currentYearData.total_amount)}
                </p>
                <p className="text-xs text-blue-600">
                  {currentYearData.expense_count} total expenses
                </p>
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Active Period</span>
                </div>
                <p className="text-sm font-bold text-green-700">
                  {new Date(currentYearData.first_expense_date).toLocaleDateString()} - {' '}
                  {new Date(currentYearData.last_expense_date).toLocaleDateString()}
                </p>
                <p className="text-xs text-green-600">
                  {currentYearData.user_count} user{currentYearData.user_count !== 1 ? 's' : ''}, {' '}
                  {currentYearData.category_count} categories
                </p>
              </div>

              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-purple-900">Average Monthly</span>
                </div>
                <p className="text-lg font-bold text-purple-700">
                  {formatCurrency(currentYearData.total_amount / 12)}
                </p>
                <p className="text-xs text-purple-600">
                  Based on 12 months
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default YearSelector;