import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/SupabaseAuthContext';
import { useTimeRange } from '../context/TimeRangeContext';
import { formatCurrency } from '../utils/currency';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
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
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import {
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Tag,
  Edit,
  Trash2,
  MoreHorizontal,
  FileText,
  Copy,
  Loader2,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Grid,
  List,
  BarChart3,
  PieChart,
  TrendingUp,
  DollarSign,
  CreditCard,
  Target,
  Settings,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  SortAsc,
  SortDesc,
  Plus,
  Zap,
  Activity,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import ExpenseForm from './ExpenseForm';

// Modern Desktop Expense Card Component
const DesktopExpenseCard = ({ 
  expense, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  isAdmin, 
  deleteLoading,
  isCompact = false 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${
        isSelected 
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-lg' 
          : 'border-border bg-card hover:border-accent-foreground/20 hover:shadow-md'
      } ${isCompact ? 'p-4' : 'p-6'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Modern gradient background overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/80 to-primary" />
      )}

      <div className="relative z-10">
        {/* Header with checkbox and actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(expense.id, checked)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full ring-2 ring-background shadow-sm"
                style={{ backgroundColor: expense.category?.color || '#64748B' }}
              />
              <Badge variant="secondary" className="text-xs font-medium px-2 py-1">
                {expense.category?.name || 'Uncategorized'}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {new Date(expense.expense_date).toLocaleDateString()}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-8 w-8 p-0 transition-all duration-200 ${
                    isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(expense)} className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  Quick Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(expense)} className="cursor-pointer">
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate Entry
                </DropdownMenuItem>
                {expense.receipt_url && (
                  <DropdownMenuItem onClick={() => window.open(expense.receipt_url, '_blank')} className="cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" />
                    View Receipt
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive cursor-pointer">
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
                        {deleteLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Deleting...</> : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main content */}
        <div className="space-y-3">
          {/* Amount - prominent display */}
          <div className="text-right">
            <div className="text-2xl font-bold text-primary font-mono">
              {formatCurrency(expense.amount)}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-foreground text-lg leading-tight line-clamp-2">
              {expense.description}
            </h3>
          </div>

          {/* Additional details */}
          {(expense.notes || (isAdmin && expense.created_by_user)) && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              {expense.notes && (
                <div>
                  <p className="text-sm text-muted-foreground line-clamp-2" title={expense.notes}>
                    {expense.notes}
                  </p>
                </div>
              )}
              {isAdmin && expense.created_by_user && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{expense.created_by_user.full_name || 'Unknown User'}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hover effects */}
        <motion.div
          className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ transformOrigin: 'left' }}
        />
      </div>
    </motion.div>
  );
};

// Desktop Stats Widget
const StatsWidget = ({ title, value, change, icon: Icon, color = "blue" }) => {
  const colorClasses = {
    blue: 'from-blue-500/10 to-blue-600/10 border-blue-200 text-blue-600',
    green: 'from-green-500/10 to-green-600/10 border-green-200 text-green-600',
    orange: 'from-orange-500/10 to-orange-600/10 border-orange-200 text-orange-600',
    purple: 'from-purple-500/10 to-purple-600/10 border-purple-200 text-purple-600'
  };

  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color]} border-2`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <p className={`text-sm flex items-center gap-1 mt-1 ${
                change.startsWith('+') ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className="h-3 w-3" />
                {change}
              </p>
            )}
          </div>
          <Icon className={`h-8 w-8 ${colorClasses[color].split(' ')[2]}`} />
        </div>
      </CardContent>
    </Card>
  );
};

const DesktopDashboard = ({ selectedCategory: parentSelectedCategory }) => {
  const { apiCall, isAdmin, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data states
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [stats, setStats] = useState({
    totalAmount: 0,
    avgAmount: 0,
    expenseCount: 0,
    categoryCount: 0
  });
  
  // UI states
  const [viewMode, setViewMode] = useState('grid'); // grid, list, table
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedExpenses, setSelectedExpenses] = useState(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  
  // Filter states
  const { dateRange, handlePresetChange, handleDateRangeChange } = useTimeRange();
  const [selectedCategory, setSelectedCategory] = useState(parentSelectedCategory || 'all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('expense_date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch functions (similar to ExpenseViewer but optimized for desktop)
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
    if (!session || !dateRange.startDate || !dateRange.endDate) return;
    
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
      
      if (response && response.expenses) {
        setExpenses(response.expenses);
        const totalCount = response.pagination?.total || response.totalCount || response.expenses.length;
        setTotalExpenses(totalCount);
        setTotalPages(Math.ceil(totalCount / pageSize));
        
        // Calculate stats
        const totalAmount = response.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
        setStats({
          totalAmount,
          avgAmount: response.expenses.length > 0 ? totalAmount / response.expenses.length : 0,
          expenseCount: response.expenses.length,
          categoryCount: new Set(response.expenses.map(exp => exp.category_id)).size
        });
      }
    } catch (err) {
      setError('Failed to fetch expenses: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [apiCall, currentPage, pageSize, dateRange, selectedCategory, selectedUser, searchTerm, sortBy, sortOrder, isAdmin, session]);

  // Initialize data
  useEffect(() => {
    fetchCategories();
    if (isAdmin) fetchUsers();
  }, [fetchCategories, fetchUsers, isAdmin]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Expense management functions
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

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setEditModalOpen(true);
  };

  const handleDeleteExpense = async (expenseId) => {
    setDeleteLoading(true);
    try {
      await apiCall(`/expenses/${expenseId}`, { method: 'DELETE' });
      const newSelected = new Set(selectedExpenses);
      newSelected.delete(expenseId);
      setSelectedExpenses(newSelected);
      await fetchExpenses();
    } catch (err) {
      setError('Failed to delete expense: ' + err.message);
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
        expense_date: new Date().toISOString().split('T')[0],
        receipt_url: expense.receipt_url || '',
        notes: expense.notes || ''
      };
      
      await apiCall('/expenses', {
        method: 'POST',
        body: duplicateData
      });
      
      fetchExpenses();
    } catch (err) {
      setError('Failed to duplicate expense: ' + err.message);
    }
  };

  const renderExpenseGrid = () => {
    const gridCols = isCompactMode ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' 
                                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    
    return (
      <div className={`grid ${gridCols} gap-4`}>
        {expenses.map((expense) => (
          <DesktopExpenseCard
            key={expense.id}
            expense={expense}
            isSelected={selectedExpenses.has(expense.id)}
            onSelect={handleSelectExpense}
            onEdit={handleEditExpense}
            onDelete={handleDeleteExpense}
            onDuplicate={handleDuplicateExpense}
            isAdmin={isAdmin}
            deleteLoading={deleteLoading}
            isCompact={isCompactMode}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading desktop dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      {/* Desktop Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-border/50 overflow-hidden"
          >
            <div className="p-6 h-full overflow-y-auto">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Expense Insights</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <Minimize className="h-4 w-4" />
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="space-y-4 mb-6">
                <StatsWidget
                  title="Total Spent"
                  value={formatCurrency(stats.totalAmount)}
                  change="+12.5%"
                  icon={DollarSign}
                  color="blue"
                />
                <StatsWidget
                  title="Average"
                  value={formatCurrency(stats.avgAmount)}
                  icon={Target}
                  color="green"
                />
                <StatsWidget
                  title="Expenses"
                  value={stats.expenseCount.toString()}
                  icon={CreditCard}
                  color="orange"
                />
                <StatsWidget
                  title="Categories"
                  value={stats.categoryCount.toString()}
                  icon={Tag}
                  color="purple"
                />
              </div>

              {/* Quick Filters */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Quick Filters</h3>
                
                <div>
                  <Label htmlFor="sidebar-category" className="text-sm font-medium mb-2">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full">
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

                {isAdmin && (
                  <div>
                    <Label htmlFor="sidebar-user" className="text-sm font-medium mb-2">User</Label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger className="w-full">
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
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop Toolbar */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-border/50 p-4">
          <div className="flex items-center justify-between">
            {/* Left section */}
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Maximize className="h-4 w-4" />
                  Show Insights
                </Button>
              )}
              
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">Expenses</h1>
                <Badge variant="secondary">{totalExpenses} total</Badge>
                {selectedExpenses.size > 0 && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    {selectedExpenses.size} selected
                  </Badge>
                )}
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-lg p-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-7 w-7 p-0"
                >
                  <Grid className="h-3 w-3" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-7 w-7 p-0"
                >
                  <List className="h-3 w-3" />
                </Button>
              </div>

              {/* Compact Mode Toggle */}
              <Button
                variant={isCompactMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsCompactMode(!isCompactMode)}
                className="flex items-center gap-2"
              >
                {isCompactMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                Compact
              </Button>

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setSortBy('expense_date')}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Date {sortBy === 'expense_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('amount')}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('description')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Description {sortBy === 'description' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Actions */}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchExpenses}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedExpenses.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="font-medium">{selectedExpenses.size} expense{selectedExpenses.size !== 1 ? 's' : ''} selected</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Selected
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedExpenses(new Set());
                    setIsAllSelected(false);
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          )}

          {/* Multi-select header */}
          {expenses.length > 0 && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="text-sm font-medium text-muted-foreground">
                  Select all visible ({expenses.length})
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}

          {/* Expense Grid */}
          {expenses.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {renderExpenseGrid()}
            </AnimatePresence>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No expenses found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search criteria to find what you're looking for.
                </p>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DesktopDashboard;