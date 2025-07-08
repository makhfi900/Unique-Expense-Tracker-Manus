import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

const CSVImportExport = () => {
  const { apiCall } = useAuth();
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [importProgress, setImportProgress] = useState(0);
  
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportFilters, setExportFilters] = useState({
    start_date: '',
    end_date: '',
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setImportFile(file);
      setImportError('');
    } else {
      setImportError('Please select a valid CSV file');
      setImportFile(null);
    }
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const expenses = [];

    // Expected headers (flexible order)
    const requiredHeaders = ['date', 'amount', 'description', 'category'];
    const optionalHeaders = ['notes', 'receipt_url'];

    // Check if required headers exist
    const missingHeaders = requiredHeaders.filter(header => 
      !headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
    );

    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    // Map headers to indices
    const headerMap = {};
    headers.forEach((header, index) => {
      const lowerHeader = header.toLowerCase();
      if (lowerHeader.includes('date')) headerMap.date = index;
      else if (lowerHeader.includes('amount')) headerMap.amount = index;
      else if (lowerHeader.includes('description')) headerMap.description = index;
      else if (lowerHeader.includes('category')) headerMap.category = index;
      else if (lowerHeader.includes('notes')) headerMap.notes = index;
      else if (lowerHeader.includes('receipt')) headerMap.receipt_url = index;
    });

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length < headers.length) continue; // Skip incomplete rows

      const expense = {
        expense_date: values[headerMap.date],
        amount: parseFloat(values[headerMap.amount]),
        description: values[headerMap.description],
        category_name: values[headerMap.category],
        notes: headerMap.notes !== undefined ? values[headerMap.notes] : '',
        receipt_url: headerMap.receipt_url !== undefined ? values[headerMap.receipt_url] : '',
      };

      // Validate required fields
      if (!expense.expense_date || isNaN(expense.amount) || !expense.description || !expense.category_name) {
        console.warn(`Skipping invalid row ${i + 1}:`, expense);
        continue;
      }

      // Validate and format date
      const date = new Date(expense.expense_date);
      if (isNaN(date.getTime())) {
        console.warn(`Skipping row ${i + 1} with invalid date:`, expense.expense_date);
        continue;
      }
      expense.expense_date = date.toISOString().split('T')[0];

      expenses.push(expense);
    }

    return expenses;
  };

  const handleImport = async () => {
    if (!importFile) {
      setImportError('Please select a CSV file');
      return;
    }

    setImportLoading(true);
    setImportError('');
    setImportSuccess('');
    setImportProgress(0);

    try {
      // Read file content
      const fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsText(importFile);
      });

      setImportProgress(25);

      // Parse CSV
      const expenses = parseCSV(fileContent);
      
      if (expenses.length === 0) {
        throw new Error('No valid expenses found in the CSV file');
      }

      setImportProgress(50);

      // Get categories to map category names to IDs
      const categoriesData = await apiCall('/categories');
      const categories = categoriesData.categories || [];
      const categoryMap = {};
      categories.forEach(cat => {
        categoryMap[cat.name.toLowerCase()] = cat.id;
      });

      setImportProgress(75);

      // Process expenses and create them
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const expense of expenses) {
        try {
          // Find category ID
          const categoryId = categoryMap[expense.category_name.toLowerCase()];
          if (!categoryId) {
            errors.push(`Category "${expense.category_name}" not found for expense: ${expense.description}`);
            errorCount++;
            continue;
          }

          // Create expense
          await apiCall('/expenses', {
            method: 'POST',
            body: {
              amount: expense.amount,
              description: expense.description,
              category_id: categoryId,
              expense_date: expense.expense_date,
              notes: expense.notes,
              receipt_url: expense.receipt_url,
            },
          });

          successCount++;
        } catch (err) {
          errors.push(`Failed to create expense "${expense.description}": ${err.message}`);
          errorCount++;
        }
      }

      setImportProgress(100);

      if (successCount > 0) {
        setImportSuccess(`Successfully imported ${successCount} expenses.${errorCount > 0 ? ` ${errorCount} expenses failed to import.` : ''}`);
      }

      if (errors.length > 0 && errorCount === expenses.length) {
        setImportError(`All imports failed. First few errors: ${errors.slice(0, 3).join('; ')}`);
      }

    } catch (err) {
      setImportError(err.message);
    } finally {
      setImportLoading(false);
      setTimeout(() => setImportProgress(0), 2000);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    setExportError('');

    try {
      const queryParams = new URLSearchParams();
      if (exportFilters.start_date) queryParams.append('start_date', exportFilters.start_date);
      if (exportFilters.end_date) queryParams.append('end_date', exportFilters.end_date);

      const queryString = queryParams.toString();
      const endpoint = `/expenses/export${queryString ? `?${queryString}` : ''}`;
      
      const data = await apiCall(endpoint);
      
      // Convert data to CSV format
      if (!data || data.length === 0) {
        throw new Error('No expenses found for export');
      }

      const csvHeaders = Object.keys(data[0]).join(',');
      const csvRows = data.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      const csvContent = [csvHeaders, ...csvRows].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      setExportError(err.message);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Import Expenses from CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {importError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{importError}</AlertDescription>
            </Alert>
          )}

          {importSuccess && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{importSuccess}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={importLoading}
            />
            <p className="text-sm text-gray-500">
              CSV file should contain columns: Date, Amount, Description, Category (required), Notes, Receipt URL (optional)
            </p>
          </div>

          {importProgress > 0 && (
            <div className="space-y-2">
              <Label>Import Progress</Label>
              <Progress value={importProgress} className="w-full" />
            </div>
          )}

          <Button 
            onClick={handleImport} 
            disabled={!importFile || importLoading}
            className="w-full"
          >
            {importLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Expenses
              </>
            )}
          </Button>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">CSV Format Example:</h4>
            <pre className="text-sm text-gray-600 overflow-x-auto">
{`Date,Amount,Description,Category,Notes
2024-01-15,25.50,Lunch at restaurant,Food & Dining,Team lunch
2024-01-16,45.00,Office supplies,Office Supplies,Printer paper`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export Expenses to CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {exportError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{exportError}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="export-start-date">Start Date (Optional)</Label>
              <Input
                id="export-start-date"
                type="date"
                value={exportFilters.start_date}
                onChange={(e) => setExportFilters(prev => ({ ...prev, start_date: e.target.value }))}
                disabled={exportLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="export-end-date">End Date (Optional)</Label>
              <Input
                id="export-end-date"
                type="date"
                value={exportFilters.end_date}
                onChange={(e) => setExportFilters(prev => ({ ...prev, end_date: e.target.value }))}
                disabled={exportLoading}
              />
            </div>
          </div>

          <Button 
            onClick={handleExport} 
            disabled={exportLoading}
            className="w-full"
          >
            {exportLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Expenses
              </>
            )}
          </Button>

          <p className="text-sm text-gray-500">
            Export will include all expenses you have access to based on your role. 
            Use date filters to limit the export to a specific time period.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CSVImportExport;

