require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase clients
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Anon client for auth operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-User-Role', 'x-user-id', 'x-user-role']
}));
app.use(express.json());

// Supabase Auth middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  try {
    // Verify the Supabase Auth token
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !authUser) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user profile from our users table
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'User profile not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Helper functions
const parseUserAgent = (userAgent) => {
  const ua = userAgent.toLowerCase();
  
  let deviceType = 'desktop';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    deviceType = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
  }

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

const getLocationFromIP = async (ip) => {
  try {
    if (ip === 'unknown' || ip.includes('127.0.0.1') || ip.includes('localhost')) {
      return {
        country: 'Local',
        city: 'Local',
        region: 'Local'
      };
    }
    
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

const recordLoginActivity = async (userId, ipAddress, userAgent, deviceInfo, success, failureReason = null) => {
  try {
    const location = await getLocationFromIP(ipAddress);
    
    const { error } = await supabaseAdmin
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

// Routes

// Authentication routes (handled by frontend Supabase Auth)
app.post('/api/auth/login', async (req, res) => {
  try {
    // This endpoint is no longer used as authentication is handled by Supabase Auth on the frontend
    // It's kept for backward compatibility but returns a not implemented message
    res.status(501).json({ 
      error: 'Authentication is now handled by Supabase Auth on the frontend',
      message: 'Please use the Supabase Auth login flow instead'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create new users' });
    }

    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['admin', 'account_officer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Create user with Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      user_metadata: {
        full_name,
        role
      },
      email_confirm: true
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(409).json({ error: 'Email already exists' });
      }
      return res.status(500).json({ error: authError.message });
    }

    // The user profile will be automatically created by the database trigger
    // Wait a moment and then fetch the created profile
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', authUser.user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ error: 'User created but profile fetch failed' });
    }

    res.status(201).json({ user: userProfile });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User management routes
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, created_at, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { full_name, role, is_active } = req.body;

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (role !== undefined) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, email, full_name, role, is_active')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update user' });
    }

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login activity routes
app.get('/api/login-activities', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { user_id, limit = 100, offset = 0 } = req.query;

    let queryBuilder = supabaseAdmin
      .from('login_activities')
      .select(`
        *,
        users!inner(email, full_name)
      `)
      .order('login_time', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (user_id) {
      queryBuilder = queryBuilder.eq('user_id', user_id);
    }

    const { data: activities, error } = await queryBuilder;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch login activities' });
    }

    res.json({ activities });
  } catch (error) {
    console.error('Get login activities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cleanup old login activities
app.delete('/api/login-activities/cleanup', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Clean up login activities older than 2 weeks
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const { error } = await supabaseAdmin
      .from('login_activities')
      .delete()
      .lt('login_time', twoWeeksAgo.toISOString());

    if (error) {
      return res.status(500).json({ error: 'Failed to cleanup old login activities' });
    }

    res.json({ message: 'Old login activities cleaned up successfully' });
  } catch (error) {
    console.error('Cleanup login activities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Category routes
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .insert([
        {
          name,
          description,
          color: color || '#3B82F6',
          created_by: req.user.id,
        },
      ])
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Category name already exists' });
      }
      return res.status(500).json({ error: 'Failed to create category' });
    }

    res.status(201).json({ category });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { name, description, color, is_active } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update category' });
    }

    res.json({ category });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Expense routes
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    let queryBuilder = supabaseAdmin
      .from('expenses')
      .select(`
        *,
        category:categories(id, name, color),
        created_by_user:users!expenses_created_by_fkey(id, full_name)
      `)
      .eq('is_active', true);

    // Role-based filtering
    if (req.user.role === 'account_officer') {
      queryBuilder = queryBuilder.eq('created_by', req.user.id);
      
      if (req.query.date) {
        queryBuilder = queryBuilder.eq('expense_date', req.query.date);
      }
    } else if (req.user.role === 'admin') {
      if (req.query.date) {
        queryBuilder = queryBuilder.eq('expense_date', req.query.date);
      }
      if (req.query.start_date && req.query.end_date) {
        queryBuilder = queryBuilder
          .gte('expense_date', req.query.start_date)
          .lte('expense_date', req.query.end_date);
      }
      if (req.query.category_id) {
        queryBuilder = queryBuilder.eq('category_id', req.query.category_id);
      }
      if (req.query.created_by) {
        queryBuilder = queryBuilder.eq('created_by', req.query.created_by);
      }
    }

    const { data: expenses, error } = await queryBuilder.order('expense_date', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch expenses' });
    }

    res.json({ expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const { amount, description, category_id, expense_date, receipt_url, notes } = req.body;

    if (!amount || !description || !category_id || !expense_date) {
      return res.status(400).json({ error: 'Amount, description, category, and date are required' });
    }

    const { data: expense, error } = await supabaseAdmin
      .from('expenses')
      .insert([
        {
          amount: parseFloat(amount),
          description,
          category_id,
          expense_date,
          receipt_url,
          notes,
          created_by: req.user.id,
        },
      ])
      .select(`
        *,
        category:categories(id, name, color),
        created_by_user:users!expenses_created_by_fkey(id, full_name)
      `)
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create expense' });
    }

    // Smart refresh of materialized views (only if needed)
    try {
      await supabaseAdmin.rpc('smart_refresh_analytics');
    } catch (refreshError) {
      console.error('Failed to refresh analytics views:', refreshError);
      // Don't fail the expense creation if refresh fails
    }

    res.status(201).json({ expense });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, category_id, expense_date, receipt_url, notes } = req.body;

    // Check if user can edit this expense
    const { data: existingExpense, error: fetchError } = await supabaseAdmin
      .from('expenses')
      .select('created_by')
      .eq('id', id)
      .single();

    if (fetchError || !existingExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (req.user.role !== 'admin' && existingExpense.created_by !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own expenses' });
    }

    const updateData = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (description !== undefined) updateData.description = description;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (expense_date !== undefined) updateData.expense_date = expense_date;
    if (receipt_url !== undefined) updateData.receipt_url = receipt_url;
    if (notes !== undefined) updateData.notes = notes;

    const { data: expense, error } = await supabaseAdmin
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
      return res.status(500).json({ error: 'Failed to update expense' });
    }

    // Smart refresh of materialized views (only if needed)
    try {
      await supabaseAdmin.rpc('smart_refresh_analytics');
    } catch (refreshError) {
      console.error('Failed to refresh analytics views:', refreshError);
      // Don't fail the expense update if refresh fails
    }

    res.json({ expense });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user can delete this expense
    const { data: existingExpense, error: fetchError } = await supabaseAdmin
      .from('expenses')
      .select('created_by')
      .eq('id', id)
      .single();

    if (fetchError || !existingExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (req.user.role !== 'admin' && existingExpense.created_by !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own expenses' });
    }

    const { error } = await supabaseAdmin
      .from('expenses')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete expense' });
    }

    // Smart refresh of materialized views (only if needed)
    try {
      await supabaseAdmin.rpc('smart_refresh_analytics');
    } catch (refreshError) {
      console.error('Failed to refresh analytics views:', refreshError);
      // Don't fail the expense deletion if refresh fails
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analytics routes
app.get('/api/analytics/spending-trends', authenticateToken, async (req, res) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;

    let queryBuilder = supabaseAdmin
      .from('expenses')
      .select('amount, expense_date, category:categories(name, color)')
      .eq('is_active', true);

    if (req.user.role === 'account_officer') {
      queryBuilder = queryBuilder.eq('created_by', req.user.id);
    }

    queryBuilder = queryBuilder
      .gte('expense_date', `${year}-01-01`)
      .lte('expense_date', `${year}-12-31`);

    const { data: expenses, error } = await queryBuilder;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch spending trends' });
    }

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

    res.json({ trends, period, year });
  } catch (error) {
    console.error('Analytics spending trends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/analytics/category-breakdown', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let queryBuilder = supabaseAdmin
      .from('expenses')
      .select('amount, category:categories(id, name, color)')
      .eq('is_active', true);

    if (req.user.role === 'account_officer') {
      queryBuilder = queryBuilder.eq('created_by', req.user.id);
    }

    if (start_date) queryBuilder = queryBuilder.gte('expense_date', start_date);
    if (end_date) queryBuilder = queryBuilder.lte('expense_date', end_date);

    const { data: expenses, error } = await queryBuilder;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch category breakdown' });
    }

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

    res.json({ breakdown });
  } catch (error) {
    console.error('Analytics category breakdown error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CSV Export route
app.get('/api/expenses/export', authenticateToken, async (req, res) => {
  try {
    let queryBuilder = supabaseAdmin
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

    if (req.user.role === 'account_officer') {
      queryBuilder = queryBuilder.eq('created_by', req.user.id);
    }

    if (req.query.start_date) queryBuilder = queryBuilder.gte('expense_date', req.query.start_date);
    if (req.query.end_date) queryBuilder = queryBuilder.lte('expense_date', req.query.end_date);

    const { data: expenses, error } = await queryBuilder.order('expense_date', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch expenses for export' });
    }

    const csvData = expenses.map(expense => ({
      Date: expense.expense_date,
      Amount: expense.amount,
      Description: expense.description,
      Category: expense.category?.name || 'Uncategorized',
      Notes: expense.notes || '',
      'Created By': expense.created_by_user?.full_name || '',
    }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
    res.json(csvData);
  } catch (error) {
    console.error('Export expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API server is running' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;