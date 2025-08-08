
-- =====================================================
-- MISSING DATABASE FUNCTIONS FOR YEAR COMPARISON
-- =====================================================
-- Run this in Supabase SQL Editor to fix the blank page issue

-- 1. Create get_available_years function
CREATE OR REPLACE FUNCTION get_available_years()
RETURNS TABLE(
    year INTEGER,
    total_amount NUMERIC,
    expense_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(YEAR FROM e.expense_date)::INTEGER as year,
        SUM(e.amount) as total_amount,
        COUNT(*)::BIGINT as expense_count
    FROM expenses e
    WHERE e.expense_date IS NOT NULL
    GROUP BY EXTRACT(YEAR FROM e.expense_date)
    ORDER BY year DESC;
END;
$$ LANGUAGE plpgsql;

-- 2. Create calculate_year_comparison function
CREATE OR REPLACE FUNCTION calculate_year_comparison(
    base_year INTEGER,
    compare_year INTEGER,
    user_id UUID DEFAULT NULL
)
RETURNS TABLE(
    month INTEGER,
    month_name TEXT,
    month_short TEXT,
    base_year_amount NUMERIC,
    compare_year_amount NUMERIC,
    amount_difference NUMERIC,
    amount_percentage_change NUMERIC,
    status TEXT,
    trend_direction TEXT,
    significance_level TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH base_data AS (
        SELECT 
            EXTRACT(MONTH FROM e.expense_date)::INTEGER as month,
            SUM(e.amount) as total_amount
        FROM expenses e
        WHERE EXTRACT(YEAR FROM e.expense_date) = base_year
        AND (user_id IS NULL OR e.created_by = user_id)
        GROUP BY EXTRACT(MONTH FROM e.expense_date)
    ),
    compare_data AS (
        SELECT 
            EXTRACT(MONTH FROM e.expense_date)::INTEGER as month,
            SUM(e.amount) as total_amount
        FROM expenses e
        WHERE EXTRACT(YEAR FROM e.expense_date) = compare_year
        AND (user_id IS NULL OR e.created_by = user_id)
        GROUP BY EXTRACT(MONTH FROM e.expense_date)
    ),
    month_names AS (
        SELECT 
            generate_series(1, 12) as month,
            to_char(date '2000-01-01' + (generate_series(1, 12) - 1) * interval '1 month', 'Month') as month_name,
            to_char(date '2000-01-01' + (generate_series(1, 12) - 1) * interval '1 month', 'Mon') as month_short
    )
    SELECT 
        mn.month,
        TRIM(mn.month_name) as month_name,
        TRIM(mn.month_short) as month_short,
        COALESCE(bd.total_amount, 0) as base_year_amount,
        COALESCE(cd.total_amount, 0) as compare_year_amount,
        COALESCE(cd.total_amount, 0) - COALESCE(bd.total_amount, 0) as amount_difference,
        CASE 
            WHEN COALESCE(bd.total_amount, 0) = 0 THEN 0
            ELSE ((COALESCE(cd.total_amount, 0) - COALESCE(bd.total_amount, 0)) / COALESCE(bd.total_amount, 1)) * 100
        END as amount_percentage_change,
        CASE 
            WHEN COALESCE(cd.total_amount, 0) > COALESCE(bd.total_amount, 0) THEN 'increased'
            WHEN COALESCE(cd.total_amount, 0) < COALESCE(bd.total_amount, 0) THEN 'decreased'
            ELSE 'unchanged'
        END as status,
        CASE 
            WHEN ABS(COALESCE(cd.total_amount, 0) - COALESCE(bd.total_amount, 0)) > 1000 THEN 'up'
            WHEN ABS(COALESCE(cd.total_amount, 0) - COALESCE(bd.total_amount, 0)) < 100 THEN 'stable'
            ELSE 'down'
        END as trend_direction,
        CASE 
            WHEN ABS(COALESCE(cd.total_amount, 0) - COALESCE(bd.total_amount, 0)) > 5000 THEN 'very_high'
            WHEN ABS(COALESCE(cd.total_amount, 0) - COALESCE(bd.total_amount, 0)) > 2000 THEN 'high'
            WHEN ABS(COALESCE(cd.total_amount, 0) - COALESCE(bd.total_amount, 0)) > 500 THEN 'medium'
            ELSE 'low'
        END as significance_level
    FROM month_names mn
    LEFT JOIN base_data bd ON mn.month = bd.month
    LEFT JOIN compare_data cd ON mn.month = cd.month
    ORDER BY mn.month;
END;
$$ LANGUAGE plpgsql;

-- 3. Grant execute permissions
GRANT EXECUTE ON FUNCTION get_available_years() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_year_comparison(INTEGER, INTEGER, UUID) TO authenticated;

-- Test the functions
SELECT 'Functions created successfully!' as status;
