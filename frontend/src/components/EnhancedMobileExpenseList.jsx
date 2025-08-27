import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/SupabaseAuthContext';
import { useTimeRange } from '../context/TimeRangeContext';
import { useIsMobile } from '../hooks/use-mobile';

// Enhanced UI Components
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
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

// New Enhanced Mobile Components
import ProfessionalMobileCard from './ui/professional-mobile-card';
import EnhancedFloatingActionButton from './ui/enhanced-fab';
import MobileGestureNavigation from './ui/mobile-gesture-navigation';
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
  SlidersHorizontal,
  X,
  Loader2,
  Sparkles,
  Calendar,
  TrendingUp,
  DollarSign,
  BarChart3,
  Zap,
  Star,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const EnhancedMobileExpenseList = ({ selectedCategory: parentSelectedCategory }) => {
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

  // Enhanced Pagination with Virtual Scrolling
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // Increased for better performance
  const [totalPages, setTotalPages] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Selection states
  const [selectedExpenses, setSelectedExpenses] = useState(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);

  // Enhanced UI states
  const [showFilters, setShowFilters] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Mobile-specific enhanced states
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [gestureEnabled, setGestureEnabled] = useState(true);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'compact'
  
  // Virtual scrolling and performance refs
  const scrollContainerRef = useRef(null);
  const loadMoreObserverRef = useRef(null);
  const lastExpenseElementRef = useRef(null);

  // Haptic feedback with enhanced patterns
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
        case 'success':
          window.navigator.vibrate([100, 50, 100]);
          break;
        case 'error':
          window.navigator.vibrate([200, 100, 200, 100, 200]);
          break;
      }
    }
  }, []);

  // Fetch data functions with enhanced error handling
  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiCall('/categories');
      if (response.categories) {
        setCategories(response.categories);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      triggerHaptic('error');
    }
  }, [apiCall, triggerHaptic]);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await apiCall('/users');
      if (response.users) {
        setUsers(response.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      triggerHaptic('error');
    }
  }, [apiCall, isAdmin, triggerHaptic]);

  // Enhanced fetchExpenses with infinite scrolling support
  const fetchExpenses = useCallback(async (isLoadMore = false) => {
    if (!session || !dateRange.startDate || !dateRange.endDate) {
      return;
    }

    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
      setError('');
    }

    try {
      const targetPage = isLoadMore ? currentPage + 1 : currentPage;
      
      const params = new URLSearchParams({
        page: targetPage.toString(),
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
        if (isLoadMore) {
          // Append new expenses for infinite scroll
          setExpenses(prev => [...prev, ...response.expenses]);
          setCurrentPage(targetPage);
        } else {
          // Replace expenses for new search/filter
          setExpenses(response.expenses);
        }
        
        const totalItems = response.pagination?.total || response.expenses.length;
        const totalPagesCount = response.pagination?.totalPages || Math.ceil(totalItems / pageSize);
        
        setTotalExpenses(totalItems);
        setTotalPages(totalPagesCount);
        setHasMoreData(targetPage < totalPagesCount);
        
        triggerHaptic('success');
      }
    } catch (err) {
      setError(err.message || 'Failed to load expenses');
      console.error('Fetch expenses error:', err);
      triggerHaptic('error');
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [apiCall, session, dateRange, currentPage, pageSize, sortBy, sortOrder, selectedCategory, selectedUser, searchTerm, isAdmin, triggerHaptic]);

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
      // Reset pagination for new filters
      setCurrentPage(1);
      setHasMoreData(true);
      fetchExpenses();
    }
  }, [dateRange, selectedCategory, selectedUser, searchTerm, sortBy, sortOrder]);

  // Infinite scroll intersection observer
  useEffect(() => {
    if (!hasMoreData || isLoadingMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreData && !isLoadingMore) {
          fetchExpenses(true); // Load more data
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    const currentElement = lastExpenseElementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [hasMoreData, isLoadingMore, loading, fetchExpenses]);

  // Enhanced pull to refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    triggerHaptic('light');
    
    try {
      // Reset to first page and clear existing data
      setCurrentPage(1);
      setHasMoreData(true);
      setExpenses([]); // Clear existing data for fresh load
      await fetchExpenses();
      setLastRefresh(new Date());
      triggerHaptic('success');
    } catch (err) {
      console.error('Refresh failed:', err);
      triggerHaptic('error');
    } finally {
      setRefreshing(false);
    }
  }, [fetchExpenses, triggerHaptic]);

  // Enhanced selection handlers
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

  // Sort handler with mobile optimizations
  const handleSort = useCallback((column) => {
    if (sortBy === column) {
      // Toggle sort order for same column
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder);
      triggerHaptic('medium');
    } else {
      // Set new column with default desc order
      setSortBy(column);
      setSortOrder('desc');
      triggerHaptic('light');
    }
    setCurrentPage(1); // Reset pagination when sorting
  }, [sortBy, sortOrder, triggerHaptic]);

  // Enhanced action handlers
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
      triggerHaptic('success');
    } catch (err) {
      setError('Failed to delete expense: ' + err.message);
      triggerHaptic('error');
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
      triggerHaptic('success');
    } catch (err) {
      setError('Failed to duplicate expense: ' + err.message);
      triggerHaptic('error');
    }
  }, [apiCall, fetchExpenses, triggerHaptic]);

  // Enhanced FAB action handlers
  const handleAddExpense = useCallback(() => {
    setAddExpenseModalOpen(true);
    triggerHaptic('medium');
  }, [triggerHaptic]);

  const handleShowFilters = useCallback(() => {
    setShowFilters(!showFilters);
    triggerHaptic('light');
  }, [showFilters, triggerHaptic]);

  const handleImportData = useCallback(() => {
    // Navigate to import/export section
    if (window.parent?.setActiveTab) {
      window.parent.setActiveTab('import-export');
    }
    triggerHaptic('medium');
  }, [triggerHaptic]);

  const handleViewAnalytics = useCallback(() => {
    // Navigate to analytics section
    if (window.parent?.setActiveTab) {
      window.parent.setActiveTab('analytics');
    }
    triggerHaptic('medium');
  }, [triggerHaptic]);

  // Enhanced bulk actions
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
      triggerHaptic('success');
    } catch (err) {
      setError('Failed to delete expenses: ' + err.message);
      triggerHaptic('error');
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
      
      triggerHaptic('success');
    } catch (err) {
      setError('Failed to export expenses: ' + err.message);
      triggerHaptic('error');
    }
  }, [selectedExpenses, expenses, triggerHaptic]);

  // Enhanced gesture navigation handlers
  const handleSwipeLeft = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      triggerHaptic('medium');
    }
  }, [currentPage, totalPages, triggerHaptic]);

  const handleSwipeRight = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      triggerHaptic('medium');
    }
  }, [currentPage, triggerHaptic]);

  // Memoized filter stats with enhanced metrics
  const filterStats = useMemo(() => {
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const avgAmount = expenses.length > 0 ? totalAmount / expenses.length : 0;
    
    return {
      total: totalExpenses,
      selected: selectedExpenses.size,
      totalAmount,
      avgAmount,
      hasFilters: searchTerm || selectedCategory !== 'all' || (isAdmin && selectedUser !== 'all'),
      lastRefresh,
      currentPageExpenses: expenses.length
    };
  }, [totalExpenses, selectedExpenses.size, expenses, searchTerm, selectedCategory, selectedUser, isAdmin, lastRefresh]);

  if (!isMobile) {
    return (
      <div className="text-center p-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-10 h-10 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Enhanced Mobile Interface
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          This enhanced mobile interface is optimized for mobile devices. 
          Please use the regular expense viewer on desktop for the best experience.
        </p>
      </div>
    );
  }

  return (
    <MobileGestureNavigation
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
      onPullToRefresh={handleRefresh}
      enableSwipeNavigation={false} // Disabled to prevent conflicts with scrolling
      enablePullToRefresh={true}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/40"
      style={{
        // Enhanced mobile scrolling compatibility
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        overscrollBehavior: 'contain'
      }}
    >
      {/* Enhanced Mobile Header */}
      <div className="sticky top-0 z-40 bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Smart Expenses
                </h1>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                    {filterStats.total} total
                  </Badge>
                  {filterStats.selected > 0 && (
                    <Badge variant="outline" className="px-2 py-0.5 text-xs border-blue-200 text-blue-700">
                      {filterStats.selected} selected
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Enhanced Filter Toggle */}
              <Button
                variant={showFilters ? "default" : "ghost"}
                size="sm"
                onClick={handleShowFilters}
                className="relative h-10 w-10 p-0 rounded-xl"
                title="Toggle filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {filterStats.hasFilters && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"
                  />
                )}
              </Button>

              {/* Enhanced Stats Display */}
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex h-10 px-3 rounded-xl"
                title={`Total: $${filterStats.totalAmount.toFixed(2)} • Avg: $${filterStats.avgAmount.toFixed(2)}`}
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                <span className="text-xs font-medium">Stats</span>
              </Button>
            </div>
          </div>

          {/* Enhanced Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0, y: -10 }}
                animate={{ height: 'auto', opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl p-4 mt-3">
                  {/* Search with enhanced styling */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search expenses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-11 pr-4 h-12 rounded-xl border-0 bg-white dark:bg-gray-800 shadow-sm"
                    />
                  </div>

                  {/* Enhanced Category and User Filters */}
                  <div className="grid grid-cols-1 gap-3">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="h-12 rounded-xl border-0 bg-white dark:bg-gray-800 shadow-sm">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="font-medium">{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {isAdmin && (
                      <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger className="h-12 rounded-xl border-0 bg-white dark:bg-gray-800 shadow-sm">
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

                  {/* Quick Clear Filters */}
                  {filterStats.hasFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('all');
                        setSelectedUser('all');
                        triggerHaptic('light');
                      }}
                      className="w-full h-10 rounded-xl border-dashed"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Sort Controls - Positioned after filters */}
          <AnimatePresence>
            {!loading && expenses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mt-4"
              >
                <div className="sticky top-32 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Sort by:
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {expenses.length} expenses
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2">
                    {/* Date Sort Button */}
                    <Button
                      variant={sortBy === 'expense_date' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleSort('expense_date')}
                      className={`
                        min-w-[44px] h-11 px-4 rounded-xl transition-all duration-200
                        ${sortBy === 'expense_date' 
                          ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }
                      `}
                      style={{ minHeight: '44px' }} // Ensure 44px touch target
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="font-medium">Date</span>
                      {sortBy === 'expense_date' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-1"
                        >
                          {sortOrder === 'asc' ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )}
                        </motion.div>
                      )}
                    </Button>

                    {/* Amount Sort Button */}
                    <Button
                      variant={sortBy === 'amount' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleSort('amount')}
                      className={`
                        min-w-[44px] h-11 px-4 rounded-xl transition-all duration-200
                        ${sortBy === 'amount' 
                          ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }
                      `}
                      style={{ minHeight: '44px' }} // Ensure 44px touch target
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span className="font-medium">Amount</span>
                      {sortBy === 'amount' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-1"
                        >
                          {sortOrder === 'asc' ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )}
                        </motion.div>
                      )}
                    </Button>

                    {/* Description Sort Button */}
                    <Button
                      variant={sortBy === 'description' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleSort('description')}
                      className={`
                        min-w-[44px] h-11 px-4 rounded-xl transition-all duration-200
                        ${sortBy === 'description' 
                          ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }
                      `}
                      style={{ minHeight: '44px' }} // Ensure 44px touch target
                    >
                      <span className="font-medium">Name</span>
                      {sortBy === 'description' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-1"
                        >
                          {sortOrder === 'asc' ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )}
                        </motion.div>
                      )}
                    </Button>
                  </div>
                  
                  {/* Sort Direction Indicator */}
                  <div className="mt-3 flex items-center justify-center">
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}
                        {sortBy === 'amount' && (sortOrder === 'asc' ? ' (Low to High)' : ' (High to Low)')}
                        {sortBy === 'description' && (sortOrder === 'asc' ? ' (A-Z)' : ' (Z-A)')}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Sort Controls - Only show when expenses are loaded */}
          {!loading && expenses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticky top-32 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-30 rounded-2xl p-4 mx-1 mb-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sort expenses
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {sortBy === 'expense_date' && 'Date'}
                  {sortBy === 'amount' && 'Amount'}
                  {sortBy === 'description' && 'Name'}
                  {' • '}
                  {sortBy === 'expense_date' && (sortOrder === 'asc' ? 'Oldest first' : 'Newest first')}
                  {sortBy === 'amount' && (sortOrder === 'asc' ? 'Lowest first' : 'Highest first')}
                  {sortBy === 'description' && (sortOrder === 'asc' ? 'A → Z' : 'Z → A')}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Date Sort Button */}
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  <Button
                    variant={sortBy === 'expense_date' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleSort('expense_date')}
                    className="flex items-center gap-2 h-11 px-4 rounded-xl min-w-[88px] touch-manipulation"
                    style={{ minHeight: '44px', minWidth: '44px' }} // iOS guidelines
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">Date</span>
                    {sortBy === 'expense_date' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {sortOrder === 'asc' ? 
                          <ArrowUp className="h-3 w-3" /> : 
                          <ArrowDown className="h-3 w-3" />
                        }
                      </motion.div>
                    )}
                  </Button>
                </motion.div>

                {/* Amount Sort Button */}
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  <Button
                    variant={sortBy === 'amount' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleSort('amount')}
                    className="flex items-center gap-2 h-11 px-4 rounded-xl min-w-[100px] touch-manipulation"
                    style={{ minHeight: '44px', minWidth: '44px' }}
                  >
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm font-medium">Amount</span>
                    {sortBy === 'amount' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {sortOrder === 'asc' ? 
                          <ArrowUp className="h-3 w-3" /> : 
                          <ArrowDown className="h-3 w-3" />
                        }
                      </motion.div>
                    )}
                  </Button>
                </motion.div>

                {/* Name/Description Sort Button */}
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  <Button
                    variant={sortBy === 'description' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleSort('description')}
                    className="flex items-center gap-2 h-11 px-4 rounded-xl min-w-[88px] touch-manipulation"
                    style={{ minHeight: '44px', minWidth: '44px' }}
                  >
                    <span className="text-sm font-medium">Name</span>
                    {sortBy === 'description' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {sortOrder === 'asc' ? 
                          <ArrowUp className="h-3 w-3" /> : 
                          <ArrowDown className="h-3 w-3" />
                        }
                      </motion.div>
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Enhanced Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-5 mt-4"
        >
          <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 rounded-2xl">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <div className="font-medium mb-2">{error}</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchExpenses} 
                className="h-8 rounded-xl border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Enhanced Content - Optimized for native scrolling */}
      <div 
        className="px-5 pb-32"
        style={{
          // Native scrolling optimization for mobile
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain',
          // Prevent scroll chaining issues
          overscrollBehaviorY: 'contain'
        }}
      >
        {loading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 h-12 w-12 bg-blue-200 dark:bg-blue-800 rounded-full -z-10"
              />
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              Loading your expenses...
              <br />
              <span className="text-sm opacity-75">Preparing professional interface</span>
            </p>
          </motion.div>
        ) : expenses.length > 0 ? (
          <>
            {/* Enhanced Select All Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticky top-28 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-30 rounded-2xl p-4 mb-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    className="w-5 h-5 rounded-lg data-[state=checked]:bg-blue-600"
                  />
                  <div>
                    <span className="text-sm font-medium">
                      {isAllSelected ? 'Deselect All' : `Select All (${expenses.length})`}
                    </span>
                    {filterStats.currentPageExpenses !== filterStats.total && (
                      <div className="text-xs text-gray-500">
                        Page {currentPage} of {totalPages}
                      </div>
                    )}
                  </div>
                </div>
                
                {filterStats.selected > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      <Star className="w-3 h-3 mr-1" />
                      {filterStats.selected} selected
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkExport}
                      className="h-8 px-3 rounded-xl"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Enhanced Expense Cards with Virtual Scrolling */}
            <div 
              className="space-y-4" 
              ref={scrollContainerRef}
            >
              <AnimatePresence mode="popLayout">
                {expenses.map((expense, index) => (
                  <motion.div
                    key={expense.id}
                    ref={index === expenses.length - 1 ? lastExpenseElementRef : null}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ 
                      delay: Math.min(index * 0.03, 0.3), // Cap animation delay for performance
                      duration: 0.3,
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    }}
                  >
                    <ProfessionalMobileCard
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

            {/* Infinite Scroll Loading Indicator */}
            {isLoadingMore && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center py-8"
              >
                <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Loading more expenses...
                  </span>
                </div>
              </motion.div>
            )}

            {/* End of List Indicator */}
            {!hasMoreData && expenses.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      All expenses loaded
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {expenses.length} of {totalExpenses} expenses
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <Sparkles className="w-12 h-12 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              No expenses found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm leading-relaxed">
              {filterStats.hasFilters 
                ? "No expenses match your current filters. Try adjusting your search criteria."
                : "Start tracking your expenses by adding your first expense entry."
              }
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button 
                onClick={handleAddExpense}
                className="h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Add First Expense
              </Button>
              {filterStats.hasFilters && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedUser('all');
                  }}
                  className="h-12 rounded-2xl"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Enhanced Floating Action Button */}
      <EnhancedFloatingActionButton
        onAddExpense={handleAddExpense}
        onImportData={handleImportData}
        onViewAnalytics={handleViewAnalytics}
        onShowFilters={handleShowFilters}
        onBulkExport={handleBulkExport}
        isAdmin={isAdmin}
        selectedCount={filterStats.selected}
      />

      {/* Enhanced Modals */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Expense</DialogTitle>
            <DialogDescription>
              Update the details for this expense with enhanced controls.
            </DialogDescription>
          </DialogHeader>
          
          {editingExpense && (
            <ExpenseForm
              expense={editingExpense}
              onSuccess={() => {
                setEditModalOpen(false);
                setEditingExpense(null);
                fetchExpenses();
                triggerHaptic('success');
              }}
              onCancel={() => {
                setEditModalOpen(false);
                setEditingExpense(null);
                triggerHaptic('light');
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={addExpenseModalOpen} onOpenChange={setAddExpenseModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add New Expense</DialogTitle>
            <DialogDescription>
              Record a new expense with professional mobile interface.
            </DialogDescription>
          </DialogHeader>
          
          <ExpenseForm
            onSuccess={() => {
              setAddExpenseModalOpen(false);
              fetchExpenses();
              triggerHaptic('success');
            }}
            onCancel={() => {
              setAddExpenseModalOpen(false);
              triggerHaptic('light');
            }}
          />
        </DialogContent>
      </Dialog>
    </MobileGestureNavigation>
  );
};

export default EnhancedMobileExpenseList;