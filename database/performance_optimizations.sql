-- Performance Optimization SQL Script
-- This script adds composite indexes and materialized views to improve query performance

-- =====================================================
-- COMPOSITE INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================

-- Index for expenses filtered by user and date (common query pattern)
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(created_by, expense_date);

-- Index for expenses filtered by category and date (analytics queries)
CREATE INDEX IF NOT EXISTS idx_expenses_category_date ON expenses(category_id, expense_date);

-- Index for expenses filtered by date and amount (for analytics and reporting)
CREATE INDEX IF NOT EXISTS idx_expenses_date_amount ON expenses(expense_date, amount);

-- Index for active expenses by user (user dashboard queries)
CREATE INDEX IF NOT EXISTS idx_expenses_user_active ON expenses(created_by, is_active) WHERE is_active = true;

-- Index for active expenses by category (category analytics)
CREATE INDEX IF NOT EXISTS idx_expenses_category_active ON expenses(category_id, is_active) WHERE is_active = true;

-- Index for expenses by date range (common filtering)
CREATE INDEX IF NOT EXISTS idx_expenses_date_range ON expenses(expense_date) WHERE is_active = true;

-- Index for full-text search on expense descriptions
CREATE INDEX IF NOT EXISTS idx_expenses_description_search ON expenses USING gin(to_tsvector('english', description));

-- Index for login activities by user and time (for monitoring)
CREATE INDEX IF NOT EXISTS idx_login_activities_user_recent ON login_activities(user_id, login_time DESC);

-- =====================================================
-- MATERIALIZED VIEWS FOR ANALYTICS PERFORMANCE
-- =====================================================

-- Monthly spending summary by user and category
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly_spending AS
SELECT 
    DATE_TRUNC('month', e.expense_date) as month,
    e.category_id,
    e.created_by,
    SUM(e.amount) as total_amount,
    COUNT(*) as expense_count,
    AVG(e.amount) as avg_amount,
    MIN(e.amount) as min_amount,
    MAX(e.amount) as max_amount
FROM expenses e
WHERE e.is_active = true
GROUP BY 1, 2, 3;

-- Create index on materialized view for faster lookups
CREATE INDEX IF NOT EXISTS idx_mv_monthly_spending_lookup ON mv_monthly_spending(month, category_id, created_by);

-- Daily spending summary for trend analysis
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_spending AS
SELECT 
    e.expense_date,
    e.category_id,
    e.created_by,
    SUM(e.amount) as total_amount,
    COUNT(*) as expense_count
FROM expenses e
WHERE e.is_active = true
GROUP BY 1, 2, 3;

-- Create index on daily spending materialized view
CREATE INDEX IF NOT EXISTS idx_mv_daily_spending_lookup ON mv_daily_spending(expense_date, category_id, created_by);

-- Category spending summary for analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_category_spending AS
SELECT 
    e.category_id,
    c.name as category_name,
    c.color as category_color,
    SUM(e.amount) as total_amount,
    COUNT(*) as expense_count,
    AVG(e.amount) as avg_amount,
    COUNT(DISTINCT e.created_by) as user_count,  -- Fixed: specify e.created_by
    MIN(e.expense_date) as first_expense_date,
    MAX(e.expense_date) as last_expense_date
FROM expenses e
JOIN categories c ON e.category_id = c.id
WHERE e.is_active = true AND c.is_active = true
GROUP BY 1, 2, 3;

-- Create index on category spending materialized view
CREATE INDEX IF NOT EXISTS idx_mv_category_spending_lookup ON mv_category_spending(category_id);

-- User spending summary for user analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_spending AS
SELECT 
    e.created_by as user_id,
    u.full_name as user_name,
    u.role as user_role,
    SUM(e.amount) as total_amount,
    COUNT(*) as expense_count,
    AVG(e.amount) as avg_amount,
    COUNT(DISTINCT e.category_id) as categories_used,
    MIN(e.expense_date) as first_expense_date,
    MAX(e.expense_date) as last_expense_date
FROM expenses e
JOIN users u ON e.created_by = u.id
WHERE e.is_active = true AND u.is_active = true
GROUP BY 1, 2, 3;

-- Create index on user spending materialized view
CREATE INDEX IF NOT EXISTS idx_mv_user_spending_lookup ON mv_user_spending(user_id);

-- =====================================================
-- FUNCTIONS FOR MATERIALIZED VIEW REFRESH
-- =====================================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    -- Refresh materialized views concurrently to avoid blocking
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_spending;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_spending;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_spending;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_spending;
    
    -- Log the refresh
    RAISE NOTICE 'Analytics materialized views refreshed at %', NOW();
EXCEPTION
    WHEN OTHERS THEN
        -- If concurrent refresh fails, try regular refresh
        REFRESH MATERIALIZED VIEW mv_monthly_spending;
        REFRESH MATERIALIZED VIEW mv_daily_spending;
        REFRESH MATERIALIZED VIEW mv_category_spending;
        REFRESH MATERIALIZED VIEW mv_user_spending;
        
        RAISE NOTICE 'Analytics materialized views refreshed (non-concurrent) at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to refresh views after expense changes
CREATE OR REPLACE FUNCTION trigger_refresh_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh analytics views after expense operations
    PERFORM refresh_analytics_views();
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC VIEW REFRESH
-- =====================================================

-- Trigger to refresh analytics views after expense insert/update/delete
DROP TRIGGER IF EXISTS trigger_expense_analytics_refresh ON expenses;
CREATE TRIGGER trigger_expense_analytics_refresh
    AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_analytics();

-- =====================================================
-- PERFORMANCE MONITORING QUERIES
-- =====================================================

-- Query to monitor index usage
CREATE OR REPLACE VIEW v_index_usage AS
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Query to monitor slow queries (only if pg_stat_statements is enabled)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        EXECUTE 'CREATE OR REPLACE VIEW v_slow_queries AS
                 SELECT 
                     query,
                     calls,
                     total_exec_time,
                     mean_exec_time,
                     stddev_exec_time,
                     rows
                 FROM pg_stat_statements
                 WHERE mean_exec_time > 100
                 ORDER BY mean_exec_time DESC';
    ELSE
        -- Create a placeholder view if pg_stat_statements is not available
        EXECUTE 'CREATE OR REPLACE VIEW v_slow_queries AS
                 SELECT 
                     ''pg_stat_statements not enabled'' as query,
                     0 as calls,
                     0 as total_exec_time,
                     0 as mean_exec_time,
                     0 as stddev_exec_time,
                     0 as rows';
    END IF;
END
$$;

-- =====================================================
-- INITIAL DATA POPULATION
-- =====================================================

-- Populate materialized views with initial data
SELECT refresh_analytics_views();

-- Analyze tables to update statistics
ANALYZE expenses;
ANALYZE categories;
ANALYZE users;
ANALYZE login_activities;

-- =====================================================
-- MAINTENANCE COMMANDS
-- =====================================================

-- Commands to run periodically for maintenance:
-- REINDEX INDEX CONCURRENTLY idx_expenses_user_date;
-- VACUUM ANALYZE expenses;
-- SELECT refresh_analytics_views();

-- Monitor performance with:
-- SELECT * FROM v_index_usage;
-- SELECT * FROM v_slow_queries;

COMMENT ON MATERIALIZED VIEW mv_monthly_spending IS 'Monthly spending aggregated by user and category for fast analytics';
COMMENT ON MATERIALIZED VIEW mv_daily_spending IS 'Daily spending aggregated by user and category for trend analysis';
COMMENT ON MATERIALIZED VIEW mv_category_spending IS 'Category spending summary for analytics dashboard';
COMMENT ON MATERIALIZED VIEW mv_user_spending IS 'User spending summary for user analytics';

COMMENT ON FUNCTION refresh_analytics_views() IS 'Refreshes all analytics materialized views';
COMMENT ON FUNCTION trigger_refresh_analytics() IS 'Trigger function to refresh analytics views after expense changes';