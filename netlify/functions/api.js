const { createClient } = require('@supabase/supabase-js');
const csvParser = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Initialize Supabase clients
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Anon client for auth operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Supabase Auth middleware
const authenticateToken = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  try {
    // Verify the Supabase Auth token
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !authUser) {
      throw new Error('Invalid token');
    }

    // Get user profile from our users table
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      throw new Error('User profile not found');
    }

    return user;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Route handlers
const routes = {
  // Authentication routes (handled by frontend Supabase Auth)
  'POST /auth/login': async (body, user, event) => {
    // This endpoint is no longer used as authentication is handled by Supabase Auth on the frontend
    // It's kept for backward compatibility but returns a not implemented message
    return { 
      statusCode: 501, 
      body: { 
        error: 'Authentication is now handled by Supabase Auth on the frontend',
        message: 'Please use the Supabase Auth login flow instead'
      } 
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

    try {
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
          return { statusCode: 409, body: { error: 'Email already exists' } };
        }
        return { statusCode: 500, body: { error: authError.message } };
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
        return { statusCode: 500, body: { error: 'User created but profile fetch failed' } };
      }

      return { statusCode: 201, body: { user: userProfile } };
    } catch (error) {
      return { statusCode: 500, body: { error: 'Failed to create user' } };
    }
  },

  // User management routes
  'GET /users': async (body, user) => {
    if (!user || user.role !== 'admin') {
      return { statusCode: 403, body: { error: 'Admin access required' } };
    }

    const { data: users, error } = await supabaseAdmin
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

    const { data: updatedUser, error } = await supabaseAdmin
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

    let queryBuilder = supabaseAdmin
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

    // First, count how many records would be deleted
    const { count: recordsToDelete, error: countError } = await supabaseAdmin
      .from('login_activities')
      .select('*', { count: 'exact', head: true })
      .lt('login_time', twoWeeksAgo.toISOString());

    if (countError) {
      return { statusCode: 500, body: { error: 'Failed to check old login activities' } };
    }

    if (recordsToDelete === 0) {
      return { 
        statusCode: 200, 
        body: { 
          message: 'No old login activities found to cleanup',
          deletedCount: 0 
        } 
      };
    }

    // Delete the old records
    const { error: deleteError } = await supabaseAdmin
      .from('login_activities')
      .delete()
      .lt('login_time', twoWeeksAgo.toISOString());

    if (deleteError) {
      return { statusCode: 500, body: { error: 'Failed to cleanup old login activities' } };
    }

    return { 
      statusCode: 200, 
      body: { 
        message: `Successfully cleaned up ${recordsToDelete} old login activities`,
        deletedCount: recordsToDelete 
      } 
    };
  },

  'POST /login-activities/record-failed': async (body, user) => {
    const { email, ...activityData } = body;

    // Get user ID by email using service role
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      return { statusCode: 404, body: { error: 'User not found' } };
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
      return { statusCode: 500, body: { error: 'Failed to record login activity' } };
    }

    return { statusCode: 200, body: { message: 'Failed login activity recorded successfully' } };
  },

  // Category routes
  'GET /categories': async (body, user) => {
    if (!user) {
      return { statusCode: 401, body: { error: 'Authentication required' } };
    }

    const { data: categories, error } = await supabaseAdmin
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

    const { data: category, error } = await supabaseAdmin
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

    const { data: category, error } = await supabaseAdmin
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

    let queryBuilder = supabaseAdmin
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
          created_by: user.id,
        },
      ])
      .select(`
        *,
        category:categories(id, name, color),
        created_by_user:users!expenses_created_by_fkey(id, full_name)
      `)
      .single();

    // Smart refresh of materialized views (only if needed)
    if (!error && expense) {
      try {
        await supabaseAdmin.rpc('smart_refresh_analytics');
      } catch (refreshError) {
        console.error('Failed to refresh analytics views:', refreshError);
        // Don't fail the expense creation if refresh fails
      }
    }

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
    const { data: existingExpense, error: fetchError } = await supabaseAdmin
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
      return { statusCode: 500, body: { error: 'Failed to update expense' } };
    }

    // Smart refresh of materialized views (only if needed)
    try {
      await supabaseAdmin.rpc('smart_refresh_analytics');
    } catch (refreshError) {
      console.error('Failed to refresh analytics views:', refreshError);
      // Don't fail the expense update if refresh fails
    }

    return { statusCode: 200, body: { expense } };
  },

  'DELETE /expenses/:id': async (body, user, params) => {
    if (!user) {
      return { statusCode: 401, body: { error: 'Authentication required' } };
    }

    const { id } = params;

    // Check if user can delete this expense
    const { data: existingExpense, error: fetchError } = await supabaseAdmin
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

    const { error } = await supabaseAdmin
      .from('expenses')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      return { statusCode: 500, body: { error: 'Failed to delete expense' } };
    }

    // Smart refresh of materialized views (only if needed)
    try {
      await supabaseAdmin.rpc('smart_refresh_analytics');
    } catch (refreshError) {
      console.error('Failed to refresh analytics views:', refreshError);
      // Don't fail the expense deletion if refresh fails
    }

    return { statusCode: 200, body: { message: 'Expense deleted successfully' } };
  },

  // Analytics routes
  'GET /analytics/spending-trends': async (body, user, params, query) => {
    if (!user) {
      return { statusCode: 401, body: { error: 'Authentication required' } };
    }

    const { period = 'monthly', year = new Date().getFullYear() } = query;

    let queryBuilder = supabaseAdmin
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

    let queryBuilder = supabaseAdmin
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

  // New Phase 2 Analytics Routes - Yearly Analysis
  'GET /analytics/available-years': async (body, user, params, query) => {
    if (!user) {
      return { statusCode: 401, body: { error: 'Authentication required' } };
    }

    // Admin can see all years, account officers see only their own data
    const isAdmin = user.role === 'admin';

    try {
      const { data: years, error } = await supabaseAdmin
        .rpc('get_available_years');

      if (error) {
        return { statusCode: 500, body: { error: 'Failed to fetch available years' } };
      }

      // Filter years for account officers if needed
      let filteredYears = years;
      if (!isAdmin) {
        // For account officers, we need to filter by their own data
        // This requires a custom query since the function returns all data
        const { data: userYears, error: userError } = await supabaseAdmin
          .from('expenses')
          .select('expense_date')
          .eq('created_by', user.id)
          .eq('is_active', true);

        if (userError) {
          return { statusCode: 500, body: { error: 'Failed to fetch user expense years' } };
        }

        // Extract unique years from user's expenses
        const userYearSet = new Set();
        userYears.forEach(expense => {
          const year = new Date(expense.expense_date).getFullYear();
          userYearSet.add(year);
        });

        filteredYears = years.filter(yearData => userYearSet.has(yearData.year));
      }

      return { statusCode: 200, body: { years: filteredYears } };
    } catch (error) {
      return { statusCode: 500, body: { error: 'Failed to fetch available years' } };
    }
  },

  'GET /analytics/yearly-breakdown': async (body, user, params, query) => {
    if (!user) {
      return { statusCode: 401, body: { error: 'Authentication required' } };
    }

    const { year = new Date().getFullYear() } = query;
    const isAdmin = user.role === 'admin';
    const targetUserId = isAdmin ? null : user.id;

    try {
      const { data: breakdown, error } = await supabaseAdmin
        .rpc('get_yearly_breakdown', { 
          target_year: parseInt(year),
          user_id: targetUserId
        });

      if (error) {
        return { statusCode: 500, body: { error: 'Failed to fetch yearly breakdown' } };
      }

      // Calculate additional metrics
      const totalSpending = breakdown.reduce((sum, month) => sum + parseFloat(month.total_amount || 0), 0);
      const avgMonthlySpending = totalSpending / 12; // Average across all 12 months
      const activeMonths = breakdown.filter(month => parseFloat(month.total_amount || 0) > 0).length;
      
      const highestMonth = breakdown.reduce((max, month) => 
        parseFloat(month.total_amount || 0) > parseFloat(max.total_amount || 0) ? month : max
      , breakdown[0] || {});
      
      const lowestMonth = breakdown.reduce((min, month) => 
        parseFloat(month.total_amount || 0) < parseFloat(min.total_amount || 0) && parseFloat(month.total_amount || 0) > 0 ? month : min
      , breakdown.find(m => parseFloat(m.total_amount || 0) > 0) || {});

      const yearlyMetrics = {
        totalSpending,
        avgMonthlySpending,
        activeMonths,
        highestMonth: {
          month: highestMonth.month_name,
          amount: parseFloat(highestMonth.total_amount || 0)
        },
        lowestMonth: {
          month: lowestMonth.month_name,
          amount: parseFloat(lowestMonth.total_amount || 0)
        }
      };

      return { 
        statusCode: 200, 
        body: { 
          year: parseInt(year),
          breakdown,
          metrics: yearlyMetrics
        } 
      };
    } catch (error) {
      return { statusCode: 500, body: { error: 'Failed to fetch yearly breakdown' } };
    }
  },

  // Phase 3 Analytics Routes - Year-over-Year Comparison
  'GET /analytics/year-comparison': async (body, user, params, query) => {
    if (!user) {
      return { statusCode: 401, body: { error: 'Authentication required' } };
    }

    const { 
      base_year = new Date().getFullYear() - 1, 
      compare_year = new Date().getFullYear() 
    } = query;

    const isAdmin = user.role === 'admin';
    const targetUserId = isAdmin ? null : user.id;

    try {
      // Get detailed monthly comparison
      const { data: monthlyComparison, error: monthlyError } = await supabaseAdmin
        .rpc('calculate_year_comparison', {
          base_year: parseInt(base_year),
          compare_year: parseInt(compare_year),
          user_id: targetUserId
        });

      if (monthlyError) {
        return { statusCode: 500, body: { error: 'Failed to fetch monthly comparison' } };
      }

      // Get summary statistics
      const { data: summaryData, error: summaryError } = await supabaseAdmin
        .rpc('get_year_comparison_summary', {
          base_year: parseInt(base_year),
          compare_year: parseInt(compare_year),
          user_id: targetUserId
        });

      if (summaryError) {
        return { statusCode: 500, body: { error: 'Failed to fetch comparison summary' } };
      }

      // Get category comparison
      const { data: categoryComparison, error: categoryError } = await supabaseAdmin
        .rpc('get_category_year_comparison', {
          base_year: parseInt(base_year),
          compare_year: parseInt(compare_year),
          user_id: targetUserId
        });

      if (categoryError) {
        return { statusCode: 500, body: { error: 'Failed to fetch category comparison' } };
      }

      return {
        statusCode: 200,
        body: {
          baseYear: parseInt(base_year),
          compareYear: parseInt(compare_year),
          monthlyComparison,
          summary: summaryData[0] || {},
          categoryComparison
        }
      };
    } catch (error) {
      return { statusCode: 500, body: { error: 'Failed to fetch year comparison data' } };
    }
  },

  // Phase 4 Analytics Routes - Intelligent Insights
  'GET /analytics/insights': async (body, user, params, query) => {
    if (!user) {
      return { statusCode: 401, body: { error: 'Authentication required' } };
    }

    const { limit = 10, refresh = false } = query;
    const isAdmin = user.role === 'admin';

    try {
      // For admins, they can get system-wide insights, for others only personal insights
      const targetUserId = isAdmin ? user.id : user.id;

      if (refresh === 'true') {
        // Force refresh insights
        await supabaseAdmin.rpc('refresh_insights_cache', { target_user_id: targetUserId });
      }

      // Get user-specific insights
      const { data: userInsights, error: userError } = await supabaseAdmin
        .rpc('get_user_insights', {
          target_user_id: targetUserId,
          limit_count: parseInt(limit)
        });

      if (userError) {
        return { statusCode: 500, body: { error: 'Failed to fetch user insights' } };
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
          ? userInsights.reduce((sum, insight) => sum + parseFloat(insight.confidence_score), 0) / userInsights.length 
          : 0,
        lastUpdated: userInsights.length > 0 ? userInsights[0].created_at : null
      };

      return {
        statusCode: 200,
        body: {
          insights: categorizedInsights,
          summary,
          isAdmin,
          userId: user.id
        }
      };
    } catch (error) {
      return { statusCode: 500, body: { error: 'Failed to fetch insights data' } };
    }
  },

  // CSV Export route
  'GET /expenses/export': async (body, user, params, query) => {
    if (!user) {
      return { statusCode: 401, body: { error: 'Authentication required' } };
    }

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

  // =====================================================
  // BUDGET SETTINGS ROUTES
  // =====================================================

  // Get user budget settings
  'GET /budget/settings': async (body, user, params, query) => {
    if (!user) {
      return { statusCode: 401, body: { error: 'Authentication required' } };
    }

    try {
      // First try to get existing settings
      const { data: settings, error } = await supabaseAdmin
        .from('user_budget_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Budget settings fetch error:', error);
        return { statusCode: 500, body: { error: 'Failed to fetch budget settings' } };
      }

      // If no settings exist, return default ones
      if (!settings) {
        return {
          statusCode: 200,
          body: {
            settings: {
              monthly_budget: 50000,
              warning_threshold: 0.8,
              emergency_threshold: 0.95,
              currency_code: 'INR'
            }
          }
        };
      }

      return { statusCode: 200, body: { settings } };
    } catch (error) {
      console.error('Budget settings error:', error);
      return { statusCode: 500, body: { error: 'Internal server error' } };
    }
  },

  // Update user budget settings
  'PUT /budget/settings': async (body, user, params, query) => {
    if (!user) {
      return { statusCode: 401, body: { error: 'Authentication required' } };
    }

    try {
      const {
        monthly_budget,
        warning_threshold,
        emergency_threshold,
        currency_code
      } = body;

      // Validate input
      if (!monthly_budget || monthly_budget <= 0) {
        return { statusCode: 400, body: { error: 'Monthly budget must be greater than 0' } };
      }

      if (warning_threshold !== undefined && (warning_threshold < 0 || warning_threshold > 1)) {
        return { statusCode: 400, body: { error: 'Warning threshold must be between 0 and 1' } };
      }

      if (emergency_threshold !== undefined && (emergency_threshold < 0 || emergency_threshold > 1)) {
        return { statusCode: 400, body: { error: 'Emergency threshold must be between 0 and 1' } };
      }

      if (warning_threshold && emergency_threshold && warning_threshold >= emergency_threshold) {
        return { statusCode: 400, body: { error: 'Warning threshold must be less than emergency threshold' } };
      }

      // Try to update existing settings or insert new ones
      const { data: settings, error } = await supabaseAdmin
        .from('user_budget_settings')
        .upsert({
          user_id: user.id,
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
        return { statusCode: 500, body: { error: 'Failed to update budget settings' } };
      }

      return {
        statusCode: 200,
        body: {
          success: true,
          message: 'Budget settings updated successfully',
          settings
        }
      };
    } catch (error) {
      console.error('Budget settings update error:', error);
      return { statusCode: 500, body: { error: 'Internal server error' } };
    }
  },

  // Delete user budget settings (reset to defaults)
  'DELETE /budget/settings': async (body, user, params, query) => {
    if (!user) {
      return { statusCode: 401, body: { error: 'Authentication required' } };
    }

    try {
      const { error } = await supabaseAdmin
        .from('user_budget_settings')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) {
        console.error('Budget settings delete error:', error);
        return { statusCode: 500, body: { error: 'Failed to reset budget settings' } };
      }

      return {
        statusCode: 200,
        body: {
          success: true,
          message: 'Budget settings reset to defaults'
        }
      };
    } catch (error) {
      console.error('Budget settings delete error:', error);
      return { statusCode: 500, body: { error: 'Internal server error' } };
    }
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

