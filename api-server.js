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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-User-Role', 'x-user-id', 'x-user-role', 'x-request-time', 'x-session-id']
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

// Generate user insights using direct queries
const generateUserInsights = async (userId) => {
  try {
    const insights = [];
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const applicableFrom = thirtyDaysAgo.toISOString().split('T')[0];
    const applicableTo = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get user's recent expenses
    const { data: expenses, error } = await supabaseAdmin
      .from('expenses')
      .select(`
        amount,
        expense_date,
        category:categories(name, color)
      `)
      .eq('created_by', userId)
      .gte('expense_date', applicableFrom)
      .eq('is_active', true)
      .order('expense_date', { ascending: false });

    if (error || !expenses || expenses.length === 0) {
      // Generate a "get started" insight if no expenses
      insights.push({
        user_id: userId,
        insight_type: 'getting_started',
        insight_category: 'onboarding',
        title: 'Welcome to Expense Tracking!',
        description: 'Start by adding your first expense to see personalized insights and spending patterns.',
        severity: 'info',
        confidence_score: 1.0,
        metadata: { reason: 'no_expenses' },
        applicable_from: applicableFrom,
        applicable_to: applicableTo,
        is_active: true
      });
      return insights;
    }

    const totalSpending = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const avgDailySpending = totalSpending / 30;

    // Insight 1: Spending summary
    insights.push({
      user_id: userId,
      insight_type: 'spending_summary',
      insight_category: 'overview',
      title: 'Monthly Spending Summary',
      description: `You've spent Rs${totalSpending.toFixed(2)} in the last 30 days across ${expenses.length} transactions. Your average daily spending is Rs${avgDailySpending.toFixed(2)}.`,
      severity: 'info',
      confidence_score: 0.95,
      metadata: { 
        total_spending: totalSpending,
        transaction_count: expenses.length,
        avg_daily: avgDailySpending
      },
      applicable_from: applicableFrom,
      applicable_to: applicableTo,
      is_active: true
    });

    // Insight 2: Category analysis
    const categoryTotals = {};
    expenses.forEach(expense => {
      const categoryName = expense.category?.name || 'Uncategorized';
      if (!categoryTotals[categoryName]) {
        categoryTotals[categoryName] = { total: 0, count: 0 };
      }
      categoryTotals[categoryName].total += parseFloat(expense.amount);
      categoryTotals[categoryName].count += 1;
    });

    const sortedCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b.total - a.total);

    if (sortedCategories.length > 0) {
      const [topCategory, topData] = sortedCategories[0];
      const percentage = (topData.total / totalSpending * 100).toFixed(1);

      if (percentage > 40) {
        insights.push({
          user_id: userId,
          insight_type: 'category_dominance',
          insight_category: 'spending_pattern',
          title: `Heavy Focus on ${topCategory}`,
          description: `${topCategory} accounts for ${percentage}% of your spending (Rs${topData.total.toFixed(2)}). Consider diversifying your expenses or setting category limits.`,
          severity: 'warning',
          confidence_score: 0.85,
          metadata: {
            category: topCategory,
            amount: topData.total,
            percentage: parseFloat(percentage)
          },
          applicable_from: applicableFrom,
          applicable_to: applicableTo,
          is_active: true
        });
      } else {
        insights.push({
          user_id: userId,
          insight_type: 'category_balance',
          insight_category: 'spending_pattern',
          title: 'Balanced Spending Distribution',
          description: `Your top spending category is ${topCategory} at ${percentage}% (Rs${topData.total.toFixed(2)}). This shows good spending diversification.`,
          severity: 'info',
          confidence_score: 0.75,
          metadata: {
            category: topCategory,
            amount: topData.total,
            percentage: parseFloat(percentage)
          },
          applicable_from: applicableFrom,
          applicable_to: applicableTo,
          is_active: true
        });
      }
    }

    // Insight 3: Recent spending trend
    const recentWeek = expenses.filter(exp => 
      new Date(exp.expense_date) >= new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    );
    const recentWeekTotal = recentWeek.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const weeklyAverage = totalSpending * (7/30); // Expected weekly spending based on monthly average

    if (recentWeekTotal > weeklyAverage * 1.5) {
      insights.push({
        user_id: userId,
        insight_type: 'spending_spike',
        insight_category: 'trend_analysis',
        title: 'High Spending Week Detected',
        description: `You've spent Rs${recentWeekTotal.toFixed(2)} this week, which is ${((recentWeekTotal / weeklyAverage - 1) * 100).toFixed(1)}% above your usual weekly average. Consider reviewing recent purchases.`,
        severity: 'alert',
        confidence_score: 0.80,
        metadata: {
          week_spending: recentWeekTotal,
          expected_weekly: weeklyAverage,
          variance_percentage: (recentWeekTotal / weeklyAverage - 1) * 100
        },
        applicable_from: applicableFrom,
        applicable_to: applicableTo,
        is_active: true
      });
    }

    console.log('Generated', insights.length, 'insights for user', userId);
    return insights;
  } catch (error) {
    console.error('Error generating insights:', error);
    return [];
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

// Enhanced User management routes
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { include_stats = false } = req.query;

    let selectFields = 'id, email, full_name, role, created_at, is_active';
    
    // If stats are requested, include expense statistics
    if (include_stats === 'true') {
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select(`
          id, email, full_name, role, created_at, is_active,
          expenses:expenses!expenses_created_by_fkey(
            id,
            amount,
            expense_date
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch users with stats' });
      }

      // Calculate statistics for each user
      const usersWithStats = users.map(user => {
        const activeExpenses = user.expenses?.filter(exp => exp.expense_date) || [];
        const totalAmount = activeExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        const thisMonthExpenses = activeExpenses.filter(exp => exp.expense_date?.startsWith(currentMonth));
        const thisMonthAmount = thisMonthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

        return {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          created_at: user.created_at,
          is_active: user.is_active,
          stats: {
            totalExpenses: activeExpenses.length,
            totalAmount,
            thisMonthExpenses: thisMonthExpenses.length,
            thisMonthAmount,
            lastExpenseDate: activeExpenses.length > 0 
              ? activeExpenses.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date))[0].expense_date
              : null
          }
        };
      });

      return res.json({ users: usersWithStats });
    }

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(selectFields)
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

// New endpoint: Get user list for filtering (admin only)
app.get('/api/users/list', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, role')
      .eq('is_active', true)
      .order('full_name');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch user list' });
    }

    res.json({ users });
  } catch (error) {
    console.error('Get user list error:', error);
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

    // First, count how many records would be deleted
    const { count: recordsToDelete, error: countError } = await supabaseAdmin
      .from('login_activities')
      .select('*', { count: 'exact', head: true })
      .lt('login_time', twoWeeksAgo.toISOString());

    if (countError) {
      return res.status(500).json({ error: 'Failed to check old login activities' });
    }

    if (recordsToDelete === 0) {
      return res.json({ 
        message: 'No old login activities found to cleanup',
        deletedCount: 0 
      });
    }

    // Delete the old records
    const { error: deleteError } = await supabaseAdmin
      .from('login_activities')
      .delete()
      .lt('login_time', twoWeeksAgo.toISOString());

    if (deleteError) {
      return res.status(500).json({ error: 'Failed to cleanup old login activities' });
    }

    res.json({ 
      message: `Successfully cleaned up ${recordsToDelete} old login activities`,
      deletedCount: recordsToDelete 
    });
  } catch (error) {
    console.error('Cleanup login activities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Record failed login activity (no auth required)
app.post('/api/login-activities/record-failed', async (req, res) => {
  try {
    const { email, ...activityData } = req.body;

    // Get user ID by email using service role
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Insert failed login activity
    const loginActivity = {
      ...activityData,
      user_id: userData.id,
      success: false
    };

    const { error: insertError } = await supabaseAdmin
      .from('login_activities')
      .insert([loginActivity]);

    if (insertError) {
      return res.status(500).json({ error: 'Failed to record login activity' });
    }

    res.json({ message: 'Failed login activity recorded successfully' });
  } catch (error) {
    console.error('Record failed login error:', error);
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

// Enhanced Expense routes with advanced filtering
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      categories,
      category_id,
      user_id,
      start_date,
      end_date,
      date,
      search,
      sort_by = 'expense_date',
      sort_order = 'desc',
      min_amount,
      max_amount
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(Math.max(1, parseInt(limit)), 500); // Max 500 items per page
    const offset = (pageNum - 1) * limitNum;

    // Validate sort parameters
    const validSortColumns = ['expense_date', 'amount', 'description', 'created_at'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'expense_date';
    const sortDirection = sort_order.toLowerCase() === 'asc' ? { ascending: true } : { ascending: false };

    // Base query with joins
    let queryBuilder = supabaseAdmin
      .from('expenses')
      .select(`
        *,
        category:categories(id, name, color),
        created_by_user:users!expenses_created_by_fkey(id, full_name)
      `)
      .eq('is_active', true);

    // Count query for pagination metadata
    let countQueryBuilder = supabaseAdmin
      .from('expenses')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Role-based access control
    if (req.user.role === 'account_officer') {
      // Account officers can only see their own expenses
      queryBuilder = queryBuilder.eq('created_by', req.user.id);
      countQueryBuilder = countQueryBuilder.eq('created_by', req.user.id);
    } else if (req.user.role === 'admin') {
      // Admins can filter by user_id
      if (user_id) {
        queryBuilder = queryBuilder.eq('created_by', user_id);
        countQueryBuilder = countQueryBuilder.eq('created_by', user_id);
      }
    }

    // Date filtering (backward compatibility)
    if (date) {
      queryBuilder = queryBuilder.eq('expense_date', date);
      countQueryBuilder = countQueryBuilder.eq('expense_date', date);
    } else {
      // Date range filtering
      if (start_date) {
        queryBuilder = queryBuilder.gte('expense_date', start_date);
        countQueryBuilder = countQueryBuilder.gte('expense_date', start_date);
      }
      if (end_date) {
        queryBuilder = queryBuilder.lte('expense_date', end_date);
        countQueryBuilder = countQueryBuilder.lte('expense_date', end_date);
      }
    }

    // Category filtering (supports both single category_id and multiple categories)
    if (categories || category_id) {
      let categoryIds = [];
      
      // Helper function to validate UUID format
      const isValidUUID = (uuid) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
      };
      
      // Handle multiple categories parameter (comma-separated UUIDs)
      if (categories) {
        const categoryList = categories.split(',').map(id => id.trim()).filter(id => id && isValidUUID(id));
        categoryIds.push(...categoryList);
      }
      
      // Handle single category_id parameter (from frontend - UUID format)
      if (category_id) {
        const trimmedCategoryId = category_id.trim();
        if (trimmedCategoryId && isValidUUID(trimmedCategoryId)) {
          categoryIds.push(trimmedCategoryId);
        }
      }
      
      // Apply category filter if we have valid category UUIDs
      if (categoryIds.length > 0) {
        // Remove duplicates
        categoryIds = [...new Set(categoryIds)];
        
        // Debug logging for category filtering
        console.log('[EXPENSE API] Category filter applied:', {
          filterType: categoryIds.length === 1 ? 'single' : 'multiple',
          categoryIds: categoryIds,
          originalParams: { categories, category_id }
        });
        
        if (categoryIds.length === 1) {
          // Single category filter
          queryBuilder = queryBuilder.eq('category_id', categoryIds[0]);
          countQueryBuilder = countQueryBuilder.eq('category_id', categoryIds[0]);
        } else {
          // Multiple categories filter
          queryBuilder = queryBuilder.in('category_id', categoryIds);
          countQueryBuilder = countQueryBuilder.in('category_id', categoryIds);
        }
      }
    }

    // Amount range filtering
    if (min_amount && !isNaN(parseFloat(min_amount))) {
      queryBuilder = queryBuilder.gte('amount', parseFloat(min_amount));
      countQueryBuilder = countQueryBuilder.gte('amount', parseFloat(min_amount));
    }
    if (max_amount && !isNaN(parseFloat(max_amount))) {
      queryBuilder = queryBuilder.lte('amount', parseFloat(max_amount));
      countQueryBuilder = countQueryBuilder.lte('amount', parseFloat(max_amount));
    }

    // Text search in description and notes
    if (search && search.trim()) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      queryBuilder = queryBuilder.or(`description.ilike.${searchTerm},notes.ilike.${searchTerm}`);
      countQueryBuilder = countQueryBuilder.or(`description.ilike.${searchTerm},notes.ilike.${searchTerm}`);
    }

    // Apply sorting and pagination
    queryBuilder = queryBuilder
      .order(sortColumn, sortDirection)
      .range(offset, offset + limitNum - 1);

    // Execute both queries concurrently
    const [expensesResult, countResult] = await Promise.all([
      queryBuilder,
      countQueryBuilder
    ]);

    const { data: expenses, error } = expensesResult;
    const { count: totalCount, error: countError } = countResult;

    if (error) {
      console.error('Expenses query error:', error);
      return res.status(500).json({ error: 'Failed to fetch expenses' });
    }

    if (countError) {
      console.error('Count query error:', countError);
      return res.status(500).json({ error: 'Failed to count expenses' });
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      expenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        categories: categories ? categories.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : null,
        user_id: user_id || null,
        start_date: start_date || null,
        end_date: end_date || null,
        search: search || null,
        sort_by: sortColumn,
        sort_order: sort_order.toLowerCase(),
        min_amount: min_amount ? parseFloat(min_amount) : null,
        max_amount: max_amount ? parseFloat(max_amount) : null
      }
    });
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
    const { period = 'monthly', year = new Date().getFullYear(), start_date, end_date } = req.query;

    let queryBuilder = supabaseAdmin
      .from('expenses')
      .select('amount, expense_date, category:categories(name, color)')
      .eq('is_active', true);

    if (req.user.role === 'account_officer') {
      queryBuilder = queryBuilder.eq('created_by', req.user.id);
    }

    // Use specific date range if provided, otherwise use full year
    if (start_date && end_date) {
      queryBuilder = queryBuilder
        .gte('expense_date', start_date)
        .lte('expense_date', end_date);
    } else {
      queryBuilder = queryBuilder
        .gte('expense_date', `${year}-01-01`)
        .lte('expense_date', `${year}-12-31`);
    }

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

// New API endpoint for combined monthly-category breakdown
app.get('/api/analytics/monthly-category-breakdown', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, period = 'monthly' } = req.query;
    
    let queryBuilder = supabaseAdmin
      .from('expenses')
      .select('amount, expense_date, category:categories(id, name, color)')
      .eq('is_active', true);

    // Filter by user role
    if (req.user.role === 'account_officer') {
      queryBuilder = queryBuilder.eq('created_by', req.user.id);
    }

    // Apply date filters
    if (start_date) queryBuilder = queryBuilder.gte('expense_date', start_date);
    if (end_date) queryBuilder = queryBuilder.lte('expense_date', end_date);

    const { data: expenses, error } = await queryBuilder.order('expense_date');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch monthly category breakdown' });
    }

    // Process data to create monthly breakdown with category details
    const monthlyData = {};
    const categoryColors = {};

    expenses.forEach(expense => {
      const date = new Date(expense.expense_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const categoryName = expense.category?.name || 'Uncategorized';
      const categoryColor = expense.category?.color || '#64748B';
      const amount = parseFloat(expense.amount);

      // Store category color for consistency
      if (!categoryColors[categoryName]) {
        categoryColors[categoryName] = categoryColor;
      }

      // Initialize month if not exists
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: new Date(monthKey + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          monthKey,
          total: 0,
          categories: {}
        };
      }

      // Initialize category if not exists
      if (!monthlyData[monthKey].categories[categoryName]) {
        monthlyData[monthKey].categories[categoryName] = {
          value: 0,
          count: 0,
          color: categoryColor
        };
      }

      // Add expense to month and category
      monthlyData[monthKey].total += amount;
      monthlyData[monthKey].categories[categoryName].value += amount;
      monthlyData[monthKey].categories[categoryName].count += 1;
    });

    // Convert to array format suitable for stacked bar chart
    const breakdown = Object.values(monthlyData).map(monthData => {
      const result = {
        month: monthData.month,
        monthKey: monthData.monthKey,
        total: monthData.total,
        ...monthData.categories
      };

      // Add individual category values as direct properties for recharts
      Object.keys(monthData.categories).forEach(categoryName => {
        result[categoryName] = monthData.categories[categoryName].value;
      });

      return result;
    }).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

    res.json({ 
      breakdown, 
      categoryColors,
      categoryList: Object.keys(categoryColors)
    });

  } catch (error) {
    console.error('Monthly category breakdown error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New Phase 2 Analytics Routes - Yearly Analysis
app.get('/api/analytics/available-years', authenticateToken, async (req, res) => {
  try {
    // Admin can see all years, account officers see only their own data
    const isAdmin = req.user.role === 'admin';

    const { data: years, error } = await supabaseAdmin
      .rpc('get_available_years');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch available years' });
    }

    // Filter years for account officers if needed
    let filteredYears = years;
    if (!isAdmin) {
      // For account officers, we need to filter by their own data
      // This requires a custom query since the function returns all data
      const { data: userYears, error: userError } = await supabaseAdmin
        .from('expenses')
        .select('expense_date')
        .eq('created_by', req.user.id)
        .eq('is_active', true);

      if (userError) {
        return res.status(500).json({ error: 'Failed to fetch user expense years' });
      }

      // Extract unique years from user's expenses
      const userYearSet = new Set();
      userYears.forEach(expense => {
        const year = new Date(expense.expense_date).getFullYear();
        userYearSet.add(year);
      });

      filteredYears = years.filter(yearData => userYearSet.has(yearData.year));
    }

    res.json({ years: filteredYears });
  } catch (error) {
    console.error('Available years error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/analytics/yearly-breakdown', authenticateToken, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const isAdmin = req.user.role === 'admin';
    const targetUserId = isAdmin ? null : req.user.id;

    console.log('Yearly breakdown request:', { year, isAdmin, targetUserId });

    // Use direct queries instead of broken function
    let queryBuilder = supabaseAdmin
      .from('expenses')
      .select(`
        expense_date,
        amount,
        category:categories(name, color)
      `)
      .gte('expense_date', `${year}-01-01`)
      .lte('expense_date', `${year}-12-31`)
      .eq('is_active', true);

    // Filter by user if not admin
    if (targetUserId) {
      queryBuilder = queryBuilder.eq('created_by', targetUserId);
    }

    const { data: expenses, error } = await queryBuilder;

    if (error) {
      console.error('Yearly breakdown query error:', error);
      return res.status(500).json({ error: 'Failed to fetch yearly breakdown' });
    }

    console.log('Found', expenses?.length || 0, 'expenses for year', year);

    // Group expenses by month
    const monthlyData = {};
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthShorts = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Initialize all 12 months
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = {
        month: i,
        month_name: monthNames[i - 1],
        month_short: monthShorts[i - 1],
        total_amount: 0,
        expense_count: 0,
        avg_amount: 0,
        top_category: null,
        top_category_amount: 0,
        categories_used: 0,
        vs_previous_month: 0,
        vs_same_month_last_year: 0,
        is_highest_month: false,
        is_lowest_month: false
      };
    }

    // Process expenses
    const categoryTotals = {};
    expenses?.forEach(expense => {
      const expenseDate = new Date(expense.expense_date);
      const month = expenseDate.getMonth() + 1;
      const amount = parseFloat(expense.amount);

      monthlyData[month].total_amount += amount;
      monthlyData[month].expense_count += 1;

      // Track categories
      const categoryKey = `${month}-${expense.category?.name || 'Uncategorized'}`;
      if (!categoryTotals[categoryKey]) {
        categoryTotals[categoryKey] = {
          month,
          category: expense.category?.name || 'Uncategorized',
          total: 0
        };
      }
      categoryTotals[categoryKey].total += amount;
    });

    // Calculate averages and find top categories
    Object.values(monthlyData).forEach(monthData => {
      if (monthData.expense_count > 0) {
        monthData.avg_amount = monthData.total_amount / monthData.expense_count;
        
        // Find top category for this month
        const monthCategories = Object.values(categoryTotals)
          .filter(cat => cat.month === monthData.month)
          .sort((a, b) => b.total - a.total);
        
        if (monthCategories.length > 0) {
          monthData.top_category = monthCategories[0].category;
          monthData.top_category_amount = monthCategories[0].total;
          monthData.categories_used = monthCategories.length;
        }
      }
    });

    // Calculate comparisons and find highest/lowest
    const breakdown = Object.values(monthlyData);
    const nonZeroMonths = breakdown.filter(m => m.total_amount > 0);
    
    if (nonZeroMonths.length > 0) {
      const maxAmount = Math.max(...breakdown.map(m => m.total_amount));
      const minAmount = Math.min(...nonZeroMonths.map(m => m.total_amount));
      
      breakdown.forEach((monthData, index) => {
        // Previous month comparison
        if (index > 0) {
          monthData.vs_previous_month = monthData.total_amount - breakdown[index - 1].total_amount;
        }
        
        // Highest/lowest flags
        monthData.is_highest_month = monthData.total_amount === maxAmount && monthData.total_amount > 0;
        monthData.is_lowest_month = monthData.total_amount === minAmount && monthData.total_amount > 0;
      });
    }

    // Calculate additional metrics
    const totalSpending = breakdown.reduce((sum, month) => sum + month.total_amount, 0);
    const avgMonthlySpending = totalSpending / 12;
    const activeMonths = breakdown.filter(month => month.total_amount > 0).length;
    
    const highestMonth = breakdown.reduce((max, month) => 
      month.total_amount > max.total_amount ? month : max
    , breakdown[0]);
    
    const lowestMonth = nonZeroMonths.reduce((min, month) => 
      month.total_amount < min.total_amount ? month : min
    , nonZeroMonths[0] || {});

    const yearlyMetrics = {
      totalSpending,
      avgMonthlySpending,
      activeMonths,
      highestMonth: {
        month: highestMonth?.month_name || 'N/A',
        amount: highestMonth?.total_amount || 0
      },
      lowestMonth: {
        month: lowestMonth?.month_name || 'N/A',
        amount: lowestMonth?.total_amount || 0
      }
    };

    console.log('Yearly metrics:', yearlyMetrics);

    res.json({ 
      year: parseInt(year),
      breakdown,
      metrics: yearlyMetrics
    });
  } catch (error) {
    console.error('Yearly breakdown error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Phase 3 Analytics Routes - Year-over-Year Comparison
app.get('/api/analytics/year-comparison', authenticateToken, async (req, res) => {
  try {
    const { 
      base_year = new Date().getFullYear() - 1, 
      compare_year = new Date().getFullYear() 
    } = req.query;

    const isAdmin = req.user.role === 'admin';
    const targetUserId = isAdmin ? null : req.user.id;

    // Get detailed monthly comparison - FIXED: Use correct parameter names
    const { data: monthlyComparison, error: monthlyError } = await supabaseAdmin
      .rpc('calculate_year_comparison', {
        p_base_year: parseInt(base_year),
        p_compare_year: parseInt(compare_year),
        p_user_id: targetUserId
      });

    if (monthlyError) {
      return res.status(500).json({ error: 'Failed to fetch monthly comparison' });
    }

    // Get summary statistics
    const { data: summaryData, error: summaryError } = await supabaseAdmin
      .rpc('get_year_comparison_summary', {
        base_year: parseInt(base_year),
        compare_year: parseInt(compare_year),
        user_id: targetUserId
      });

    if (summaryError) {
      return res.status(500).json({ error: 'Failed to fetch comparison summary' });
    }

    // Get category comparison
    const { data: categoryComparison, error: categoryError } = await supabaseAdmin
      .rpc('get_category_year_comparison', {
        base_year: parseInt(base_year),
        compare_year: parseInt(compare_year),
        user_id: targetUserId
      });

    if (categoryError) {
      return res.status(500).json({ error: 'Failed to fetch category comparison' });
    }

    res.json({
      baseYear: parseInt(base_year),
      compareYear: parseInt(compare_year),
      monthlyComparison,
      summary: summaryData[0] || {},
      categoryComparison
    });
  } catch (error) {
    console.error('Year comparison error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Phase 4 Analytics Routes - Intelligent Insights
app.get('/api/analytics/insights', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, refresh = false } = req.query;
    const isAdmin = req.user.role === 'admin';
    const targetUserId = req.user.id;

    console.log('Insights request:', { userId: targetUserId, isAdmin, limit, refresh });

    // Try to get existing insights from cache first
    let { data: userInsights, error: userError } = await supabaseAdmin
      .from('insights_cache')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .gte('applicable_to', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // If no cached insights or refresh requested, generate new ones
    if (!userInsights || userInsights.length === 0 || refresh === 'true') {
      console.log('Generating new insights for user:', targetUserId);
      
      // Generate insights using direct queries instead of broken functions
      const generatedInsights = await generateUserInsights(targetUserId);
      
      // Clear old insights
      await supabaseAdmin
        .from('insights_cache')
        .delete()
        .eq('user_id', targetUserId);

      // Insert new insights
      if (generatedInsights.length > 0) {
        const { error: insertError } = await supabaseAdmin
          .from('insights_cache')
          .insert(generatedInsights);

        if (insertError) {
          console.error('Failed to cache insights:', insertError);
        }
      }

      userInsights = generatedInsights;
    }

    if (userError && !userInsights) {
      console.error('User insights error:', userError);
      return res.status(500).json({ error: 'Failed to fetch user insights' });
    }

    let systemInsights = [];
    
    // If admin, also get system-wide insights
    if (isAdmin) {
      const { data: adminInsights, error: adminError } = await supabaseAdmin
        .from('insights_cache')
        .select('*')
        .is('user_id', null) // System-wide insights have null user_id
        .eq('is_active', true)
        .gte('applicable_to', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(5);

      if (!adminError && adminInsights) {
        systemInsights = adminInsights;
      }
    }

    // Categorize insights by type
    const categorizedInsights = {
      critical: [],
      alerts: [],
      warnings: [],
      recommendations: [],
      systemwide: systemInsights
    };

    userInsights.forEach(insight => {
      switch (insight.severity) {
        case 'critical':
          categorizedInsights.critical.push(insight);
          break;
        case 'alert':
          categorizedInsights.alerts.push(insight);
          break;
        case 'warning':
          categorizedInsights.warnings.push(insight);
          break;
        case 'info':
          categorizedInsights.recommendations.push(insight);
          break;
      }
    });

    // Generate summary statistics
    const summary = {
      totalInsights: userInsights.length,
      criticalCount: categorizedInsights.critical.length,
      alertCount: categorizedInsights.alerts.length,
      warningCount: categorizedInsights.warnings.length,
      recommendationCount: categorizedInsights.recommendations.length,
      systemwideCount: categorizedInsights.systemwide.length,
      avgConfidenceScore: userInsights.length > 0 
        ? userInsights.reduce((sum, insight) => sum + parseFloat(insight.confidence_score || 0), 0) / userInsights.length 
        : 0,
      lastUpdated: userInsights.length > 0 ? userInsights[0].created_at : null
    };

    console.log('Insights summary:', summary);

    res.json({
      insights: categorizedInsights,
      summary,
      isAdmin,
      userId: req.user.id
    });
  } catch (error) {
    console.error('Insights error:', error);
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

// =====================================================
// BUDGET SETTINGS ROUTES
// =====================================================

// Get user budget settings
app.get('/api/budget/settings', authenticateToken, async (req, res) => {
  try {
    // First try to get existing settings
    const { data: settings, error } = await supabaseAdmin
      .from('user_budget_settings')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Budget settings fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch budget settings' });
    }

    // If no settings exist, create default ones
    if (!settings) {
      const { data: newSettings, error: insertError } = await supabaseAdmin
        .from('user_budget_settings')
        .insert({
          user_id: req.user.id,
          monthly_budget: 50000,
          warning_threshold: 0.8,
          emergency_threshold: 0.95,
          currency_code: 'INR'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Budget settings creation error:', insertError);
        // Return default settings even if insertion fails
        return res.json({
          settings: {
            monthly_budget: 50000,
            warning_threshold: 0.8,
            emergency_threshold: 0.95,
            currency_code: 'INR'
          }
        });
      }

      return res.json({ settings: newSettings });
    }

    res.json({ settings });
  } catch (error) {
    console.error('Budget settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user budget settings
app.put('/api/budget/settings', authenticateToken, async (req, res) => {
  try {
    const {
      monthly_budget,
      warning_threshold,
      emergency_threshold,
      currency_code
    } = req.body;

    // Validate input
    if (!monthly_budget || monthly_budget <= 0) {
      return res.status(400).json({ error: 'Monthly budget must be greater than 0' });
    }

    if (warning_threshold !== undefined && (warning_threshold < 0 || warning_threshold > 1)) {
      return res.status(400).json({ error: 'Warning threshold must be between 0 and 1' });
    }

    if (emergency_threshold !== undefined && (emergency_threshold < 0 || emergency_threshold > 1)) {
      return res.status(400).json({ error: 'Emergency threshold must be between 0 and 1' });
    }

    if (warning_threshold && emergency_threshold && warning_threshold >= emergency_threshold) {
      return res.status(400).json({ error: 'Warning threshold must be less than emergency threshold' });
    }

    // Try to update existing settings or insert new ones
    const { data: settings, error } = await supabaseAdmin
      .from('user_budget_settings')
      .upsert({
        user_id: req.user.id,
        monthly_budget,
        warning_threshold: warning_threshold || 0.8,
        emergency_threshold: emergency_threshold || 0.95,
        currency_code: currency_code || 'INR',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Budget settings update error:', error);
      return res.status(500).json({ error: 'Failed to update budget settings' });
    }

    res.json({ 
      success: true, 
      message: 'Budget settings updated successfully',
      settings 
    });
  } catch (error) {
    console.error('Budget settings update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user budget settings (reset to defaults)
app.delete('/api/budget/settings', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('user_budget_settings')
      .update({ is_active: false })
      .eq('user_id', req.user.id);

    if (error) {
      console.error('Budget settings delete error:', error);
      return res.status(500).json({ error: 'Failed to reset budget settings' });
    }

    res.json({ 
      success: true, 
      message: 'Budget settings reset to defaults' 
    });
  } catch (error) {
    console.error('Budget settings delete error:', error);
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
  console.log('\n' + '='.repeat(60));
  console.log('🚀 EXPENSE TRACKER API SERVER STARTED');
  console.log('='.repeat(60));
  console.log(`📡 API Server: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Endpoints: ${PORT}/api/expenses, ${PORT}/api/bulk-recategorize`);
  console.log(`🔐 Supabase Integration: ACTIVE`);
  console.log('='.repeat(60));
  console.log('💡 Frontend should be running on http://localhost:5173');
  console.log('🌐 Full App: Frontend + API working together');
  console.log('='.repeat(60) + '\n');
});

module.exports = app;