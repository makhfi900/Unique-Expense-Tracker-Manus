-- Phase 4: Intelligent Insights Enhancement
-- Run this in Supabase SQL Editor after Phase 3

-- =====================================================
-- INSIGHTS CACHE TABLE
-- =====================================================

-- Create insights cache table for performance and caching
CREATE TABLE IF NOT EXISTS insights_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
    insight_category VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'alert', 'critical')),
    confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    metadata JSONB DEFAULT '{}',
    applicable_from DATE,
    applicable_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for insights cache
CREATE INDEX idx_insights_cache_user ON insights_cache(user_id, is_active);
CREATE INDEX idx_insights_cache_type ON insights_cache(insight_type, insight_category);
CREATE INDEX idx_insights_cache_date ON insights_cache(applicable_from, applicable_to);
CREATE INDEX idx_insights_cache_severity ON insights_cache(severity, confidence_score);

-- =====================================================
-- INTELLIGENT INSIGHTS FUNCTIONS
-- =====================================================

-- Function to analyze spending patterns and generate insights
CREATE OR REPLACE FUNCTION generate_spending_insights(
    target_user_id UUID DEFAULT NULL,
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
    analysis_start_date DATE;
    current_month_spending NUMERIC;
    avg_monthly_spending NUMERIC;
    spending_trend NUMERIC;
    top_category RECORD;
    unusual_spikes RECORD;
BEGIN
    analysis_start_date := CURRENT_DATE - INTERVAL '1 month' * analysis_months;

    -- If target_user_id is provided, analyze for specific user
    -- Otherwise, generate system-wide insights
    
    -- Loop through users for analysis
    FOR user_record IN 
        SELECT id, full_name, role 
        FROM users 
        WHERE is_active = true 
        AND (target_user_id IS NULL OR id = target_user_id)
    LOOP
        
        -- 1. SPENDING TREND ANALYSIS
        WITH monthly_spending AS (
            SELECT 
                DATE_TRUNC('month', expense_date) as month,
                SUM(amount) as total
            FROM expenses
            WHERE created_by = user_record.id
            AND expense_date >= analysis_start_date
            AND is_active = true
            GROUP BY 1
            ORDER BY 1
        ),
        trend_analysis AS (
            SELECT 
                AVG(total) as avg_monthly,
                COALESCE(
                    (SELECT total FROM monthly_spending ORDER BY month DESC LIMIT 1), 0
                ) as current_month,
                CASE 
                    WHEN COUNT(*) > 1 THEN
                        (
                            (SELECT total FROM monthly_spending ORDER BY month DESC LIMIT 1) - 
                            (SELECT total FROM monthly_spending ORDER BY month DESC LIMIT 1 OFFSET 1)
                        ) / NULLIF((SELECT total FROM monthly_spending ORDER BY month DESC LIMIT 1 OFFSET 1), 0) * 100
                    ELSE 0
                END as month_over_month_change
            FROM monthly_spending
        )
        SELECT ta.avg_monthly, ta.current_month, ta.month_over_month_change
        INTO avg_monthly_spending, current_month_spending, spending_trend
        FROM trend_analysis ta;

        -- Generate spending trend insights
        IF spending_trend > 25 THEN
            RETURN QUERY SELECT
                'spending_trend'::TEXT,
                'budget_alert'::TEXT,
                'Significant Spending Increase Detected'::TEXT,
                format('Your spending increased by %s%% this month (Rs%s vs Rs%s average). Consider reviewing your budget.',
                    ROUND(spending_trend, 1), 
                    to_char(current_month_spending, 'FM999,999,990'),
                    to_char(avg_monthly_spending, 'FM999,999,990')
                )::TEXT,
                'alert'::TEXT,
                0.85::NUMERIC,
                json_build_object(
                    'user_id', user_record.id,
                    'current_spending', current_month_spending,
                    'average_spending', avg_monthly_spending,
                    'percentage_change', spending_trend
                )::JSONB;
        ELSIF spending_trend < -25 THEN
            RETURN QUERY SELECT
                'spending_trend'::TEXT,
                'savings_opportunity'::TEXT,
                'Great Job on Reducing Expenses!'::TEXT,
                format('You''ve reduced spending by %s%% this month. You saved Rs%s compared to your average!',
                    ROUND(ABS(spending_trend), 1),
                    to_char(avg_monthly_spending - current_month_spending, 'FM999,999,990')
                )::TEXT,
                'info'::TEXT,
                0.90::NUMERIC,
                json_build_object(
                    'user_id', user_record.id,
                    'savings_amount', avg_monthly_spending - current_month_spending,
                    'percentage_reduction', ABS(spending_trend)
                )::JSONB;
        END IF;

        -- 2. TOP CATEGORY ANALYSIS
        WITH category_analysis AS (
            SELECT 
                c.name,
                c.color,
                SUM(e.amount) as total_spent,
                COUNT(*) as transaction_count,
                AVG(e.amount) as avg_per_transaction,
                SUM(e.amount) / NULLIF((
                    SELECT SUM(amount) 
                    FROM expenses 
                    WHERE created_by = user_record.id 
                    AND expense_date >= analysis_start_date 
                    AND is_active = true
                ), 0) * 100 as percentage_of_total
            FROM expenses e
            JOIN categories c ON e.category_id = c.id
            WHERE e.created_by = user_record.id
            AND e.expense_date >= analysis_start_date
            AND e.is_active = true
            GROUP BY c.id, c.name, c.color
            ORDER BY total_spent DESC
            LIMIT 1
        )
        SELECT ca.* INTO top_category FROM category_analysis ca;

        IF top_category.percentage_of_total > 40 THEN
            RETURN QUERY SELECT
                'category_dominance'::TEXT,
                'spending_pattern'::TEXT,
                format('Heavy Spending in %s Category', top_category.name)::TEXT,
                format('%s accounts for %s%% of your spending (Rs%s). Consider diversifying your expenses or setting a budget limit.',
                    top_category.name,
                    ROUND(top_category.percentage_of_total, 1),
                    to_char(top_category.total_spent, 'FM999,999,990')
                )::TEXT,
                'warning'::TEXT,
                0.80::NUMERIC,
                json_build_object(
                    'user_id', user_record.id,
                    'category_name', top_category.name,
                    'category_percentage', top_category.percentage_of_total,
                    'category_total', top_category.total_spent
                )::JSONB;
        END IF;

        -- 3. UNUSUAL SPENDING SPIKE DETECTION
        WITH daily_spending AS (
            SELECT 
                expense_date,
                SUM(amount) as daily_total
            FROM expenses
            WHERE created_by = user_record.id
            AND expense_date >= CURRENT_DATE - INTERVAL '30 days'
            AND is_active = true
            GROUP BY expense_date
        ),
        spending_stats AS (
            SELECT 
                AVG(daily_total) as avg_daily,
                STDDEV(daily_total) as stddev_daily
            FROM daily_spending
        ),
        unusual_days AS (
            SELECT 
                ds.expense_date,
                ds.daily_total,
                ss.avg_daily,
                ss.stddev_daily
            FROM daily_spending ds
            CROSS JOIN spending_stats ss
            WHERE ds.daily_total > (ss.avg_daily + 2 * ss.stddev_daily)
            AND ds.daily_total > 1000 -- Minimum threshold
            ORDER BY ds.daily_total DESC
            LIMIT 1
        )
        SELECT ud.* INTO unusual_spikes FROM unusual_days ud;

        IF unusual_spikes.daily_total IS NOT NULL THEN
            RETURN QUERY SELECT
                'unusual_spike'::TEXT,
                'anomaly_detection'::TEXT,
                'Unusual Spending Day Detected'::TEXT,
                format('On %s, you spent Rs%s, which is %sx higher than your daily average of Rs%s. Review this day for any unusual expenses.',
                    unusual_spikes.expense_date::TEXT,
                    to_char(unusual_spikes.daily_total, 'FM999,999,990'),
                    ROUND(unusual_spikes.daily_total / NULLIF(unusual_spikes.avg_daily, 0), 1),
                    to_char(unusual_spikes.avg_daily, 'FM999,999,990')
                )::TEXT,
                'warning'::TEXT,
                0.75::NUMERIC,
                json_build_object(
                    'user_id', user_record.id,
                    'spike_date', unusual_spikes.expense_date,
                    'spike_amount', unusual_spikes.daily_total,
                    'average_daily', unusual_spikes.avg_daily
                )::JSONB;
        END IF;

        -- 4. BUDGET RECOMMENDATIONS
        WITH budget_analysis AS (
            SELECT 
                AVG(monthly_total) as recommended_budget,
                MAX(monthly_total) as peak_month,
                MIN(monthly_total) as lowest_month
            FROM (
                SELECT 
                    DATE_TRUNC('month', expense_date) as month,
                    SUM(amount) as monthly_total
                FROM expenses
                WHERE created_by = user_record.id
                AND expense_date >= analysis_start_date
                AND is_active = true
                GROUP BY 1
            ) monthly_data
        )
        SELECT ba.* INTO top_category FROM budget_analysis ba; -- Reusing variable

        IF avg_monthly_spending > 0 THEN
            RETURN QUERY SELECT
                'budget_recommendation'::TEXT,
                'financial_planning'::TEXT,
                'Smart Budget Recommendation'::TEXT,
                format('Based on your spending pattern, we recommend a monthly budget of Rs%s with a buffer of 20%% (Rs%s total).',
                    to_char(avg_monthly_spending * 1.1, 'FM999,999,990'),
                    to_char(avg_monthly_spending * 1.3, 'FM999,999,990')
                )::TEXT,
                'info'::TEXT,
                0.70::NUMERIC,
                json_build_object(
                    'user_id', user_record.id,
                    'recommended_budget', avg_monthly_spending * 1.1,
                    'buffer_budget', avg_monthly_spending * 1.3
                )::JSONB;
        END IF;

    END LOOP;

    -- 5. SYSTEM-WIDE INSIGHTS (only if target_user_id is NULL)
    IF target_user_id IS NULL THEN
        -- Generate system-wide insights for admins (FIXED: WITH clause moved inside RETURN QUERY)
        RETURN QUERY
        WITH system_stats AS (
            SELECT 
                COUNT(DISTINCT created_by) as active_users,
                SUM(amount) as total_system_spending,
                AVG(amount) as avg_expense_amount
            FROM expenses
            WHERE expense_date >= CURRENT_DATE - INTERVAL '30 days'
            AND is_active = true
        )
        SELECT 
            'system_overview'::TEXT,
            'admin_insights'::TEXT,
            'Monthly System Overview'::TEXT,
            format('System has %s active users with total spending of Rs%s this month. Average expense: Rs%s.',
                ss.active_users,
                to_char(ss.total_system_spending, 'FM999,999,990'),
                to_char(ss.avg_expense_amount, 'FM999,999,990')
            )::TEXT,
            'info'::TEXT,
            0.95::NUMERIC,
            json_build_object(
                'active_users', ss.active_users,
                'total_spending', ss.total_system_spending,
                'avg_expense', ss.avg_expense_amount
            )::JSONB
        FROM system_stats ss;
    END IF;

END;
$$ LANGUAGE plpgsql;

-- Function to cache insights for better performance
CREATE OR REPLACE FUNCTION refresh_insights_cache(target_user_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    insights_count INTEGER := 0;
    insight_record RECORD;
BEGIN
    -- Clear existing insights for the user(s)
    IF target_user_id IS NOT NULL THEN
        DELETE FROM insights_cache WHERE user_id = target_user_id;
    ELSE
        DELETE FROM insights_cache WHERE created_at < CURRENT_DATE - INTERVAL '1 day';
    END IF;

    -- Generate and cache new insights
    FOR insight_record IN 
        SELECT * FROM generate_spending_insights(target_user_id)
    LOOP
        INSERT INTO insights_cache (
            user_id,
            insight_type,
            insight_category,
            title,
            description,
            severity,
            confidence_score,
            metadata,
            applicable_from,
            applicable_to
        ) VALUES (
            COALESCE((insight_record.metadata->>'user_id')::UUID, target_user_id),
            insight_record.insight_type,
            insight_record.insight_category,
            insight_record.title,
            insight_record.description,
            insight_record.severity,
            insight_record.confidence_score,
            insight_record.metadata,
            CURRENT_DATE - INTERVAL '30 days',
            CURRENT_DATE + INTERVAL '30 days'
        );
        
        insights_count := insights_count + 1;
    END LOOP;

    RETURN insights_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get personalized insights for a user
CREATE OR REPLACE FUNCTION get_user_insights(
    target_user_id UUID,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
    id UUID,
    insight_type TEXT,
    insight_category TEXT,
    title TEXT,
    description TEXT,
    severity TEXT,
    confidence_score NUMERIC,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- First, refresh insights if they're stale
    IF NOT EXISTS (
        SELECT 1 FROM insights_cache 
        WHERE user_id = target_user_id 
        AND created_at > CURRENT_DATE - INTERVAL '6 hours'
    ) THEN
        PERFORM refresh_insights_cache(target_user_id);
    END IF;

    -- Return cached insights
    RETURN QUERY
    SELECT 
        ic.id,
        ic.insight_type,
        ic.insight_category,
        ic.title,
        ic.description,
        ic.severity,
        ic.confidence_score,
        ic.metadata,
        ic.created_at
    FROM insights_cache ic
    WHERE ic.user_id = target_user_id
    AND ic.is_active = true
    AND ic.applicable_from <= CURRENT_DATE
    AND ic.applicable_to >= CURRENT_DATE
    ORDER BY 
        CASE ic.severity
            WHEN 'critical' THEN 1
            WHEN 'alert' THEN 2
            WHEN 'warning' THEN 3
            WHEN 'info' THEN 4
        END,
        ic.confidence_score DESC,
        ic.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- AUTOMATED INSIGHTS REFRESH
-- =====================================================

-- Function to be called by a scheduled job
CREATE OR REPLACE FUNCTION auto_refresh_insights()
RETURNS TEXT AS $$
DECLARE
    refreshed_count INTEGER;
    user_record RECORD;
    total_refreshed INTEGER := 0;
BEGIN
    -- Refresh insights for users who have had activity in the last 7 days
    FOR user_record IN
        SELECT DISTINCT u.id, u.full_name
        FROM users u
        INNER JOIN expenses e ON u.id = e.created_by
        WHERE u.is_active = true
        AND e.expense_date >= CURRENT_DATE - INTERVAL '7 days'
        AND e.is_active = true
    LOOP
        refreshed_count := refresh_insights_cache(user_record.id);
        total_refreshed := total_refreshed + refreshed_count;
    END LOOP;

    -- Also refresh system-wide insights for admins
    refreshed_count := refresh_insights_cache(NULL);
    total_refreshed := total_refreshed + refreshed_count;

    RETURN format('Auto-refreshed insights: %s total insights generated', total_refreshed);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS AND MAINTENANCE
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_insights_cache_updated_at
    BEFORE UPDATE ON insights_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_insights_updated_at();

-- =====================================================
-- USAGE EXAMPLES AND COMMENTS
-- =====================================================

COMMENT ON TABLE insights_cache IS 'Cached intelligent insights for users with performance optimization';
COMMENT ON FUNCTION generate_spending_insights(UUID, INTEGER) IS 'Generates intelligent spending insights and recommendations';
COMMENT ON FUNCTION refresh_insights_cache(UUID) IS 'Refreshes cached insights for specific user or all users';
COMMENT ON FUNCTION get_user_insights(UUID, INTEGER) IS 'Retrieves personalized insights for a user with automatic refresh';
COMMENT ON FUNCTION auto_refresh_insights() IS 'Automated function to refresh insights for active users (to be called by scheduler)';

-- Initial insights generation
SELECT refresh_insights_cache();

-- Test the functions (uncomment to test)
-- SELECT * FROM generate_spending_insights();
-- SELECT * FROM get_user_insights('user-uuid-here');