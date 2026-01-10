import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/SupabaseAuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Loader2, Save, X, Sparkles, Check } from 'lucide-react';
import { getCategorySuggestionEngine } from '../utils/categorySuggestion';

const ExpenseForm = ({ expense = null, onSuccess, onCancel }) => {
  const { apiCall } = useAuth();
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: '',
    expense_date: new Date().toISOString().split('T')[0],
    receipt_url: '',
    notes: '',
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Initialize category suggestion engine
  const suggestionEngine = useMemo(() => {
    return getCategorySuggestionEngine(categories);
  }, [categories]);

  // Update suggestions when description or notes change
  const updateSuggestions = useCallback((description, notes) => {
    if (!suggestionEngine || categories.length === 0) return;

    // Only suggest if no category is selected or if it's a new expense
    if (formData.category_id && expense) {
      setSuggestions([]);
      return;
    }

    const newSuggestions = suggestionEngine.suggest(description, notes, 3);
    setSuggestions(newSuggestions);
  }, [suggestionEngine, categories, formData.category_id, expense]);

  // Debounced suggestion update
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateSuggestions(formData.description, formData.notes);
    }, 300);  // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData.description, formData.notes, updateSuggestions]);

  // Apply a suggestion
  const applySuggestion = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      category_id: suggestion.categoryId
    }));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    fetchCategories();
    
    // If editing an expense, populate the form
    if (expense) {
      setFormData({
        amount: expense.amount.toString(),
        description: expense.description,
        category_id: expense.category_id,
        expense_date: expense.expense_date,
        receipt_url: expense.receipt_url || '',
        notes: expense.notes || '',
      });
    }
  }, [expense]);

  const fetchCategories = async () => {
    try {
      const data = await apiCall('/categories');
      setCategories(data.categories || []);
    } catch (err) {
      setError(`Failed to fetch categories: ${err.message || 'Unknown error'}`);
      setCategories([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Re-enable suggestions when description changes
    if (field === 'description') {
      setShowSuggestions(true);
    }

    // Clear suggestions when user manually selects a category
    if (field === 'category_id') {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.amount || !formData.description || !formData.category_id || !formData.expense_date) {
        throw new Error('Please fill in all required fields');
      }

      // Validate amount
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount greater than 0');
      }

      const endpoint = expense ? `/expenses/${expense.id}` : '/expenses';
      const method = expense ? 'PUT' : 'POST';

      await apiCall(endpoint, {
        method,
        body: {
          ...formData,
          amount: amount,
        },
      });

      setSuccess(expense ? 'Expense updated successfully!' : 'Expense created successfully!');
      
      // Reset form if creating new expense
      if (!expense) {
        setFormData({
          amount: '',
          description: '',
          category_id: '',
          expense_date: new Date().toISOString().split('T')[0],
          receipt_url: '',
          notes: '',
        });
      }

      // Call success callback after a short delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {error && (
        <Alert variant="destructive" className="text-sm">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="text-sm">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Amount and Date - Stack on mobile, side by side on tablet+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium">Amount *</Label>
          <Input
            id="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            required
            disabled={loading}
            className="h-12 sm:h-10 text-base sm:text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expense_date" className="text-sm font-medium">Date *</Label>
          <Input
            id="expense_date"
            type="date"
            value={formData.expense_date}
            onChange={(e) => handleInputChange('expense_date', e.target.value)}
            required
            disabled={loading}
            className="h-12 sm:h-10 text-base sm:text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
        <Input
          id="description"
          type="text"
          placeholder="Enter expense description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          required
          disabled={loading}
          className="h-12 sm:h-10 text-base sm:text-sm"
        />

        {/* AI Category Suggestions */}
        {showSuggestions && suggestions.length > 0 && !formData.category_id && (
          <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                AI Suggested Categories
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.categoryId}
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1"
                  style={{
                    backgroundColor: `${suggestion.color}20`,
                    borderColor: suggestion.color,
                    borderWidth: '1px',
                    color: suggestion.color
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: suggestion.color }}
                  />
                  <span className="font-medium">{suggestion.categoryName}</span>
                  <span className="text-xs opacity-70">
                    ({suggestion.confidenceLabel})
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Click a suggestion to auto-fill category, or select manually below
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
        <Select
          value={formData.category_id}
          onValueChange={(value) => handleInputChange('category_id', value)}
          disabled={loading}
        >
          <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent className="max-h-[50vh]">
            {categories.map((category) => (
              <SelectItem
                key={category.id}
                value={category.id}
                className="py-3 sm:py-2"
              >
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 sm:w-3 sm:h-3 rounded-full mr-3 sm:mr-2 flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-base sm:text-sm">{category.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="receipt_url" className="text-sm font-medium">Receipt URL</Label>
        <Input
          id="receipt_url"
          type="url"
          inputMode="url"
          placeholder="https://example.com/receipt.jpg"
          value={formData.receipt_url}
          onChange={(e) => handleInputChange('receipt_url', e.target.value)}
          disabled={loading}
          className="h-12 sm:h-10 text-base sm:text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Additional notes about this expense"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          disabled={loading}
          rows={3}
          className="text-base sm:text-sm min-h-[80px]"
        />
      </div>

      {/* Action buttons - Full width on mobile */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="h-12 sm:h-10 text-base sm:text-sm w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading}
          className="h-12 sm:h-10 text-base sm:text-sm w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {expense ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {expense ? 'Update Expense' : 'Create Expense'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default ExpenseForm;

