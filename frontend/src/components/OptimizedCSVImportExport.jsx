import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Upload, 
  Download, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  X,
  RefreshCw
} from 'lucide-react';

const OptimizedCSVImportExport = () => {
  const { apiCall } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [categories, setCategories] = useState([]);
  
  // Export state
  const [exportFilters, setExportFilters] = useState({
    startDate: '',
    endDate: '',
    categoryId: ''
  });
  
  // Import state
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importResults, setImportResults] = useState(null);
  
  // Web Worker reference
  const workerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new Worker('/csvWorker.js');
    
    workerRef.current.onmessage = (e) => {
      const { type, progress: workerProgress, message, error: workerError, ...data } = e.data;
      
      switch (type) {
        case 'PROGRESS':
          setProgress(workerProgress);
          setProgressMessage(message);
          break;
        case 'EXPORT_COMPLETE':
          handleExportComplete(data);
          break;
        case 'IMPORT_COMPLETE':
          handleImportComplete(data);
          break;
        case 'PARSE_COMPLETE':
          setImportPreview(data);
          break;
        case 'ERROR':
          setError(workerError);
          setLoading(false);
          setProgress(0);
          setProgressMessage('');
          break;
      }
    };
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await apiCall('/categories');
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, [apiCall]);

  const handleExportComplete = useCallback((data) => {
    const { csvContent, totalRecords } = data;
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `expenses_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    
    setSuccess(`Successfully exported ${totalRecords} expenses to CSV`);
    setLoading(false);
    setProgress(0);
    setProgressMessage('');
  }, []);

  const handleImportComplete = useCallback(async (data) => {
    const { expenses, errors, successCount, errorCount } = data;
    
    try {
      // Upload valid expenses to server
      if (expenses.length > 0) {
        setProgressMessage('Uploading expenses to server...');
        setProgress(50);
        
        const response = await apiCall('/expenses/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ expenses })
        });
        
        setProgress(100);
        setImportResults({
          success: true,
          totalProcessed: successCount + errorCount,
          successCount: response.created_count || successCount,
          errorCount: errorCount + (response.failed_count || 0),
          errors: [...errors, ...(response.errors || [])]
        });
        
        setSuccess(`Successfully imported ${response.created_count || successCount} expenses`);
      } else {
        setImportResults({
          success: false,
          totalProcessed: errorCount,
          successCount: 0,
          errorCount,
          errors
        });
        setError('No valid expenses found in the CSV file');
      }
    } catch (err) {
      setError(`Failed to upload expenses: ${err.message}`);
      setImportResults({
        success: false,
        totalProcessed: successCount + errorCount,
        successCount: 0,
        errorCount: successCount + errorCount,
        errors: [...errors, { error: err.message }]
      });
    }
    
    setLoading(false);
    setProgress(0);
    setProgressMessage('');
  }, [apiCall]);

  const handleExport = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setProgress(0);
      setProgressMessage('Fetching expenses...');
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (exportFilters.startDate) queryParams.append('start_date', exportFilters.startDate);
      if (exportFilters.endDate) queryParams.append('end_date', exportFilters.endDate);
      if (exportFilters.categoryId) queryParams.append('category_id', exportFilters.categoryId);
      
      // Add export flag to get all records
      queryParams.append('export', 'true');
      
      const queryString = queryParams.toString();
      const endpoint = `/expenses${queryString ? `?${queryString}` : ''}`;
      
      const data = await apiCall(endpoint);
      const expenses = data.expenses || [];
      
      if (expenses.length === 0) {
        setError('No expenses found matching the selected criteria');
        setLoading(false);
        return;
      }
      
      setProgressMessage('Processing expenses for export...');
      setProgress(25);
      
      // Send data to Web Worker for processing
      workerRef.current.postMessage({
        type: 'EXPORT_CSV',
        data: {
          expenses,
          categories,
          includeHeaders: true
        }
      });
      
    } catch (err) {
      setError(err.message);
      setLoading(false);
      setProgress(0);
      setProgressMessage('');
    }
  }, [apiCall, exportFilters, categories]);

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }
    
    setImportFile(file);
    setImportPreview(null);
    setImportResults(null);
    setError('');
    setSuccess('');
    
    // Parse file for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvContent = e.target.result;
      workerRef.current.postMessage({
        type: 'PARSE_CSV',
        data: { csvContent }
      });
    };
    reader.readAsText(file);
  }, []);

  const handleImport = useCallback(() => {
    if (!importFile) {
      setError('Please select a CSV file first');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    setProgress(0);
    setProgressMessage('Reading CSV file...');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvContent = e.target.result;
      
      setProgressMessage('Processing CSV data...');
      setProgress(25);
      
      workerRef.current.postMessage({
        type: 'IMPORT_CSV',
        data: {
          csvContent,
          categories
        }
      });
    };
    reader.readAsText(importFile);
  }, [importFile, categories]);

  const clearImport = useCallback(() => {
    setImportFile(null);
    setImportPreview(null);
    setImportResults(null);
    setError('');
    setSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Processing...</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600">{progressMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue="export" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="import">Import Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Export Expenses
              </CardTitle>
              <CardDescription>
                Export your expense data to a CSV file. Use filters to export specific date ranges or categories.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="export-start-date">Start Date</Label>
                  <Input
                    id="export-start-date"
                    type="date"
                    value={exportFilters.startDate}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="export-end-date">End Date</Label>
                  <Input
                    id="export-end-date"
                    type="date"
                    value={exportFilters.endDate}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="export-category">Category</Label>
                  <select
                    id="export-category"
                    value={exportFilters.categoryId}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, categoryId: e.target.value }))}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <Button 
                onClick={handleExport} 
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export to CSV
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Import Expenses
              </CardTitle>
              <CardDescription>
                Import expense data from a CSV file. The file should have columns for Date, Amount, Description, Category, and Notes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="import-file">Select CSV File</Label>
                <Input
                  id="import-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  disabled={loading}
                  ref={fileInputRef}
                />
              </div>
              
              {importFile && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="text-sm">{importFile.name}</span>
                    <Badge variant="secondary" className="ml-2">
                      {(importFile.size / 1024).toFixed(1)} KB
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearImport}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {importPreview && (
                <div className="space-y-2">
                  <h4 className="font-medium">File Preview</h4>
                  <div className="text-sm text-gray-600">
                    Headers: {importPreview.headers.join(', ')}
                  </div>
                  <div className="text-sm text-gray-600">
                    Total rows: {importPreview.totalLines}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          {importPreview.headers.map((header, index) => (
                            <th key={index} className="border-b border-gray-200 px-3 py-2 text-left text-sm">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.preview.slice(1, 6).map((row, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            {row.split(',').map((cell, cellIndex) => (
                              <td key={cellIndex} className="px-3 py-2 text-sm">
                                {cell.replace(/"/g, '').trim()}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleImport} 
                disabled={loading || !importFile}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Import CSV
              </Button>
            </CardContent>
          </Card>
          
          {importResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {importResults.success ? (
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                  )}
                  Import Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {importResults.totalProcessed}
                    </div>
                    <div className="text-sm text-gray-500">Total Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {importResults.successCount}
                    </div>
                    <div className="text-sm text-gray-500">Successfully Imported</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {importResults.errorCount}
                    </div>
                    <div className="text-sm text-gray-500">Errors</div>
                  </div>
                </div>
                
                {importResults.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-600">Errors:</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {importResults.errors.map((error, index) => (
                        <div key={index} className="text-sm p-2 bg-red-50 rounded">
                          {error.line && `Line ${error.line}: `}
                          {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OptimizedCSVImportExport;