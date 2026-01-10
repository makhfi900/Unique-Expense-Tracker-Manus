/**
 * PDF Report Generator Component
 * Admin-only feature for generating comprehensive expense analysis reports
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/SupabaseAuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import {
  FileText,
  Download,
  Loader2,
  Calendar,
  PieChart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  FileWarning,
  Settings
} from 'lucide-react';
import { ExpenseReportGenerator, findBurningPoints, generateInsights } from '../utils/pdfReportGenerator';
import { formatCurrency } from '../utils/currency';

const PDFReportGenerator = ({
  kpiData,
  categoryBreakdown,
  monthlyData,
  dateRange,
  yearComparison,
  expenses
}) => {
  const { isAdmin, apiCall } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Year comparison configuration
  // Default to comparing the two most recent COMPLETE years
  const currentYear = new Date().getFullYear();
  const [baseYear, setBaseYear] = useState(currentYear - 2); // e.g., 2024 if current is 2026
  const [compareYear, setCompareYear] = useState(currentYear - 1); // e.g., 2025 if current is 2026

  // Generate available years for selection (last 10 years)
  const availableYears = useMemo(() => {
    const years = [];
    for (let year = currentYear; year >= currentYear - 10; year--) {
      years.push(year);
    }
    return years;
  }, [currentYear]);

  // Report configuration options
  const [reportConfig, setReportConfig] = useState({
    includeExecutiveSummary: true,
    includeCategoryBreakdown: true,
    includeBurningPoints: true,
    includeMonthlyTrends: true,
    includeYearComparison: true,
    includeInsights: true,
    reportPeriod: 'current' // 'current', 'ytd', 'custom'
  });

  // Only show for admins
  if (!isAdmin) {
    return null;
  }

  const handleConfigChange = (key, value) => {
    setReportConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const fetchAdditionalData = async () => {
    try {
      // Fetch expenses if not provided (needed for burning points)
      let expenseData = expenses;
      if (!expenseData || expenseData.length === 0) {
        const response = await apiCall(`/expenses?start_date=${dateRange?.startDate || ''}&end_date=${dateRange?.endDate || ''}`);
        expenseData = response.expenses || [];
      }

      // Fetch year comparison if not provided and enabled
      // Uses user-selected years (defaults to two most recent complete years)
      let yearComparisonData = yearComparison;
      if (reportConfig.includeYearComparison && !yearComparisonData) {
        try {
          console.log(`Fetching year comparison: ${baseYear} vs ${compareYear}`);
          const response = await apiCall(`/analytics/year-comparison?base_year=${baseYear}&compare_year=${compareYear}`);
          yearComparisonData = response;
        } catch (err) {
          console.warn('Could not fetch year comparison data:', err);
        }
      }

      return { expenseData, yearComparisonData };
    } catch (err) {
      console.error('Error fetching additional data:', err);
      throw err;
    }
  };

  const generateReport = async () => {
    setIsGenerating(true);
    setError('');
    setSuccess(false);

    try {
      // Fetch any missing data
      const { expenseData, yearComparisonData } = await fetchAdditionalData();

      // Calculate burning points from expenses
      const burningPoints = findBurningPoints(expenseData);

      // Prepare report data
      const reportData = {
        kpiData,
        categoryBreakdown: categoryBreakdown || [],
        monthlyData: monthlyData || [],
        dateRange,
        yearComparison: yearComparisonData,
        burningPoints,
        expenses: expenseData
      };

      // Defer PDF generation to next frame to avoid blocking the main thread
      // This prevents the "click handler took too long" violation
      await new Promise((resolve, reject) => {
        requestAnimationFrame(() => {
          // Use setTimeout to yield to the browser and avoid forced reflow
          setTimeout(() => {
            try {
              const generator = new ExpenseReportGenerator(reportData);
              generator.download('expense-analysis-report');
              resolve();
            } catch (pdfError) {
              console.error('PDF generation error:', pdfError);
              reject(pdfError);
            }
          }, 0);
        });
      });

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2000);

    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Preview data summary - memoized to avoid recalculation on every render
  const preview = useMemo(() => {
    const insights = generateInsights({
      categoryBreakdown,
      monthlyData,
      kpiData,
      yearComparison
    });

    return {
      totalSpending: kpiData?.totalSpent || 0,
      transactions: kpiData?.totalExpenses || 0,
      categories: categoryBreakdown?.length || 0,
      months: monthlyData?.length || 0,
      insights: insights.length
    };
  }, [categoryBreakdown, monthlyData, kpiData, yearComparison]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 border-0"
        >
          <FileText className="h-4 w-4" />
          Generate Report
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Generate Management Report
          </DialogTitle>
          <DialogDescription>
            Create a comprehensive PDF report for management review with expense analysis,
            insights, and optimization recommendations.
          </DialogDescription>
        </DialogHeader>

        {/* Report Preview */}
        <Card className="bg-slate-50 dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Report Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="text-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-muted-foreground">Total Spending</p>
                <p className="font-semibold text-blue-600">{formatCurrency(preview.totalSpending)}</p>
              </div>
              <div className="text-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-muted-foreground">Transactions</p>
                <p className="font-semibold text-green-600">{preview.transactions}</p>
              </div>
              <div className="text-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-muted-foreground">Categories</p>
                <p className="font-semibold text-purple-600">{preview.categories}</p>
              </div>
              <div className="text-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-muted-foreground">Months</p>
                <p className="font-semibold text-orange-600">{preview.months}</p>
              </div>
              <div className="text-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-muted-foreground">Insights</p>
                <p className="font-semibold text-red-600">{preview.insights}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Sections Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Report Sections</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center space-x-2 p-3 rounded-lg border bg-white dark:bg-slate-800">
              <Checkbox
                id="executiveSummary"
                checked={reportConfig.includeExecutiveSummary}
                onCheckedChange={(checked) => handleConfigChange('includeExecutiveSummary', checked)}
              />
              <label htmlFor="executiveSummary" className="flex items-center gap-2 text-sm cursor-pointer">
                <PieChart className="h-4 w-4 text-blue-500" />
                Executive Summary
              </label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border bg-white dark:bg-slate-800">
              <Checkbox
                id="categoryBreakdown"
                checked={reportConfig.includeCategoryBreakdown}
                onCheckedChange={(checked) => handleConfigChange('includeCategoryBreakdown', checked)}
              />
              <label htmlFor="categoryBreakdown" className="flex items-center gap-2 text-sm cursor-pointer">
                <PieChart className="h-4 w-4 text-purple-500" />
                Category Breakdown
              </label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border bg-white dark:bg-slate-800">
              <Checkbox
                id="burningPoints"
                checked={reportConfig.includeBurningPoints}
                onCheckedChange={(checked) => handleConfigChange('includeBurningPoints', checked)}
              />
              <label htmlFor="burningPoints" className="flex items-center gap-2 text-sm cursor-pointer">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Burning Points (Top Expenses)
              </label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border bg-white dark:bg-slate-800">
              <Checkbox
                id="monthlyTrends"
                checked={reportConfig.includeMonthlyTrends}
                onCheckedChange={(checked) => handleConfigChange('includeMonthlyTrends', checked)}
              />
              <label htmlFor="monthlyTrends" className="flex items-center gap-2 text-sm cursor-pointer">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Monthly Trends
              </label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border bg-white dark:bg-slate-800">
              <Checkbox
                id="yearComparison"
                checked={reportConfig.includeYearComparison}
                onCheckedChange={(checked) => handleConfigChange('includeYearComparison', checked)}
              />
              <label htmlFor="yearComparison" className="flex items-center gap-2 text-sm cursor-pointer">
                <Calendar className="h-4 w-4 text-orange-500" />
                Year-over-Year Comparison
              </label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border bg-white dark:bg-slate-800">
              <Checkbox
                id="insights"
                checked={reportConfig.includeInsights}
                onCheckedChange={(checked) => handleConfigChange('includeInsights', checked)}
              />
              <label htmlFor="insights" className="flex items-center gap-2 text-sm cursor-pointer">
                <FileWarning className="h-4 w-4 text-amber-500" />
                Key Insights & Recommendations
              </label>
            </div>
          </div>

          {/* Year Selection Controls - only show when year comparison is enabled */}
          {reportConfig.includeYearComparison && (
            <div className="p-4 rounded-lg border bg-orange-50 dark:bg-orange-900/20 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-orange-700 dark:text-orange-300">
                <Calendar className="h-4 w-4" />
                Year Comparison Settings
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="baseYear" className="text-xs text-muted-foreground">Base Year</Label>
                  <Select value={baseYear.toString()} onValueChange={(value) => setBaseYear(parseInt(value))}>
                    <SelectTrigger id="baseYear" className="bg-white dark:bg-slate-800">
                      <SelectValue placeholder="Select base year" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => (
                        <SelectItem key={`base-${year}`} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="compareYear" className="text-xs text-muted-foreground">Compare Year</Label>
                  <Select value={compareYear.toString()} onValueChange={(value) => setCompareYear(parseInt(value))}>
                    <SelectTrigger id="compareYear" className="bg-white dark:bg-slate-800">
                      <SelectValue placeholder="Select compare year" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => (
                        <SelectItem key={`compare-${year}`} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {baseYear === compareYear ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Please select two different years for comparison
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Comparing {Math.min(baseYear, compareYear)} → {Math.max(baseYear, compareYear)} (older to newer)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Report Period Info */}
        {dateRange && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-muted-foreground">Report Period:</span>
            <Badge variant="secondary">
              {dateRange.startDate} to {dateRange.endDate}
            </Badge>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              Report generated successfully! Check your downloads folder.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={generateReport}
            disabled={isGenerating}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PDFReportGenerator;
