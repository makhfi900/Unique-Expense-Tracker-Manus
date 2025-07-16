// CSV Processing Web Worker
// This worker handles CSV export/import operations to prevent UI blocking

self.onmessage = function(e) {
  const { type, data } = e.data;
  
  try {
    switch (type) {
      case 'EXPORT_CSV':
        exportCSV(data);
        break;
      case 'IMPORT_CSV':
        importCSV(data);
        break;
      case 'PARSE_CSV':
        parseCSV(data);
        break;
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error.message
    });
  }
};

// Export expenses to CSV format
function exportCSV(data) {
  const { expenses, categories = [], includeHeaders = true } = data;
  
  // Create category lookup map for performance
  const categoryMap = categories.reduce((map, cat) => {
    map[cat.id] = cat.name;
    return map;
  }, {});
  
  const headers = [
    'Date',
    'Amount',
    'Description',
    'Category',
    'Notes',
    'Created By',
    'Created At'
  ];
  
  let csvContent = '';
  
  // Add headers if requested
  if (includeHeaders) {
    csvContent += headers.join(',') + '\n';
  }
  
  // Process expenses in chunks to avoid blocking
  const chunkSize = 1000;
  let processedCount = 0;
  
  function processChunk() {
    const chunk = expenses.slice(processedCount, processedCount + chunkSize);
    
    chunk.forEach(expense => {
      const row = [
        formatDate(expense.expense_date),
        expense.amount,
        escapeCSVValue(expense.description),
        categoryMap[expense.category_id] || 'Unknown',
        escapeCSVValue(expense.notes || ''),
        escapeCSVValue(expense.created_by_user?.full_name || 'Unknown'),
        formatDateTime(expense.created_at)
      ];
      
      csvContent += row.join(',') + '\n';
    });
    
    processedCount += chunk.length;
    
    // Report progress
    const progress = Math.round((processedCount / expenses.length) * 100);
    self.postMessage({
      type: 'PROGRESS',
      progress,
      message: `Processed ${processedCount} of ${expenses.length} expenses`
    });
    
    // Continue processing or finish
    if (processedCount < expenses.length) {
      // Use setTimeout to prevent blocking
      setTimeout(processChunk, 0);
    } else {
      // Export complete
      self.postMessage({
        type: 'EXPORT_COMPLETE',
        csvContent,
        totalRecords: expenses.length
      });
    }
  }
  
  // Start processing
  processChunk();
}

// Import CSV and parse into expense objects
function importCSV(data) {
  const { csvContent, categories = [] } = data;
  
  // Create category lookup map (case-insensitive)
  const categoryMap = categories.reduce((map, cat) => {
    map[cat.name.toLowerCase()] = cat.id;
    return map;
  }, {});
  
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Map headers to expected fields
  const fieldMapping = {
    'date': 'expense_date',
    'amount': 'amount',
    'description': 'description',
    'category': 'category_id',
    'notes': 'notes'
  };
  
  const expenses = [];
  const errors = [];
  
  // Process lines in chunks
  const chunkSize = 500;
  let processedCount = 0;
  
  function processChunk() {
    const startIndex = processedCount + 1; // Skip header
    const endIndex = Math.min(startIndex + chunkSize, lines.length);
    
    for (let i = startIndex; i < endIndex; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        const values = parseCSVLine(line);
        const expense = {};
        
        // Map values to expense fields
        headers.forEach((header, index) => {
          const field = fieldMapping[header];
          if (field && values[index] !== undefined) {
            let value = values[index].trim();
            
            switch (field) {
              case 'amount':
                value = parseFloat(value.replace(/[^0-9.-]/g, ''));
                if (isNaN(value) || value <= 0) {
                  throw new Error(`Invalid amount: ${values[index]}`);
                }
                break;
              case 'expense_date':
                value = formatDateForDB(value);
                break;
              case 'category_id':
                const categoryId = categoryMap[value.toLowerCase()];
                if (!categoryId) {
                  throw new Error(`Unknown category: ${value}`);
                }
                value = categoryId;
                break;
            }
            
            expense[field] = value;
          }
        });
        
        // Validate required fields
        if (!expense.amount || !expense.description || !expense.expense_date) {
          throw new Error('Missing required fields: amount, description, or date');
        }
        
        expenses.push(expense);
        
      } catch (error) {
        errors.push({
          line: i + 1,
          content: line,
          error: error.message
        });
      }
    }
    
    processedCount = endIndex - 1;
    
    // Report progress
    const progress = Math.round((processedCount / (lines.length - 1)) * 100);
    self.postMessage({
      type: 'PROGRESS',
      progress,
      message: `Processed ${processedCount} of ${lines.length - 1} lines`
    });
    
    // Continue processing or finish
    if (processedCount < lines.length - 1) {
      setTimeout(processChunk, 0);
    } else {
      // Import complete
      self.postMessage({
        type: 'IMPORT_COMPLETE',
        expenses,
        errors,
        totalLines: lines.length - 1,
        successCount: expenses.length,
        errorCount: errors.length
      });
    }
  }
  
  // Start processing
  processChunk();
}

// Parse CSV content and return basic info
function parseCSV(data) {
  const { csvContent } = data;
  
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines.length > 0 ? lines[0].split(',').map(h => h.trim()) : [];
  
  self.postMessage({
    type: 'PARSE_COMPLETE',
    headers,
    totalLines: lines.length - 1,
    preview: lines.slice(0, 6) // First 5 data rows plus header
  });
}

// Utility functions
function escapeCSVValue(value) {
  if (typeof value !== 'string') {
    value = String(value);
  }
  
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  
  return value;
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of value
      values.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last value
  values.push(current);
  
  return values;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateForDB(dateString) {
  // Parse various date formats and convert to YYYY-MM-DD
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
  
  return date.toISOString().split('T')[0];
}