-- Phase 3: Year-over-Year Comparison Enhancement
-- Run this in Supabase SQL Editor after Phase 2

-- =====================================================
-- YEAR-OVER-YEAR COMPARISON FUNCTIONS
-- =====================================================

-- Function to calculate detailed year-over-year comparison
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
    base_year_expenses BIGINT,
    compare_year_amount NUMERIC,
    compare_year_expenses BIGINT,
    amount_difference NUMERIC,
    amount_percentage_change NUMERIC,
    expense_count_difference BIGINT,
    expense_percentage_change NUMERIC,
    status TEXT,
    trend_direction TEXT,
    significance_level TEXT
) AS $$
DECLARE
    base_total NUMERIC;
    compare_total NUMERIC;
BEGIN
    -- Get total spending for each year for context
    SELECT 
        COALESCE(SUM(CASE WHEN year = base_year THEN total_amount END), 0),
        COALESCE(SUM(CASE WHEN year = compare_year THEN total_amount END), 0)
    INTO base_total, compare_total
    FROM mv_yearly_monthly_breakdown
    WHERE year IN (base_year, compare_year)
    AND (user_id IS NULL OR created_by = user_id);

    RETURN QUERY
    WITH base_data AS (
        SELECT 
            month,
            month_name,
            month_short,
            COALESCE(SUM(total_amount), 0) as amount,
            COALESCE(SUM(expense_count), 0) as expenses
        FROM mv_yearly_monthly_breakdown
        WHERE year = base_year
        AND (user_id IS NULL OR created_by = user_id)
        GROUP BY month, month_name, month_short
    ),
    compare_data AS (
        SELECT 
            month,
            month_name,
            month_short,
            COALESCE(SUM(total_amount), 0) as amount,
            COALESCE(SUM(expense_count), 0) as expenses
        FROM mv_yearly_monthly_breakdown
        WHERE year = compare_year
        AND (user_id IS NULL OR created_by = user_id)
        GROUP BY month, month_name, month_short
    ),
    all_months AS (
        SELECT generate_series(1, 12) as month
    ),
    monthly_comparison AS (
        SELECT 
            am.month,
            COALESCE(bd.month_name, TO_CHAR(TO_DATE(am.month::text, 'MM'), 'Month')) as month_name,
            COALESCE(bd.month_short, TO_CHAR(TO_DATE(am.month::text, 'MM'), 'Mon')) as month_short,
            COALESCE(bd.amount, 0) as base_year_amount,
            COALESCE(bd.expenses, 0) as base_year_expenses,
            COALESCE(cd.amount, 0) as compare_year_amount,
            COALESCE(cd.expenses, 0) as compare_year_expenses,
            COALESCE(cd.amount, 0) - COALESCE(bd.amount, 0) as amount_difference,
            CASE 
                WHEN COALESCE(bd.amount, 0) = 0 AND COALESCE(cd.amount, 0) > 0 THEN 100.0
                WHEN COALESCE(bd.amount, 0) = 0 THEN 0.0
                ELSE ((COALESCE(cd.amount, 0) - COALESCE(bd.amount, 0)) / bd.amount * 100)
            END as amount_percentage_change,
            COALESCE(cd.expenses, 0) - COALESCE(bd.expenses, 0) as expense_count_difference,
            CASE 
                WHEN COALESCE(bd.expenses, 0) = 0 AND COALESCE(cd.expenses, 0) > 0 THEN 100.0
                WHEN COALESCE(bd.expenses, 0) = 0 THEN 0.0
                ELSE ((COALESCE(cd.expenses, 0) - COALESCE(bd.expenses, 0))::NUMERIC / bd.expenses * 100)
            END as expense_percentage_change
        FROM all_months am
        LEFT JOIN base_data bd ON am.month = bd.month
        LEFT JOIN compare_data cd ON am.month = cd.month
    )
    SELECT 
        mc.month::INTEGER,
        mc.month_name,
        mc.month_short,
        mc.base_year_amount,
        mc.base_year_expenses,
        mc.compare_year_amount,
        mc.compare_year_expenses,
        mc.amount_difference,
        mc.amount_percentage_change,
        mc.expense_count_difference,
        mc.expense_percentage_change,
        -- Status classification
        CASE 
            WHEN mc.amount_difference > 0 THEN 'increased'
            WHEN mc.amount_difference < 0 THEN 'decreased'
            ELSE 'unchanged'
        END as status,
        -- Trend direction
        CASE 
            WHEN mc.amount_percentage_change > 20 THEN 'strongly_up'
            WHEN mc.amount_percentage_change > 5 THEN 'up'
            WHEN mc.amount_percentage_change > -5 THEN 'stable'
            WHEN mc.amount_percentage_change > -20 THEN 'down'
            ELSE 'strongly_down'
        END as trend_direction,
        -- Significance level
        CASE 
            WHEN ABS(mc.amount_percentage_change) > 50 THEN 'very_high'
            WHEN ABS(mc.amount_percentage_change) > 25 THEN 'high'
            WHEN ABS(mc.amount_percentage_change) > 10 THEN 'medium'
            WHEN ABS(mc.amount_percentage_change) > 2 THEN 'low'
            ELSE 'minimal'
        END as significance_level
    FROM monthly_comparison mc
    ORDER BY mc.month;
END;
$$ LANGUAGE plpgsql;

-- Function to get year comparison summary statistics
CREATE OR REPLACE FUNCTION get_year_comparison_summary(
    p_base_year INTEGER,
    p_compare_year INTEGER,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
    base_year INTEGER,
    compare_year INTEGER,
    base_total_spending NUMERIC,
    compare_total_spending NUMERIC,
    total_difference NUMERIC,
    total_percentage_change NUMERIC,
    base_total_expenses BIGINT,
    compare_total_expenses BIGINT,
    expense_count_difference BIGINT,
    expense_count_percentage_change NUMERIC,
    base_avg_monthly NUMERIC,
    compare_avg_monthly NUMERIC,
    base_active_months INTEGER,
    compare_active_months INTEGER,
    months_with_increases INTEGER,
    months_with_decreases INTEGER,
    months_unchanged INTEGER,
    biggest_increase_month TEXT,
    biggest_increase_amount NUMERIC,
    biggest_decrease_month TEXT,
    biggest_decrease_amount NUMERIC,
    most_consistent_trend TEXT
) AS $$
DECLARE
    comparison_data RECORD;
BEGIN
    -- Get the detailed comparison data
    CREATE TEMP TABLE IF NOT EXISTS temp_comparison AS
    SELECT * FROM calculate_year_comparison(p_base_year, p_compare_year, p_user_id);

    RETURN QUERY
    WITH summary_stats AS (
        SELECT 
            p_base_year as by,
            p_compare_year as cy,
            SUM(base_year_amount) as base_total,
            SUM(compare_year_amount) as compare_total,
            SUM(base_year_expenses) as base_expenses,
            SUM(compare_year_expenses) as compare_expenses,
            COUNT(CASE WHEN base_year_amount > 0 THEN 1 END) as base_active,
            COUNT(CASE WHEN compare_year_amount > 0 THEN 1 END) as compare_active,
            COUNT(CASE WHEN amount_difference > 0 THEN 1 END) as increases,
            COUNT(CASE WHEN amount_difference < 0 THEN 1 END) as decreases,
            COUNT(CASE WHEN amount_difference = 0 THEN 1 END) as unchanged
        FROM temp_comparison
    ),
    extremes AS (
        SELECT 
            (SELECT month_name FROM temp_comparison WHERE amount_difference = (SELECT MAX(amount_difference) FROM temp_comparison) LIMIT 1) as max_increase_month,
            (SELECT MAX(amount_difference) FROM temp_comparison) as max_increase_amount,
            (SELECT month_name FROM temp_comparison WHERE amount_difference = (SELECT MIN(amount_difference) FROM temp_comparison) LIMIT 1) as max_decrease_month,
            (SELECT MIN(amount_difference) FROM temp_comparison) as max_decrease_amount
    ),
    trend_analysis AS (
        SELECT 
            CASE 
                WHEN COUNT(CASE WHEN trend_direction IN ('up', 'strongly_up') THEN 1 END) > 6 THEN 'upward'
                WHEN COUNT(CASE WHEN trend_direction IN ('down', 'strongly_down') THEN 1 END) > 6 THEN 'downward'
                WHEN COUNT(CASE WHEN trend_direction = 'stable' THEN 1 END) > 6 THEN 'stable'
                ELSE 'mixed'
            END as overall_trend
        FROM temp_comparison
    )
    SELECT 
        ss.by::INTEGER,
        ss.cy::INTEGER,
        ss.base_total,
        ss.compare_total,
        (ss.compare_total - ss.base_total) as total_diff,
        CASE 
            WHEN ss.base_total = 0 AND ss.compare_total > 0 THEN 100.0
            WHEN ss.base_total = 0 THEN 0.0
            ELSE ((ss.compare_total - ss.base_total) / ss.base_total * 100)
        END as total_pct_change,
        ss.base_expenses,
        ss.compare_expenses,
        (ss.compare_expenses - ss.base_expenses) as expense_diff,
        CASE 
            WHEN ss.base_expenses = 0 AND ss.compare_expenses > 0 THEN 100.0
            WHEN ss.base_expenses = 0 THEN 0.0
            ELSE ((ss.compare_expenses - ss.base_expenses)::NUMERIC / ss.base_expenses * 100)
        END as expense_pct_change,
        (ss.base_total / 12) as base_avg,
        (ss.compare_total / 12) as compare_avg,
        ss.base_active::INTEGER,
        ss.compare_active::INTEGER,
        ss.increases::INTEGER,
        ss.decreases::INTEGER,
        ss.unchanged::INTEGER,
        ex.max_increase_month,
        ex.max_increase_amount,
        ex.max_decrease_month,
        ex.max_decrease_amount,
        ta.overall_trend
    FROM summary_stats ss
    CROSS JOIN extremes ex
    CROSS JOIN trend_analysis ta;

    -- Clean up temp table
    DROP TABLE IF EXISTS temp_comparison;
END;
$$ LANGUAGE plpgsql;

-- Function to get category-wise year comparison
CREATE OR REPLACE FUNCTION get_category_year_comparison(
    p_base_year INTEGER,
    p_compare_year INTEGER,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
    category_id UUID,
    category_name TEXT,
    category_color TEXT,
    base_year_amount NUMERIC,
    compare_year_amount NUMERIC,
    amount_difference NUMERIC,
    percentage_change NUMERIC,
    base_year_expenses BIGINT,
    compare_year_expenses BIGINT,
    expense_difference BIGINT,
    trend_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH base_categories AS (
        SELECT 
            category_id,
            category_name,
            category_color,
            SUM(total_amount) as total_amount,
            SUM(expense_count) as expense_count
        FROM mv_yearly_monthly_breakdown
        WHERE year = base_year
        AND (user_id IS NULL OR created_by = user_id)
        GROUP BY category_id, category_name, category_color
    ),
    compare_categories AS (
        SELECT 
            category_id,
            category_name,
            category_color,
            SUM(total_amount) as total_amount,
            SUM(expense_count) as expense_count
        FROM mv_yearly_monthly_breakdown
        WHERE year = compare_year
        AND (user_id IS NULL OR created_by = user_id)
        GROUP BY category_id, category_name, category_color
    ),
    all_categories AS (
        SELECT category_id, category_name, category_color FROM base_categories
        UNION
        SELECT category_id, category_name, category_color FROM compare_categories
    )
    SELECT 
        ac.category_id,
        ac.category_name,
        ac.category_color,
        COALESCE(bc.total_amount, 0) as base_amount,
        COALESCE(cc.total_amount, 0) as compare_amount,
        COALESCE(cc.total_amount, 0) - COALESCE(bc.total_amount, 0) as amount_diff,
        CASE 
            WHEN COALESCE(bc.total_amount, 0) = 0 AND COALESCE(cc.total_amount, 0) > 0 THEN 100.0
            WHEN COALESCE(bc.total_amount, 0) = 0 THEN 0.0
            ELSE ((COALESCE(cc.total_amount, 0) - COALESCE(bc.total_amount, 0)) / bc.total_amount * 100)
        END as pct_change,
        COALESCE(bc.expense_count, 0) as base_expenses,
        COALESCE(cc.expense_count, 0) as compare_expenses,
        COALESCE(cc.expense_count, 0) - COALESCE(bc.expense_count, 0) as expense_diff,
        CASE 
            WHEN COALESCE(cc.total_amount, 0) - COALESCE(bc.total_amount, 0) > 0 THEN 'increased'
            WHEN COALESCE(cc.total_amount, 0) - COALESCE(bc.total_amount, 0) < 0 THEN 'decreased'
            ELSE 'unchanged'
        END as trend_status
    FROM all_categories ac
    LEFT JOIN base_categories bc ON ac.category_id = bc.category_id
    LEFT JOIN compare_categories cc ON ac.category_id = cc.category_id
    ORDER BY ABS(COALESCE(cc.total_amount, 0) - COALESCE(bc.total_amount, 0)) DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USAGE EXAMPLES AND COMMENTS
-- =====================================================

COMMENT ON FUNCTION calculate_year_comparison(INTEGER, INTEGER, UUID) IS 'Detailed month-by-month comparison between two years with trend analysis';
COMMENT ON FUNCTION get_year_comparison_summary(INTEGER, INTEGER, UUID) IS 'Summary statistics and insights for year-over-year comparison';
COMMENT ON FUNCTION get_category_year_comparison(INTEGER, INTEGER, UUID) IS 'Category-wise spending comparison between two years';

-- Test the functions (uncomment to test)
-- SELECT * FROM calculate_year_comparison(2023, 2024);
-- SELECT * FROM get_year_comparison_summary(2023, 2024);
-- SELECT * FROM get_category_year_comparison(2023, 2024);