-- Fix Analytics Functions - Resolve Ambiguous Column References
-- Run this in Supabase SQL Editor to fix existing function errors

-- =====================================================
-- FIX YEARLY BREAKDOWN FUNCTION
-- =====================================================

-- Drop and recreate the get_yearly_breakdown function with fixed column references
DROP FUNCTION IF EXISTS get_yearly_breakdown(INTEGER, UUID);

CREATE OR REPLACE FUNCTION get_yearly_breakdown(
    target_year INTEGER,
    user_id UUID DEFAULT NULL
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
    -- Comparative metrics
    vs_previous_month NUMERIC,
    vs_same_month_last_year NUMERIC,
    is_highest_month BOOLEAN,
    is_lowest_month BOOLEAN
) AS $$
DECLARE
    year_total NUMERIC;
    year_avg NUMERIC;
BEGIN
    -- Get year totals for comparison
    SELECT SUM(ymb.total_amount), AVG(ymb.total_amount) 
    INTO year_total, year_avg
    FROM mv_yearly_monthly_breakdown ymb
    WHERE ymb.year = target_year
    AND (user_id IS NULL OR ymb.created_by = user_id);

    RETURN QUERY
    WITH monthly_data AS (
        SELECT 
            ymb.month,
            ymb.month_name,
            ymb.month_short,
            SUM(ymb.total_amount) as month_total_amount,
            SUM(ymb.expense_count) as month_expense_count,
            AVG(ymb.avg_amount) as month_avg_amount,
            COUNT(DISTINCT ymb.category_id) as month_categories_used
        FROM mv_yearly_monthly_breakdown ymb
        WHERE ymb.year = target_year
        AND (user_id IS NULL OR ymb.created_by = user_id)
        GROUP BY ymb.month, ymb.month_name, ymb.month_short
    ),
    monthly_with_top_category AS (
        SELECT 
            md.*,
            -- Get top category for each month
            (
                SELECT ymb.category_name
                FROM mv_yearly_monthly_breakdown ymb
                WHERE ymb.year = target_year 
                AND ymb.month = md.month
                AND (user_id IS NULL OR ymb.created_by = user_id)
                GROUP BY ymb.category_name
                ORDER BY SUM(ymb.total_amount) DESC
                LIMIT 1
            ) as month_top_category,
            (
                SELECT MAX(category_total.total)
                FROM (
                    SELECT SUM(ymb.total_amount) as total
                    FROM mv_yearly_monthly_breakdown ymb
                    WHERE ymb.year = target_year 
                    AND ymb.month = md.month
                    AND (user_id IS NULL OR ymb.created_by = user_id)
                    GROUP BY ymb.category_name
                ) category_total
            ) as month_top_category_amount
        FROM monthly_data md
    ),
    monthly_with_comparisons AS (
        SELECT 
            mwtc.*,
            -- Previous month comparison
            mwtc.month_total_amount - LAG(mwtc.month_total_amount) OVER (ORDER BY mwtc.month) as month_vs_previous_month,
            -- Previous year same month comparison
            mwtc.month_total_amount - COALESCE((
                SELECT SUM(ymb.total_amount)
                FROM mv_yearly_monthly_breakdown ymb
                WHERE ymb.year = target_year - 1 
                AND ymb.month = mwtc.month
                AND (user_id IS NULL OR ymb.created_by = user_id)
            ), 0) as month_vs_same_month_last_year,
            -- Highest/lowest indicators
            mwtc.month_total_amount = MAX(mwtc.month_total_amount) OVER () as month_is_highest_month,
            mwtc.month_total_amount = MIN(mwtc.month_total_amount) OVER () as month_is_lowest_month
        FROM monthly_with_top_category mwtc
    )
    SELECT 
        mwc.month::INTEGER,
        mwc.month_name,
        mwc.month_short,
        mwc.month_total_amount,
        mwc.month_expense_count,
        mwc.month_avg_amount,
        mwc.month_top_category,
        mwc.month_top_category_amount,
        mwc.month_categories_used,
        mwc.month_vs_previous_month,
        mwc.month_vs_same_month_last_year,
        mwc.month_is_highest_month,
        mwc.month_is_lowest_month
    FROM monthly_with_comparisons mwc
    ORDER BY mwc.month;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIX YEAR COMPARISON FUNCTIONS
-- =====================================================

-- Fix calculate_year_comparison function
DROP FUNCTION IF EXISTS calculate_year_comparison(INTEGER, INTEGER, UUID);

CREATE OR REPLACE FUNCTION calculate_year_comparison(
    p_base_year INTEGER,
    p_compare_year INTEGER,
    p_user_id UUID DEFAULT NULL
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
BEGIN
    RETURN QUERY
    WITH base_data AS (
        SELECT 
            ymb.month,
            ymb.month_name,
            ymb.month_short,
            COALESCE(SUM(ymb.total_amount), 0) as amount,
            COALESCE(SUM(ymb.expense_count), 0) as expenses
        FROM mv_yearly_monthly_breakdown ymb
        WHERE ymb.year = p_base_year
        AND (p_user_id IS NULL OR ymb.created_by = p_user_id)
        GROUP BY ymb.month, ymb.month_name, ymb.month_short
    ),
    compare_data AS (
        SELECT 
            ymb.month,
            ymb.month_name,
            ymb.month_short,
            COALESCE(SUM(ymb.total_amount), 0) as amount,
            COALESCE(SUM(ymb.expense_count), 0) as expenses
        FROM mv_yearly_monthly_breakdown ymb
        WHERE ymb.year = p_compare_year
        AND (p_user_id IS NULL OR ymb.created_by = p_user_id)
        GROUP BY ymb.month, ymb.month_name, ymb.month_short
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

-- =====================================================
-- CREATE USER BUDGET SETTINGS TABLE
-- =====================================================

-- Create user budget configuration table
CREATE TABLE IF NOT EXISTS user_budget_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    monthly_budget NUMERIC NOT NULL DEFAULT 50000,
    warning_threshold NUMERIC DEFAULT 0.8 CHECK (warning_threshold >= 0 AND warning_threshold <= 1),
    emergency_threshold NUMERIC DEFAULT 0.95 CHECK (emergency_threshold >= 0 AND emergency_threshold <= 1),
    currency_code VARCHAR(3) DEFAULT 'INR',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Create indexes for user budget settings
CREATE INDEX IF NOT EXISTS idx_user_budget_settings_user ON user_budget_settings(user_id, is_active);

-- Function to get or create user budget settings
CREATE OR REPLACE FUNCTION get_user_budget_settings(target_user_id UUID)
RETURNS TABLE(
    monthly_budget NUMERIC,
    warning_threshold NUMERIC,
    emergency_threshold NUMERIC,
    currency_code TEXT
) AS $$
BEGIN
    -- Insert default settings if they don't exist
    INSERT INTO user_budget_settings (user_id, monthly_budget, warning_threshold, emergency_threshold)
    VALUES (target_user_id, 50000, 0.8, 0.95)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Return the settings
    RETURN QUERY
    SELECT 
        ubs.monthly_budget,
        ubs.warning_threshold,
        ubs.emergency_threshold,
        ubs.currency_code
    FROM user_budget_settings ubs
    WHERE ubs.user_id = target_user_id
    AND ubs.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to update user budget settings
CREATE OR REPLACE FUNCTION update_user_budget_settings(
    target_user_id UUID,
    new_monthly_budget NUMERIC,
    new_warning_threshold NUMERIC DEFAULT NULL,
    new_emergency_threshold NUMERIC DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT
) AS $$
BEGIN
    -- Validate input
    IF new_monthly_budget <= 0 THEN
        RETURN QUERY SELECT false, 'Monthly budget must be greater than 0';
        RETURN;
    END IF;
    
    IF new_warning_threshold IS NOT NULL AND (new_warning_threshold < 0 OR new_warning_threshold > 1) THEN
        RETURN QUERY SELECT false, 'Warning threshold must be between 0 and 1';
        RETURN;
    END IF;
    
    IF new_emergency_threshold IS NOT NULL AND (new_emergency_threshold < 0 OR new_emergency_threshold > 1) THEN
        RETURN QUERY SELECT false, 'Emergency threshold must be between 0 and 1';
        RETURN;
    END IF;
    
    -- Insert or update settings
    INSERT INTO user_budget_settings (
        user_id, 
        monthly_budget, 
        warning_threshold, 
        emergency_threshold,
        updated_at
    )
    VALUES (
        target_user_id,
        new_monthly_budget,
        COALESCE(new_warning_threshold, 0.8),
        COALESCE(new_emergency_threshold, 0.95),
        now()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        monthly_budget = EXCLUDED.monthly_budget,
        warning_threshold = COALESCE(new_warning_threshold, user_budget_settings.warning_threshold),
        emergency_threshold = COALESCE(new_emergency_threshold, user_budget_settings.emergency_threshold),
        updated_at = now();
    
    RETURN QUERY SELECT true, 'Budget settings updated successfully';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE PROPER INSIGHTS GENERATION FUNCTION
-- =====================================================

-- Enhanced insights function that works with current data structure
CREATE OR REPLACE FUNCTION generate_user_spending_insights(
    target_user_id UUID,
    analysis_months INTEGER DEFAULT 6
)
RETURNS TABLE(
    insight_type TEXT,
    insight_category TEXT,
    title TEXT,
    description TEXT,
    severity TEXT,
    confidence_score NUMERIC,
    metadata JSONB
) AS $$
DECLARE
    user_record RECORD;
    current_month_spending NUMERIC;
    avg_monthly_spending NUMERIC;
    spending_trend NUMERIC;
    top_category RECORD;
    user_budget NUMERIC;
BEGIN
    -- Get user info
    SELECT id, full_name, role INTO user_record
    FROM users WHERE id = target_user_id AND is_active = true;
    
    IF user_record.id IS NULL THEN
        RETURN;
    END IF;
    
    -- Get user budget
    SELECT monthly_budget INTO user_budget
    FROM get_user_budget_settings(target_user_id)
    LIMIT 1;
    
    IF user_budget IS NULL THEN
        user_budget := 50000; -- Default fallback
    END IF;
    
    -- Calculate spending metrics
    WITH monthly_spending AS (
        SELECT 
            DATE_TRUNC('month', expense_date) as month,
            SUM(amount) as total
        FROM expenses
        WHERE created_by = target_user_id
        AND expense_date >= CURRENT_DATE - INTERVAL '1 month' * analysis_months
        AND is_active = true
        GROUP BY 1
        ORDER BY 1
    )
    SELECT 
        AVG(total),
        COALESCE((SELECT total FROM monthly_spending ORDER BY month DESC LIMIT 1), 0),
        CASE 
            WHEN COUNT(*) > 1 THEN
                COALESCE(
                    ((SELECT total FROM monthly_spending ORDER BY month DESC LIMIT 1) - 
                     (SELECT total FROM monthly_spending ORDER BY month DESC LIMIT 1 OFFSET 1)) / 
                    NULLIF((SELECT total FROM monthly_spending ORDER BY month DESC LIMIT 1 OFFSET 1), 0) * 100,
                    0
                )
            ELSE 0
        END
    INTO avg_monthly_spending, current_month_spending, spending_trend
    FROM monthly_spending;
    
    -- Budget vs spending analysis
    IF current_month_spending > user_budget * 1.1 THEN
        RETURN QUERY SELECT
            'budget_alert'::TEXT,
            'budget_management'::TEXT,
            'Monthly Budget Exceeded'::TEXT,
            format('You''ve spent Rs%s this month, which exceeds your budget of Rs%s by %s%%. Consider reviewing your expenses.',
                to_char(current_month_spending, 'FM999,999,990'),
                to_char(user_budget, 'FM999,999,990'),
                ROUND(((current_month_spending - user_budget) / user_budget * 100), 1)
            )::TEXT,
            'critical'::TEXT,
            0.95::NUMERIC,
            json_build_object(
                'user_id', target_user_id,
                'current_spending', current_month_spending,
                'budget', user_budget,
                'overage_amount', current_month_spending - user_budget,
                'overage_percentage', (current_month_spending - user_budget) / user_budget * 100
            )::JSONB;
    ELSIF current_month_spending > user_budget * 0.8 THEN
        RETURN QUERY SELECT
            'budget_warning'::TEXT,
            'budget_management'::TEXT,
            'Approaching Budget Limit'::TEXT,
            format('You''ve spent Rs%s this month, which is %s%% of your Rs%s budget. You have Rs%s remaining.',
                to_char(current_month_spending, 'FM999,999,990'),
                ROUND((current_month_spending / user_budget * 100), 1),
                to_char(user_budget, 'FM999,999,990'),
                to_char(user_budget - current_month_spending, 'FM999,999,990')
            )::TEXT,
            'warning'::TEXT,
            0.85::NUMERIC,
            json_build_object(
                'user_id', target_user_id,
                'current_spending', current_month_spending,
                'budget', user_budget,
                'percentage_used', current_month_spending / user_budget * 100,
                'remaining_budget', user_budget - current_month_spending
            )::JSONB;
    END IF;
    
    -- Spending trend analysis
    IF spending_trend > 25 THEN
        RETURN QUERY SELECT
            'spending_trend'::TEXT,
            'trend_analysis'::TEXT,
            'Significant Spending Increase'::TEXT,
            format('Your spending increased by %s%% this month (Rs%s vs Rs%s average). This trend may impact your budget.',
                ROUND(spending_trend, 1),
                to_char(current_month_spending, 'FM999,999,990'),
                to_char(avg_monthly_spending, 'FM999,999,990')
            )::TEXT,
            'alert'::TEXT,
            0.80::NUMERIC,
            json_build_object(
                'user_id', target_user_id,
                'trend_percentage', spending_trend,
                'current_spending', current_month_spending,
                'average_spending', avg_monthly_spending
            )::JSONB;
    ELSIF spending_trend < -20 THEN
        RETURN QUERY SELECT
            'spending_trend'::TEXT,
            'savings_opportunity'::TEXT,
            'Great Savings Achievement!'::TEXT,
            format('You''ve reduced spending by %s%% this month, saving Rs%s compared to your average!',
                ROUND(ABS(spending_trend), 1),
                to_char(avg_monthly_spending - current_month_spending, 'FM999,999,990')
            )::TEXT,
            'info'::TEXT,
            0.90::NUMERIC,
            json_build_object(
                'user_id', target_user_id,
                'savings_amount', avg_monthly_spending - current_month_spending,
                'savings_percentage', ABS(spending_trend)
            )::JSONB;
    END IF;
    
    -- Top category analysis
    WITH category_analysis AS (
        SELECT 
            c.name,
            SUM(e.amount) as total_spent,
            COUNT(*) as transaction_count,
            SUM(e.amount) / NULLIF((
                SELECT SUM(amount) 
                FROM expenses 
                WHERE created_by = target_user_id 
                AND expense_date >= CURRENT_DATE - INTERVAL '30 days'
                AND is_active = true
            ), 0) * 100 as percentage_of_total
        FROM expenses e
        JOIN categories c ON e.category_id = c.id
        WHERE e.created_by = target_user_id
        AND e.expense_date >= CURRENT_DATE - INTERVAL '30 days'
        AND e.is_active = true
        GROUP BY c.id, c.name
        ORDER BY total_spent DESC
        LIMIT 1
    )
    SELECT ca.* INTO top_category FROM category_analysis ca;
    
    IF top_category.percentage_of_total > 50 THEN
        RETURN QUERY SELECT
            'category_dominance'::TEXT,
            'spending_pattern'::TEXT,
            format('Heavy Focus on %s Spending', top_category.name)::TEXT,
            format('%s accounts for %s%% of your monthly spending (Rs%s). Consider diversifying expenses or setting category limits.',
                top_category.name,
                ROUND(top_category.percentage_of_total, 1),
                to_char(top_category.total_spent, 'FM999,999,990')
            )::TEXT,
            'warning'::TEXT,
            0.75::NUMERIC,
            json_build_object(
                'user_id', target_user_id,
                'category_name', top_category.name,
                'category_percentage', top_category.percentage_of_total,
                'category_total', top_category.total_spent
            )::JSONB;
    END IF;
    
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION get_yearly_breakdown(INTEGER, UUID) IS 'Fixed version - Returns detailed monthly breakdown for a specific year with comparative metrics';
COMMENT ON FUNCTION calculate_year_comparison(INTEGER, INTEGER, UUID) IS 'Fixed version - Detailed month-by-month comparison between two years with trend analysis';
COMMENT ON TABLE user_budget_settings IS 'User-configurable budget settings with thresholds';
COMMENT ON FUNCTION get_user_budget_settings(UUID) IS 'Gets or creates default budget settings for a user';
COMMENT ON FUNCTION update_user_budget_settings(UUID, NUMERIC, NUMERIC, NUMERIC) IS 'Updates user budget settings with validation';
COMMENT ON FUNCTION generate_user_spending_insights(UUID, INTEGER) IS 'Generates personalized spending insights based on budget and trends';