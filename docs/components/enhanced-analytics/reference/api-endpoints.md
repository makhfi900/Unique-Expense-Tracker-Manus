# Enhanced Analytics - API Endpoints Reference

## 📡 API Integration Overview

The Enhanced Analytics component integrates with multiple backend endpoints to fetch comprehensive expense data. This document details all API endpoints, request/response formats, and error handling strategies.

## 🔗 Primary Analytics Endpoints

### 1. Spending Trends Endpoint

**Endpoint**: `GET /analytics/spending-trends`

**Purpose**: Fetches monthly spending trends for time-based analysis

**Parameters**:
```javascript
{
  period: 'monthly',           // Required: aggregation period
  year: number,               // Required: target year
  start_date: 'YYYY-MM-DD',   // Required: filter start date
  end_date: 'YYYY-MM-DD'      // Required: filter end date
}
```

**Example Request**:
```javascript
const response = await apiCall(
  `/analytics/spending-trends?period=monthly&year=2024&start_date=2024-01-01&end_date=2024-12-31`
);
```

**Response Format**:
```json
{
  "trends": [
    {
      "month": "2024-01",
      "total": 15000.00,
      "count": 45,
      "categories": {
        "Office Supplies": 5000.00,
        "Travel": 10000.00
      }
    }
  ],
  "summary": {
    "total_amount": 15000.00,
    "total_transactions": 45,
    "period_start": "2024-01-01",
    "period_end": "2024-12-31"
  }
}
```

**Error Responses**:
```json
{
  "error": "Invalid date range",
  "code": "INVALID_RANGE", 
  "status": 400
}
```

### 2. Category Breakdown Endpoint

**Endpoint**: `GET /analytics/category-breakdown`

**Purpose**: Provides category-wise expense breakdown with totals and counts

**Parameters**:
```javascript
{
  start_date: 'YYYY-MM-DD',   // Required: filter start date
  end_date: 'YYYY-MM-DD'      // Required: filter end date
}
```

**Example Request**:
```javascript
const response = await apiCall(
  `/analytics/category-breakdown?start_date=2024-01-01&end_date=2024-12-31`
);
```

**Response Format**:
```json
{
  "breakdown": {
    "Office Supplies": {
      "total": 5000.00,
      "count": 15,
      "color": "#3B82F6",
      "average": 333.33,
      "percentage": 33.33
    },
    "Travel": {
      "total": 10000.00,
      "count": 30,
      "color": "#EF4444",
      "average": 333.33,
      "percentage": 66.67
    }
  },
  "summary": {
    "total_amount": 15000.00,
    "total_categories": 2,
    "total_transactions": 45
  }
}
```

### 3. Monthly-Category Breakdown Endpoint

**Endpoint**: `GET /analytics/monthly-category-breakdown`

**Purpose**: Combined monthly and category data for stacked charts

**Parameters**:
```javascript
{
  start_date: 'YYYY-MM-DD',   // Required: filter start date
  end_date: 'YYYY-MM-DD'      // Required: filter end date
}
```

**Example Request**:
```javascript
const response = await apiCall(
  `/analytics/monthly-category-breakdown?start_date=2024-01-01&end_date=2024-12-31`
);
```

**Response Format**:
```json
{
  "breakdown": [
    {
      "month": "Jan 2024",
      "total": 7500.00,
      "Office Supplies": 2500.00,
      "Travel": 5000.00,
      "Utilities": 0
    },
    {
      "month": "Feb 2024", 
      "total": 7500.00,
      "Office Supplies": 2500.00,
      "Travel": 5000.00,
      "Utilities": 0
    }
  ],
  "categoryColors": {
    "Office Supplies": "#3B82F6",
    "Travel": "#EF4444", 
    "Utilities": "#10B981"
  },
  "categoryList": [
    "Office Supplies",
    "Travel", 
    "Utilities"
  ]
}
```

## 🔄 Fallback Endpoints

### 4. Direct Expenses Endpoint

**Endpoint**: `GET /expenses`

**Purpose**: Fallback data source when analytics endpoints fail

**Parameters**:
```javascript
{
  start_date: 'YYYY-MM-DD',   // Optional: filter start date
  end_date: 'YYYY-MM-DD',     // Optional: filter end date
  category_id: string,        // Optional: specific category filter
  limit: number,              // Optional: result limit
  offset: number              // Optional: pagination offset
}
```

**Example Request**:
```javascript
const response = await apiCall(
  `/expenses?start_date=2024-01-01&end_date=2024-12-31&limit=1000`
);
```

**Response Format**:
```json
{
  "expenses": [
    {
      "id": "exp_123",
      "amount": 250.00,
      "description": "Office supplies purchase",
      "expense_date": "2024-01-15",
      "category_id": "cat_456",
      "category_name": "Office Supplies",
      "user_id": "user_789",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 1000,
    "offset": 0,
    "has_more": false
  }
}
```

### 5. Categories Endpoint

**Endpoint**: `GET /categories`

**Purpose**: Fetch all available expense categories

**Parameters**: None

**Example Request**:
```javascript
const response = await apiCall('/categories');
```

**Response Format**:
```json
{
  "categories": [
    {
      "id": "cat_456",
      "name": "Office Supplies",
      "color": "#3B82F6",
      "description": "Office and administrative supplies",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## 🔧 API Integration Implementation

### Parallel Request Strategy

```javascript
const fetchAnalyticsData = useCallback(async () => {
  setLoading(true);
  setError('');
  
  try {
    const requests = [];
    
    // 1. Spending trends
    requests.push(
      apiCall(`/analytics/spending-trends?period=monthly&year=${startYear}&start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`)
        .catch(err => ({ error: err.message, type: 'trends' }))
    );
    
    // 2. Category breakdown  
    requests.push(
      apiCall(`/analytics/category-breakdown?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`)
        .catch(err => ({ error: err.message, type: 'categories' }))
    );
    
    // 3. Monthly-category breakdown
    requests.push(
      apiCall(`/analytics/monthly-category-breakdown?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`)
        .catch(err => ({ error: err.message, type: 'monthly-category' }))
    );

    // Execute in parallel
    const [trendsResponse, categoryResponse, monthlyCategoryResponse] = await Promise.all(requests);
    
    // Process responses with individual error handling
    // ... processing logic
    
  } catch (err) {
    setError('Failed to fetch analytics data: ' + err.message);
  } finally {
    setLoading(false);
  }
}, [apiCall, dateRange, selectedCategory, categories]);
```

### Error Handling Strategy

```javascript
// Individual endpoint error handling
if (categoryResponse.error) {
  console.warn('Category data failed:', categoryResponse.error);
  // Trigger fallback system
  await fetchCategoryFallback();
} else {
  // Process successful response
  processCategoryData(categoryResponse.breakdown);
}
```

### Fallback Data Processing

```javascript
const fetchCategoryFallback = async () => {
  try {
    // Fetch raw expenses
    const expensesResponse = await apiCall(
      `/expenses?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`
    );

    if (expensesResponse.expenses?.length > 0) {
      // Client-side processing
      const categoryTotals = {};
      const categoryCounts = {};
      
      expensesResponse.expenses.forEach(expense => {
        const categoryName = expense.category_name || 'Uncategorized';
        const amount = parseFloat(expense.amount) || 0;
        
        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + amount;
        categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
      });

      // Generate breakdown array
      const breakdownArray = Object.entries(categoryTotals).map(([name, total], index) => {
        const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
        return {
          name,
          value: total,
          count: categoryCounts[name],
          color: colors[index % colors.length]
        };
      });

      setCategoryBreakdown(breakdownArray);
    }
  } catch (err) {
    console.error('Category fallback failed:', err);
  }
};
```

## 🚨 Error Handling Patterns

### API Error Response Format

```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "status": 400,
  "details": {
    "field": "Additional context",
    "suggestion": "How to fix the issue"
  }
}
```

### Client-Side Error Handling

```javascript
// Error boundary pattern
const handleApiError = (error, context) => {
  console.error(`${context} failed:`, error);
  
  // Log to monitoring service
  if (process.env.NODE_ENV === 'production') {
    analyticsService.track('api_error', {
      endpoint: context,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
  
  // Set user-friendly error message
  setError(`Failed to load ${context}. Please try refreshing the page.`);
};
```

### Retry Logic

```javascript
const apiCallWithRetry = async (endpoint, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall(endpoint);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

## 📊 Data Validation

### Response Validation

```javascript
const validateAnalyticsResponse = (data, type) => {
  switch (type) {
    case 'category-breakdown':
      return data?.breakdown && 
             typeof data.breakdown === 'object' &&
             Object.values(data.breakdown).every(cat => 
               typeof cat.total === 'number' && 
               typeof cat.count === 'number'
             );
             
    case 'monthly-category':
      return Array.isArray(data?.breakdown) &&
             data.breakdown.every(month => 
               typeof month.month === 'string' &&
               typeof month.total === 'number'
             );
             
    default:
      return false;
  }
};
```

### Data Sanitization

```javascript
const sanitizeApiData = (rawData) => {
  // Remove any potentially harmful scripts or HTML
  const sanitize = (value) => {
    if (typeof value === 'string') {
      return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    return value;
  };

  return JSON.parse(JSON.stringify(rawData, (key, value) => sanitize(value)));
};
```

## 🔐 Security Considerations

### Authentication

```javascript
// All API calls use authenticated wrapper
const { apiCall } = useAuth();

// apiCall automatically includes:
// - Authorization headers
// - CSRF protection  
// - Request signing
// - Rate limiting
```

### Data Privacy

```javascript
// Sensitive data filtering
const filterSensitiveData = (expenses) => {
  return expenses.map(expense => ({
    ...expense,
    // Remove personally identifiable information for non-admin users
    user_details: isAdmin ? expense.user_details : null,
    notes: isAdmin ? expense.notes : '[Redacted]'
  }));
};
```

## 📈 Performance Optimization

### Request Optimization

```javascript
// Request deduplication
const requestCache = new Map();
const cacheKey = `${endpoint}-${JSON.stringify(params)}`;

if (requestCache.has(cacheKey)) {
  return requestCache.get(cacheKey);
}

const request = apiCall(endpoint, params);
requestCache.set(cacheKey, request);

// Clear cache after 5 minutes
setTimeout(() => requestCache.delete(cacheKey), 5 * 60 * 1000);

return request;
```

### Data Compression

```javascript
// Request compressed responses
const apiCall = async (endpoint, options = {}) => {
  return fetch(endpoint, {
    ...options,
    headers: {
      'Accept-Encoding': 'gzip, br',
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
};
```

---

**API Version**: v1.0  
**Base URL**: `/api/v1`  
**Authentication**: Bearer token required  
**Rate Limiting**: 100 requests/minute  
**Last Updated**: 2025-08-24