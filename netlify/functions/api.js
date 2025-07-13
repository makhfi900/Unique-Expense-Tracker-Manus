const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const csvParser = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Authentication middleware
const authenticateToken = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Route handlers
const routes = {
  // Authentication routes
  'POST /auth/login': async (body, user, event) => {
    const { email, password } = body;

    if (!email || !password) {
      return { statusCode: 400, body: { error: 'Email and password are required' } };
    }

    const { data: userRecord, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    // Extract request information for login activity tracking
    const clientIP = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown';
    const userAgent = event.headers['user-agent'] || 'unknown';
    
    // Parse user agent for device and browser info
    const deviceInfo = parseUserAgent(userAgent);

    if (error || !userRecord) {
      // Record failed login attempt
      if (userRecord) {
        await recordLoginActivity(userRecord.id, clientIP, userAgent, deviceInfo, false, 'Invalid password');
      }
      return { statusCode: 401, body: { error: 'Invalid credentials' } };
    }

    const isValidPassword = await bcrypt.compare(password, userRecord.password_hash);
    if (!isValidPassword) {
      // Record failed login attempt
      await recordLoginActivity(userRecord.id, clientIP, userAgent, deviceInfo, false, 'Invalid password');
      return { statusCode: 401, body: { error: 'Invalid credentials' } };
    }

    // Record successful login activity
    await recordLoginActivity(userRecord.id, clientIP, userAgent, deviceInfo, true);

    const token = jwt.sign(
      { userId: userRecord.id, email: userRecord.email, role: userRecord.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      statusCode: 200,
      body: {
        token,
        user: {
          id: userRecord.id,
          email: userRecord.email,
          full_name: userRecord.full_name,
          role: userRecord.role,
        },
      },
    };
  },

  'POST /auth/register': async (body, user) => {
    // Only admins can create new users
    if (!user || user.role !== 'admin') {
      return { statusCode: 403, body: { error: 'Only admins can create new users' } };
    }

    const { email, password, full_name, role } = body;

    if (!email || !password || !full_name || !role) {
      return { statusCode: 400, body: { error: 'All fields are required' } };
    }

    if (!['admin', 'account_officer'].includes(role)) {
      return { statusCode: 400, body: { error: 'Invalid role' } };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          email: email.toLowerCase(),
          password_hash: hashedPassword,
          full_name,
          role,
        },
      ])
      .select('id, email, full_name, role')
      .single();

    if (error) {
      if (error.code === '23505') {
        return { statusCode: 409, body: { error: 'Email already exists' } };
      }
      return { statusCode: 500, body: { error: 'Failed to create user' } };
    }

    return { statusCode: 201, body: { user: newUser } };
  },

  // User management routes
  'GET /users': async (body, user) => {
    if (!user || user.role !== 'admin') {
      return { statusCode: 403, body: { error: 'Admin access required' } };
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return { statusCode: 500, body: { error: 'Failed to fetch users' } };
    }

    return { statusCode: 200, body: { users } };
  },

  'PUT /users/:id': async (body, user, params) => {
    if (!user || user.role !== 'admin') {
      return { statusCode: 403, body: { error: 'Admin access required' } };
    }

    const { id } = params;
    const { full_name, role, is_active } = body;

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (role !== undefined) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, email, full_name, role, is_active')
      .single();

    if (error) {
      return { statusCode: 500, body: { error: 'Failed to update user' } };
    }

    return { statusCode: 200, body: { user: updatedUser } };
  },

  // Login activity routes
  'GET /login-activities': async (body, user, params, query) => {
    if (!user || user.role !== 'admin') {
      return { statusCode: 403, body: { error: 'Admin access required' } };
    }

    const { user_id, limit = 100, offset = 0 } = query;

    let queryBuilder = supabase
      .from('login_activities')
      .select(`
        *,
        users!inner(email, full_name)
      `)
      .order('login_time', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by specific user if requested
    if (user_id) {
      queryBuilder = queryBuilder.eq('user_id', user_id);
    }

    const { data: activities, error } = await queryBuilder;

    if (error) {
      return { statusCode: 500, body: { error: 'Failed to fetch login activities' } };
    }

    return { statusCode: 200, body: { activities } };
  },

  'DELETE /login-activities/cleanup': async (body, user) => {
    if (!user || user.role !== 'admin') {
      return { statusCode: 403, body: { error: 'Admin access required' } };
    }

    // Clean up login activities older than 2 weeks
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const { error } = await supabase
      .from('login_activities')
      .delete()
      .lt('login_time', twoWeeksAgo.toISOString());

    if (error) {
      return { statusCode: 500, body: { error: 'Failed to cleanup old login activities' } };
    }

    return { statusCode: 200, body: { message: 'Old login activities cleaned up successfully' } };
  },

  // Category routes
  'GET /categories': async (body, user) => {
    if (!user) {
      return { statusCode: 401, body: { error: 'Authentication required' } };
    }

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      return { statusCode: 500, body: { error: 'Failed to fetch categories' } };
    }

    return { statusCode: 200, body: { categories } };
  },

  'POST /categories': async (body, user) => {
    if (!user) {
      return { statusCode: 401, body: { error: 'Authentication required' } };
    }

    const { name, description, color } = body;

    if (!name) {
      return { statusCode: 400, body: { error: 'Category name is required' } };
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert([
        {
          name,
          description,
          color: color || '#3B82F6',
          created_by: user.id,
        },
      ])
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return { statusCode: 409, body: { error: 'Category name already exists' } };
      }
      return { statusCode: 500, body: { error: 'Failed to create category' } };
    }

    return { statusCode: 201, body: { category } };
  },

  'PUT /categories/:id': async (body, user, params) => {
    if (!user || user.role !== 'admin') {
      return { statusCode: 403, body: { error: 'Admin access required' } };
    }

    const { id } = params;
    const { name, description, color, is_active } = body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: category, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return { statusCode: 500, body: { error: 'Failed to update category' } };
    }

    return { statusCode: 200, body: { category } };
  },

  // Expense routes
  'GET /expenses': async (body, user, params, query) => {
    if (!user) {
      return { statusCode: 401, body: { error: 'Authentication required' } };
    }

    let queryBuilder = supabase
      .from('expenses')
      .select(`
        *,
        category:categories(id, name, color),
        created_by_user:users!expenses_created_by_fkey(id, full_name)
      `)
      .eq('is_active', true);

    // Role-based filtering
    if (user.role === 'account_officer') {
      // Account officers can only see their own expenses
      queryBuilder = queryBuilder.eq('created_by', user.id);
      
      // If date filter is provided, apply it
      if (query.date) {
        queryBuilder = queryBuilder.eq('expense_date', query.date);
      }
    } else if (user.role === 'admin') {
      // Admins can see all expenses with optional filters
      if (query.date) {
        queryBuilder = queryBuilder.eq('expense_date', query.date);
      }
      if (query.start_date && query.end_date) {
        queryBuilder = queryBuilder
          .gte('expense_date', query.start_date)
          .lte('expense_date', query.end_date);
      }
      if (query.category_id) {
        queryBuilder = queryBuilder.eq('category_id', query.category_id);
      }
      if (query.created_by) {
        queryBuilder = queryBuilder.eq('created_by', query.created_by);
      }
    }

    const { data: expenses, error } = await queryBuilder.order('expense_date', { ascending: false });

    if (error) {
      return { statusCode: 500, body: { error: 'Failed to fetch expenses' } };
    }

    return { statusCode: 200, body: { expenses } };
  },

  'POST /expenses': async (body, user) => {
    if (!user) {
      return { statusCode: 401, body: { error: 'Authentication required' } };
    }

    const { amount, description, category_id, expense_date, receipt_url, notes } = body;

    if (!amount || !description || !category_id || !expense_date) {
      return { statusCode: 400, body: { error: 'Amount, description, category, and date are required' } };
    }

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert([
        {
          amount: parseFloat(amount),
          description,
          category_id,
          expense_date,
          receipt_url,
          notes,
          created_by: user.id,
        },
      ])
      .select(`
        *,
        category:categories(id, name, color),
        created_by_user:users!expenses_created_by_fkey(id, full_name)
      `)
      .single();

    if (error) {
      return { statusCode: 500, body: { error: 'Failed to create expense' } };
    }

    return { statusCode: 201, body: { expense } };
  },

  'PUT /expenses/:id': async (body, user, params) => {
    if (!user) {
      return { statusCode: 401, body: { error: 'Authentication required' } };
    }

    const { id } = params;
    const { amount, description, category_id, expense_date, receipt_url, notes } = body;

    // Check if user can edit this expense
    const { data: existingExpense, error: fetchError } = await supabase
      .from('expenses')
      .select('created_by')
      .eq('id', id)
      .single();

    if (fetchError || !existingExpense) {
      return { statusCode: 404, body: { error: 'Expense not found' } };
    }

    if (user.role !== 'admin' && existingExpense.created_by !== user.id) {
      return { statusCode: 403, body: { error: 'You can only edit your own expenses' } };
    }

    const updateData = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (description !== undefined) updateData.description = description;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (expense_date !== undefined) updateData.expense_date = expense_date;
    if (receipt_url !== undefined) updateData.receipt_url = receipt_url;
    if (notes !== undefined) updateData.notes = notes;

    const { data: expense, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        category:categories(id, name, color),
        created_by_user:users!expenses_created_by_fkey(id, full_name)
      `)
      .single();

    if (error) {
      return { statusCode: 500, body: { error: 'Failed to update expense' } };
    }

    return { statusCode: 200, body: { expense } };
  },

  'DELETE /expenses/:id': async (body, user, params) => {
    if (!user) {
      return { statusCode: 401, body: { error: 'Authentication required' } };
    }

    const { id } = params;

    // Check if user can delete this expense
    const { data: existingExpense, error: fetchError } = await supabase
      .from('expenses')
      .select('created_by')
      .eq('id', id)
      .single();

    if (fetchError || !existingExpense) {
      return { statusCode: 404, body: { error: 'Expense not found' } };
    }

    if (user.role !== 'admin' && existingExpense.created_by !== user.id) {
      return { statusCode: 403, body: { error: 'You can only delete your own expenses' } };
    }

    const { error } = await supabase
      .from('expenses')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      return { statusCode: 500, body: { error: 'Failed to delete expense' } };
    }

    return { statusCode: 200, body: { message: 'Expense deleted successfully' } };
  },

  // Analytics routes
  'GET /analytics/spending-trends': async (body, user, params, query) => {
    if (!user) {
      return { statusCode: 401, body: { error: 'Authentication required' } };
    }

    const { period = 'monthly', year = new Date().getFullYear() } = query;

    let queryBuilder = supabase
      .from('expenses')
      .select('amount, expense_date, category:categories(name, color)')
      .eq('is_active', true);

    // Role-based filtering
    if (user.role === 'account_officer') {
      queryBuilder = queryBuilder.eq('created_by', user.id);
    }

    // Year filtering
    queryBuilder = queryBuilder
      .gte('expense_date', `${year}-01-01`)
      .lte('expense_date', `${year}-12-31`);

    const { data: expenses, error } = await queryBuilder;

    if (error) {
      return { statusCode: 500, body: { error: 'Failed to fetch spending trends' } };
    }

    // Process data based on period
    const trends = {};
    expenses.forEach(expense => {
      const date = new Date(expense.expense_date);
      let key;

      if (period === 'monthly') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === 'yearly') {
        key = date.getFullYear().toString();
      }

      if (!trends[key]) {
        trends[key] = 0;
      }
      trends[key] += parseFloat(expense.amount);
    });

    return { statusCode: 200, body: { trends, period, year } };
  },

  'GET /analytics/category-breakdown': async (body, user, params, query) => {
    if (!user) {
      return { statusCode: 401, body: { error: 'Authentication required' } };
    }

    const { start_date, end_date } = query;

    let queryBuilder = supabase
      .from('expenses')
      .select('amount, category:categories(id, name, color)')
      .eq('is_active', true);

    // Role-based filtering
    if (user.role === 'account_officer') {
      queryBuilder = queryBuilder.eq('created_by', user.id);
    }

    // Date filtering
    if (start_date) queryBuilder = queryBuilder.gte('expense_date', start_date);
    if (end_date) queryBuilder = queryBuilder.lte('expense_date', end_date);

    const { data: expenses, error } = await queryBuilder;

    if (error) {
      return { statusCode: 500, body: { error: 'Failed to fetch category breakdown' } };
    }

    // Process data by category
    const breakdown = {};
    expenses.forEach(expense => {
      const categoryName = expense.category?.name || 'Uncategorized';
      const categoryColor = expense.category?.color || '#64748B';

      if (!breakdown[categoryName]) {
        breakdown[categoryName] = {
          total: 0,
          color: categoryColor,
          count: 0,
        };
      }
      breakdown[categoryName].total += parseFloat(expense.amount);
      breakdown[categoryName].count += 1;
    });

    return { statusCode: 200, body: { breakdown } };
  },

  // CSV Export route
  'GET /expenses/export': async (body, user, params, query) => {
    if (!user) {
      return { statusCode: 401, body: { error: 'Authentication required' } };
    }

    let queryBuilder = supabase
      .from('expenses')
      .select(`
        amount,
        description,
        expense_date,
        notes,
        category:categories(name),
        created_by_user:users!expenses_created_by_fkey(full_name)
      `)
      .eq('is_active', true);

    // Role-based filtering
    if (user.role === 'account_officer') {
      queryBuilder = queryBuilder.eq('created_by', user.id);
    }

    // Date filtering
    if (query.start_date) queryBuilder = queryBuilder.gte('expense_date', query.start_date);
    if (query.end_date) queryBuilder = queryBuilder.lte('expense_date', query.end_date);

    const { data: expenses, error } = await queryBuilder.order('expense_date', { ascending: false });

    if (error) {
      return { statusCode: 500, body: { error: 'Failed to fetch expenses for export' } };
    }

    // Format data for CSV
    const csvData = expenses.map(expense => ({
      Date: expense.expense_date,
      Amount: expense.amount,
      Description: expense.description,
      Category: expense.category?.name || 'Uncategorized',
      Notes: expense.notes || '',
      'Created By': expense.created_by_user?.full_name || '',
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="expenses.csv"',
      },
      body: csvData,
    };
  },
};

// Helper function to parse user agent
const parseUserAgent = (userAgent) => {
  const ua = userAgent.toLowerCase();
  
  // Detect device type
  let deviceType = 'desktop';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    deviceType = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
  }

  // Detect browser
  let browser = 'unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browser = 'Opera';
  }

  // Detect operating system
  let os = 'unknown';
  if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('mac os') || ua.includes('macos')) {
    os = 'macOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
  }

  return { deviceType, browser, os };
};

// Helper function to get location from IP (simplified - in production, use a proper IP geolocation service)
const getLocationFromIP = async (ip) => {
  try {
    // For demo purposes, return mock data
    // In production, integrate with services like ipapi.co, ipgeolocation.io, etc.
    if (ip === 'unknown' || ip.includes('127.0.0.1') || ip.includes('localhost')) {
      return {
        country: 'Local',
        city: 'Local',
        region: 'Local'
      };
    }
    
    // Mock location data - replace with actual API call
    return {
      country: 'Unknown',
      city: 'Unknown', 
      region: 'Unknown'
    };
  } catch (error) {
    return {
      country: 'Unknown',
      city: 'Unknown',
      region: 'Unknown'
    };
  }
};

// Helper function to record login activity
const recordLoginActivity = async (userId, ipAddress, userAgent, deviceInfo, success, failureReason = null) => {
  try {
    const location = await getLocationFromIP(ipAddress);
    
    const { error } = await supabase
      .from('login_activities')
      .insert([
        {
          user_id: userId,
          ip_address: ipAddress,
          user_agent: userAgent,
          device_type: deviceInfo.deviceType,
          browser: deviceInfo.browser,
          operating_system: deviceInfo.os,
          location_country: location.country,
          location_city: location.city,
          location_region: location.region,
          success: success,
          failure_reason: failureReason
        }
      ]);

    if (error) {
      console.error('Failed to record login activity:', error);
    }
  } catch (error) {
    console.error('Error recording login activity:', error);
  }
};

// Main handler function
exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    const method = event.httpMethod;
    const path = event.path.replace('/.netlify/functions/api', '');
    const routeKey = `${method} ${path}`;
    
    // Extract path parameters
    const pathParts = path.split('/').filter(Boolean);
    const params = {};
    
    // Find matching route with parameters
    let matchedRoute = null;
    for (const route in routes) {
      const routeParts = route.split(' ')[1].split('/').filter(Boolean);
      if (routeParts.length === pathParts.length) {
        let isMatch = true;
        const tempParams = {};
        
        for (let i = 0; i < routeParts.length; i++) {
          if (routeParts[i].startsWith(':')) {
            tempParams[routeParts[i].substring(1)] = pathParts[i];
          } else if (routeParts[i] !== pathParts[i]) {
            isMatch = false;
            break;
          }
        }
        
        if (isMatch && route.startsWith(method)) {
          matchedRoute = route;
          Object.assign(params, tempParams);
          break;
        }
      }
    }

    // Use exact match if no parameterized route found
    if (!matchedRoute && routes[routeKey]) {
      matchedRoute = routeKey;
    }

    if (!matchedRoute) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Route not found' }),
      };
    }

    // Parse request body
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        body = event.body;
      }
    }

    // Parse query parameters
    const query = event.queryStringParameters || {};

    // Authenticate user for protected routes
    let user = null;
    if (!matchedRoute.includes('/auth/login')) {
      try {
        user = await authenticateToken(event.headers.authorization || event.headers.Authorization);
      } catch (error) {
        if (!matchedRoute.includes('/auth/')) {
          return {
            statusCode: 401,
            headers: corsHeaders,
            body: JSON.stringify({ error: error.message }),
          };
        }
      }
    }

    // Execute route handler
    const result = await routes[matchedRoute](body, user, params, query, event);

    return {
      statusCode: result.statusCode,
      headers: {
        ...corsHeaders,
        'Content-Type': result.headers?.['Content-Type'] || 'application/json',
        ...(result.headers || {}),
      },
      body: result.headers?.['Content-Type'] === 'text/csv' 
        ? JSON.stringify(result.body) 
        : JSON.stringify(result.body),
    };

  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

