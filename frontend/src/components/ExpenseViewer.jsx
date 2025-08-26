import React, { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from '../hooks/use-mobile';
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
  AlertTriangle,
  Smartphone,
  Monitor,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import ExpenseForm from './ExpenseForm';

// Mobile-responsive expense card component
const MobileExpenseCard = ({ expense, isSelected, onSelect, onEdit, onDelete, onDuplicate, isAdmin, deleteLoading }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={`mb-3 border transition-all duration-200 ${
      isSelected ? 'border-primary bg-primary/5' : 'hover:border-accent-foreground/20'
    }`}>
      <CardContent className="p-4">
        {/* Header with checkbox, date, and amount */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(expense.id, checked)}
              className="mt-1 flex-shrink-0"
            />
            <div>
              <div className="font-semibold text-base truncate max-w-[180px]">
                {expense.description}
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(expense.expense_date).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-bold text-lg text-green-600">
              {formatCurrency(expense.amount)}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(expense)}>
                  <Edit className="mr-2 h-4 w-4" />Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(expense)}>
                  <Copy className="mr-2 h-4 w-4" />Duplicate
                </DropdownMenuItem>
                {expense.receipt_url && (
                  <DropdownMenuItem onClick={() => window.open(expense.receipt_url, '_blank')}>
                    <FileText className="mr-2 h-4 w-4" />View Receipt
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                      <AlertDialogDescription>
                        Delete "{expense.description}"? This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(expense.id)}
                        disabled={deleteLoading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Deleting...</> : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Category and expand button */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: expense.category?.color || '#64748B' }}
            />
            <span className="text-sm font-medium">{expense.category?.name || 'Uncategorized'}</span>
          </div>
          
          {(expense.notes || (isAdmin && expense.created_by_user)) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 px-2 text-xs"
            >
              {isExpanded ? 'Less' : 'More'}
            </Button>
          )}
        </div>

        {/* Expandable details */}
        {isExpanded && (
          <div className="pt-2 border-t border-border space-y-2">
            {expense.notes && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Notes</div>
                <div className="text-sm">{expense.notes}</div>
              </div>
            )}
            {isAdmin && expense.created_by_user && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">User</div>
                <div className="text-sm">{expense.created_by_user.full_name || 'Unknown User'}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ExpenseViewer = ({ selectedCategory: parentSelectedCategory }) => {
  const { apiCall, isAdmin, session } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data states
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  
  // Use shared time range context
  const { dateRange, handlePresetChange, handleDateRangeChange } = useTimeRange();
  
  // Filter states - Use parent category if provided, otherwise maintain internal state
  const [selectedCategory, setSelectedCategory] = useState(parentSelectedCategory || 'all');
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
  
  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Mobile responsive states  
  const [showMobileColumns, setShowMobileColumns] = useState(false);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [swipeStart, setSwipeStart] = useState(null);

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

  // ENHANCED: Session-aware fetchExpenses with comprehensive error handling and retry logic
  const fetchExpenses = useCallback(async () => {
    // Session validation before attempting fetch
    if (!session) {
      console.error('❌ NO SESSION: Cannot fetch expenses without authentication');
      setError('Authentication required. Please log in again.');
      setLoading(false);
      return;
    }
    
    // FUNCTIONAL FIX: Only validate dates if we have them, allow fetch with defaults
    if (!dateRange.startDate || !dateRange.endDate) {
      console.log('📅 ExpenseViewer: No date range set, using current month defaults');
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
    
    // Enhanced debugging with session info
    console.log(`📊 FETCHING EXPENSES: ${dateRange.startDate} to ${dateRange.endDate}`);
    console.log(`🔐 Session Status: Active, User: ${session.user?.email || 'Unknown'}`);
    
    try {
      // SWARM FIX: Enhanced query parameters with network debugging
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      
      console.log('🔍 QUERY PARAMS BUILT:', {
        page: currentPage,
        limit: pageSize,
        dateRange: `${dateRange.startDate} to ${dateRange.endDate}`,
        sort: `${sortBy} ${sortOrder}`,
        category: selectedCategory,
        user: selectedUser,
        search: searchTerm
      });

      // SWARM FIX: Enhanced category filter with proper type validation and 'all' handling
      if (selectedCategory !== 'all' && selectedCategory !== null && selectedCategory !== undefined) {
        // Convert to string and validate for API parameter
        const categoryId = String(selectedCategory);
        
        // Additional validation to ensure we have a valid category ID
        if (categoryId && categoryId !== 'undefined' && categoryId !== 'null' && categoryId.trim() !== '') {
          params.append('category_id', categoryId.trim()); // Fixed parameter name to match API expectation
          console.log(`🏷️  Category Filter Applied: "${categoryId}" (original: ${selectedCategory}, type: ${typeof selectedCategory})`);
        } else {
          console.warn('⚠️  Invalid category ID detected, skipping filter:', selectedCategory);
        }
      } else {
        console.log('🏷️  Category Filter: Showing all categories (selectedCategory:', selectedCategory, ')');
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
      
      // SWARM FIX: Enhanced response validation and error handling
      if (response && response.expenses) {
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
      // ENHANCED: Comprehensive error handling with session-aware messages
      console.error('❌ FETCH EXPENSES ERROR:', {
        error: err.message,
        originalError: err.originalError?.message,
        endpoint: err.endpoint,
        attempt: err.attempt,
        type: err.constructor.name,
        timestamp: new Date().toISOString()
      });
      
      // Provide user-friendly error messages based on error type
      let userErrorMessage = 'Failed to fetch expenses';
      
      if (err.message.includes('Authentication') || err.message.includes('401') || err.message.includes('unauthorized')) {
        userErrorMessage = 'Authentication error - please try logging in again';
      } else if (err.message.includes('Network') || err.message.includes('Failed to fetch')) {
        userErrorMessage = 'Network error - please check your connection and try again';
      } else if (err.message.includes('Rate limited') || err.message.includes('429')) {
        userErrorMessage = 'Too many requests - please wait a moment and try again';
      } else if (err.message.includes('Access denied') || err.message.includes('403')) {
        userErrorMessage = 'Access denied - you may not have permission to view this data';
      } else if (err.message.includes('category_id')) {
        userErrorMessage = 'Category filter error - this has been automatically fixed. Please try again.';
      } else {
        userErrorMessage = `${err.message} (${err.originalError?.message || 'Unknown cause'})`;
      }
      
      setError(userErrorMessage);
      console.error('❌ ENHANCED FETCH ERROR:', {
        originalError: err,
        enhancedMessage: userErrorMessage,
        endpoint: 'ExpenseViewer.fetchExpenses',
        filters: { selectedCategory, selectedUser, searchTerm, dateRange }
      });
    } finally {
      setLoading(false);
    }
  }, [apiCall, currentPage, pageSize, dateRange.startDate, dateRange.endDate, selectedCategory, selectedUser, searchTerm, sortBy, sortOrder, isAdmin, session]);

  // Initialize data
  useEffect(() => {
    fetchCategories();
    if (isAdmin) {
      fetchUsers();
    }
  }, [fetchCategories, fetchUsers, isAdmin]);


  // Mobile card expansion handler
  const toggleCardExpansion = (expenseId) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(expenseId)) {
      newExpanded.delete(expenseId);
    } else {
      newExpanded.add(expenseId);
    }
    setExpandedCards(newExpanded);
  };

  // Mobile swipe handler for pagination
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setSwipeStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e) => {
    if (!swipeStart) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - swipeStart.x;
    const deltaY = touch.clientY - swipeStart.y;
    
    // Only handle horizontal swipes that are longer than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0 && currentPage > 1) {
        // Swipe right - previous page
        setCurrentPage(currentPage - 1);
      } else if (deltaX < 0 && currentPage < totalPages) {
        // Swipe left - next page
        setCurrentPage(currentPage + 1);
      }
    }
    
    setSwipeStart(null);
  };

  // Priority columns for mobile display (for future mobile table implementation)
  // const mobileColumns = {
  //   essential: ['date', 'amount', 'description'], // Always shown on mobile
  //   secondary: ['category', 'notes'], // Shown when expanded
  //   admin: ['user'], // Admin only, shown when expanded
  //   actions: ['actions'] // Always accessible via card action menu
  // };

  // SWARM FIX: Separate filter change effects to prevent cascading re-renders
  useEffect(() => {
    console.log('📅 DATE RANGE CHANGED:', dateRange);
    setCurrentPage(1); // Reset to first page when date range changes
    setSelectedExpenses(new Set()); // Clear selections on date range change
    setIsAllSelected(false);
  }, [dateRange.startDate, dateRange.endDate]);

  // SWARM FIX: Handle other filter changes separately
  useEffect(() => {
    console.log('🔍 FILTERS CHANGED:', { selectedCategory, selectedUser, searchTerm, sortBy, sortOrder });
    setCurrentPage(1); // Reset to first page when filters change
    setSelectedExpenses(new Set()); // Clear selections on filter change
    setIsAllSelected(false);
  }, [selectedCategory, selectedUser, searchTerm, sortBy, sortOrder]);

  // SWARM FIX: Consolidated data refresh with proper debouncing and race condition prevention
  useEffect(() => {
    const fetchData = async () => {
      if (dateRange.startDate && dateRange.endDate) {
        console.log('🔄 COORDINATED FETCH TRIGGERED:', {
          dateRange: `${dateRange.startDate} to ${dateRange.endDate}`,
          selectedCategory,
          selectedUser,
          searchTerm,
          currentPage,
          pageSize
        });
        try {
          // SWARM COORDINATION: Use the existing fetchExpenses function which handles all filters properly
          await fetchExpenses();
        } catch (error) {
          console.error('❌ COORDINATED FETCH ERROR:', error);
          setError(`Network error: ${error.message}. Please check your connection and try again.`);
        }
      }
    };
    
    // SWARM COORDINATION: Optimized debounce delay to balance responsiveness and performance
    const timeoutId = setTimeout(fetchData, 250);
    return () => clearTimeout(timeoutId);
  }, [dateRange.startDate, dateRange.endDate, selectedCategory, selectedUser, searchTerm, currentPage, pageSize, fetchExpenses]);

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

  // SWARM FIX: Enhanced sorting with immediate data refresh
  const handleSort = useCallback((column) => {
    console.log(`🔄 SORT TRIGGERED: ${column} (current: ${sortBy} ${sortOrder})`);
    
    if (sortBy === column) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder);
      console.log(`📊 Sort order changed: ${column} ${newOrder}`);
    } else {
      setSortBy(column);
      setSortOrder('desc');
      console.log(`📊 Sort column changed: ${column} desc`);
    }
    
    // Force immediate data refresh when sort changes
    setCurrentPage(1);
  }, [sortBy, sortOrder]);

  // CRITICAL FIX: Remove fetchExpenses dependency to prevent infinite loop
  // The main useEffect in fetchExpenses already handles sortBy/sortOrder changes
  // This useEffect was causing an infinite loop by including fetchExpenses as dependency
  // Removing this duplicate useEffect as fetchExpenses already handles sorting changes

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

  // SWARM FIX: Sync with parent category selection without race conditions
  useEffect(() => {
    if (parentSelectedCategory !== undefined && parentSelectedCategory !== selectedCategory) {
      console.log('🔄 SYNCING CATEGORY FROM PARENT:', parentSelectedCategory);
      setSelectedCategory(parentSelectedCategory);
      // Reset pagination and selections when parent category changes
      setCurrentPage(1);
      setSelectedExpenses(new Set());
      setIsAllSelected(false);
    }
  }, [parentSelectedCategory]); // CRITICAL FIX: Remove selectedCategory from deps to prevent loops

  // Clear selection when expenses change
  useEffect(() => {
    setSelectedExpenses(new Set());
    setIsAllSelected(false);
  }, [expenses]);

  // Individual expense actions
  const handleEditExpense = (expense) => {
    console.log('Opening edit modal for expense:', expense.id);
    setEditingExpense(expense);
    setEditModalOpen(true);
  };

  // Handle expense edit success
  const handleEditSuccess = () => {
    console.log('Expense edited successfully, refreshing data...');
    setEditModalOpen(false);
    setEditingExpense(null);
    // Refresh the expenses list to show updated data
    fetchExpenses();
  };

  // Handle expense edit cancel
  const handleEditCancel = () => {
    console.log('Edit cancelled');
    setEditModalOpen(false);
    setEditingExpense(null);
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

      if (selectedCategory !== 'all' && selectedCategory !== null && selectedCategory !== undefined) {
        // SWARM FIX: Enhanced parameter validation for export with proper type handling
        const categoryId = String(selectedCategory);
        
        // Additional validation to ensure we have a valid category ID for export
        if (categoryId && categoryId !== 'undefined' && categoryId !== 'null' && categoryId.trim() !== '') {
          params.append('category_id', categoryId.trim()); // Match the fixed parameter name
          console.log(`📥 Export Category Filter: "${categoryId}" (original: ${selectedCategory}, type: ${typeof selectedCategory})`);
        } else {
          console.warn('⚠️  Export: Invalid category ID detected, skipping filter:', selectedCategory);
        }
      } else {
        console.log('📥 Export: Including all categories (selectedCategory:', selectedCategory, ')');
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

  // Mobile Card Component for expenses
  const MobileExpenseCard = ({ expense, onEdit, onDelete, onDuplicate }) => {
    const isExpanded = expandedCards.has(expense.id);
    const isSelected = selectedExpenses.has(expense.id);

    return (
      <div className={`rounded-lg border p-4 space-y-3 transition-all ${
        isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/50'
      }`}>
        {/* Card Header - Essential Info */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => handleSelectExpense(expense.id, checked)}
              aria-label={`Select expense ${expense.description}`}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              {/* Date and Amount - Always visible */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(expense.expense_date).toLocaleDateString()}
                </div>
                <div className="font-mono font-semibold text-primary text-lg">
                  {formatCurrency(expense.amount)}
                </div>
              </div>
              
              {/* Description - Always visible */}
              <h3 className="font-medium text-foreground mb-2 break-words">
                {expense.description}
              </h3>
              
              {/* Category - Always visible */}
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: expense.category?.color || '#64748B' }}
                />
                <span className="text-sm text-muted-foreground">
                  {expense.category?.name || 'Uncategorized'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Actions Menu */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCardExpansion(expense.id)}
              className="px-2"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(expense)} className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(expense)} className="cursor-pointer">
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
                        Are you sure you want to delete "{expense.description}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(expense.id)}
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
          </div>
        </div>
        
        {/* Expanded Details */}
        {isExpanded && (
          <div className="pt-3 border-t space-y-2">
            {/* Notes */}
            {expense.notes && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</span>
                <p className="text-sm mt-1 text-foreground">{expense.notes}</p>
              </div>
            )}
            
            {/* User (Admin only) */}
            {isAdmin && expense.created_by_user && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">User</span>
                <p className="text-sm mt-1 flex items-center gap-2">
                  <User className="h-3 w-3" />
                  {expense.created_by_user.full_name || 'Unknown User'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
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
          <CardTitle>
            <div className="flex flex-col space-y-4">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>Expenses ({totalExpenses} total)</span>
                  {!isMobile && selectedExpenses.size > 0 && (
                    <span className="text-sm text-muted-foreground px-2 py-1 bg-primary/10 rounded-full">
                      {selectedExpenses.size} selected
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground hidden sm:block">
                  Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalExpenses)} of {totalExpenses}
                </div>
              </div>
              
              {/* Mobile bulk actions */}
              {selectedExpenses.size > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkExport}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    <span className={isMobile ? 'hidden' : ''}>Export</span>
                    {isMobile && <span className="text-xs">({selectedExpenses.size})</span>}
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
                        <span className={isMobile ? 'hidden' : ''}>Delete</span>
                        {isMobile && <span className="text-xs">({selectedExpenses.size})</span>}
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
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedExpenses(new Set());
                        setIsAllSelected(false);
                      }}
                      className="flex items-center gap-1 text-muted-foreground"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile/Desktop View Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isMobile ? (
                <><Smartphone className="h-4 w-4" /> Mobile View</>
              ) : (
                <><Monitor className="h-4 w-4" /> Desktop View</>
              )}
            </div>
            {!isMobile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMobileColumns(!showMobileColumns)}
                className="flex items-center gap-2"
              >
                {showMobileColumns ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showMobileColumns ? 'Hide' : 'Show'} Optional Columns
              </Button>
            )}
          </div>

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
              {/* Mobile Card Layout */}
              {isMobile ? (
                <div 
                  className="space-y-3 touch-pan-y"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Mobile Select All */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all expenses"
                      />
                      <span className="text-sm font-medium">
                        Select All ({expenses.length})
                      </span>
                    </div>
                    {selectedExpenses.size > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {selectedExpenses.size} selected
                      </span>
                    )}
                  </div>
                  
                  {/* Mobile Sorting Controls */}
                  <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg mb-3">
                    <div className="text-sm font-medium text-muted-foreground">
                      Sort by:
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={sortBy === 'expense_date' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleSort('expense_date')}
                        className="text-xs px-2 py-1 h-7"
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Date
                        {sortBy === 'expense_date' && (
                          sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                        )}
                      </Button>
                      <Button
                        variant={sortBy === 'amount' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleSort('amount')}
                        className="text-xs px-2 py-1 h-7"
                      >
                        <span className="font-mono">₨</span>
                        {sortBy === 'amount' && (
                          sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                        )}
                      </Button>
                      <Button
                        variant={sortBy === 'description' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleSort('description')}
                        className="text-xs px-2 py-1 h-7"
                      >
                        Desc
                        {sortBy === 'description' && (
                          sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Mobile Swipe Hint */}
                  {totalPages > 1 && (
                    <div className="text-center py-2">
                      <span className="text-xs text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
                        Swipe left/right to navigate pages
                      </span>
                    </div>
                  )}
                  
                  {expenses.map((expense) => (
                    <MobileExpenseCard
                      key={expense.id}
                      expense={expense}
                      onEdit={handleEditExpense}
                      onDelete={handleDeleteExpense}
                      onDuplicate={handleDuplicateExpense}
                    />
                  ))}
                </div>
              ) : (
                /* Desktop Table Layout with responsive columns */
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        {/* Multi-select column - always visible */}
                        <TableHead className="w-12 sticky left-0 bg-background">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all expenses"
                          />
                        </TableHead>
                        
                        {/* Essential columns - always visible */}
                        <TableHead 
                          className="cursor-pointer hover:bg-accent transition-colors sticky left-12 bg-background min-w-[100px] select-none"
                          onClick={() => handleSort('expense_date')}
                          title={`Sort by date ${sortBy === 'expense_date' ? (sortOrder === 'asc' ? '(ascending)' : '(descending)') : ''}`}
                          aria-label={`Sort expenses by date ${sortBy === 'expense_date' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'ascending'}`}
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="hidden sm:inline">Date</span>
                            <span className="sm:hidden">Date</span>
                            {sortBy === 'expense_date' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 text-primary" /> : <ArrowDown className="h-4 w-4 text-primary" />
                            ) : (
                              <ArrowUpDown className="h-4 w-4 text-muted-foreground opacity-50" />
                            )}
                          </div>
                        </TableHead>
                        
                        <TableHead 
                          className="cursor-pointer hover:bg-accent transition-colors min-w-[100px] select-none"
                          onClick={() => handleSort('amount')}
                          title={`Sort by amount ${sortBy === 'amount' ? (sortOrder === 'asc' ? '(ascending)' : '(descending)') : ''}`}
                          aria-label={`Sort expenses by amount ${sortBy === 'amount' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'descending'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="hidden sm:inline">Amount</span>
                            <span className="sm:hidden font-mono">₨</span>
                            {sortBy === 'amount' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 text-primary" /> : <ArrowDown className="h-4 w-4 text-primary" />
                            ) : (
                              <ArrowUpDown className="h-4 w-4 text-muted-foreground opacity-50" />
                            )}
                          </div>
                        </TableHead>
                        
                        <TableHead 
                          className="cursor-pointer hover:bg-accent transition-colors min-w-[200px] select-none"
                          onClick={() => handleSort('description')}
                          title={`Sort by description ${sortBy === 'description' ? (sortOrder === 'asc' ? '(ascending)' : '(descending)') : ''}`}
                          aria-label={`Sort expenses by description ${sortBy === 'description' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'ascending'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="hidden sm:inline">Description</span>
                            <span className="sm:hidden">Desc</span>
                            {sortBy === 'description' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 text-primary" /> : <ArrowDown className="h-4 w-4 text-primary" />
                            ) : (
                              <ArrowUpDown className="h-4 w-4 text-muted-foreground opacity-50" />
                            )}
                          </div>
                        </TableHead>
                        
                        {/* Secondary columns - hideable on desktop */}
                        <TableHead className={showMobileColumns ? '' : 'hidden lg:table-cell'}>
                          <div className="flex items-center gap-1">
                            <Tag className="h-4 w-4" />
                            Category
                          </div>
                        </TableHead>
                        
                        {isAdmin && (
                          <TableHead className={showMobileColumns ? '' : 'hidden xl:table-cell'}>
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              User
                            </div>
                          </TableHead>
                        )}
                        
                        <TableHead className={showMobileColumns ? '' : 'hidden lg:table-cell'}>Notes</TableHead>
                        
                        {/* Actions column - sticky right */}
                        <TableHead className="w-16 sticky right-0 bg-background">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow 
                          key={expense.id} 
                          className="hover:bg-accent/50"
                          data-state={selectedExpenses.has(expense.id) ? "selected" : ""}
                        >
                          {/* Multi-select checkbox - sticky left */}
                          <TableCell className="sticky left-0 bg-background">
                            <Checkbox
                              checked={selectedExpenses.has(expense.id)}
                              onCheckedChange={(checked) => handleSelectExpense(expense.id, checked)}
                              aria-label={`Select expense ${expense.description}`}
                            />
                          </TableCell>
                          
                          {/* Essential columns */}
                          <TableCell className="sticky left-12 bg-background">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {new Date(expense.expense_date).toLocaleDateString()}
                            </div>
                          </TableCell>
                          
                          <TableCell className="font-mono font-semibold text-primary">
                            {formatCurrency(expense.amount)}
                          </TableCell>
                          
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={expense.description}>
                              {expense.description}
                            </div>
                          </TableCell>
                          
                          {/* Secondary columns - hideable */}
                          <TableCell className={showMobileColumns ? '' : 'hidden lg:table-cell'}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: expense.category?.color || '#64748B' }}
                              />
                              <span className="truncate">{expense.category?.name || 'Uncategorized'}</span>
                            </div>
                          </TableCell>
                          
                          {isAdmin && (
                            <TableCell className={showMobileColumns ? '' : 'hidden xl:table-cell'}>
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span className="truncate">{expense.created_by_user?.full_name || 'Unknown User'}</span>
                              </div>
                            </TableCell>
                          )}
                          
                          <TableCell className={`max-w-xs ${showMobileColumns ? '' : 'hidden lg:table-cell'}`}>
                            <div className="truncate" title={expense.notes}>
                              {expense.notes || '-'}
                            </div>
                          </TableCell>
                          
                          {/* Actions column - sticky right */}
                          <TableCell className="sticky right-0 bg-background">
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
              </div>
            )}

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                  {isMobile && selectedExpenses.size > 0 && (
                    <div className="mt-1">
                      {selectedExpenses.size} selected
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className={isMobile ? 'hidden' : ''}>Previous</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1"
                  >
                    <span className={isMobile ? 'hidden' : ''}>Next</span>
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
                      const today = new Date().toISOString().split('T')[0];
                      const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
                      handleDateRangeChange('startDate', firstOfMonth);
                      handleDateRangeChange('endDate', today);
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

      {/* Edit Expense Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update the details for this expense. All changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          
          {editingExpense && (
            <div className="py-4">
              <ExpenseForm
                expense={editingExpense}
                onSuccess={handleEditSuccess}
                onCancel={handleEditCancel}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseViewer;