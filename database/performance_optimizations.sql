-- File: database/performance_optimizations_updated.sql
-- Run this AFTER the main schema script

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

-- Drop existing materialized views if they exist
DROP MATERIALIZED VIEW IF EXISTS mv_monthly_spending CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_daily_spending CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_category_spending CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_user_spending CASCADE;

-- Monthly spending summary by user and category
CREATE MATERIALIZED VIEW mv_monthly_spending AS
SELECT 
    DATE_TRUNC('month', e.expense_date) as month,
    e.category_id,
    e.created_by,
    c.name as category_name,
    u.full_name as user_name,
    u.role as user_role,
    SUM(e.amount) as total_amount,
    COUNT(*) as expense_count,
    AVG(e.amount) as avg_amount,
    MIN(e.amount) as min_amount,
    MAX(e.amount) as max_amount
FROM expenses e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN users u ON e.created_by = u.id
WHERE e.is_active = true
GROUP BY 1, 2, 3, 4, 5, 6;

-- Create index on materialized view for faster lookups
CREATE INDEX idx_mv_monthly_spending_lookup ON mv_monthly_spending(month, category_id, created_by);
CREATE INDEX idx_mv_monthly_spending_role ON mv_monthly_spending(user_role);

-- Daily spending summary for trend analysis
CREATE MATERIALIZED VIEW mv_daily_spending AS
SELECT 
    e.expense_date,
    e.category_id,
    e.created_by,
    c.name as category_name,
    u.role as user_role,
    SUM(e.amount) as total_amount,
    COUNT(*) as expense_count
FROM expenses e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN users u ON e.created_by = u.id
WHERE e.is_active = true
GROUP BY 1, 2, 3, 4, 5;

-- Create indexes on daily spending materialized view
CREATE INDEX idx_mv_daily_spending_lookup ON mv_daily_spending(expense_date, category_id, created_by);
CREATE INDEX idx_mv_daily_spending_role ON mv_daily_spending(user_role);

-- Category spending summary for analytics
CREATE MATERIALIZED VIEW mv_category_spending AS
SELECT 
    e.category_id,
    c.name as category_name,
    c.color as category_color,
    SUM(e.amount) as total_amount,
    COUNT(*) as expense_count,
    AVG(e.amount) as avg_amount,
    COUNT(DISTINCT e.created_by) as user_count,
    MIN(e.expense_date) as first_expense_date,
    MAX(e.expense_date) as last_expense_date
FROM expenses e
JOIN categories c ON e.category_id = c.id
WHERE e.is_active = true AND c.is_active = true
GROUP BY 1, 2, 3;

-- Create index on category spending materialized view
CREATE INDEX idx_mv_category_spending_lookup ON mv_category_spending(category_id);

-- User spending summary for user analytics
CREATE MATERIALIZED VIEW mv_user_spending AS
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
CREATE INDEX idx_mv_user_spending_lookup ON mv_user_spending(user_id);
CREATE INDEX idx_mv_user_spending_role ON mv_user_spending(user_role);

-- =====================================================
-- OPTIMIZED REFRESH FUNCTIONS
-- =====================================================

-- Function to refresh all materialized views (optimized)
CREATE OR REPLACE FUNCTION refresh_analytics_views(concurrent_refresh BOOLEAN DEFAULT TRUE)
RETURNS void AS $$
DECLARE
    refresh_start TIMESTAMP;
    refresh_method TEXT;
BEGIN
    refresh_start := clock_timestamp();
    refresh_method := CASE WHEN concurrent_refresh THEN 'CONCURRENTLY' ELSE '' END;
    
    -- Try concurrent refresh first (non-blocking)
    IF concurrent_refresh THEN
        BEGIN
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_spending;
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_spending;
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_spending;
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_spending;
            
            RAISE NOTICE 'Analytics views refreshed concurrently in % ms', 
                EXTRACT(MILLISECOND FROM clock_timestamp() - refresh_start);
        EXCEPTION
            WHEN OTHERS THEN
                -- Fall back to regular refresh
                RAISE NOTICE 'Concurrent refresh failed, using regular refresh: %', SQLERRM;
                PERFORM refresh_analytics_views(FALSE);
        END;
    ELSE
        -- Regular refresh (blocking but always works)
        REFRESH MATERIALIZED VIEW mv_monthly_spending;
        REFRESH MATERIALIZED VIEW mv_daily_spending;
        REFRESH MATERIALIZED VIEW mv_category_spending;
        REFRESH MATERIALIZED VIEW mv_user_spending;
        
        RAISE NOTICE 'Analytics views refreshed (blocking) in % ms', 
            EXTRACT(MILLISECOND FROM clock_timestamp() - refresh_start);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SMART REFRESH TRIGGER (Only refresh when needed)
-- =====================================================

-- Table to track last refresh time
CREATE TABLE IF NOT EXISTS analytics_refresh_log (
    id SERIAL PRIMARY KEY,
    refresh_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    refresh_type VARCHAR(50),
    duration_ms INTEGER
);

-- Smart refresh function that checks if refresh is needed
CREATE OR REPLACE FUNCTION smart_refresh_analytics()
RETURNS void AS $$
DECLARE
    last_refresh TIMESTAMP;
    minutes_since_refresh INTEGER;
BEGIN
    -- Get last refresh time
    SELECT MAX(refresh_time) INTO last_refresh 
    FROM analytics_refresh_log 
    WHERE refresh_type = 'auto';
    
    -- Calculate minutes since last refresh
    minutes_since_refresh := EXTRACT(EPOCH FROM (NOW() - COALESCE(last_refresh, '2000-01-01'::timestamp))) / 60;
    
    -- Only refresh if more than 5 minutes have passed
    IF minutes_since_refresh > 5 THEN
        PERFORM refresh_analytics_views(TRUE);
        
        INSERT INTO analytics_refresh_log (refresh_type, duration_ms)
        VALUES ('auto', 0);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- REMOVE AUTOMATIC TRIGGERS (They can slow down operations)
-- =====================================================

-- Drop the automatic refresh trigger if it exists
DROP TRIGGER IF EXISTS trigger_expense_analytics_refresh ON expenses;

-- Instead, create a scheduled job (run this in your application or as a cron job)
-- SELECT smart_refresh_analytics();

-- =====================================================
-- PERFORMANCE MONITORING VIEWS
-- =====================================================

-- Enhanced index usage view
CREATE OR REPLACE VIEW v_index_usage AS
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'RARELY USED'
        WHEN idx_scan < 1000 THEN 'OCCASIONALLY USED'
        ELSE 'FREQUENTLY USED'
    END as usage_category,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Table size and bloat estimation
CREATE OR REPLACE VIEW v_table_sizes AS
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================
-- QUERY PERFORMANCE HINTS
-- =====================================================

-- Create a function to analyze query performance
CREATE OR REPLACE FUNCTION analyze_expense_query_performance()
RETURNS TABLE(
    suggestion TEXT,
    impact TEXT,
    query_example TEXT
) AS $$
BEGIN
    -- Check if statistics are up to date
    RETURN QUERY
    SELECT 
        'Run ANALYZE on tables' as suggestion,
        'HIGH - Improves query planning' as impact,
        'ANALYZE expenses, categories, users;' as query_example;
    
    -- Check for missing indexes
    RETURN QUERY
    SELECT 
        'Consider adding index on frequently filtered columns' as suggestion,
        'MEDIUM - Speeds up filtered queries' as impact,
        'CREATE INDEX idx_expenses_custom ON expenses(column_name);' as query_example
    FROM pg_stat_user_tables
    WHERE schemaname = 'public' 
    AND n_tup_upd + n_tup_ins + n_tup_del > 1000
    AND NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = pg_stat_user_tables.tablename
    )
    LIMIT 1;
    
    RETURN QUERY
    SELECT 
        'Refresh materialized views regularly' as suggestion,
        'HIGH - Speeds up analytics queries' as impact,
        'SELECT refresh_analytics_views();' as query_example;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL DATA POPULATION
-- =====================================================

-- Populate materialized views with initial data
SELECT refresh_analytics_views(FALSE);

-- Analyze tables to update statistics
ANALYZE expenses;
ANALYZE categories;
ANALYZE users;
ANALYZE login_activities;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================

COMMENT ON FUNCTION refresh_analytics_views(BOOLEAN) IS 'Refreshes all analytics materialized views. Use TRUE for concurrent (non-blocking) refresh.';
COMMENT ON FUNCTION smart_refresh_analytics() IS 'Intelligently refreshes analytics views only if needed (5+ minutes since last refresh)';
COMMENT ON VIEW v_index_usage IS 'Monitor index usage to identify unused or rarely used indexes';
COMMENT ON VIEW v_table_sizes IS 'Monitor table and index sizes for capacity planning';