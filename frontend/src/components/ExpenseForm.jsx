import React, { useState, useEffect } from 'react';
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
import { Loader2, Save, X } from 'lucide-react';

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
      setError('Failed to fetch categories');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expense_date">Date *</Label>
          <Input
            id="expense_date"
            type="date"
            value={formData.expense_date}
            onChange={(e) => handleInputChange('expense_date', e.target.value)}
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Input
          id="description"
          type="text"
          placeholder="Enter expense description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select 
          value={formData.category_id} 
          onValueChange={(value) => handleInputChange('category_id', value)}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: category.color }}
                  ></div>
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="receipt_url">Receipt URL</Label>
        <Input
          id="receipt_url"
          type="url"
          placeholder="https://example.com/receipt.jpg"
          value={formData.receipt_url}
          onChange={(e) => handleInputChange('receipt_url', e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Additional notes about this expense"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          disabled={loading}
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
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

