import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/SupabaseAuthContext';
import { useTimeRange } from '../context/TimeRangeContext';
import { formatCurrency } from '../utils/currency';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Tag,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Edit,
  Trash2,
  MoreHorizontal,
  FileText,
  Copy,
  CheckSquare,
  Square,
  Info,
  AlertTriangle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { Checkbox } from './ui/checkbox';

const ExpenseViewer = () => {
  const { apiCall, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data states
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  
  // Use shared time range context
  const { dateRange, selectedPreset, handlePresetChange, handleDateRangeChange } = useTimeRange();
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('expense_date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // Dynamic configurable page size
  const [totalPages, setTotalPages] = useState(1);
  
  // Page size options for user selection
  const pageSizeOptions = [20, 50, 100, 200];
  
  // Multi-select states
  const [selectedExpenses, setSelectedExpenses] = useState(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  
  // Action states
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Legacy date presets for Analytics Filters (matching EnhancedAnalytics.jsx format)
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

  // Legacy preset handler for Analytics Filters compatibility
  const handleLegacyPresetChange = (preset) => {
    if (legacyDatePresets[preset]) {
      handlePresetChange('custom', {
        startDate: legacyDatePresets[preset].startDate,
        endDate: legacyDatePresets[preset].endDate
      });
    }
  };

  // Fetch categories
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

  // Fetch users (admin only)
  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    
    try {
      const response = await apiCall('/users');
      if (response.users) {
        setUsers(response.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, [apiCall, isAdmin]);

  // CRITICAL FIX: Enhanced fetchExpenses with proper TimeRange context integration
  const fetchExpenses = useCallback(async (forceRefresh = false) => {
    // FUNCTIONAL FIX: Only validate dates if we have them, allow fetch with defaults
    if (!dateRange.startDate || !dateRange.endDate) {
      console.log('ExpenseViewer: No date range set, using current month defaults');
      // Set default range to current month if no range provided
      const today = new Date().toISOString().split('T')[0];
      const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      
      // Update the date range context with defaults
      handleDateRangeChange('startDate', firstOfMonth);
      handleDateRangeChange('endDate', today);
      return;
    }

    setLoading(true);
    setError('');
    
    // DEBUGGING: Log actual date range being used for API call
    console.log(`📊 FETCHING EXPENSES: ${dateRange.startDate} to ${dateRange.endDate}`);
    
    try {
      // Build query parameters using existing API format
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        sort_by: sortBy,
        sort_order: sortOrder
      });

      // Add filters
      if (selectedCategory !== 'all') {
        // Ensure category ID is converted to string for API consistency
        const categoryId = String(selectedCategory);
        params.append('categories', categoryId);
        console.log(`🏷️  Category Filter Applied: ${categoryId} (type: ${typeof selectedCategory})`);
      }
      
      if (isAdmin && selectedUser !== 'all') {
        params.append('user_id', selectedUser);
      }
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      // FUNCTIONAL FIX: Log the actual API URL being called
      const apiUrl = `/expenses?${params.toString()}`;
      console.log(`🌐 API CALL: ${apiUrl}`);

      const response = await apiCall(apiUrl);
      console.log(`📦 API Response: ${response?.expenses?.length || 0} expenses returned`);
      
      if (response.expenses) {
        setExpenses(response.expenses);
        // Use proper API response fields based on backend structure
        const totalCount = response.pagination?.total || response.totalCount || response.expenses.length;
        const calculatedTotalPages = response.pagination?.totalPages || response.totalPages || Math.ceil(totalCount / pageSize);
        
        setTotalExpenses(totalCount);
        setTotalPages(calculatedTotalPages);
        
        // FUNCTIONAL SUCCESS: Log successful data fetch
        console.log(`✅ DATA LOADED: ${response.expenses.length} expenses for ${dateRange.startDate} to ${dateRange.endDate}`);
      }
    } catch (err) {
      setError('Failed to fetch expenses: ' + err.message);
      console.error('❌ FETCH ERROR:', err);
    } finally {
      setLoading(false);
    }
  }, [apiCall, currentPage, pageSize, dateRange.startDate, dateRange.endDate, selectedCategory, selectedUser, searchTerm, sortBy, sortOrder, isAdmin]);

  // Initialize data
  useEffect(() => {
    fetchCategories();
    if (isAdmin) {
      fetchUsers();
    }
  }, [fetchCategories, fetchUsers, isAdmin]);

  // CRITICAL FIX: Properly watch TimeRange context changes and trigger data refresh
  useEffect(() => {
    console.log('📅 DATE RANGE CHANGED:', dateRange);
    setCurrentPage(1); // Reset to first page when filters change
    setSelectedExpenses(new Set()); // Clear selections on filter change
    setIsAllSelected(false);
  }, [dateRange.startDate, dateRange.endDate, selectedCategory, selectedUser, searchTerm, sortBy, sortOrder]);

  // CRITICAL FIX: Force immediate data refresh when dependencies change
  useEffect(() => {
    const fetchData = async () => {
      if (dateRange.startDate && dateRange.endDate) {
        console.log('🔄 TRIGGERING IMMEDIATE FETCH DUE TO DEPENDENCY CHANGE');
        await fetchExpenses(true); // Force refresh
      }
    };
    
    // Use a small delay to batch rapid changes
    const timeoutId = setTimeout(fetchData, 100);
    return () => clearTimeout(timeoutId);
  }, [dateRange.startDate, dateRange.endDate, selectedCategory, selectedUser, searchTerm, sortBy, sortOrder, currentPage, pageSize]);

  // Enhanced loading states for better UX
  const [filterLoading, setFilterLoading] = useState(false);
  const [dateRangeLoading, setDateRangeLoading] = useState(false);
  
  useEffect(() => {
    setFilterLoading(true);
    const timeoutId = setTimeout(() => {
      setFilterLoading(false);
    }, 200); // Brief loading state for UX feedback
    
    return () => clearTimeout(timeoutId);
  }, [selectedCategory, selectedUser, searchTerm]);
  
  // Separate loading state for date range changes
  useEffect(() => {
    setDateRangeLoading(true);
    const timeoutId = setTimeout(() => {
      setDateRangeLoading(false);
    }, 300); // Slightly longer for date range changes
    
    return () => clearTimeout(timeoutId);
  }, [dateRange]);

  // Date range handled by shared TimeRangeContext

  // Handle sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Multi-select handlers
  const handleSelectExpense = (expenseId, checked) => {
    const newSelected = new Set(selectedExpenses);
    if (checked) {
      newSelected.add(expenseId);
    } else {
      newSelected.delete(expenseId);
    }
    setSelectedExpenses(newSelected);
    setIsAllSelected(newSelected.size === expenses.length && expenses.length > 0);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = new Set(expenses.map(expense => expense.id));
      setSelectedExpenses(allIds);
      setIsAllSelected(true);
    } else {
      setSelectedExpenses(new Set());
      setIsAllSelected(false);
    }
  };

  // Clear selection when expenses change
  useEffect(() => {
    setSelectedExpenses(new Set());
    setIsAllSelected(false);
  }, [expenses]);

  // Individual expense actions
  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    // You can implement edit modal here or navigate to edit page
    console.log('Edit expense:', expense);
  };

  const handleDeleteExpense = async (expenseId) => {
    setDeleteLoading(true);
    try {
      await apiCall(`/expenses/${expenseId}`, {
        method: 'DELETE'
      });
      // Remove from selection if selected
      const newSelected = new Set(selectedExpenses);
      newSelected.delete(expenseId);
      setSelectedExpenses(newSelected);
      // Refresh the expenses list
      await fetchExpenses();
    } catch (err) {
      setError('Failed to delete expense: ' + err.message);
      console.error('Delete expense error:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDuplicateExpense = async (expense) => {
    try {
      const duplicateData = {
        amount: expense.amount,
        description: `Copy of ${expense.description}`,
        category_id: expense.category_id,
        expense_date: new Date().toISOString().split('T')[0], // Today's date
        receipt_url: expense.receipt_url || '',
        notes: expense.notes || ''
      };
      
      await apiCall('/expenses', {
        method: 'POST',
        body: duplicateData
      });
      
      // Refresh the expenses list
      fetchExpenses();
    } catch (err) {
      setError('Failed to duplicate expense: ' + err.message);
    }
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedExpenses.size === 0) return;
    
    setDeleteLoading(true);
    try {
      // Delete all selected expenses
      const deletePromises = Array.from(selectedExpenses).map(id => 
        apiCall(`/expenses/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      
      // Clear selection and refresh
      setSelectedExpenses(new Set());
      setIsAllSelected(false);
      await fetchExpenses();
    } catch (err) {
      setError('Failed to delete expenses: ' + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkExport = async () => {
    if (selectedExpenses.size === 0) {
      // Export all if none selected
      handleExport();
      return;
    }

    try {
      // Filter selected expenses and export
      const selectedData = expenses.filter(expense => selectedExpenses.has(expense.id));
      
      if (selectedData.length === 0) return;
      
      // Convert to CSV format
      const headers = ['Date', 'Amount', 'Description', 'Category', 'Notes'];
      const csvData = [
        headers.join(','),
        ...selectedData.map(expense => [
          new Date(expense.expense_date).toLocaleDateString(),
          expense.amount,
          `"${expense.description.replace(/"/g, '""')}"`,
          expense.category?.name || 'Uncategorized',
          `"${(expense.notes || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');
      
      // Download CSV
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `selected_expenses_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Failed to export selected expenses: ' + err.message);
    }
  };

  // Export expenses
  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        start_date: dateRange.startDate,
        end_date: dateRange.endDate
      });

      if (selectedCategory !== 'all') {
        // Ensure category ID is converted to string for API consistency
        const categoryId = String(selectedCategory);
        params.append('categories', categoryId);
        console.log(`📥 Export Category Filter: ${categoryId} (type: ${typeof selectedCategory})`);
      }
      
      if (isAdmin && selectedUser !== 'all') {
        params.append('user_id', selectedUser);
      }
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await apiCall(`/expenses/export?${params.toString()}`);
      
      // Convert to CSV and download
      const csvContent = "data:text/csv;charset=utf-8," + 
        Object.keys(response[0] || {}).join(",") + "\n" +
        response.map(row => Object.values(row).join(",")).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `expenses_${dateRange.startDate}_${dateRange.endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Failed to export expenses: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Filters - ONLY for Account Officers */}
      {!isAdmin && !loading && (
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Account Officer Date Filters
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Essential date range controls for expense tracking and reporting
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Enhanced Preset Selector for Account Officers */}
              <div>
                <Label htmlFor="preset" className="text-sm font-semibold">
                  Quick Date Ranges
                </Label>
                <Select onValueChange={handleLegacyPresetChange}>
                  <SelectTrigger className="border-blue-200 dark:border-blue-700">
                    <SelectValue placeholder="Choose date range" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(legacyDatePresets).map(([key, preset]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {preset.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Enhanced Start Date - CRITICAL FOR ACCOUNT OFFICERS */}
              <div>
                <Label htmlFor="start-date" className="text-sm font-semibold flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Start Date
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => {
                    console.log('📅 START DATE CHANGED:', e.target.value);
                    handleDateRangeChange('startDate', e.target.value);
                    // Immediate visual feedback
                    setDateRangeLoading(true);
                  }}
                  className="border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Filter expenses from this date onwards
                </p>
              </div>

              {/* Enhanced End Date - CRITICAL FOR ACCOUNT OFFICERS */}
              <div>
                <Label htmlFor="end-date" className="text-sm font-semibold flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  End Date
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => {
                    console.log('📅 END DATE CHANGED:', e.target.value);
                    handleDateRangeChange('endDate', e.target.value);
                    // Immediate visual feedback
                    setDateRangeLoading(true);
                  }}
                  className="border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Filter expenses up to this date
                </p>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex items-end gap-2">
                <Button 
                  onClick={() => {
                    console.log('🔄 MANUAL REFRESH TRIGGERED BY ACCOUNT OFFICER');
                    fetchExpenses(true); // Force refresh when button clicked
                  }} 
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Loading...' : 'Apply Filters'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
                    handleDateRangeChange('startDate', firstOfMonth);
                    handleDateRangeChange('endDate', today);
                  }}
                  className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                  size="sm"
                >
                  <Calendar className="h-3 w-3" />
                  This Month
                </Button>
              </div>
            </div>

            {/* Account Officer Helper Info */}
            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-300 dark:border-blue-700">
              <div className="flex items-start gap-2 text-sm">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">Account Officer Date Controls</p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    Use the start and end date fields above to filter your expense records for any specific time period. 
                    These controls are essential for generating accurate reports and tracking spending patterns.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Currently showing: <strong>{new Date(dateRange.startDate).toLocaleDateString()}</strong> to <strong>{new Date(dateRange.endDate).toLocaleDateString()}</strong>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Expense Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Info about date range control */}
          <div className="text-sm text-muted-foreground mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Date range is controlled by the Analytics Filters above</span>
            </div>
            <div className="mt-1 text-xs">
              Current range: {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
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

            {/* User Filter (Admin Only) */}
            {isAdmin && (
              <div>
                <Label htmlFor="user">User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Search */}
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search description or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Page Size Selector */}
            <div>
              <Label htmlFor="pageSize">Items per page</Label>
              <Select value={pageSize.toString()} onValueChange={(value) => {
                setPageSize(parseInt(value));
                setCurrentPage(1); // Reset to first page when changing page size
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} items
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex items-end gap-2">
              <Button 
                onClick={() => {
                  console.log('🔄 REFRESH BUTTON CLICKED');
                  fetchExpenses(true);
                }} 
                variant="outline" 
                className="flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
              <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <div className="font-medium">Error loading expenses</div>
            <div className="text-sm mt-1">{error}</div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchExpenses} 
              className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>Expenses ({totalExpenses} total)</span>
              {selectedExpenses.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedExpenses.size} selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkExport}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Export Selected
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteLoading}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete Selected
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Selected Expenses</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {selectedExpenses.size} selected expense{selectedExpenses.size !== 1 ? 's' : ''}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleBulkDelete}
                            disabled={deleteLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleteLoading ? (
                              <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>
                            ) : (
                              'Delete'
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalExpenses)} of {totalExpenses}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(loading || filterLoading || dateRangeLoading) ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
                <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-cyan-200 animate-pulse" />
              </div>
              <div className="text-center">
                <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
                  {dateRangeLoading ? 'Updating date range...' : 
                   filterLoading ? 'Applying filters...' : 
                   'Loading expenses...'}
                </span>
                <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  {dateRangeLoading ? 'Please wait while we fetch data for your selected time period' :
                   filterLoading ? 'Processing your filter selections' :
                   'Retrieving your expense data'}
                </div>
              </div>
            </div>
          ) : expenses.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* Multi-select column */}
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all expenses"
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleSort('expense_date')}
                    >
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Date
                        {sortBy === 'expense_date' && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center gap-1">
                        Amount
                        {sortBy === 'amount' && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        Category
                      </div>
                    </TableHead>
                    {isAdmin && (
                      <TableHead>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          User
                        </div>
                      </TableHead>
                    )}
                    <TableHead>Notes</TableHead>
                    {/* Actions column */}
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow 
                      key={expense.id} 
                      className="hover:bg-accent/50"
                      data-state={selectedExpenses.has(expense.id) ? "selected" : ""}
                    >
                      {/* Multi-select checkbox */}
                      <TableCell>
                        <Checkbox
                          checked={selectedExpenses.has(expense.id)}
                          onCheckedChange={(checked) => handleSelectExpense(expense.id, checked)}
                          aria-label={`Select expense ${expense.description}`}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {expense.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: expense.category?.color || '#64748B' }}
                          />
                          {expense.category?.name || 'Uncategorized'}
                        </div>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {expense.created_by_user?.full_name || 'Unknown User'}
                        </TableCell>
                      )}
                      <TableCell className="max-w-xs truncate">
                        {expense.notes || '-'}
                      </TableCell>
                      {/* Actions column */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleEditExpense(expense)}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDuplicateExpense(expense)}
                              className="cursor-pointer"
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            {expense.receipt_url && (
                              <DropdownMenuItem 
                                onClick={() => window.open(expense.receipt_url, '_blank')}
                                className="cursor-pointer"
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                View Receipt
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  onSelect={(e) => e.preventDefault()}
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the expense "{expense.description}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteExpense(expense.id)}
                                    disabled={deleteLoading}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {deleteLoading ? (
                                      <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>
                                    ) : (
                                      'Delete'
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center shadow-inner">
                    <Search className="h-10 w-10 text-gray-400" />
                  </div>
                  <div className="absolute -inset-2 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 animate-pulse" />
                </div>
                <div className="max-w-md">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Expenses Found</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    No expenses found for the selected filters and time period. Try adjusting your search criteria or date range to find what you're looking for.
                  </p>
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <Info className="h-4 w-4" />
                      <span className="text-sm font-medium">Current date range:</span>
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setSelectedUser('all');
                    }} 
                    variant="outline"
                    className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Clear Filters
                  </Button>
                  <Button 
                    onClick={fetchExpenses} 
                    variant="outline"
                    className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <Calendar className="h-4 w-4" />
                    Refresh Data
                  </Button>
                  <Button 
                    onClick={() => {
                      handlePresetChange('current_month');
                    }} 
                    className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600"
                  >
                    <Calendar className="h-4 w-4" />
                    Show This Month
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseViewer;