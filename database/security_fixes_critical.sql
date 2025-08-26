-- CRITICAL SECURITY FIXES - Deploy Immediately
-- This script addresses the most critical RLS policy gaps

-- =====================================================
-- ENABLE RLS ON UNPROTECTED TABLES
-- =====================================================

-- Enable RLS on insights_cache table
ALTER TABLE insights_cache ENABLE ROW LEVEL SECURITY;

-- Enable RLS on analytics_refresh_log table  
ALTER TABLE analytics_refresh_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- INSIGHTS CACHE SECURITY POLICIES
-- =====================================================

-- Users can only view their own insights
CREATE POLICY "Users can view own insights" ON insights_cache
    FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

-- Users can only insert their own insights (system generated)
CREATE POLICY "System can insert insights" ON insights_cache
    FOR INSERT TO authenticated 
    WITH CHECK (user_id = auth.uid());

-- Only admins can view all insights for system management
CREATE POLICY "Admins can view all insights" ON insights_cache
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin' 
            AND users.is_active = true
        )
    );

-- =====================================================
-- ANALYTICS REFRESH LOG SECURITY
-- =====================================================

-- Only admins can view refresh logs
CREATE POLICY "Admins can view refresh logs" ON analytics_refresh_log
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin' 
            AND users.is_active = true
        )
    );

-- Only system can insert refresh logs
CREATE POLICY "System can insert refresh logs" ON analytics_refresh_log
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- FIX OVERLY PERMISSIVE POLICIES
-- =====================================================

-- Drop and recreate users table policies with proper restrictions
DROP POLICY IF EXISTS "Users can view all users" ON users;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT TO authenticated 
    USING (id = auth.uid());

-- Admins can view all user profiles
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users u2
            WHERE u2.id = auth.uid() 
            AND u2.role = 'admin' 
            AND u2.is_active = true
        )
    );

-- =====================================================
-- FIX EXPENSES TABLE POLICIES
-- =====================================================

-- Drop the overly permissive expenses viewing policy
DROP POLICY IF EXISTS "Users can view all active expenses" ON expenses;

-- Account officers can only view their own expenses
CREATE POLICY "Account officers can view own expenses" ON expenses
    FOR SELECT TO authenticated 
    USING (
        created_by = auth.uid() 
        AND is_active = true
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'account_officer' 
            AND users.is_active = true
        )
    );

-- Admins can view all expenses
CREATE POLICY "Admins can view all expenses" ON expenses
    FOR SELECT TO authenticated 
    USING (
        is_active = true 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin' 
            AND users.is_active = true
        )
    );

-- =====================================================
-- SECURE MATERIALIZED VIEWS (FUNCTION-BASED APPROACH)
-- =====================================================

-- Create secure view functions that respect RLS
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
    -- Get the role of the requesting user
    SELECT role INTO requesting_user_role 
    FROM users 
    WHERE id = auth.uid() AND is_active = true;
    
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

-- Create secure category spending function
CREATE OR REPLACE FUNCTION get_secure_category_spending()
RETURNS TABLE(
    category_id UUID,
    category_name TEXT,
    category_color TEXT,
    total_amount NUMERIC,
    expense_count BIGINT,
    avg_amount NUMERIC
) 
SECURITY DEFINER
AS $$
DECLARE
    requesting_user_role TEXT;
    user_filter UUID;
BEGIN
    -- Get the role of the requesting user
    SELECT role INTO requesting_user_role 
    FROM users 
    WHERE id = auth.uid() AND is_active = true;
    
    -- Non-admins can only see their own data
    IF requesting_user_role != 'admin' THEN
        user_filter := auth.uid();
    END IF;
    
    RETURN QUERY
    SELECT 
        c.id as category_id,
        c.name as category_name,
        c.color as category_color,
        COALESCE(SUM(e.amount), 0) as total_amount,
        COUNT(e.*) as expense_count,
        COALESCE(AVG(e.amount), 0) as avg_amount
    FROM categories c
    LEFT JOIN expenses e ON c.id = e.category_id 
        AND e.is_active = true
        AND (user_filter IS NULL OR e.created_by = user_filter)
    WHERE c.is_active = true
    GROUP BY c.id, c.name, c.color
    ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- REMOVE HARDCODED CREDENTIALS QUERIES
-- =====================================================

-- Remove the hardcoded demo users (they should be created via proper admin interface)
DELETE FROM auth.users WHERE email IN ('admin1@test.com', 'officer1@test.com');
DELETE FROM users WHERE email IN ('admin1@test.com', 'officer1@test.com');

-- =====================================================
-- SECURITY AUDIT FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION security_audit_report()
RETURNS TABLE(
    table_name TEXT,
    rls_enabled BOOLEAN,
    policy_count INTEGER,
    security_status TEXT,
    recommendations TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH table_info AS (
        SELECT 
            schemaname || '.' || tablename as table_name,
            rowsecurity as rls_enabled
        FROM pg_tables 
        WHERE schemaname = 'public'
        UNION ALL
        SELECT 
            schemaname || '.' || matviewname as table_name,
            false as rls_enabled  -- Materialized views don't support RLS
        FROM pg_matviews 
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
        END as security_status,
        CASE 
            WHEN ti.rls_enabled AND COALESCE(pi.policy_count, 0) > 0 THEN 'Good security posture'
            WHEN ti.rls_enabled AND COALESCE(pi.policy_count, 0) = 0 THEN 'Enable RLS policies'
            WHEN NOT ti.rls_enabled THEN 'Enable RLS and create policies'
        END as recommendations
    FROM table_info ti
    LEFT JOIN policy_info pi ON ti.table_name = pi.table_name
    ORDER BY 
        CASE 
            WHEN NOT ti.rls_enabled THEN 1
            WHEN ti.rls_enabled AND COALESCE(pi.policy_count, 0) = 0 THEN 2
            ELSE 3
        END,
        ti.table_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION get_user_monthly_spending(UUID, DATE, DATE) IS 'Secure function to get monthly spending data with RLS enforcement';
COMMENT ON FUNCTION get_secure_category_spending() IS 'Secure function to get category spending data with role-based access';
COMMENT ON FUNCTION security_audit_report() IS 'Generates security audit report for all tables and their RLS status';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run security audit to verify fixes
SELECT * FROM security_audit_report();

-- Verify RLS is enabled on critical tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('insights_cache', 'analytics_refresh_log');

-- Count policies on each table
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;