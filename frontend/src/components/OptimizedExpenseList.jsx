import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
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
  DialogTrigger,
} from './ui/dialog';
import { 
  Edit, 
  Trash2, 
  Filter, 
  Calendar,
  DollarSign,
  User,
  Tag,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import ExpenseForm from './ExpenseForm';

// Custom hook for debounced values
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Memoized table row component
const ExpenseRow = React.memo(({ expense, isAdmin, onEdit, onDelete, formatCurrency, formatDate }) => (
  <TableRow key={expense.id}>
    <TableCell>
      <div className="flex items-center">
        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
        {formatDate(expense.expense_date)}
      </div>
    </TableCell>
    <TableCell>
      <div className="flex items-center font-medium">
        <DollarSign className="h-4 w-4 text-green-600 mr-1" />
        {formatCurrency(expense.amount)}
      </div>
    </TableCell>
    <TableCell>
      <div className="max-w-xs truncate" title={expense.description}>
        {expense.description}
      </div>
      {expense.notes && (
        <div className="text-sm text-gray-500 max-w-xs truncate" title={expense.notes}>
          {expense.notes}
        </div>
      )}
    </TableCell>
    <TableCell>
      {expense.category && (
        <Badge 
          variant="secondary" 
          style={{ backgroundColor: `${expense.category.color}20`, color: expense.category.color }}
        >
          <Tag className="h-3 w-3 mr-1" />
          {expense.category.name}
        </Badge>
      )}
    </TableCell>
    {isAdmin && (
      <TableCell>
        <div className="flex items-center">
          <User className="h-4 w-4 text-gray-400 mr-2" />
          {expense.created_by_user?.full_name || 'Unknown'}
        </div>
      </TableCell>
    )}
    <TableCell>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(expense)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(expense.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </TableCell>
  </TableRow>
));

ExpenseRow.displayName = 'ExpenseRow';

const OptimizedExpenseList = () => {
  const { apiCall, isAdmin, isAccountOfficer } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingExpense, setEditingExpense] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoized formatting functions
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Fetch expenses with pagination and search
  const fetchExpenses = useCallback(async (filters = {}, page = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      
      // Add pagination
      queryParams.append('page', page.toString());
      queryParams.append('limit', itemsPerPage.toString());
      
      // Add search
      if (filters.search || debouncedSearchTerm) {
        queryParams.append('search', filters.search || debouncedSearchTerm);
      }
      
      // Add filters
      if (filters.date || dateFilter) {
        queryParams.append('date', filters.date || dateFilter);
      }
      if (filters.start_date || startDateFilter) {
        queryParams.append('start_date', filters.start_date || startDateFilter);
      }
      if (filters.end_date || endDateFilter) {
        queryParams.append('end_date', filters.end_date || endDateFilter);
      }
      if (filters.category_id || categoryFilter) {
        queryParams.append('category_id', filters.category_id || categoryFilter);
      }

      const queryString = queryParams.toString();
      const endpoint = `/expenses${queryString ? `?${queryString}` : ''}`;
      
      const data = await apiCall(endpoint);
      setExpenses(data.expenses || []);
      setTotalItems(data.total || 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiCall, debouncedSearchTerm, dateFilter, startDateFilter, endDateFilter, categoryFilter, itemsPerPage]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const data = await apiCall('/categories');
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, [apiCall]);

  // Initial data fetch
  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, [fetchExpenses, fetchCategories]);

  // Refetch when search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setCurrentPage(1);
      fetchExpenses({}, 1);
    }
  }, [debouncedSearchTerm, fetchExpenses]);

  // Handle delete
  const handleDelete = useCallback(async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await apiCall(`/expenses/${expenseId}`, { method: 'DELETE' });
      fetchExpenses({}, currentPage);
    } catch (err) {
      setError(err.message);
    }
  }, [apiCall, fetchExpenses, currentPage]);

  // Handle edit
  const handleEdit = useCallback((expense) => {
    setEditingExpense(expense);
    setShowEditDialog(true);
  }, []);

  const handleEditSuccess = useCallback(() => {
    setShowEditDialog(false);
    setEditingExpense(null);
    fetchExpenses({}, currentPage);
  }, [fetchExpenses, currentPage]);

  // Apply filters
  const applyFilters = useCallback(() => {
    setCurrentPage(1);
    fetchExpenses({}, 1);
  }, [fetchExpenses]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setDateFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setCategoryFilter('');
    setCurrentPage(1);
    fetchExpenses({}, 1);
  }, [fetchExpenses]);

  // Pagination calculations
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchExpenses({}, newPage);
    }
  }, [fetchExpenses, totalPages]);

  // Memoized pagination info
  const paginationInfo = useMemo(() => ({
    currentPage,
    totalPages,
    startItem,
    endItem,
    totalItems,
    showPagination: totalPages > 1
  }), [currentPage, totalPages, startItem, endItem, totalItems]);

  if (loading && expenses.length === 0) {
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

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Search & Filters</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search expenses by description, notes, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {isAccountOfficer && (
                <div className="space-y-2">
                  <Label htmlFor="date-filter">Specific Date</Label>
                  <Input
                    id="date-filter"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>
              )}

              {isAdmin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="start-date-filter">Start Date</Label>
                    <Input
                      id="start-date-filter"
                      type="date"
                      value={startDateFilter}
                      onChange={(e) => setStartDateFilter(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-date-filter">End Date</Label>
                    <Input
                      id="end-date-filter"
                      type="date"
                      value={endDateFilter}
                      onChange={(e) => setEndDateFilter(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="category-filter">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end space-x-2">
                <Button onClick={applyFilters} disabled={loading}>
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={clearFilters} disabled={loading}>
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Expenses</span>
            {paginationInfo.showPagination && (
              <div className="text-sm text-gray-500">
                Showing {paginationInfo.startItem} to {paginationInfo.endItem} of {paginationInfo.totalItems} expenses
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          )}

          {!loading && expenses.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
              <p className="text-gray-500">
                {searchTerm || dateFilter || startDateFilter || endDateFilter || categoryFilter
                  ? "No expenses match your search criteria. Try adjusting your filters."
                  : isAccountOfficer 
                    ? "You haven't recorded any expenses yet."
                    : "No expenses have been recorded yet."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      {isAdmin && <TableHead>Created By</TableHead>}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <ExpenseRow
                        key={expense.id}
                        expense={expense}
                        isAdmin={isAdmin}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {paginationInfo.showPagination && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {paginationInfo.startItem} to {paginationInfo.endItem} of {paginationInfo.totalItems} expenses
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i));
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            disabled={loading}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update the expense details below.
            </DialogDescription>
          </DialogHeader>
          {editingExpense && (
            <ExpenseForm
              expense={editingExpense}
              onSuccess={handleEditSuccess}
              onCancel={() => setShowEditDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OptimizedExpenseList;