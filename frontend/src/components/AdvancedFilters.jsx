import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Checkbox } from './ui/checkbox';
import { Calendar } from './ui/calendar';
import {
  Filter,
  Search,
  Calendar as CalendarIcon,
  DollarSign,
  Tag,
  User,
  X,
  ChevronDown,
  ChevronUp,
  Settings,
  Zap,
  RefreshCw,
  Save,
  Bookmark,
  MoreHorizontal,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  Clock,
  Target,
  TrendingUp,
  Hash
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';

// Predefined filter presets
const FILTER_PRESETS = [
  {
    id: 'recent',
    name: 'Recent Expenses',
    icon: Clock,
    filters: {
      dateRange: 'last_7_days',
      sortBy: 'expense_date',
      sortOrder: 'desc'
    }
  },
  {
    id: 'high_value',
    name: 'High Value',
    icon: TrendingUp,
    filters: {
      minAmount: 1000,
      sortBy: 'amount',
      sortOrder: 'desc'
    }
  },
  {
    id: 'uncategorized',
    name: 'Uncategorized',
    icon: Hash,
    filters: {
      categories: ['uncategorized'],
      sortBy: 'expense_date',
      sortOrder: 'desc'
    }
  },
  {
    id: 'this_month',
    name: 'This Month',
    icon: CalendarIcon,
    filters: {
      dateRange: 'this_month',
      sortBy: 'expense_date',
      sortOrder: 'desc'
    }
  }
];

// Smart search suggestions based on expense data
const useSearchSuggestions = (expenses, searchTerm) => {
  return useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    const suggestions = new Set();
    const lowerSearch = searchTerm.toLowerCase();
    
    expenses.forEach(expense => {
      // Description suggestions
      if (expense.description?.toLowerCase().includes(lowerSearch)) {
        suggestions.add({
          type: 'description',
          value: expense.description,
          icon: '📝',
          label: expense.description
        });
      }
      
      // Notes suggestions
      if (expense.notes?.toLowerCase().includes(lowerSearch)) {
        suggestions.add({
          type: 'notes',
          value: expense.notes,
          icon: '📋',
          label: expense.notes
        });
      }
      
      // Amount suggestions (if searching for numbers)
      if (!isNaN(searchTerm) && expense.amount.toString().includes(searchTerm)) {
        suggestions.add({
          type: 'amount',
          value: expense.amount,
          icon: '💰',
          label: formatCurrency(expense.amount)
        });
      }
    });
    
    return Array.from(suggestions).slice(0, 8);
  }, [expenses, searchTerm]);
};

const FilterChip = ({ label, onRemove, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
  };
  
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}
    >
      {label}
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
};

const AmountRangeSlider = ({ minAmount, maxAmount, value, onChange, expenses }) => {
  const expenseAmounts = expenses.map(e => parseFloat(e.amount || 0));
  const dataMin = Math.min(...expenseAmounts, 0);
  const dataMax = Math.max(...expenseAmounts, 10000);
  
  const min = minAmount ?? dataMin;
  const max = maxAmount ?? dataMax;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Amount Range</Label>
        <div className="text-sm text-muted-foreground">
          {formatCurrency(value[0])} - {formatCurrency(value[1])}
        </div>
      </div>
      <Slider
        min={min}
        max={max}
        step={50}
        value={value}
        onValueChange={onChange}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatCurrency(min)}</span>
        <span>{formatCurrency(max)}</span>
      </div>
    </div>
  );
};

const DateRangeSelector = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customRange, setCustomRange] = useState({
    from: value?.from || new Date(),
    to: value?.to || new Date()
  });

  const presets = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 days', value: 'last_7_days' },
    { label: 'Last 30 days', value: 'last_30_days' },
    { label: 'This month', value: 'this_month' },
    { label: 'Last month', value: 'last_month' },
    { label: 'This year', value: 'this_year' },
    { label: 'Custom range', value: 'custom' }
  ];

  const handlePresetChange = (preset) => {
    const now = new Date();
    let from, to;

    switch (preset) {
      case 'today':
        from = to = now;
        break;
      case 'yesterday':
        from = to = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'last_7_days':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        to = now;
        break;
      case 'last_30_days':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        to = now;
        break;
      case 'this_month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = now;
        break;
      case 'last_month':
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'this_year':
        from = new Date(now.getFullYear(), 0, 1);
        to = now;
        break;
      case 'custom':
        setIsOpen(true);
        return;
      default:
        return;
    }

    onChange({ from, to, preset });
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value?.from ? (
            value.from.toDateString() === value.to?.toDateString() ? (
              value.from.toLocaleDateString()
            ) : (
              `${value.from.toLocaleDateString()} - ${value.to?.toLocaleDateString()}`
            )
          ) : (
            "Select date range"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="border-r p-4 space-y-2">
            <h4 className="font-medium text-sm mb-3">Quick Ranges</h4>
            {presets.map((preset) => (
              <Button
                key={preset.value}
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => handlePresetChange(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="p-4">
            <Calendar
              mode="range"
              defaultMonth={value?.from}
              selected={customRange}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setCustomRange(range);
                  onChange({ ...range, preset: 'custom' });
                  setIsOpen(false);
                }
              }}
              numberOfMonths={2}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const AdvancedFilters = ({
  filters,
  onFiltersChange,
  expenses = [],
  categories = [],
  users = [],
  isAdmin = false,
  onApplyFilters,
  onResetFilters,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters?.search || '');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [savedFilters, setSavedFilters] = useState([]);

  const searchSuggestions = useSearchSuggestions(expenses, searchTerm);

  // Calculate expense amount range from data
  const amountRange = useMemo(() => {
    if (expenses.length === 0) return [0, 10000];
    const amounts = expenses.map(e => parseFloat(e.amount || 0));
    return [Math.min(...amounts), Math.max(...amounts)];
  }, [expenses]);

  // Active filters for chips display
  const activeFilters = useMemo(() => {
    const active = [];
    
    if (filters?.search) {
      active.push({ key: 'search', label: `Search: "${filters.search}"`, color: 'blue' });
    }
    
    if (filters?.categories?.length > 0) {
      const categoryNames = filters.categories
        .map(id => categories.find(c => c.id === id)?.name || 'Unknown')
        .join(', ');
      active.push({ key: 'categories', label: `Categories: ${categoryNames}`, color: 'green' });
    }
    
    if (filters?.users?.length > 0 && isAdmin) {
      const userNames = filters.users
        .map(id => users.find(u => u.id === id)?.full_name || 'Unknown')
        .join(', ');
      active.push({ key: 'users', label: `Users: ${userNames}`, color: 'purple' });
    }
    
    if (filters?.minAmount || filters?.maxAmount) {
      const min = filters.minAmount || amountRange[0];
      const max = filters.maxAmount || amountRange[1];
      active.push({ 
        key: 'amount', 
        label: `Amount: ${formatCurrency(min)} - ${formatCurrency(max)}`,
        color: 'orange' 
      });
    }
    
    if (filters?.dateRange) {
      active.push({ 
        key: 'dateRange', 
        label: `Date: ${filters.dateRange.preset || 'Custom'}`,
        color: 'blue' 
      });
    }
    
    return active;
  }, [filters, categories, users, isAdmin, amountRange]);

  const handleFilterChange = useCallback((key, value) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const handleRemoveFilter = useCallback((key) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    handleFilterChange('search', value);
  }, [handleFilterChange]);

  const handleApplyPreset = useCallback((preset) => {
    const newFilters = { ...filters, ...preset.filters };
    onFiltersChange(newFilters);
    setSelectedPreset(preset.id);
  }, [filters, onFiltersChange]);

  const handleSaveCurrentFilters = useCallback(() => {
    const name = prompt('Enter a name for this filter set:');
    if (name) {
      const newSavedFilter = {
        id: Date.now().toString(),
        name,
        filters: { ...filters }
      };
      setSavedFilters(prev => [...prev, newSavedFilter]);
    }
  }, [filters]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar with Suggestions */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses, descriptions, notes..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowSearchSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
            className="pl-10 pr-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
          />
        </div>
        
        {/* Search Suggestions */}
        {showSearchSuggestions && searchSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-800 border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            {searchSuggestions.map((suggestion, index) => (
              <button
                key={index}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 border-b border-border/50 last:border-0"
                onClick={() => {
                  setSearchTerm(suggestion.value);
                  handleSearchChange(suggestion.value);
                  setShowSearchSuggestions(false);
                }}
              >
                <span>{suggestion.icon}</span>
                <span className="truncate">{suggestion.label}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {suggestion.type}
                </Badge>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Filter Presets */}
      <div className="flex flex-wrap gap-2">
        {FILTER_PRESETS.map((preset) => {
          const Icon = preset.icon;
          return (
            <Button
              key={preset.id}
              variant={selectedPreset === preset.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleApplyPreset(preset)}
              className="flex items-center gap-2"
            >
              <Icon className="h-3 w-3" />
              {preset.name}
            </Button>
          );
        })}
      </div>

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border">
          <span className="text-sm font-medium text-muted-foreground mr-2">Active filters:</span>
          <AnimatePresence>
            {activeFilters.map((filter) => (
              <FilterChip
                key={filter.key}
                label={filter.label}
                color={filter.color}
                onRemove={() => handleRemoveFilter(filter.key)}
              />
            ))}
          </AnimatePresence>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="ml-auto text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Advanced Filters Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Advanced Filters
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveCurrentFilters}
                className="flex items-center gap-2"
              >
                <Save className="h-3 w-3" />
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {isExpanded ? 'Less' : 'More'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <CardContent className="space-y-6">
                {/* Date Range */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Date Range</Label>
                  <DateRangeSelector
                    value={filters?.dateRange}
                    onChange={(dateRange) => handleFilterChange('dateRange', dateRange)}
                  />
                </div>

                {/* Amount Range */}
                <AmountRangeSlider
                  value={[filters?.minAmount || amountRange[0], filters?.maxAmount || amountRange[1]]}
                  onChange={([min, max]) => {
                    handleFilterChange('minAmount', min);
                    handleFilterChange('maxAmount', max);
                  }}
                  expenses={expenses}
                />

                {/* Categories */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Categories</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={filters?.categories?.includes(category.id) || false}
                          onCheckedChange={(checked) => {
                            const currentCategories = filters?.categories || [];
                            const newCategories = checked
                              ? [...currentCategories, category.id]
                              : currentCategories.filter(id => id !== category.id);
                            handleFilterChange('categories', newCategories);
                          }}
                        />
                        <label
                          htmlFor={`category-${category.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Users (Admin only) */}
                {isAdmin && users.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Users</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={filters?.users?.includes(user.id) || false}
                            onCheckedChange={(checked) => {
                              const currentUsers = filters?.users || [];
                              const newUsers = checked
                                ? [...currentUsers, user.id]
                                : currentUsers.filter(id => id !== user.id);
                              handleFilterChange('users', newUsers);
                            }}
                          />
                          <label
                            htmlFor={`user-${user.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                          >
                            <User className="w-3 h-3" />
                            {user.full_name || user.email}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sorting */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Sort By</Label>
                    <Select
                      value={filters?.sortBy || 'expense_date'}
                      onValueChange={(value) => handleFilterChange('sortBy', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense_date">Date</SelectItem>
                        <SelectItem value="amount">Amount</SelectItem>
                        <SelectItem value="description">Description</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                        {isAdmin && <SelectItem value="user">User</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Order</Label>
                    <Select
                      value={filters?.sortOrder || 'desc'}
                      onValueChange={(value) => handleFilterChange('sortOrder', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">
                          <div className="flex items-center gap-2">
                            <SortAsc className="h-3 w-3" />
                            Ascending
                          </div>
                        </SelectItem>
                        <SelectItem value="desc">
                          <div className="flex items-center gap-2">
                            <SortDesc className="h-3 w-3" />
                            Descending
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    {savedFilters.length > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Bookmark className="h-3 w-3" />
                            Saved ({savedFilters.length})
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Saved Filter Sets</h4>
                            {savedFilters.map((saved) => (
                              <Button
                                key={saved.id}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => onFiltersChange(saved.filters)}
                              >
                                {saved.name}
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onResetFilters}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onApplyFilters(filters)}
                      className="flex items-center gap-2"
                    >
                      <Zap className="h-3 w-3" />
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
};

export default AdvancedFilters;