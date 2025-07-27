# Database Setup Instructions

## Overview
This directory contains the database schema and performance optimization files for the Expense Tracker application.

## Files

### `supabase_auth_schema_fixed.sql` ⭐ **MAIN SCHEMA FILE**
- **Purpose:** Complete database schema with RLS policies, triggers, and test users
- **Status:** Production-ready, includes authentication setup
- **Features:** Users, categories, expenses, login activities tables with proper indexes
- **Test Users:** Creates admin1@test.com and officer1@test.com with passwords

### `performance_optimizations.sql` ⭐ **PERFORMANCE ENHANCEMENTS**
- **Purpose:** Materialized views, composite indexes, and analytics functions
- **Status:** Optional but recommended for production
- **Features:** Analytics views, smart refresh functions, monitoring tools
- **Run After:** Execute after main schema for optimal performance

## Setup Process

### Step 1: Execute Main Database Schema
1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Copy entire contents of `supabase_auth_schema_fixed.sql`
4. Paste and execute
5. Verify no errors in output

### Step 2: Execute Performance Optimizations (Recommended)
1. In Supabase SQL Editor
2. Copy entire contents of `performance_optimizations.sql`
3. Paste and execute
4. Verify materialized views are created

### Step 3: Test User Access
The main schema automatically creates test users:
- **Admin:** admin1@test.com / admin1
- **Officer:** officer1@test.com / officer1

These users are ready to use immediately after schema execution.

### Step 4: Verification
Run these queries in SQL Editor to verify setup:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check RLS policies (should see new safe policies)
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Test user role function (replace with actual user ID)
SELECT get_user_role(auth.uid());

-- Verify demo users exist
SELECT id, email, full_name, role FROM users;

-- Check default categories
SELECT name, description, color FROM categories;
```

## What's Fixed

### ✅ RLS Circular Dependency Resolution
- Removed `user_role()` function that queried users table
- Created `get_user_role()` and `is_admin()` with `SECURITY DEFINER`
- Simple RLS policies without recursive function calls
- Proper service role access for API operations

### ✅ Frontend Component Issues
- Fixed infinite recursion in `OptimizedExpenseList.jsx`
- Enhanced authentication context with timeout failsafe
- Improved dashboard tab calculation logic
- Better error handling throughout auth flow

### ✅ Database Performance
- Added proper indexes for common queries
- Optimized RLS policies for performance
- Cleanup functions for maintenance
- Proper triggers for timestamp updates

## Expected Results After Migration

1. **Page refresh works properly** - No stuck loading
2. **All 7 dashboard tabs visible** - Admin privileges detected
3. **Logout works without blank page** - Clean auth state transitions
4. **ExpenseList loads properly** - No infinite recursion
5. **Filter functionality accessible** - "Show Filters" button works
6. **Database queries succeed** - No RLS blocking issues

## Troubleshooting

### If Authentication Still Fails
1. Check browser console for errors
2. Verify environment variables in `.env`
3. Confirm demo users exist in auth.users table
4. Test direct database queries with service role

### If RLS Issues Persist
1. Verify all policies were created successfully
2. Check function permissions with `\df` in SQL editor
3. Test user role function: `SELECT get_user_role('user-uuid-here');`

### If Components Still Have Issues
1. Clear browser cache and localStorage
2. Restart development servers
3. Check console for JavaScript errors
4. Verify Supabase client initialization

## Support
For issues with this setup, check:
1. Browser console errors
2. Supabase logs in dashboard
3. Network tab for failed API calls
4. Documentation in `CLAUDE.md`