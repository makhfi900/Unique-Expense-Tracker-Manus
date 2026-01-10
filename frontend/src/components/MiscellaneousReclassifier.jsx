/**
 * Miscellaneous Expense Reclassifier Component
 * Batch reclassification of miscellaneous expenses using AI suggestions
 * Available for all users
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/SupabaseAuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import {
  Sparkles,
  RefreshCw,
  Check,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Wand2,
  ArrowRight
} from 'lucide-react';
import { getReclassificationSuggestions, getCategorySuggestionEngine } from '../utils/categorySuggestion';
import { formatCurrency } from '../utils/currency';

const MiscellaneousReclassifier = ({ onReclassified }) => {
  const { apiCall } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reclassifications, setReclassifications] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());

  // Fetch data when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch categories and expenses in parallel
      const [categoriesRes, expensesRes] = await Promise.all([
        apiCall('/categories'),
        apiCall('/expenses?limit=1000')  // Get all expenses for learning
      ]);

      const cats = categoriesRes.categories || [];
      const exps = expensesRes.expenses || [];

      setCategories(cats);
      setExpenses(exps);

      // Initialize suggestion engine with categories
      const engine = getCategorySuggestionEngine(cats);

      // Train on existing categorized expenses
      engine.learnFromExpenses(exps);

      // Get reclassification suggestions for miscellaneous expenses
      const suggestions = getReclassificationSuggestions(exps, cats);

      // Initialize reclassifications with user-editable category
      const reclass = suggestions.map(item => ({
        ...item,
        selectedCategoryId: item.topSuggestion?.categoryId || '',
        isAccepted: item.topSuggestion?.confidence >= 0.5  // Auto-accept high confidence
      }));

      setReclassifications(reclass);

      // Auto-select high confidence items
      const autoSelected = new Set(
        reclass
          .filter(r => r.topSuggestion?.confidence >= 0.5)
          .map(r => r.expense.id)
      );
      setSelectedItems(autoSelected);

    } catch (err) {
      setError('Failed to load data: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Toggle item selection
  const toggleSelection = (expenseId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(expenseId)) {
        newSet.delete(expenseId);
      } else {
        newSet.add(expenseId);
      }
      return newSet;
    });
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedItems.size === reclassifications.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(reclassifications.map(r => r.expense.id)));
    }
  };

  // Update category selection for an item
  const updateCategorySelection = (expenseId, categoryId) => {
    setReclassifications(prev =>
      prev.map(item =>
        item.expense.id === expenseId
          ? { ...item, selectedCategoryId: categoryId }
          : item
      )
    );

    // Auto-select item when category is changed
    if (categoryId) {
      setSelectedItems(prev => new Set([...prev, expenseId]));
    }
  };

  // Apply reclassifications
  const applyReclassifications = async () => {
    const itemsToUpdate = reclassifications.filter(
      r => selectedItems.has(r.expense.id) && r.selectedCategoryId
    );

    if (itemsToUpdate.length === 0) {
      setError('Please select at least one expense to reclassify');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    let successCount = 0;
    let failCount = 0;

    for (const item of itemsToUpdate) {
      try {
        await apiCall(`/expenses/${item.expense.id}`, {
          method: 'PUT',
          body: {
            category_id: item.selectedCategoryId
          }
        });
        successCount++;
      } catch (err) {
        console.error(`Failed to update expense ${item.expense.id}:`, err);
        failCount++;
      }
    }

    setSaving(false);

    if (failCount === 0) {
      setSuccess(`Successfully reclassified ${successCount} expense${successCount > 1 ? 's' : ''}!`);

      // Remove updated items from the list
      setReclassifications(prev =>
        prev.filter(r => !selectedItems.has(r.expense.id) || !r.selectedCategoryId)
      );
      setSelectedItems(new Set());

      // Notify parent component
      if (onReclassified) {
        onReclassified(successCount);
      }

      // Close dialog after a short delay
      setTimeout(() => {
        if (reclassifications.length <= successCount) {
          setIsOpen(false);
        }
      }, 1500);
    } else {
      setError(`Updated ${successCount} expense${successCount > 1 ? 's' : ''}, but ${failCount} failed.`);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const highConfidence = reclassifications.filter(r => r.topSuggestion?.confidence >= 0.5).length;
    const mediumConfidence = reclassifications.filter(r =>
      r.topSuggestion?.confidence >= 0.3 && r.topSuggestion?.confidence < 0.5
    ).length;
    const lowConfidence = reclassifications.filter(r =>
      r.topSuggestion?.confidence > 0 && r.topSuggestion?.confidence < 0.3
    ).length;

    return { highConfidence, mediumConfidence, lowConfidence, total: reclassifications.length };
  }, [reclassifications]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 border-0"
        >
          <Wand2 className="h-4 w-4" />
          AI Reclassify
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI-Powered Expense Reclassification
          </DialogTitle>
          <DialogDescription>
            Review AI suggestions for miscellaneous expenses and reclassify them to appropriate categories.
          </DialogDescription>
        </DialogHeader>

        {/* Stats Summary */}
        {!loading && reclassifications.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="text-center p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Miscellaneous</p>
            </div>
            <div className="text-center p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.highConfidence}</p>
              <p className="text-xs text-muted-foreground">High Confidence</p>
            </div>
            <div className="text-center p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{stats.mediumConfidence}</p>
              <p className="text-xs text-muted-foreground">Medium</p>
            </div>
            <div className="text-center p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{stats.lowConfidence}</p>
              <p className="text-xs text-muted-foreground">Low</p>
            </div>
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
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
            <p className="text-muted-foreground">Analyzing expenses with AI...</p>
          </div>
        ) : reclassifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-muted-foreground">No miscellaneous expenses need reclassification.</p>
          </div>
        ) : (
          <>
            {/* Select All Header */}
            <div className="flex items-center justify-between py-2 px-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedItems.size === reclassifications.length && reclassifications.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm font-medium">
                  {selectedItems.size} of {reclassifications.length} selected
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Reclassification List */}
            <ScrollArea className="flex-1 max-h-[400px]">
              <div className="space-y-2 pr-4">
                {reclassifications.map((item) => (
                  <Card
                    key={item.expense.id}
                    className={`transition-all ${
                      selectedItems.has(item.expense.id)
                        ? 'ring-2 ring-purple-500 bg-purple-50/50 dark:bg-purple-900/20'
                        : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <Checkbox
                          checked={selectedItems.has(item.expense.id)}
                          onCheckedChange={() => toggleSelection(item.expense.id)}
                          className="mt-1"
                        />

                        {/* Expense Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">{item.expense.description}</span>
                            <Badge variant="secondary" className="shrink-0">
                              {formatCurrency(item.expense.amount)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.expense.expense_date}
                            {item.expense.notes && ` • ${item.expense.notes.substring(0, 50)}...`}
                          </p>

                          {/* Suggestions */}
                          {item.suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.suggestions.slice(0, 3).map((sugg, idx) => (
                                <button
                                  key={sugg.categoryId}
                                  type="button"
                                  onClick={() => updateCategorySelection(item.expense.id, sugg.categoryId)}
                                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-all ${
                                    item.selectedCategoryId === sugg.categoryId
                                      ? 'ring-2 ring-offset-1'
                                      : 'opacity-70 hover:opacity-100'
                                  }`}
                                  style={{
                                    backgroundColor: `${sugg.color}20`,
                                    borderColor: sugg.color,
                                    borderWidth: '1px',
                                    color: sugg.color,
                                    ringColor: sugg.color
                                  }}
                                >
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: sugg.color }}
                                  />
                                  {sugg.categoryName}
                                  <span className={`text-xs ${
                                    sugg.confidence >= 0.5 ? 'text-green-600' :
                                    sugg.confidence >= 0.3 ? 'text-yellow-600' : 'text-orange-600'
                                  }`}>
                                    {sugg.confidenceLabel}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Category Selector */}
                        <div className="shrink-0 w-48">
                          <Select
                            value={item.selectedCategoryId}
                            onValueChange={(value) => updateCategorySelection(item.expense.id, value)}
                          >
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.filter(c => c.name.toLowerCase() !== 'miscellaneous').map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: cat.color }}
                                    />
                                    {cat.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={applyReclassifications}
                disabled={saving || selectedItems.size === 0}
                className="gap-2 bg-purple-600 hover:bg-purple-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Apply {selectedItems.size} Reclassification{selectedItems.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MiscellaneousReclassifier;
