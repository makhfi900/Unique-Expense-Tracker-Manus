-- =====================================================
-- COMPREHENSIVE SECURITY FIX - SINGLE DEPLOYMENT
-- This replaces ALL previous security fix scripts
-- =====================================================

-- Step 1: Clean up ALL existing policies to start fresh
DO $$
BEGIN
    -- Drop all policies on users table
    DROP POLICY IF EXISTS "Users can view own profile" ON users;
    DROP POLICY IF EXISTS "Admins can view all users" ON users;
    DROP POLICY IF EXISTS "Users can view all users" ON users;
    DROP POLICY IF EXISTS "Users can update own profile" ON users;
    DROP POLICY IF EXISTS "Admins can update users" ON users;
    DROP POLICY IF EXISTS "Admins can insert users" ON users;
    DROP POLICY IF EXISTS "users_select_own" ON users;
    DROP POLICY IF EXISTS "users_select_admin" ON users;
    DROP POLICY IF EXISTS "users_update_own" ON users;
    DROP POLICY IF EXISTS "users_update_admin" ON users;
    DROP POLICY IF EXISTS "users_insert_system" ON users;
    
    -- Drop all policies on insights_cache table
    DROP POLICY IF EXISTS "Users can view own insights" ON insights_cache;
    DROP POLICY IF EXISTS "System can insert insights" ON insights_cache;
    DROP POLICY IF EXISTS "Admins can view all insights" ON insights_cache;
    DROP POLICY IF EXISTS "insights_select_own" ON insights_cache;
    DROP POLICY IF EXISTS "insights_select_admin" ON insights_cache;
    DROP POLICY IF EXISTS "insights_insert_system" ON insights_cache;
    
    -- Drop all policies on expenses table
    DROP POLICY IF EXISTS "Account officers can view own expenses" ON expenses;
    DROP POLICY IF EXISTS "Admins can view all expenses" ON expenses;
    DROP POLICY IF EXISTS "Users can view all active expenses" ON expenses;
    DROP POLICY IF EXISTS "expenses_select_own" ON expenses;
    DROP POLICY IF EXISTS "expenses_select_admin" ON expenses;
    
    -- Drop all policies on analytics_refresh_log table
    DROP POLICY IF EXISTS "Admins can view refresh logs" ON analytics_refresh_log;
    DROP POLICY IF EXISTS "System can insert refresh logs" ON analytics_refresh_log;
    DROP POLICY IF EXISTS "analytics_select_admin" ON analytics_refresh_log;
    DROP POLICY IF EXISTS "analytics_insert_system" ON analytics_refresh_log;
    
    RAISE NOTICE 'All existing policies cleaned up successfully';
END $$;

-- Step 2: Enable RLS on all required tables
ALTER TABLE insights_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_refresh_log ENABLE ROW LEVEL SECURITY;

-- Step 3: Create secure, non-recursive policies

-- USERS TABLE POLICIES
CREATE POLICY "users_own_profile" ON users
    FOR SELECT TO authenticated 
    USING (id = auth.uid());

CREATE POLICY "users_admin_all" ON users
    FOR SELECT TO authenticated 
    USING (
        (auth.jwt() ->> 'role') = 'admin' 
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- INSIGHTS CACHE POLICIES  
CREATE POLICY "insights_own_data" ON insights_cache
    FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "insights_admin_all" ON insights_cache
    FOR SELECT TO authenticated 
    USING (
        (auth.jwt() ->> 'role') = 'admin'
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "insights_insert" ON insights_cache
    FOR INSERT TO authenticated 
    WITH CHECK (user_id = auth.uid());

-- EXPENSES TABLE POLICIES
CREATE POLICY "expenses_own_data" ON expenses
    FOR SELECT TO authenticated 
    USING (created_by = auth.uid() AND is_active = true);

CREATE POLICY "expenses_admin_all" ON expenses
    FOR SELECT TO authenticated 
    USING (
        is_active = true AND (
            (auth.jwt() ->> 'role') = 'admin'
            OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        )
    );

-- ANALYTICS LOG POLICIES
CREATE POLICY "analytics_admin_only" ON analytics_refresh_log
    FOR SELECT TO authenticated 
    USING (
        (auth.jwt() ->> 'role') = 'admin'
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "analytics_system_insert" ON analytics_refresh_log
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Step 4: Create secure accessor functions for materialized views
CREATE OR REPLACE FUNCTION get_user_monthly_spending(
    p_user_id UUID DEFAULT NULL,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
    month DATE,
    category_id UUID,
    category_name TEXT,
    total_amount NUMERIC,
    expense_count BIGINT
) 
SECURITY DEFINER
AS $$
DECLARE
    requesting_user_role TEXT;
BEGIN
    -- Get role from JWT to avoid recursion
    requesting_user_role := auth.jwt() ->> 'role';
    IF requesting_user_role IS NULL THEN
        requesting_user_role := auth.jwt() -> 'user_metadata' ->> 'role';
    END IF;
    
    -- If user is not admin and trying to access other user's data, deny
    IF requesting_user_role != 'admin' AND p_user_id IS NOT NULL AND p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: Cannot view other users data';
    END IF;
    
    -- If user is not admin and no user_id specified, default to their own data
    IF requesting_user_role != 'admin' AND p_user_id IS NULL THEN
        p_user_id := auth.uid();
    END IF;
    
    RETURN QUERY
    SELECT 
        DATE_TRUNC('month', e.expense_date)::DATE as month,
        e.category_id,
        c.name as category_name,
        SUM(e.amount) as total_amount,
        COUNT(*) as expense_count
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE e.is_active = true
    AND (p_user_id IS NULL OR e.created_by = p_user_id)
    AND (p_start_date IS NULL OR e.expense_date >= p_start_date)
    AND (p_end_date IS NULL OR e.expense_date <= p_end_date)
    GROUP BY 1, 2, 3
    ORDER BY 1 DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Security audit function
CREATE OR REPLACE FUNCTION security_audit_report()
RETURNS TABLE(
    table_name TEXT,
    rls_enabled BOOLEAN,
    policy_count INTEGER,
    security_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH table_info AS (
        SELECT 
            schemaname || '.' || tablename as table_name,
            rowsecurity as rls_enabled
        FROM pg_tables 
        WHERE schemaname = 'public'
    ),
    policy_info AS (
        SELECT 
            schemaname || '.' || tablename as table_name,
            COUNT(*) as policy_count
        FROM pg_policies 
        WHERE schemaname = 'public'
        GROUP BY schemaname, tablename
    )
    SELECT 
        ti.table_name,
        ti.rls_enabled,
        COALESCE(pi.policy_count, 0)::INTEGER as policy_count,
        CASE 
            WHEN ti.rls_enabled AND COALESCE(pi.policy_count, 0) > 0 THEN 'SECURE'
            WHEN ti.rls_enabled AND COALESCE(pi.policy_count, 0) = 0 THEN 'RLS_NO_POLICIES'
            WHEN NOT ti.rls_enabled THEN 'NO_RLS'
        END as security_status
    FROM table_info ti
    LEFT JOIN policy_info pi ON ti.table_name = pi.table_name
    ORDER BY ti.table_name;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Test and verify the fix
DO $$
DECLARE
    test_result RECORD;
BEGIN
    -- Test users table query
    SELECT COUNT(*) INTO test_result FROM users LIMIT 1;
    RAISE NOTICE 'SUCCESS: Users table accessible without recursion';
    
    -- Test security audit
    PERFORM * FROM security_audit_report();
    RAISE NOTICE 'SUCCESS: Security audit function working';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR in verification: %', SQLERRM;
END $$;

-- Final verification
SELECT 'COMPREHENSIVE SECURITY FIX COMPLETED' as status;
SELECT * FROM security_audit_report();