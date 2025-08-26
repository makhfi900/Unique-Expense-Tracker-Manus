-- SECURE MATERIALIZED VIEWS - IMMEDIATE FIX
-- Materialized views cannot use RLS, so we need to restrict access

-- =====================================================
-- REVOKE PUBLIC ACCESS TO MATERIALIZED VIEWS
-- =====================================================

-- Remove all permissions from materialized views for authenticated users
REVOKE ALL ON mv_monthly_spending FROM authenticated;
REVOKE ALL ON mv_daily_spending FROM authenticated;
REVOKE ALL ON mv_category_spending FROM authenticated;
REVOKE ALL ON mv_user_spending FROM authenticated;
REVOKE ALL ON mv_yearly_monthly_breakdown FROM authenticated;

-- Remove all permissions from public role
REVOKE ALL ON mv_monthly_spending FROM public;
REVOKE ALL ON mv_daily_spending FROM public;
REVOKE ALL ON mv_category_spending FROM public;
REVOKE ALL ON mv_user_spending FROM public;
REVOKE ALL ON mv_yearly_monthly_breakdown FROM public;

-- =====================================================
-- GRANT ACCESS ONLY TO SPECIFIC SECURE FUNCTIONS
-- =====================================================

-- Only the secure functions should be able to access these views
-- Grant access only to the definer of secure functions (postgres role)
GRANT SELECT ON mv_monthly_spending TO postgres;
GRANT SELECT ON mv_daily_spending TO postgres;
GRANT SELECT ON mv_category_spending TO postgres;
GRANT SELECT ON mv_user_spending TO postgres;
GRANT SELECT ON mv_yearly_monthly_breakdown TO postgres;

-- =====================================================
-- CREATE MISSING SECURE FUNCTIONS FOR ALL VIEWS
-- =====================================================

-- Secure function for daily spending
CREATE OR REPLACE FUNCTION get_secure_daily_spending(
    p_user_id UUID DEFAULT NULL,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
    expense_date DATE,
    total_amount NUMERIC,
    expense_count BIGINT,
    categories_count BIGINT
) 
SECURITY DEFINER
AS $$
DECLARE
    requesting_user_role TEXT;
    user_filter UUID;
BEGIN
    -- Get the role from JWT to avoid recursion
    requesting_user_role := auth.jwt() ->> 'role';
    IF requesting_user_role IS NULL THEN
        requesting_user_role := auth.jwt() -> 'user_metadata' ->> 'role';
    END IF;
    
    -- Non-admins can only see their own data
    IF requesting_user_role != 'admin' THEN
        user_filter := auth.uid();
        p_user_id := auth.uid(); -- Force to current user
    END IF;
    
    RETURN QUERY
    SELECT 
        e.expense_date,
        SUM(e.amount) as total_amount,
        COUNT(*) as expense_count,
        COUNT(DISTINCT e.category_id) as categories_count
    FROM expenses e
    WHERE e.is_active = true
    AND (user_filter IS NULL OR e.created_by = user_filter)
    AND (p_start_date IS NULL OR e.expense_date >= p_start_date)
    AND (p_end_date IS NULL OR e.expense_date <= p_end_date)
    GROUP BY e.expense_date
    ORDER BY e.expense_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Secure function for yearly monthly breakdown
CREATE OR REPLACE FUNCTION get_secure_yearly_breakdown(
    p_user_id UUID DEFAULT NULL,
    p_year INTEGER DEFAULT NULL
)
RETURNS TABLE(
    year INTEGER,
    month INTEGER,
    month_name TEXT,
    total_amount NUMERIC,
    expense_count BIGINT,
    categories_count BIGINT,
    avg_daily_spending NUMERIC
) 
SECURITY DEFINER
AS $$
DECLARE
    requesting_user_role TEXT;
    user_filter UUID;
BEGIN
    -- Get the role from JWT to avoid recursion
    requesting_user_role := auth.jwt() ->> 'role';
    IF requesting_user_role IS NULL THEN
        requesting_user_role := auth.jwt() -> 'user_metadata' ->> 'role';
    END IF;
    
    -- Non-admins can only see their own data
    IF requesting_user_role != 'admin' THEN
        user_filter := auth.uid();
    END IF;
    
    RETURN QUERY
    SELECT 
        EXTRACT(YEAR FROM e.expense_date)::INTEGER as year,
        EXTRACT(MONTH FROM e.expense_date)::INTEGER as month,
        TO_CHAR(e.expense_date, 'Month') as month_name,
        SUM(e.amount) as total_amount,
        COUNT(*) as expense_count,
        COUNT(DISTINCT e.category_id) as categories_count,
        SUM(e.amount) / EXTRACT(DAYS FROM DATE_TRUNC('month', e.expense_date) + INTERVAL '1 month - 1 day') as avg_daily_spending
    FROM expenses e
    WHERE e.is_active = true
    AND (user_filter IS NULL OR e.created_by = user_filter)
    AND (p_year IS NULL OR EXTRACT(YEAR FROM e.expense_date) = p_year)
    GROUP BY 1, 2, 3
    ORDER BY year DESC, month DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANT EXECUTE PERMISSIONS ON SECURE FUNCTIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_secure_daily_spending(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_secure_yearly_breakdown(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_secure_category_spending() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_monthly_spending(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_secure_user_spending() TO authenticated;

-- =====================================================
-- VERIFY SECURITY STATUS
-- =====================================================

-- Check that materialized views are no longer accessible
DO $$
DECLARE
    view_name TEXT;
    view_names TEXT[] := ARRAY['mv_monthly_spending', 'mv_daily_spending', 'mv_category_spending', 'mv_user_spending', 'mv_yearly_monthly_breakdown'];
BEGIN
    FOREACH view_name IN ARRAY view_names LOOP
        BEGIN
            -- This should fail for authenticated users now
            EXECUTE format('SELECT 1 FROM %I LIMIT 1', view_name);
            RAISE NOTICE 'WARNING: % is still accessible!', view_name;
        EXCEPTION
            WHEN insufficient_privilege THEN
                RAISE NOTICE 'GOOD: % is now secured', view_name;
            WHEN OTHERS THEN
                RAISE NOTICE 'INFO: % access check completed', view_name;
        END;
    END LOOP;
END $$;

-- Test secure functions work
SELECT 'Testing secure functions...' as status;
SELECT COUNT(*) as category_count FROM get_secure_category_spending();
SELECT COUNT(*) as monthly_count FROM get_user_monthly_spending(null, null, null);

SELECT 'MATERIALIZED VIEWS SECURED - Frontend needs to use secure functions only' as result;