import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/SupabaseAuthContext';
import { useTimeRange } from '../context/TimeRangeContext';
import { useIsMobile } from '../hooks/use-mobile';

// UI Components
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

// New Mobile Components
import MobileExpenseCard from './MobileExpenseCard';
import FloatingActionButton from './FloatingActionButton';
import PullToRefresh from './PullToRefresh';
import ExpenseForm from './ExpenseForm';

// Icons
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  RefreshCw,
  AlertTriangle,
  CheckSquare,
  Square,
  BarChart3,
  Upload,
  Calendar,
  User,
  SlidersHorizontal,
  X,
  Loader2,
  Sparkles
} from 'lucide-react';

const MobileExpenseList = ({ selectedCategory: parentSelectedCategory }) => {
  const { apiCall, isAdmin, session } = useAuth();
  const isMobile = useIsMobile();
  const { dateRange, handleDateRangeChange } = useTimeRange();

  // Data states
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(parentSelectedCategory || 'all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('expense_date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Selection states
  const [selectedExpenses, setSelectedExpenses] = useState(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);

  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Mobile-specific states
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Haptic feedback
  const triggerHaptic = useCallback((type = 'light') => {
    if (window.navigator?.vibrate) {
      switch(type) {
        case 'light':
          window.navigator.vibrate(10);
          break;
        case 'medium':
          window.navigator.vibrate(30);
          break;
        case 'heavy':
          window.navigator.vibrate([50, 10, 50]);
          break;
      }
    }
  }, []);

  // Fetch data functions
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

  const fetchExpenses = useCallback(async () => {
    if (!session || !dateRange.startDate || !dateRange.endDate) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        sort_by: sortBy,
        sort_order: sortOrder
      });

      if (selectedCategory !== 'all') {
        params.append('category_id', selectedCategory);
      }
      if (isAdmin && selectedUser !== 'all') {
        params.append('user_id', selectedUser);
      }
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await apiCall(`/expenses?${params.toString()}`);
      
      if (response?.expenses) {
        setExpenses(response.expenses);
        setTotalExpenses(response.pagination?.total || response.expenses.length);
        setTotalPages(response.pagination?.totalPages || Math.ceil(response.expenses.length / pageSize));
      }
    } catch (err) {
      setError(err.message || 'Failed to load expenses');
      console.error('Fetch expenses error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiCall, session, dateRange, currentPage, pageSize, sortBy, sortOrder, selectedCategory, selectedUser, searchTerm, isAdmin]);

  // Initialize data
  useEffect(() => {
    fetchCategories();
    if (isAdmin) {
      fetchUsers();
    }
  }, [fetchCategories, fetchUsers, isAdmin]);

  // Fetch expenses when dependencies change
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchExpenses();
    }
  }, [fetchExpenses]);

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    triggerHaptic('light');
    
    try {
      await fetchExpenses();
      setLastRefresh(new Date());
      triggerHaptic('medium');
    } catch (err) {
      console.error('Refresh failed:', err);
      triggerHaptic('heavy');
    } finally {
      setRefreshing(false);
    }
  }, [fetchExpenses, triggerHaptic]);

  // Selection handlers
  const handleToggleSelect = useCallback((expenseId, selected) => {
    const newSelected = new Set(selectedExpenses);
    if (selected) {
      newSelected.add(expenseId);
    } else {
      newSelected.delete(expenseId);
    }
    setSelectedExpenses(newSelected);
    setIsAllSelected(newSelected.size === expenses.length && expenses.length > 0);
    triggerHaptic('light');
  }, [selectedExpenses, expenses.length, triggerHaptic]);

  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      const allIds = new Set(expenses.map(expense => expense.id));
      setSelectedExpenses(allIds);
      setIsAllSelected(true);
    } else {
      setSelectedExpenses(new Set());
      setIsAllSelected(false);
    }
    triggerHaptic('medium');
  }, [expenses, triggerHaptic]);

  // Action handlers
  const handleEditExpense = useCallback((expense) => {
    setEditingExpense(expense);
    setEditModalOpen(true);
    triggerHaptic('light');
  }, [triggerHaptic]);

  const handleDeleteExpense = useCallback(async (expenseId) => {
    try {
      await apiCall(`/expenses/${expenseId}`, { method: 'DELETE' });
      
      // Remove from selection if selected
      const newSelected = new Set(selectedExpenses);
      newSelected.delete(expenseId);
      setSelectedExpenses(newSelected);
      
      // Refresh data
      await fetchExpenses();
      triggerHaptic('heavy');
    } catch (err) {
      setError('Failed to delete expense: ' + err.message);
    }
  }, [apiCall, selectedExpenses, fetchExpenses, triggerHaptic]);

  const handleDuplicateExpense = useCallback(async (expense) => {
    try {
      const duplicateData = {
        amount: expense.amount,
        description: `Copy of ${expense.description}`,
        category_id: expense.category_id,
        expense_date: new Date().toISOString().split('T')[0],
        receipt_url: expense.receipt_url || '',
        notes: expense.notes || ''
      };
      
      await apiCall('/expenses', {
        method: 'POST',
        body: duplicateData
      });
      
      await fetchExpenses();
      triggerHaptic('medium');
    } catch (err) {
      setError('Failed to duplicate expense: ' + err.message);
    }
  }, [apiCall, fetchExpenses, triggerHaptic]);

  // FAB action handlers
  const handleAddExpense = useCallback(() => {
    setAddExpenseModalOpen(true);
    triggerHaptic('light');
  }, [triggerHaptic]);

  const handleImportData = useCallback(() => {
    // Navigate to import/export section
    if (window.parent?.setActiveTab) {
      window.parent.setActiveTab('import-export');
    }
    triggerHaptic('light');
  }, [triggerHaptic]);

  const handleViewAnalytics = useCallback(() => {
    // Navigate to analytics section
    if (window.parent?.setActiveTab) {
      window.parent.setActiveTab('analytics');
    }
    triggerHaptic('light');
  }, [triggerHaptic]);

  // Bulk actions
  const handleBulkDelete = useCallback(async () => {
    if (selectedExpenses.size === 0) return;
    
    if (!window.confirm(`Delete ${selectedExpenses.size} selected expenses?`)) return;

    try {
      const deletePromises = Array.from(selectedExpenses).map(id => 
        apiCall(`/expenses/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      
      setSelectedExpenses(new Set());
      setIsAllSelected(false);
      await fetchExpenses();
      triggerHaptic('heavy');
    } catch (err) {
      setError('Failed to delete expenses: ' + err.message);
    }
  }, [selectedExpenses, apiCall, fetchExpenses, triggerHaptic]);

  const handleBulkExport = useCallback(async () => {
    try {
      const selectedData = selectedExpenses.size > 0 
        ? expenses.filter(expense => selectedExpenses.has(expense.id))
        : expenses;
      
      if (selectedData.length === 0) return;
      
      // Convert to CSV
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
      
      // Download
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      triggerHaptic('medium');
    } catch (err) {
      setError('Failed to export expenses: ' + err.message);
    }
  }, [selectedExpenses, expenses, triggerHaptic]);

  // Memoized filter stats
  const filterStats = useMemo(() => ({
    total: totalExpenses,
    selected: selectedExpenses.size,
    hasFilters: searchTerm || selectedCategory !== 'all' || (isAdmin && selectedUser !== 'all'),
    lastRefresh
  }), [totalExpenses, selectedExpenses.size, searchTerm, selectedCategory, selectedUser, isAdmin, lastRefresh]);

  if (!isMobile) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">
          Mobile expense interface is designed for mobile devices. 
          Please use the regular expense viewer on desktop.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/40">
      {/* Mobile Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Expenses
              </h1>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span>{filterStats.total} total</span>
                {filterStats.selected > 0 && (
                  <>
                    <span>•</span>
                    <span>{filterStats.selected} selected</span>
                  </>
                )}
                {filterStats.lastRefresh && (
                  <>
                    <span>•</span>
                    <span>Updated {filterStats.lastRefresh.toLocaleTimeString()}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Filter Toggle */}
              <Button
                variant={showFilters ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setShowFilters(!showFilters);
                  triggerHaptic('light');
                }}
                className="relative"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {filterStats.hasFilters && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </Button>

              {/* Bulk Actions */}
              {filterStats.selected > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBulkExport}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search expenses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Category and User Filters */}
                  <div className="grid grid-cols-1 gap-3">
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

                    {isAdmin && (
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
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="mx-4 mt-4 border-red-200 bg-red-50 dark:bg-red-900/20">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchExpenses} 
              className="ml-2 h-6"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Content */}
      <PullToRefresh onRefresh={handleRefresh} disabled={loading}>
        <div className="px-4 pb-24">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading expenses...</p>
            </div>
          ) : expenses.length > 0 ? (
            <>
              {/* Select All */}
              <div className="flex items-center justify-between py-3 sticky top-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-20 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <span className="text-sm font-medium">
                    {isAllSelected ? 'Deselect All' : `Select All (${expenses.length})`}
                  </span>
                </div>
                {filterStats.selected > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {filterStats.selected} selected
                  </Badge>
                )}
              </div>

              {/* Expense Cards */}
              <div className="py-4 space-y-3">
                <AnimatePresence>
                  {expenses.map((expense, index) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <MobileExpenseCard
                        expense={expense}
                        onEdit={handleEditExpense}
                        onDelete={handleDeleteExpense}
                        onDuplicate={handleDuplicateExpense}
                        onToggleSelect={handleToggleSelect}
                        isSelected={selectedExpenses.has(expense.id)}
                        isAdmin={isAdmin}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Load More */}
              {currentPage < totalPages && (
                <div className="text-center py-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Load More
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No expenses found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
                No expenses match your current filters. Try adjusting your search or date range.
              </p>
              <Button onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedUser('all');
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Floating Action Button */}
      <FloatingActionButton
        onAddExpense={handleAddExpense}
        onImportData={handleImportData}
        onViewAnalytics={handleViewAnalytics}
        isAdmin={isAdmin}
      />

      {/* Edit Expense Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update the details for this expense.
            </DialogDescription>
          </DialogHeader>
          
          {editingExpense && (
            <ExpenseForm
              expense={editingExpense}
              onSuccess={() => {
                setEditModalOpen(false);
                setEditingExpense(null);
                fetchExpenses();
              }}
              onCancel={() => {
                setEditModalOpen(false);
                setEditingExpense(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Expense Modal */}
      <Dialog open={addExpenseModalOpen} onOpenChange={setAddExpenseModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              Record a new expense with detailed information.
            </DialogDescription>
          </DialogHeader>
          
          <ExpenseForm
            onSuccess={() => {
              setAddExpenseModalOpen(false);
              fetchExpenses();
            }}
            onCancel={() => {
              setAddExpenseModalOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileExpenseList;