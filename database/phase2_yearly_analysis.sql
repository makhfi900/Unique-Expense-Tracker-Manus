-- Phase 2: Yearly Monthly Analysis Enhancement
-- CORRECTED SCRIPT: Fixes data type mismatch for top_category (varchar -> text).
-- This script is idempotent and safe to re-run.

-- =====================================================
-- PRE-CLEANUP: Drop existing functions to avoid conflicts
-- =====================================================
DROP FUNCTION IF EXISTS get_available_years();
DROP FUNCTION IF EXISTS get_yearly_breakdown(INTEGER, UUID);
DROP FUNCTION IF EXISTS refresh_analytics_views(BOOLEAN);

-- =====================================================
-- YEARLY MONTHLY BREAKDOWN MATERIALIZED VIEW
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS mv_yearly_monthly_breakdown CASCADE;

CREATE MATERIALIZED VIEW mv_yearly_monthly_breakdown AS
SELECT 
    EXTRACT(YEAR FROM e.expense_date) as year,
    EXTRACT(MONTH FROM e.expense_date) as month,
    TO_CHAR(e.expense_date, 'Month') as month_name,
    TO_CHAR(e.expense_date, 'Mon') as month_short,
    DATE_TRUNC('month', e.expense_date) as month_date,
    e.category_id,
    e.created_by,
    c.name as category_name,
    c.color as category_color,
    u.full_name as user_name,
    u.role as user_role,
    SUM(e.amount) as total_amount,
    COUNT(*) as expense_count,
    AVG(e.amount) as avg_amount,
    MIN(e.amount) as min_amount,
    MAX(e.amount) as max_amount,
    ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM e.expense_date), e.created_by ORDER BY SUM(e.amount) DESC) as spending_rank,
    PERCENT_RANK() OVER (PARTITION BY EXTRACT(YEAR FROM e.expense_date), e.created_by ORDER BY SUM(e.amount)) as spending_percentile
FROM expenses e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN users u ON e.created_by = u.id
WHERE e.is_active = true
GROUP BY 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11;

CREATE INDEX IF NOT EXISTS idx_mv_yearly_monthly_lookup ON mv_yearly_monthly_breakdown(year, month, created_by);
CREATE INDEX IF NOT EXISTS idx_mv_yearly_monthly_category ON mv_yearly_monthly_breakdown(year, category_id);
CREATE INDEX IF NOT EXISTS idx_mv_yearly_monthly_user ON mv_yearly_monthly_breakdown(created_by, year);

-- =====================================================
-- YEARLY SUMMARY FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION get_available_years()
RETURNS TABLE(
    year INTEGER,
    total_amount NUMERIC,
    expense_count BIGINT,
    user_count BIGINT,
    category_count BIGINT,
    first_expense_date DATE,
    last_expense_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(YEAR FROM e.expense_date)::INTEGER as year,
        SUM(e.amount) as total_amount,
        COUNT(*) as expense_count,
        COUNT(DISTINCT e.created_by) as user_count,
        COUNT(DISTINCT e.category_id) as category_count,
        MIN(e.expense_date) as first_expense_date,
        MAX(e.expense_date) as last_expense_date
    FROM expenses e
    WHERE e.is_active = true
    GROUP BY 1
    ORDER BY 1 DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_yearly_breakdown(
    p_target_year INTEGER,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
    month INTEGER,
    month_name TEXT,
    month_short TEXT,
    total_amount NUMERIC,
    expense_count BIGINT,
    avg_amount NUMERIC,
    top_category TEXT,
    top_category_amount NUMERIC,
    categories_used BIGINT,
    vs_previous_month NUMERIC,
    vs_same_month_last_year NUMERIC,
    is_highest_month BOOLEAN,
    is_lowest_month BOOLEAN
) AS $$
DECLARE
    year_total NUMERIC;
    year_avg NUMERIC;
BEGIN
    SELECT SUM(v.total_amount), AVG(v.total_amount) 
    INTO year_total, year_avg
    FROM mv_yearly_monthly_breakdown v
    WHERE v.year = p_target_year
    AND (p_user_id IS NULL OR v.created_by = p_user_id);

    RETURN QUERY
    WITH monthly_data AS (
        SELECT 
            ymb.month,
            ymb.month_name,
            ymb.month_short,
            SUM(ymb.total_amount) as total_amount,
            SUM(ymb.expense_count)::BIGINT as expense_count,
            AVG(ymb.avg_amount) as avg_amount,
            COUNT(DISTINCT ymb.category_id) as categories_used
        FROM mv_yearly_monthly_breakdown ymb
        WHERE ymb.year = p_target_year
        AND (p_user_id IS NULL OR ymb.created_by = p_user_id)
        GROUP BY 1, 2, 3
    ),
    monthly_with_top_category AS (
        SELECT 
            md.*,
            (
                -- FIX: Cast the category_name from VARCHAR to TEXT to match the function's return type.
                SELECT sub.category_name::TEXT
                FROM mv_yearly_monthly_breakdown sub
                WHERE sub.year = p_target_year 
                AND sub.month = md.month
                AND (p_user_id IS NULL OR sub.created_by = p_user_id)
                GROUP BY sub.category_name
                ORDER BY SUM(sub.total_amount) DESC
                LIMIT 1
            ) as top_category,
            (
                SELECT SUM(sub.total_amount)
                FROM mv_yearly_monthly_breakdown sub
                WHERE sub.year = p_target_year 
                AND sub.month = md.month
                AND (p_user_id IS NULL OR sub.created_by = p_user_id)
                AND sub.category_name = (
                    SELECT sub2.category_name
                    FROM mv_yearly_monthly_breakdown sub2
                    WHERE sub2.year = p_target_year AND sub2.month = md.month
                    AND (p_user_id IS NULL OR sub2.created_by = p_user_id)
                    GROUP BY sub2.category_name
                    ORDER BY SUM(sub2.total_amount) DESC
                    LIMIT 1
                )
            ) as top_category_amount
        FROM monthly_data md
    ),
    monthly_with_comparisons AS (
        SELECT 
            mwtc.*,
            mwtc.total_amount - LAG(mwtc.total_amount, 1, 0) OVER (ORDER BY mwtc.month) as vs_previous_month,
            mwtc.total_amount - COALESCE((
                SELECT SUM(prev_year.total_amount)
                FROM mv_yearly_monthly_breakdown prev_year
                WHERE prev_year.year = p_target_year - 1 
                AND prev_year.month = mwtc.month
                AND (p_user_id IS NULL OR prev_year.created_by = p_user_id)
            ), 0) as vs_same_month_last_year,
            mwtc.total_amount = MAX(mwtc.total_amount) OVER () as is_highest_month,
            mwtc.total_amount = MIN(mwtc.total_amount) OVER () as is_lowest_month
        FROM monthly_with_top_category mwtc
    )
    SELECT 
        mwc.month::INTEGER,
        mwc.month_name,
        mwc.month_short,
        mwc.total_amount,
        mwc.expense_count,
        mwc.avg_amount,
        mwc.top_category,
        mwc.top_category_amount,
        mwc.categories_used,
        mwc.vs_previous_month,
        mwc.vs_same_month_last_year,
        mwc.is_highest_month,
        mwc.is_lowest_month
    FROM monthly_with_comparisons mwc
    ORDER BY mwc.month;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- UPDATE REFRESH FUNCTION TO INCLUDE NEW VIEW
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_analytics_views(concurrent_refresh BOOLEAN DEFAULT TRUE)
RETURNS void AS $$
DECLARE
    refresh_start TIMESTAMP;
BEGIN
    refresh_start := clock_timestamp();
    
    IF concurrent_refresh THEN
        BEGIN
            RAISE NOTICE 'Attempting to refresh views concurrently...';
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_spending;
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_spending;
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_spending;
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_spending;
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_yearly_monthly_breakdown;
            
            RAISE NOTICE 'Analytics views refreshed concurrently in % ms', 
                EXTRACT(MILLISECOND FROM clock_timestamp() - refresh_start);
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Concurrent refresh failed, falling back to regular refresh. Reason: %', SQLERRM;
                PERFORM refresh_analytics_views(FALSE);
        END;
    ELSE
        RAISE NOTICE 'Refreshing views with blocking method...';
        REFRESH MATERIALIZED VIEW mv_monthly_spending;
        REFRESH MATERIALIZED VIEW mv_daily_spending;
        REFRESH MATERIALIZED VIEW mv_category_spending;
        REFRESH MATERIALIZED VIEW mv_user_spending;
        REFRESH MATERIALIZED VIEW mv_yearly_monthly_breakdown;
        
        RAISE NOTICE 'Analytics views refreshed (blocking) in % ms', 
            EXTRACT(MILLISECOND FROM clock_timestamp() - refresh_start);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL DATA POPULATION & USAGE
-- =====================================================

REFRESH MATERIALIZED VIEW mv_yearly_monthly_breakdown;
ANALYZE mv_yearly_monthly_breakdown;

COMMENT ON FUNCTION get_available_years() IS 'Returns all years that have expense data with summary statistics';
COMMENT ON FUNCTION get_yearly_breakdown(INTEGER, UUID) IS 'Returns detailed monthly breakdown for a specific year with comparative metrics';
COMMENT ON MATERIALIZED VIEW mv_yearly_monthly_breakdown IS 'Pre-computed yearly and monthly expense breakdowns with ranking and percentile data';

-- Test the functions (uncomment to run)
SELECT * FROM get_available_years();
SELECT * FROM get_yearly_breakdown(2024);